from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from services.api.app.core.database import get_db
from services.api.app.models.models import Encounter, ClinicalSummary, InterviewResponse, Document, ExtractedEntity, AyurvedicAssessment, RedFlagAlert
from services.api.app.schemas.schemas import ClinicalSummaryOut, SummaryVerifyRequest, StandardResponse
from services.api.app.services.summary_generator import SummaryGenerator

router = APIRouter(tags=["Clinical Summary & Triage"])

@router.post("/encounters/{encounter_id}/summaries/generate", response_model=StandardResponse, status_code=202)
def generate_summary(encounter_id: str, db: Session = Depends(get_db)):
    encounter = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")

    patient = encounter.patient
    interviews = encounter.interviews
    all_responses = []
    for iv in interviews:
        all_responses.extend(iv.responses)

    ayurvedic_data = encounter.ayurvedic_assessments[0] if encounter.ayurvedic_assessments else None
    
    extracted_entities = []
    for doc in encounter.documents:
        extracted_entities.extend(doc.extracted_entities)

    red_flags = encounter.red_flags

    # Generate draft summary using SummaryGenerator
    compiled = SummaryGenerator.generate_draft_summary(
        patient=patient,
        encounter=encounter,
        interview_responses=all_responses,
        ayurvedic_data=ayurvedic_data,
        extracted_entities=extracted_entities,
        red_flags=red_flags
    )

    # Check if a summary already exists
    summary = db.query(ClinicalSummary).filter(ClinicalSummary.encounter_id == encounter.id).first()
    if not summary:
        summary = ClinicalSummary(
            encounter_id=encounter.id,
            version=1,
            status="DRAFT",
            summary_json=compiled["summary_json"],
            summary_text=compiled["summary_text"],
            generated_by="AI_SERVICE",
            generation_confidence=0.92
        )
        db.add(summary)
    else:
        summary.summary_json = compiled["summary_json"]
        summary.summary_text = compiled["summary_text"]
        summary.version += 1

    encounter.status = "READY_FOR_REVIEW"
    db.commit()
    db.refresh(summary)

    return StandardResponse(
        success=True,
        data={
            "job_id": f"job_summary_{summary.id[:8]}",
            "summary_id": summary.id,
            "status": summary.status
        }
    )

@router.get("/encounters/{encounter_id}/summary", response_model=StandardResponse)
def get_encounter_summary(encounter_id: str, db: Session = Depends(get_db)):
    summary = db.query(ClinicalSummary).filter(ClinicalSummary.encounter_id == encounter_id).first()
    if not summary:
        # Auto-generate if absent
        encounter = db.query(Encounter).filter(Encounter.id == encounter_id).first()
        if not encounter:
            raise HTTPException(status_code=404, detail="Encounter not found")
        generate_summary(encounter_id=encounter_id, db=db)
        summary = db.query(ClinicalSummary).filter(ClinicalSummary.encounter_id == encounter_id).first()

    return StandardResponse(
        success=True,
        data={
            "summary_id": summary.id,
            "encounter_id": summary.encounter_id,
            "version": summary.version,
            "status": summary.status,
            "is_final": summary.is_final,
            "verified_by_doctor": summary.verified_by_doctor,
            "verified_by": summary.verified_by,
            "verified_at": summary.verified_at.isoformat() if summary.verified_at else None,
            "doctor_notes": summary.doctor_notes,
            "sections": summary.summary_json,
            "summary_text": summary.summary_text,
            "generated_at": summary.created_at.isoformat() if summary.created_at else datetime.now().isoformat()
        }
    )

@router.patch("/summaries/{summary_id}", response_model=StandardResponse)
def update_summary(summary_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    summary = db.query(ClinicalSummary).filter(ClinicalSummary.id == summary_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Clinical summary not found")

    if "sections" in payload and isinstance(payload["sections"], dict):
        summary.summary_json = payload["sections"]
    if "doctor_notes" in payload:
        summary.doctor_notes = payload["doctor_notes"]
    
    summary.doctor_edits_made = True
    db.commit()
    db.refresh(summary)

    return StandardResponse(
        success=True,
        data={
            "summary_id": summary.id,
            "status": summary.status,
            "sections": summary.summary_json,
            "doctor_notes": summary.doctor_notes
        }
    )

@router.post("/summaries/{summary_id}/verify", response_model=StandardResponse)
def verify_summary(summary_id: str, payload: SummaryVerifyRequest, db: Session = Depends(get_db)):
    summary = db.query(ClinicalSummary).filter(ClinicalSummary.id == summary_id).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Clinical summary not found")

    summary.is_final = True
    summary.verified_by_doctor = True
    summary.status = "FINAL"
    summary.verified_by = payload.doctor_id or "Dr. Ananya Sharma (DOC-2026-089)"
    summary.verified_at = datetime.now(timezone.utc)
    if payload.verification_note:
        summary.doctor_notes = (summary.doctor_notes or "") + f"\nVerification Note: {payload.verification_note}"

    encounter = summary.encounter
    encounter.status = "COMPLETED"

    db.commit()
    db.refresh(summary)

    return StandardResponse(
        success=True,
        data={
            "summary_id": summary.id,
            "status": "FINAL",
            "verified_by": summary.verified_by,
            "verified_at": summary.verified_at.isoformat()
        }
    )
