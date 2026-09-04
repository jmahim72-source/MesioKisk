import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Float, DateTime, Date, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from services.api.app.core.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=True)
    designation = Column(String(100), default="Doctor")
    department = Column(String(100), default="General Medicine")
    employee_id = Column(String(50), unique=True, nullable=True)
    phone = Column(String(20), nullable=True)
    role = Column(String(30), nullable=False, default="DOCTOR")  # DOCTOR, ADMIN, TRIAGE_STAFF, KIOSK
    permissions = Column(JSON, nullable=True)
    hpr_id = Column(String(50), nullable=True)
    facility_id = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    abha_number = Column(String(20), unique=True, nullable=True, index=True)
    abha_number_masked = Column(String(25), nullable=True)
    abha_health_id = Column(String(50), nullable=True)
    hospital_patient_id = Column(String(30), unique=True, nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=True)
    date_of_birth = Column(String(20), nullable=True)
    gender = Column(String(20), default="OTHER")
    phone = Column(String(20), nullable=False, index=True)
    email = Column(String(100), nullable=True)
    preferred_language = Column(String(10), default="hi")
    is_low_literacy = Column(Boolean, default=False)
    requires_assistance = Column(Boolean, default=False)
    address = Column(JSON, nullable=True)
    emergency_contact = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    encounters = relationship("Encounter", back_populates="patient", cascade="all, delete-orphan")
    consents = relationship("Consent", back_populates="patient", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="patient", cascade="all, delete-orphan")

class Consent(Base):
    __tablename__ = "consents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    encounter_id = Column(String(36), nullable=True)
    purpose = Column(String(100), default="CLINICAL_INTAKE")
    data_categories = Column(JSON, nullable=False)  # ["DEMOGRAPHICS", "CLINICAL_HISTORY", "DOCUMENTS"]
    language = Column(String(10), default="hi")
    method = Column(String(50), default="KIOSK_AUDIO_ACKNOWLEDGMENT")
    status = Column(String(30), default="GRANTED")  # GRANTED, DENIED, REVOKED
    granted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    valid_until = Column(DateTime, nullable=True)
    witness_user_id = Column(String(36), nullable=True)

    patient = relationship("Patient", back_populates="consents")

class Encounter(Base):
    __tablename__ = "encounters"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    encounter_number = Column(String(30), unique=True, nullable=False, index=True)
    encounter_date = Column(String(20), default=lambda: datetime.now().strftime("%Y-%m-%d"))
    encounter_type = Column(String(30), default="OUTPATIENT")
    department = Column(String(100), default="General Medicine")
    practitioner_id = Column(String(36), nullable=True)
    kiosk_id = Column(String(50), default="KIOSK-01")
    queue_token = Column(String(20), nullable=False)  # e.g., "A-042"
    status = Column(String(30), default="ARRIVED")  # ARRIVED, INTAKE_IN_PROGRESS, READY_FOR_REVIEW, IN_CONSULTATION, COMPLETED, CANCELLED
    priority = Column(String(20), default="ROUTINE")  # ROUTINE, PRIORITY, EMERGENCY
    chief_complaint_hint = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    patient = relationship("Patient", back_populates="encounters")
    interviews = relationship("InterviewSession", back_populates="encounter", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="encounter", cascade="all, delete-orphan")
    clinical_summaries = relationship("ClinicalSummary", back_populates="encounter", cascade="all, delete-orphan")
    red_flags = relationship("RedFlagAlert", back_populates="encounter", cascade="all, delete-orphan")
    ayurvedic_assessments = relationship("AyurvedicAssessment", back_populates="encounter", cascade="all, delete-orphan")

class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    encounter_id = Column(String(36), ForeignKey("encounters.id", ondelete="CASCADE"), nullable=False)
    session_start_time = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    session_end_time = Column(DateTime, nullable=True)
    language_used = Column(String(10), default="hi")
    input_mode = Column(String(30), default="VOICE_OR_TEXT")
    total_duration_seconds = Column(Integer, default=0)
    completion_status = Column(String(30), default="IN_PROGRESS")  # IN_PROGRESS, COMPLETED, ABANDONED
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    encounter = relationship("Encounter", back_populates="interviews")
    responses = relationship("InterviewResponse", back_populates="session", cascade="all, delete-orphan")

class InterviewResponse(Base):
    __tablename__ = "interview_responses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    session_id = Column(String(36), ForeignKey("interview_sessions.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String(50), nullable=False)
    question_text = Column(Text, nullable=False)
    question_category = Column(String(50), nullable=True)
    input_type = Column(String(30), default="VOICE_OR_TEXT")
    raw_text = Column(Text, nullable=True)
    normalized_answer = Column(JSON, nullable=True)
    audio_document_id = Column(String(36), nullable=True)
    confidence_score = Column(Float, default=1.0)
    requires_verification = Column(Boolean, default=False)
    verified_by_doctor = Column(Boolean, default=False)
    doctor_comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    session = relationship("InterviewSession", back_populates="responses")

class AyurvedicAssessment(Base):
    __tablename__ = "ayurvedic_assessments"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    encounter_id = Column(String(36), ForeignKey("encounters.id", ondelete="CASCADE"), nullable=False)
    prakriti_dominant_dosha = Column(String(30), nullable=True)  # VATA, PITTA, KAPHA, VATA_PITTA, etc.
    prakriti_vata_score = Column(Integer, default=0)
    prakriti_pitta_score = Column(Integer, default=0)
    prakriti_kapha_score = Column(Integer, default=0)
    vikriti_dominant_dosha = Column(String(30), nullable=True)
    agni_type = Column(String(30), default="SAMAGNI")  # VISHAMAGNI, TIKSHNAGNI, MANDAGNI, SAMAGNI
    koshtha_type = Column(String(30), default="MADHYAMA")  # KRURA, MRIDU, MADHYAMA
    ahara_vihara_notes = Column(Text, nullable=True)
    additional_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    encounter = relationship("Encounter", back_populates="ayurvedic_assessments")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    encounter_id = Column(String(36), ForeignKey("encounters.id", ondelete="CASCADE"), nullable=False)
    patient_id = Column(String(36), ForeignKey("patients.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), default="PRESCRIPTION")  # PRESCRIPTION, LAB_REPORT, DISCHARGE_SUMMARY, OTHER
    file_mime_type = Column(String(100), default="image/jpeg")
    file_size_bytes = Column(Integer, default=0)
    storage_path = Column(String(500), nullable=False)
    ocr_status = Column(String(30), default="COMPLETED")  # PENDING, PROCESSING, COMPLETED, FAILED
    ocr_text = Column(Text, nullable=True)
    ocr_confidence = Column(Float, default=0.92)
    upload_source = Column(String(50), default="KIOSK")
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    encounter = relationship("Encounter", back_populates="documents")
    patient = relationship("Patient", back_populates="documents")
    extracted_entities = relationship("ExtractedEntity", back_populates="document", cascade="all, delete-orphan")

class ExtractedEntity(Base):
    __tablename__ = "extracted_entities"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    encounter_id = Column(String(36), nullable=False)
    entity_type = Column(String(50), nullable=False)  # MEDICATION, DIAGNOSIS, LAB_TEST, OBSERVATION, ALLERGY
    entity_subtype = Column(String(50), nullable=True)
    raw_text = Column(Text, nullable=False)
    normalized = Column(JSON, nullable=False)
    confidence = Column(Float, default=0.88)
    verification_status = Column(String(30), default="PENDING")  # PENDING, VERIFIED, REJECTED, EDITED
    source_snippet = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    document = relationship("Document", back_populates="extracted_entities")

class ClinicalSummary(Base):
    __tablename__ = "clinical_summaries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    encounter_id = Column(String(36), ForeignKey("encounters.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, default=1)
    status = Column(String(20), default="DRAFT")  # DRAFT, FINAL
    summary_json = Column(JSON, nullable=False)
    summary_text = Column(Text, nullable=True)
    generated_by = Column(String(50), default="AI_SERVICE")
    generation_confidence = Column(Float, default=0.92)
    is_final = Column(Boolean, default=False)
    verified_by_doctor = Column(Boolean, default=False)
    verified_by = Column(String(100), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    doctor_notes = Column(Text, nullable=True)
    doctor_edits_made = Column(Boolean, default=False)
    fhir_bundle_id = Column(String(100), nullable=True)
    fhir_exported_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    encounter = relationship("Encounter", back_populates="clinical_summaries")

class RedFlagAlert(Base):
    __tablename__ = "red_flag_alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    encounter_id = Column(String(36), ForeignKey("encounters.id", ondelete="CASCADE"), nullable=False)
    rule_id = Column(String(50), nullable=False)  # CARDIAC_001, STROKE_001, etc.
    alert_type = Column(String(50), nullable=False)
    alert_severity = Column(String(20), default="HIGH")  # LOW, MEDIUM, HIGH, CRITICAL
    alert_status = Column(String(30), default="ACTIVE")  # ACTIVE, ACKNOWLEDGED, RESOLVED
    triggered_symptoms = Column(JSON, nullable=False)
    suggested_action = Column(Text, nullable=False)
    clinical_context = Column(Text, nullable=True)
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    encounter = relationship("Encounter", back_populates="red_flags")

    def __init__(self, **kwargs):
        if "severity" in kwargs and "alert_severity" not in kwargs:
            kwargs["alert_severity"] = kwargs.pop("severity")
        if "status" in kwargs and "alert_status" not in kwargs:
            kwargs["alert_status"] = kwargs.pop("status")
        super().__init__(**kwargs)

    @property
    def severity(self):
        return self.alert_severity

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    event_type = Column(String(50), nullable=False)  # CREATE, READ, UPDATE, DELETE, LOGIN, EXPORT
    event_category = Column(String(50), nullable=False)  # PATIENT_DATA, DOCUMENT, SUMMARY, CONSENT, SECURITY
    user_id = Column(String(36), nullable=True)
    user_role = Column(String(30), nullable=True)
    target_table = Column(String(50), nullable=True)
    target_id = Column(String(36), nullable=True)
    changes_summary = Column(Text, nullable=True)
    action_timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
