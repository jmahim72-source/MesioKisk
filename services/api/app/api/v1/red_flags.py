from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from services.api.app.core.database import get_db
from services.api.app.models.models import RedFlagAlert, Encounter
from services.api.app.schemas.schemas import RedFlagAlertOut, RedFlagAcknowledgeRequest, StandardResponse

router = APIRouter(tags=["Red Flag Alerts & Emergency Triage"])

@router.get("/encounters/{encounter_id}/red-flags", response_model=StandardResponse)
def get_encounter_red_flags(encounter_id: str, db: Session = Depends(get_db)):
    alerts = db.query(RedFlagAlert).filter(RedFlagAlert.encounter_id == encounter_id).all()
    results = [
        {
            "alert_id": a.id,
            "encounter_id": a.encounter_id,
            "rule_id": a.rule_id,
            "alert_type": a.alert_type,
            "severity": a.alert_severity,
            "status": a.alert_status,
            "triggered_symptoms": a.triggered_symptoms,
            "suggested_action": a.suggested_action,
            "clinical_context": a.clinical_context,
            "created_at": a.created_at.isoformat() if a.created_at else None
        }
        for a in alerts
    ]
    return StandardResponse(success=True, data=results)

@router.get("/red-flags", response_model=StandardResponse)
def get_all_active_red_flags(db: Session = Depends(get_db)):
    alerts = db.query(RedFlagAlert).filter(RedFlagAlert.alert_status == "ACTIVE").order_by(RedFlagAlert.created_at.desc()).all()
    results = []
    for a in alerts:
        enc = a.encounter
        p = enc.patient if enc else None
        results.append({
            "alert_id": a.id,
            "encounter_id": a.encounter_id,
            "patient_name": f"{p.first_name} {p.last_name or ''}".strip() if p else "Unknown",
            "hospital_patient_id": p.hospital_patient_id if p else "N/A",
            "queue_token": enc.queue_token if enc else "N/A",
            "department": enc.department if enc else "N/A",
            "rule_id": a.rule_id,
            "alert_type": a.alert_type,
            "severity": a.alert_severity,
            "status": a.alert_status,
            "triggered_symptoms": a.triggered_symptoms,
            "suggested_action": a.suggested_action,
            "created_at": a.created_at.isoformat() if a.created_at else None
        })
    return StandardResponse(success=True, data=results)

@router.post("/red-flags/{alert_id}/acknowledge", response_model=StandardResponse)
def acknowledge_red_flag(alert_id: str, payload: RedFlagAcknowledgeRequest, db: Session = Depends(get_db)):
    alert = db.query(RedFlagAlert).filter(RedFlagAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Red flag alert not found")

    alert.alert_status = "ACKNOWLEDGED"
    alert.acknowledged_by = "Triage Staff / Attending Physician"
    alert.acknowledged_at = datetime.now(timezone.utc)
    if payload.note:
        alert.clinical_context = (alert.clinical_context or "") + f" [Ack Note: {payload.note}]"

    db.commit()
    db.refresh(alert)

    return StandardResponse(
        success=True,
        data={
            "alert_id": alert.id,
            "status": alert.alert_status,
            "acknowledged_by": alert.acknowledged_by,
            "acknowledged_at": alert.acknowledged_at.isoformat()
        }
    )
