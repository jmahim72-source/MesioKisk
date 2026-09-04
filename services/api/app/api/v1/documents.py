from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone
from services.api.app.core.database import get_db
from services.api.app.models.models import Document, ExtractedEntity, Encounter
from services.api.app.schemas.schemas import EntityVerifyRequest, StandardResponse
from services.api.app.services.ocr_nlp_service import OCRNLPService

router = APIRouter(tags=["Document Intelligence & OCR"])

@router.post("/encounters/{encounter_id}/documents", response_model=StandardResponse, status_code=202)
async def upload_document(
    encounter_id: str,
    file: UploadFile = File(...),
    document_type: str = Form("PRESCRIPTION"),
    document_date: Optional[str] = Form(None),
    language: Optional[str] = Form("hi"),
    db: Session = Depends(get_db)
):
    encounter = db.query(Encounter).filter(Encounter.id == encounter_id).first()
    if not encounter:
        raise HTTPException(status_code=404, detail="Encounter not found")

    content = await file.read()

    # Process Document with OCR + Medical NLP
    ocr_result = OCRNLPService.process_document(
        file_name=file.filename or "uploaded_doc.jpg",
        file_bytes=content,
        file_type=document_type
    )

    doc = Document(
        encounter_id=encounter.id,
        patient_id=encounter.patient_id,
        file_name=file.filename or "uploaded_doc.jpg",
        file_type=document_type,
        file_mime_type=file.content_type or "image/jpeg",
        file_size_bytes=len(content),
        storage_path=f"/storage/docs/{encounter.id}/{file.filename or 'doc.jpg'}",
        ocr_status="COMPLETED",
        ocr_text=ocr_result["ocr_text"],
        ocr_confidence=ocr_result["ocr_confidence"]
    )
    db.add(doc)
    db.flush()

    for ent in ocr_result["entities"]:
        entity_record = ExtractedEntity(
            document_id=doc.id,
            encounter_id=encounter.id,
            entity_type=ent["type"],
            entity_subtype=ent.get("subtype"),
            raw_text=ent["raw_text"],
            normalized=ent["normalized"],
            confidence=ent.get("confidence", 0.90),
            verification_status="PENDING",
            source_snippet=ent.get("source_snippet")
        )
        db.add(entity_record)

    db.commit()
    db.refresh(doc)

    return StandardResponse(
        success=True,
        data={
            "document_id": doc.id,
            "processing_status": "COMPLETED",
            "job_id": f"job_{doc.id[:8]}",
            "original_filename": doc.file_name,
            "entity_count": len(ocr_result["entities"])
        }
    )

@router.get("/documents/{document_id}", response_model=StandardResponse)
def get_document(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    entities = [
        {
            "id": e.id,
            "type": e.entity_type,
            "raw_text": e.raw_text,
            "normalized": e.normalized,
            "confidence": e.confidence,
            "verification_status": e.verification_status,
            "source_snippet": e.source_snippet
        }
        for e in doc.extracted_entities
    ]

    return StandardResponse(
        success=True,
        data={
            "document_id": doc.id,
            "encounter_id": doc.encounter_id,
            "file_name": doc.file_name,
            "file_type": doc.file_type,
            "ocr_status": doc.ocr_status,
            "ocr_text": doc.ocr_text,
            "ocr_confidence": doc.ocr_confidence,
            "entities": entities
        }
    )

@router.get("/documents/{document_id}/entities", response_model=StandardResponse)
def get_document_entities(document_id: str, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    entities = [
        {
            "id": e.id,
            "type": e.entity_type,
            "raw_text": e.raw_text,
            "normalized": e.normalized,
            "confidence": e.confidence,
            "verification_status": e.verification_status,
            "source_snippet": e.source_snippet
        }
        for e in doc.extracted_entities
    ]

    return StandardResponse(
        success=True,
        data={
            "document_id": doc.id,
            "entities": entities
        }
    )

@router.patch("/documents/{document_id}/entities/{entity_id}", response_model=StandardResponse)
def verify_entity(document_id: str, entity_id: str, payload: EntityVerifyRequest, db: Session = Depends(get_db)):
    entity = db.query(ExtractedEntity).filter(
        ExtractedEntity.id == entity_id,
        ExtractedEntity.document_id == document_id
    ).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Extracted entity not found")

    entity.verification_status = payload.verification_status
    if payload.normalized is not None:
        entity.normalized = payload.normalized
    if payload.doctor_comments:
        entity.doctor_comments = payload.doctor_comments

    db.commit()
    db.refresh(entity)

    return StandardResponse(
        success=True,
        data={
            "id": entity.id,
            "verification_status": entity.verification_status,
            "normalized": entity.normalized
        }
    )
