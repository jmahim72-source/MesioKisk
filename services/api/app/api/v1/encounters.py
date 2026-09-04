import random
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional
from services.api.app.core.database import get_db
from services.api.app.models.models import Encounter, Patient
from services.api.app.schemas.schemas import EncounterCreate, EncounterUpdate, StandardResponse

router = APIRouter(tags=["Encounter & Queue Management"])

@router.post("/patients/{patient_id}/encounters", response_model=StandardResponse, status_code=201)
def create_encounter(patient_id: str, payload: EncounterCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    token_num = random.randint(1, 99)
    prefix = "A" if "ayurveda" in payload.department.lower() else "G"
    queue_token = f"{prefix}-{token_num:03d}"
    enc_number = f"OPD-2026-{random.randint(100000, 999999)}"

    encounter = Encounter(
        patient_id=patient.id,
        encounter_number=enc_number,
        encounter_date=datetime.now().strftime("%Y-%m-%d"),
        encounter_type=payload.encounter_type,
        department=payload.department,
        practitioner_id=payload.practitioner_id,
        queue_token=queue_token,
        status="ARRIVED",
        priority=payload.priority or "ROUTINE",
        chief_complaint_hint=payload.chief_complaint_hint
    )

    db.add(encounter)
    db.commit()
    db.refresh(encounter)

    return StandardResponse(
        success=True,
        data={
            "encounter_id": encounter.id,
            "patient_id": encounter.patient_id,
            "encounter_number": encounter.encounter_number,
            "status": encounter.status,
            "queue_token": encounter.queue_token,
            "priority": encounter.priority,
            "department": encounter.department,
            "created_at": encounter.created_at.isoformat() if encounter.created_at else datetime.now().isoformat()
        }
    )

@router.get("/encounters/queue", response_model=StandardResponse)
def get_encounter_queue(department: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Encounter)
    if department and department.lower() != "all":
        query = query.filter(Encounter.department.ilike(f"%{department}%"))

    encounters = query.order_by(
        Encounter.created_at.desc()
    ).all()

    queue_list = []
    for enc in encounters:
        p = enc.patient
        has_red_flags = len(enc.red_flags) > 0
        queue_list.append({
            "encounter_id": enc.id,
            "encounter_number": enc.encounter_number,
            "patient_id": enc.patient_id,
            "patient_name": f"{p.first_name} {p.last_name or ''}".strip() if p else "Unknown",
            "hospital_patient_id": p.hospital_patient_id if p else "N/A",
            "abha_number_masked": p.abha_number_masked if p else None,
            "age_gender": f"{p.date_of_birth or ''} / {p.gender}" if p else "",
            "queue_token": enc.queue_token,
            "status": enc.status,
            "priority": enc.priority,
            "department": enc.department,
            "chief_complaint": enc.chief_complaint_hint or "General Checkup",
            "has_red_flags": has_red_flags,
            "created_at": enc.created_at.isoformat() if enc.created_at else None
        })

    return StandardResponse(success=True, data=queue_list)

@router.get("/encounters/{encounter_id}", response_model=StandardResponse)
def get_encounter(encounter_id: str, db: Session = Depends(get_db)):
    encounter = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")

    patient = encounter.patient
    return StandardResponse(
        success=True,
        data={
            "encounter_id": encounter.id,
            "encounter_number": encounter.encounter_number,
            "status": encounter.status,
            "queue_token": encounter.queue_token,
            "priority": encounter.priority,
            "department": encounter.department,
            "chief_complaint_hint": encounter.chief_complaint_hint,
            "created_at": encounter.created_at.isoformat() if encounter.created_at else None,
            "patient": {
                "id": patient.id,
                "full_name": f"{patient.first_name} {patient.last_name or ''}".strip(),
                "hospital_patient_id": patient.hospital_patient_id,
                "abha_number_masked": patient.abha_number_masked,
                "phone": patient.phone,
                "gender": patient.gender,
                "date_of_birth": patient.date_of_birth,
                "preferred_language": patient.preferred_language
            } if patient else None
        }
    )

@router.patch("/encounters/{encounter_id}", response_model=StandardResponse)
def update_encounter(encounter_id: str, payload: EncounterUpdate, db: Session = Depends(get_db)):
    encounter = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")

    if payload.status:
        encounter.status = payload.status
    if payload.priority:
        encounter.priority = payload.priority
    if payload.practitioner_id:
        encounter.practitioner_id = payload.practitioner_id

    db.commit()
    db.refresh(encounter)

    return StandardResponse(
        success=True,
        data={
            "encounter_id": encounter.id,
            "status": encounter.status,
            "priority": encounter.priority
        }
    )
