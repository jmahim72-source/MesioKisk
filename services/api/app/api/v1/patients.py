import random
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone
from services.api.app.core.database import get_db
from services.api.app.models.models import Patient
from services.api.app.schemas.schemas import PatientCreate, PatientUpdate, StandardResponse

router = APIRouter(prefix="/patients", tags=["Patient Management"])

@router.post("", response_model=StandardResponse, status_code=201)
def create_patient(payload: PatientCreate, db: Session = Depends(get_db)):
    hospital_id = payload.hospital_patient_id or f"HOSP-2026-{random.randint(100000, 999999)}"
    
    masked_abha = None
    if payload.abha_number:
        clean_abha = payload.abha_number.replace("-", "").strip()
        if len(clean_abha) >= 12:
            masked_abha = f"{clean_abha[:2]}-{clean_abha[2:6]}-XXXX-{clean_abha[-4:]}"
        else:
            masked_abha = payload.abha_number

    # Check if patient already exists by ABHA or Phone to prevent uniqueness constraint errors
    existing_patient = None
    if payload.abha_number:
        existing_patient = db.query(Patient).filter(Patient.abha_number == payload.abha_number).first()
    if not existing_patient and payload.phone:
        existing_patient = db.query(Patient).filter(
            Patient.phone == payload.phone,
            Patient.first_name.ilike(payload.first_name)
        ).first()

    if existing_patient:
        if payload.preferred_language:
            existing_patient.preferred_language = payload.preferred_language
        if payload.last_name and not existing_patient.last_name:
            existing_patient.last_name = payload.last_name
        db.commit()
        db.refresh(existing_patient)
        return StandardResponse(
            success=True,
            data={
                "id": existing_patient.id,
                "hospital_patient_id": existing_patient.hospital_patient_id,
                "abha_number_masked": existing_patient.abha_number_masked,
                "full_name": f"{existing_patient.first_name} {existing_patient.last_name or ''}".strip(),
                "date_of_birth": existing_patient.date_of_birth,
                "gender": existing_patient.gender,
                "phone": existing_patient.phone,
                "preferred_language": existing_patient.preferred_language,
                "created_at": existing_patient.created_at.isoformat() if existing_patient.created_at else datetime.now().isoformat()
            }
        )

    patient = Patient(
        abha_number=payload.abha_number,
        abha_number_masked=masked_abha,
        hospital_patient_id=hospital_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        date_of_birth=payload.date_of_birth or "1975-01-01",
        gender=payload.gender or "OTHER",
        phone=payload.phone,
        email=payload.email,
        preferred_language=payload.preferred_language or "hi",
        address=payload.address.dict() if payload.address else None,
        emergency_contact=payload.emergency_contact.dict() if payload.emergency_contact else None
    )

    db.add(patient)
    db.commit()
    db.refresh(patient)

    return StandardResponse(
        success=True,
        data={
            "id": patient.id,
            "hospital_patient_id": patient.hospital_patient_id,
            "abha_number_masked": patient.abha_number_masked,
            "full_name": f"{patient.first_name} {patient.last_name or ''}".strip(),
            "date_of_birth": patient.date_of_birth,
            "gender": patient.gender,
            "phone": patient.phone,
            "preferred_language": patient.preferred_language,
            "created_at": patient.created_at.isoformat() if patient.created_at else datetime.now().isoformat()
        }
    )

@router.get("/search", response_model=StandardResponse)
def search_patients(q: str = Query(..., min_length=2), db: Session = Depends(get_db)):
    query = f"%{q}%"
    patients = db.query(Patient).filter(
        (Patient.first_name.ilike(query)) |
        (Patient.last_name.ilike(query)) |
        (Patient.hospital_patient_id.ilike(query)) |
        (Patient.phone.ilike(query)) |
        (Patient.abha_number.ilike(query))
    ).limit(20).all()

    results = [
        {
            "id": p.id,
            "hospital_patient_id": p.hospital_patient_id,
            "abha_number_masked": p.abha_number_masked,
            "full_name": f"{p.first_name} {p.last_name or ''}".strip(),
            "date_of_birth": p.date_of_birth,
            "gender": p.gender,
            "phone": p.phone,
            "preferred_language": p.preferred_language,
            "created_at": p.created_at.isoformat() if p.created_at else None
        }
        for p in patients
    ]

    return StandardResponse(success=True, data=results)

@router.get("/{patient_id}", response_model=StandardResponse)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return StandardResponse(
        success=True,
        data={
            "id": patient.id,
            "hospital_patient_id": patient.hospital_patient_id,
            "abha_number": patient.abha_number,
            "abha_number_masked": patient.abha_number_masked,
            "first_name": patient.first_name,
            "last_name": patient.last_name,
            "full_name": f"{patient.first_name} {patient.last_name or ''}".strip(),
            "date_of_birth": patient.date_of_birth,
            "gender": patient.gender,
            "phone": patient.phone,
            "preferred_language": patient.preferred_language,
            "address": patient.address,
            "emergency_contact": patient.emergency_contact,
            "created_at": patient.created_at.isoformat() if patient.created_at else None
        }
    )

@router.patch("/{patient_id}", response_model=StandardResponse)
def update_patient(patient_id: str, payload: PatientUpdate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if payload.first_name is not None:
        patient.first_name = payload.first_name
    if payload.last_name is not None:
        patient.last_name = payload.last_name
    if payload.phone is not None:
        patient.phone = payload.phone
    if payload.preferred_language is not None:
        patient.preferred_language = payload.preferred_language
    if payload.address is not None:
        patient.address = payload.address.dict()
    if payload.emergency_contact is not None:
        patient.emergency_contact = payload.emergency_contact.dict()

    db.commit()
    db.refresh(patient)

    return StandardResponse(
        success=True,
        data={
            "id": patient.id,
            "hospital_patient_id": patient.hospital_patient_id,
            "full_name": f"{patient.first_name} {patient.last_name or ''}".strip(),
            "phone": patient.phone,
            "preferred_language": patient.preferred_language
        }
    )
