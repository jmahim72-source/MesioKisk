from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from services.api.app.core.database import get_db
from services.api.app.models.models import Encounter, InterviewSession, InterviewResponse, RedFlagAlert, AyurvedicAssessment
from services.api.app.schemas.schemas import InterviewStartRequest, InterviewResponseSubmit, StandardResponse
from services.api.app.services.dialogue_engine import DialogueEngine
from services.api.app.services.red_flag_engine import evaluate_red_flags

router = APIRouter(tags=["Clinical Interview Engine"])
engine = DialogueEngine()

@router.post("/encounters/{encounter_id}/interviews", response_model=StandardResponse, status_code=201)
def start_interview(encounter_id: str, payload: InterviewStartRequest, db: Session = Depends(get_db)):
    encounter = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")

    encounter.status = "INTAKE_IN_PROGRESS"

    session = InterviewSession(
        encounter_id=encounter.id,
        language_used=payload.language or "hi",
        input_mode=payload.input_preference or "VOICE_OR_TEXT",
        completion_status="IN_PROGRESS"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    first_question = engine.get_first_question(language=payload.language or "hi")

    return StandardResponse(
        success=True,
        data={
            "interview_id": session.id,
            "status": session.completion_status,
            "current_question": first_question
        }
    )

from services.api.app.services.ai_dialogue_service import AIDialogueService

ai_service = AIDialogueService()

@router.post("/interviews/{interview_id}/responses", response_model=StandardResponse)
async def submit_response(interview_id: str, payload: InterviewResponseSubmit, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == interview_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    encounter = session.encounter
    patient = encounter.patient

    # Check if Chief Complaint
    if "chief_complaint" in payload.question_id and payload.raw_text:
        encounter.chief_complaint_hint = payload.raw_text

    # Store individual response
    response_record = InterviewResponse(
        session_id=session.id,
        question_id=payload.question_id,
        question_text=payload.question_id,
        input_type=payload.input_type or "VOICE",
        raw_text=payload.raw_text,
        normalized_answer=payload.normalized_answer,
        confidence_score=payload.confidence or 0.95
    )
    db.add(response_record)
    db.commit()

    # Collect previous responses
    all_responses = db.query(InterviewResponse).filter(InterviewResponse.session_id == interview_id).all()
    answered_ids = [r.question_id for r in all_responses]

    # Evaluate Red Flags on-the-fly
    chief_text = encounter.chief_complaint_hint or payload.raw_text or ""
    answers_data = [{"raw_text": r.raw_text, "normalized_answer": r.normalized_answer} for r in all_responses]
    red_flags = evaluate_red_flags(chief_text, answers_data)

    for rf in red_flags:
        # Check if already created
        existing_alert = db.query(RedFlagAlert).filter(
            RedFlagAlert.encounter_id == encounter.id,
            RedFlagAlert.rule_id == rf["rule_id"]
        ).first()
        if not existing_alert:
            alert = RedFlagAlert(
                encounter_id=encounter.id,
                rule_id=rf["rule_id"],
                alert_type=rf["alert_type"],
                severity=rf["severity"],
                status="ACTIVE",
                triggered_symptoms=rf["triggered_symptoms"],
                suggested_action=rf["suggested_action"],
                clinical_context=rf["clinical_context"]
            )
            db.add(alert)
            encounter.priority = "EMERGENCY" if rf["severity"] == "CRITICAL" else "PRIORITY"
            db.commit()

    # Format history for AI clinical reasoning
    history = [
        {
            "question_id": r.question_id,
            "question_text": r.question_text,
            "answer_text": r.raw_text
        }
        for r in all_responses
    ]

    patient_info = {
        "gender": getattr(patient, "gender", "FEMALE"),
        "age": 55,
        "name": f"{getattr(patient, 'first_name', 'Patient')} {getattr(patient, 'last_name', '')}".strip()
    }
    if patient and getattr(patient, "date_of_birth", None):
        try:
            birth_year = int(str(patient.date_of_birth)[:4])
            patient_info["age"] = max(1, 2026 - birth_year)
        except Exception:
            pass

    # Generate Next Adaptive Question with AI Clinical Reasoning
    ai_result = await ai_service.generate_next_question(
        patient_info=patient_info,
        chief_complaint=chief_text,
        conversation_history=history,
        language=session.language_used or "hi"
    )

    return StandardResponse(
        success=True,
        data={
            "response_id": response_record.id,
            "interview_progress": ai_result["progress_pct"],
            "next_question": ai_result["question"],
            "clinical_reasoning": ai_result.get("clinical_reasoning", ""),
            "red_flag_check": {
                "status": "ALERT_TRIGGERED" if red_flags else "NO_ALERT",
                "alerts": red_flags
            }
        }
    )

@router.post("/interviews/{interview_id}/complete", response_model=StandardResponse, status_code=202)
def complete_interview(interview_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == interview_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    session.completion_status = "COMPLETED"
    session.session_end_time = datetime.now(timezone.utc)
    
    encounter = session.encounter
    encounter.status = "READY_FOR_REVIEW"
    db.commit()

    return StandardResponse(
        success=True,
        data={
            "interview_id": session.id,
            "status": "COMPLETED",
            "summary_generation_job_id": f"job_{session.id[:8]}"
        }
    )

@router.get("/interviews/{interview_id}", response_model=StandardResponse)
def get_interview(interview_id: str, db: Session = Depends(get_db)):
    session = db.query(InterviewSession).filter(InterviewSession.id == interview_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    responses = [
        {
            "id": r.id,
            "question_id": r.question_id,
            "raw_text": r.raw_text,
            "normalized_answer": r.normalized_answer,
            "confidence": r.confidence_score
        }
        for r in session.responses
    ]

    return StandardResponse(
        success=True,
        data={
            "interview_id": session.id,
            "encounter_id": session.encounter_id,
            "status": session.completion_status,
            "language": session.language_used,
            "total_answers": len(responses),
            "responses": responses
        }
    )
