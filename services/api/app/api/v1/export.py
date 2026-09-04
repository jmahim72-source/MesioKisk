from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from services.api.app.core.database import get_db
from services.api.app.models.models import Encounter, ClinicalSummary, Patient
from services.api.app.schemas.schemas import FHIRExportRequest, ABDMExportRequest, StandardResponse
from services.api.app.services.fhir_exporter import FHIRExporter

router = APIRouter(tags=["FHIR R4 & ABDM Interoperability"])

@router.post("/encounters/{encounter_id}/export/fhir", response_model=StandardResponse, status_code=202)
def export_encounter_to_fhir(encounter_id: str, payload: FHIRExportRequest, db: Session = Depends(get_db)):
    encounter = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")

    patient = encounter.patient
    summary = db.query(ClinicalSummary).filter(ClinicalSummary.encounter_id == encounter.id).first()
    if not summary:
        raise HTTPException(status_code=400, detail="Clinical summary must be generated before FHIR export")

    fhir_bundle = FHIRExporter.create_bundle(patient=patient, encounter=encounter, summary=summary)
    
    summary.fhir_bundle_id = fhir_bundle["id"]
    summary.fhir_exported_at = datetime.now(timezone.utc)
    db.commit()

    return StandardResponse(
        success=True,
        data={
            "export_id": f"exp_{encounter.id[:8]}",
            "status": "COMPLETED",
            "format": "FHIR_R4_JSON",
            "bundle": fhir_bundle
        }
    )

@router.get("/exports/{export_id}", response_model=StandardResponse)
def get_export_bundle(export_id: str, db: Session = Depends(get_db)):
    summary = db.query(ClinicalSummary).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Export not found")
    
    encounter = summary.encounter
    patient = encounter.patient
    fhir_bundle = FHIRExporter.create_bundle(patient=patient, encounter=encounter, summary=summary)

    return StandardResponse(
        success=True,
        data={
            "export_id": export_id,
            "status": "COMPLETED",
            "format": "FHIR_R4_JSON",
            "bundle": fhir_bundle
        }
    )

@router.post("/encounters/{encounter_id}/export/abdm", response_model=StandardResponse)
def export_to_abdm(encounter_id: str, payload: ABDMExportRequest, db: Session = Depends(get_db)):
    encounter = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")

    patient = encounter.patient
    summary = db.query(ClinicalSummary).filter(ClinicalSummary.encounter_id == encounter.id).first()
    if not summary:
        raise HTTPException(status_code=400, detail="Clinical summary must be generated before ABDM export")

    fhir_bundle = FHIRExporter.create_bundle(patient=patient, encounter=encounter, summary=summary)

    return StandardResponse(
        success=True,
        data={
            "abdm_transaction_id": f"abdm-txn-{encounter.id[:8]}",
            "target": payload.target or "MOCK_HIS",
            "status": "SUCCESSFULLY_PUSHED",
            "resource_count": len(fhir_bundle["entry"]),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    )
