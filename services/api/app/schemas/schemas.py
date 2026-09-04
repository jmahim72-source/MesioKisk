from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime

# Standard Envelope Meta
class ResponseMeta(BaseModel):
    request_id: str = "req-01"
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat() + "Z")

class StandardResponse(BaseModel):
    success: bool = True
    data: Any
    meta: Optional[ResponseMeta] = None

class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str

class ErrorPayload(BaseModel):
    code: str
    message: str
    details: Optional[List[ErrorDetail]] = None

class StandardErrorResponse(BaseModel):
    success: bool = False
    error: ErrorPayload
    meta: Optional[ResponseMeta] = None

# Auth Schemas
class LoginRequest(BaseModel):
    username: str
    password: str
    role: Optional[str] = "DOCTOR"

class UserOut(BaseModel):
    id: str
    username: str
    email: str
    first_name: str
    last_name: Optional[str] = None
    role: str
    designation: Optional[str] = None
    department: Optional[str] = None
    hospital_id: Optional[str] = "hosp_01J"

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int = 86400
    user: UserOut

class RefreshRequest(BaseModel):
    refresh_token: str

# Patient Schemas
class AddressSchema(BaseModel):
    line1: Optional[str] = None
    line2: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

class EmergencyContactSchema(BaseModel):
    name: str
    relationship: str
    phone: str

class PatientCreate(BaseModel):
    identifier_type: Optional[str] = "HOSPITAL_ID"
    abha_number: Optional[str] = None
    hospital_patient_id: Optional[str] = None
    first_name: str
    last_name: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = "OTHER"
    phone: str
    email: Optional[str] = None
    preferred_language: Optional[str] = "hi"
    address: Optional[AddressSchema] = None
    emergency_contact: Optional[EmergencyContactSchema] = None

class PatientUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Optional[str] = None
    address: Optional[AddressSchema] = None
    emergency_contact: Optional[EmergencyContactSchema] = None

class PatientOut(BaseModel):
    id: str
    hospital_patient_id: str
    abha_number_masked: Optional[str] = None
    full_name: str
    date_of_birth: Optional[str] = None
    gender: str
    phone: str
    preferred_language: str
    created_at: str

# Consent Schemas
class ConsentCreate(BaseModel):
    purpose: str = "CLINICAL_INTAKE"
    data_categories: List[str] = ["DEMOGRAPHICS", "CLINICAL_HISTORY", "DOCUMENTS"]
    language: str = "hi"
    method: str = "KIOSK_AUDIO_ACKNOWLEDGMENT"
    valid_until: Optional[str] = None
    witness_user_id: Optional[str] = None

class ConsentOut(BaseModel):
    consent_id: str
    status: str
    purpose: str
    granted_at: str
    valid_until: Optional[str] = None

# Encounter Schemas
class EncounterCreate(BaseModel):
    facility_id: Optional[str] = "fac_01J"
    department: str = "General Medicine"
    practitioner_id: Optional[str] = None
    encounter_type: str = "OUTPATIENT"
    chief_complaint_hint: Optional[str] = None
    priority: Optional[str] = "ROUTINE"

class EncounterUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    practitioner_id: Optional[str] = None

class EncounterOut(BaseModel):
    encounter_id: str
    patient_id: str
    status: str
    queue_token: str
    priority: str
    department: str
    created_at: str

# Interview Schemas
class InterviewStartRequest(BaseModel):
    mode: Optional[str] = "COMBINED"
    language: Optional[str] = "hi"
    input_preference: Optional[str] = "VOICE"
    modules: Optional[List[str]] = ["GENERAL_CLINICAL", "AYURVEDIC"]

class QuestionOut(BaseModel):
    id: str
    text: str
    localized_text: Optional[str] = None
    audio_prompt_text: Optional[str] = None
    input_type: str
    required: bool = True
    options: Optional[List[Any]] = None

class InterviewResponseSubmit(BaseModel):
    question_id: str
    input_type: Optional[str] = "VOICE"
    audio_document_id: Optional[str] = None
    raw_text: Optional[str] = None
    normalized_answer: Optional[Dict[str, Any]] = None
    confidence: Optional[float] = 1.0

# Document Schemas
class ExtractedEntityOut(BaseModel):
    id: str
    type: str
    raw_text: str
    normalized: Dict[str, Any]
    confidence: float
    verification_status: str
    source_snippet: Optional[str] = None

class EntityVerifyRequest(BaseModel):
    verification_status: str = "VERIFIED"
    normalized: Optional[Dict[str, Any]] = None
    doctor_comments: Optional[str] = None

class DocumentOut(BaseModel):
    document_id: str
    processing_status: str
    original_filename: str
    ocr_text: Optional[str] = None
    ocr_confidence: Optional[float] = None
    entities: Optional[List[ExtractedEntityOut]] = None

# Summary Schemas
class ClinicalSummarySections(BaseModel):
    chief_complaint: str
    history_present_illness: str
    past_medical_history: List[str] = []
    medications: List[Union[Dict[str, Any], str]] = []
    allergies: List[str] = []
    ayurvedic_assessment: Optional[Dict[str, Any]] = None
    red_flags: List[str] = []

class ClinicalSummaryOut(BaseModel):
    summary_id: str
    encounter_id: str
    status: str
    sections: ClinicalSummarySections
    source_references: Optional[List[Dict[str, Any]]] = None
    doctor_notes: Optional[str] = None
    verified_by: Optional[str] = None
    verified_at: Optional[str] = None
    generated_at: str

class SummaryVerifyRequest(BaseModel):
    verification_note: Optional[str] = "Medication and history confirmed with patient."
    doctor_id: Optional[str] = None

# Red Flag Alert Schemas
class RedFlagAlertOut(BaseModel):
    alert_id: str
    encounter_id: str
    rule_id: str
    severity: str
    status: str
    triggered_rules: Optional[List[str]] = None
    triggered_symptoms: List[str] = []
    suggested_action: str
    clinical_context: Optional[str] = None
    created_at: str

class RedFlagAcknowledgeRequest(BaseModel):
    action: str = "TRIAGE_REFERRED"
    note: Optional[str] = "Patient referred to emergency triage desk."

# Export Schemas
class FHIRExportRequest(BaseModel):
    bundle_type: Optional[str] = "DOCUMENT"
    include_documents: Optional[bool] = True
    include_ayurvedic_assessment: Optional[bool] = True

class ABDMExportRequest(BaseModel):
    consent_id: str
    target: Optional[str] = "MOCK_HIS"
    resource_types: Optional[List[str]] = ["PATIENT", "ENCOUNTER", "COMPOSITION", "DIAGNOSTIC_REPORT"]

class ExportOut(BaseModel):
    export_id: str
    status: str = "COMPLETED"
    format: str = "FHIR_R4_JSON"
    bundle_data: Optional[Dict[str, Any]] = None
