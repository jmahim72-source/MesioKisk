from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from services.api.app.core.database import get_db
from services.api.app.models.models import Consent, Patient
from services.api.app.schemas.schemas import ConsentCreate, ConsentOut, StandardResponse

router = APIRouter(prefix="/patients", tags=["Consent Management"])

@router.post("/{patient_id}/consents", response_model=StandardResponse, status_code=201)
def create_consent(patient_id: str, payload: ConsentCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    valid_until = datetime.now(timezone.utc) + timedelta(days=365)

    consent = Consent(
        patient_id=patient.id,
        purpose=payload.purpose,
        data_categories=payload.data_categories,
        language=payload.language,
        method=payload.method,
        status="GRANTED",
        valid_until=valid_until,
        witness_user_id=payload.witness_user_id
    )

    db.add(consent)
    db.commit()
    db.refresh(consent)

    return StandardResponse(
        success=True,
        data=ConsentOut(
            consent_id=consent.id,
            status=consent.status,
            purpose=consent.purpose,
            granted_at=consent.granted_at.isoformat() if consent.granted_at else datetime.now().isoformat(),
            valid_until=consent.valid_until.isoformat() if consent.valid_until else None
        ).dict()
    )

@router.get("/{patient_id}/consents", response_model=StandardResponse)
def get_consents(patient_id: str, db: Session = Depends(get_db)):
    consents = db.query(Consent).filter(Consent.patient_id == patient_id).all()
    results = [
        ConsentOut(
            consent_id=c.id,
            status=c.status,
            purpose=c.purpose,
            granted_at=c.granted_at.isoformat() if c.granted_at else datetime.now().isoformat(),
            valid_until=c.valid_until.isoformat() if c.valid_until else None
        ).dict()
        for c in consents
    ]
    return StandardResponse(success=True, data=results)

@router.post("/{patient_id}/consents/{consent_id}/revoke", response_model=StandardResponse)
def revoke_consent(patient_id: str, consent_id: str, db: Session = Depends(get_db)):
    consent = db.query(Consent).filter(Consent.id == consent_id, Consent.patient_id == patient_id).first()
    if not consent:
        raise HTTPException(status_code=404, detail="Consent not found")

    consent.status = "REVOKED"
    db.commit()

    return StandardResponse(success=True, data={"message": "Consent successfully revoked", "status": "REVOKED"})
