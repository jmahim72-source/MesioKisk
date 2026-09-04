# SIH26047 - Database Schema Documentation

## Overview

This document describes the PostgreSQL database schema for the Patient Case-Taking Software (MediKiosk). The schema is designed to support patient registration, clinical interviews, document management, Ayurvedic assessments, and ABDM integration.

---

## Entity Relationship Diagram (Conceptual)

```
Patient (1) ──< (N) Encounter (1) ──< (N) InterviewResponse
    │                                   │
    │                                   └──< (N) AyurvedicAssessment
    │
    ├──< (N) Document
    │         │
    │         └──< (N) ExtractedEntity
    │
    ├──< (N) Consent
    │
    └──< (N) AuditLog

Encounter (1) ──< (1) ClinicalSummary
    │
    └──< (N) RedFlagAlert
```

---

## Core Tables

### 1. patients

Stores patient demographic and identification information.

```sql
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    abha_number VARCHAR(17) UNIQUE, -- 14-digit ABHA ID
    abha_health_id VARCHAR(50), -- Full ABHA health ID
    hospital_id VARCHAR(20) UNIQUE, -- Hospital-generated patient ID
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20), -- Male, Female, Other, Transgender
    phone VARCHAR(15),
    email VARCHAR(100),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    preferred_language VARCHAR(50) DEFAULT 'Hindi',
    is_low_literacy BOOLEAN DEFAULT FALSE,
    requires_assistance BOOLEAN DEFAULT FALSE,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(15),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX idx_patients_abha ON patients(abha_number);
CREATE INDEX idx_patients_hospital_id ON patients(hospital_id);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_created_at ON patients(created_at);
```

---

### 2. encounters

Represents each OPD visit/consultation for a patient.

```sql
CREATE TABLE encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_number VARCHAR(20) UNIQUE NOT NULL, -- Auto-generated: OPD-2026-00001
    encounter_date DATE NOT NULL DEFAULT CURRENT_DATE,
    encounter_type VARCHAR(50) DEFAULT 'OPD', -- OPD, Emergency, Follow-up
    department VARCHAR(100), -- General Medicine, Ayurveda, etc.
    assigned_doctor_id UUID, -- References users table
    registration_method VARCHAR(50) DEFAULT 'kiosk', -- kiosk, assisted, online
    kiosk_id VARCHAR(20), -- Physical kiosk identifier
    token_number INTEGER,
    status VARCHAR(30) DEFAULT 'registered', -- registered, in_progress, completed, cancelled
    triage_priority VARCHAR(20) DEFAULT 'routine', -- routine, priority, emergency
    checked_in_at TIMESTAMP WITH TIME ZONE,
    consultation_started_at TIMESTAMP WITH TIME ZONE,
    consultation_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_encounter_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Indexes
CREATE INDEX idx_encounters_patient_id ON encounters(patient_id);
CREATE INDEX idx_encounters_encounter_date ON encounters(encounter_date);
CREATE INDEX idx_encounters_status ON encounters(status);
CREATE INDEX idx_encounters_number ON encounters(encounter_number);
```

---

### 3. interview_sessions

Tracks each interview session (one per encounter, but can be extended for follow-ups).

```sql
CREATE TABLE interview_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    session_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    session_end_time TIMESTAMP WITH TIME ZONE,
    language_used VARCHAR(50), -- Hindi, English, etc.
    input_mode VARCHAR(30), -- voice, touch, mixed
    total_duration_seconds INTEGER,
    total_questions_asked INTEGER DEFAULT 0,
    total_questions_answered INTEGER DEFAULT 0,
    completion_status VARCHAR(30) DEFAULT 'in_progress', -- in_progress, completed, abandoned
    audio_recording_path VARCHAR(500), -- Path to full session audio
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_interview_encounter FOREIGN KEY (encounter_id) REFERENCES encounters(id)
);

-- Indexes
CREATE INDEX idx_interview_encounter_id ON interview_sessions(encounter_id);
CREATE INDEX idx_interview_status ON interview_sessions(completion_status);
```

---

### 4. interview_responses

Stores individual question-answer pairs from the clinical interview.

```sql
CREATE TABLE interview_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_id VARCHAR(50) NOT NULL, -- From question bank (e.g., "CC_001", "HPI_015")
    question_text TEXT NOT NULL,
    question_category VARCHAR(50), -- chief_complaint, hpi, past_history, etc.
    question_section VARCHAR(50), -- e.g., "respiratory", "cardiovascular", "ayurvedic_prakriti"
    response_type VARCHAR(30), -- text, single_choice, multi_choice, numeric, date
    response_value TEXT, -- Patient's answer (stored as text for flexibility)
    response_structured JSONB, -- Structured representation if applicable
    audio_clip_path VARCHAR(500), -- Path to audio clip of this response
    confidence_score DECIMAL(5,4), -- AI confidence in response accuracy (0.0000-1.0000)
    requires_verification BOOLEAN DEFAULT FALSE,
    verified_by_doctor BOOLEAN DEFAULT FALSE,
    doctor_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_response_session FOREIGN KEY (session_id) REFERENCES interview_sessions(id)
);

-- Indexes
CREATE INDEX idx_responses_session_id ON interview_responses(session_id);
CREATE INDEX idx_responses_category ON interview_responses(question_category);
CREATE INDEX idx_responses_section ON interview_responses(question_section);
CREATE INDEX idx_responses_requires_verification ON interview_responses(requires_verification);
```

---

### 5. ayurvedic_assessments

Stores Dashavidha Pariksha and other Ayurvedic assessment parameters.

```sql
CREATE TABLE ayurvedic_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,

    -- Prakriti (Constitution)
    prakriti_vata_score INTEGER CHECK (prakriti_vata_score BETWEEN 0 AND 10),
    prakriti_pitta_score INTEGER CHECK (prakriti_pitta_score BETWEEN 0 AND 10),
    prakriti_kapha_score INTEGER CHECK (prakriti_kapha_score BETWEEN 0 AND 10),
    prakriti_dominant_dosha VARCHAR(20), -- Vata, Pitta, Kapha, Vata-Pitta, etc.

    -- Vikriti (Current Imbalance)
    vikriti_vata_score INTEGER CHECK (vikriti_vata_score BETWEEN 0 AND 10),
    vikriti_pitta_score INTEGER CHECK (vikriti_pitta_score BETWEEN 0 AND 10),
    vikriti_kapha_score INTEGER CHECK (vikriti_kapha_score BETWEEN 0 AND 10),
    vikriti_dominant_dosha VARCHAR(20),

    -- Agni (Digestive Fire)
    agni_type VARCHAR(30), -- Vishamagni, Tikshnagni, Mandagni, Samagni

    -- Koshtha (Bowel Habit)
    koshtha_type VARCHAR(30), -- Krura, Madhyama, Mridu

    -- Sara (Tissue Quality)
    sara_type VARCHAR(50), -- Pravara, Madhyama, Avara

    -- Samhanana (Body Build)
    samhanana_type VARCHAR(50), -- Pravara, Madhyama, Avara

    -- Pramana (Body Measurements)
    height_cm DECIMAL(5,2),
    weight_kg DECIMAL(5,2),
    bmi DECIMAL(5,2),

    -- Satmya (Habituation)
    satmya_description TEXT,

    -- Satva (Mental Strength)
    satva_type VARCHAR(30), -- Pravara, Madhyama, Avara

    -- Ahara Shakti (Digestive Capacity)
    ahara_shakti VARCHAR(30), -- Pravara, Madhyama, Avara

    -- Vyayama Shakti (Exercise Capacity)
    vyayama_shakti VARCHAR(30), -- Pravara, Madhyama, Avara

    -- Vaya (Age Group)
    vaya_category VARCHAR(30), -- Balavastha, Madhyavastha, Jirnavastha

    -- Nidana (Etiological Factors)
    nidana_factors TEXT[],

    -- Samprapti (Pathogenesis)
    samprapti_description TEXT,

    -- Additional Notes
    additional_notes TEXT,

    -- Metadata
    assessed_by VARCHAR(100), -- AI or doctor name
    assessment_method VARCHAR(50), -- ai_generated, doctor_entered, hybrid
    confidence_score DECIMAL(5,4),
    verified_by_doctor BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ayurvedic_encounter FOREIGN KEY (encounter_id) REFERENCES encounters(id)
);

-- Indexes
CREATE INDEX idx_ayurvedic_encounter_id ON ayurvedic_assessments(encounter_id);
CREATE INDEX idx_ayurvedic_prakriti ON ayurvedic_assessments(prakriti_dominant_dosha);
```

---

### 6. documents

Stores uploaded/scanned medical documents.

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,

    -- File Information
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50), -- prescription, lab_report, discharge_summary, imaging, certificate, other
    file_mime_type VARCHAR(100), -- image/jpeg, application/pdf, etc.
    file_size_bytes INTEGER,
    storage_path VARCHAR(500) NOT NULL, -- S3/MinIO path
    storage_bucket VARCHAR(100),

    -- Document Metadata
    document_date DATE, -- Date on the document (if available)
    issuing_facility VARCHAR(255), -- Hospital/clinic name
    issuing_doctor VARCHAR(200),

    -- OCR Status
    ocr_status VARCHAR(30) DEFAULT 'pending', -- pending, processing, completed, failed
    ocr_text TEXT, -- Full extracted text
    ocr_confidence DECIMAL(5,4),
    ocr_processed_at TIMESTAMP WITH TIME ZONE,

    -- Upload Metadata
    upload_source VARCHAR(50), -- kiosk, doctor_dashboard, mobile_app
    uploaded_by VARCHAR(100), -- Patient name or user ID
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(100),
    verified_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT fk_document_encounter FOREIGN KEY (encounter_id) REFERENCES encounters(id),
    CONSTRAINT fk_document_patient FOREIGN KEY (patient_id) REFERENCES patients(id)
);

-- Indexes
CREATE INDEX idx_documents_encounter_id ON documents(encounter_id);
CREATE INDEX idx_documents_patient_id ON documents(patient_id);
CREATE INDEX idx_documents_file_type ON documents(file_type);
CREATE INDEX idx_documents_ocr_status ON documents(ocr_status);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at);

-- Full-text search index on OCR text
CREATE INDEX idx_documents_ocr_text ON documents USING GIN(to_tsvector('english', ocr_text));
```

---

### 7. extracted_entities

Stores structured data extracted from documents via OCR + NLP.

```sql
CREATE TABLE extracted_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,

    -- Entity Information
    entity_type VARCHAR(50) NOT NULL, -- medication, diagnosis, lab_test, observation, procedure, allergy
    entity_subtype VARCHAR(50), -- e.g., "antibiotic", "antihypertensive" for medications

    -- Entity Data (stored as JSONB for flexibility)
    entity_data JSONB NOT NULL,
    -- Example for medication:
    -- {
    --   "name": "Metformin",
    --   "strength": "500 mg",
    --   "dosage": "1 tablet",
    --   "frequency": "twice daily",
    --   "duration": "30 days",
    --   "prescriber": "Dr. Sharma",
    --   "date": "2026-08-15"
    -- }

    -- Extraction Metadata
    extraction_method VARCHAR(50), -- ocr_nlp, manual_entry, ai_suggested
    confidence_score DECIMAL(5,4),
    source_text_snippet TEXT, -- Original text from which entity was extracted

    -- Verification
    requires_verification BOOLEAN DEFAULT TRUE,
    verified_by_doctor BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(100),
    verified_at TIMESTAMP WITH TIME ZONE,
    doctor_comments TEXT,

    -- Timeline
    entity_date DATE, -- Date associated with the entity (e.g., test date, prescription date)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_entity_document FOREIGN KEY (document_id) REFERENCES documents(id),
    CONSTRAINT fk_entity_encounter FOREIGN KEY (encounter_id) REFERENCES encounters(id)
);

-- Indexes
CREATE INDEX idx_entities_document_id ON extracted_entities(document_id);
CREATE INDEX idx_entities_encounter_id ON extracted_entities(encounter_id);
CREATE INDEX idx_entities_type ON extracted_entities(entity_type);
CREATE INDEX idx_entities_requires_verification ON extracted_entities(requires_verification);
CREATE INDEX idx_entities_date ON extracted_entities(entity_date);

-- GIN index for JSONB queries
CREATE INDEX idx_entities_data ON extracted_entities USING GIN(entity_data);
```

---

### 8. clinical_summaries

Stores the AI-generated and doctor-verified clinical summaries.

```sql
CREATE TABLE clinical_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,

    -- Summary Versions
    version INTEGER DEFAULT 1, -- Version number (incremented on each edit)
    summary_type VARCHAR(30) DEFAULT 'ai_generated', -- ai_generated, doctor_edited, final

    -- Structured Summary (JSONB for flexibility)
    summary_json JSONB NOT NULL,
    -- Structure:
    -- {
    --   "chief_complaints": [...],
    --   "history_of_present_illness": "...",
    --   "past_medical_history": [...],
    --   "current_medications": [...],
    --   "allergies": [...],
    --   "family_history": "...",
    --   "personal_history": "...",
    --   "review_of_systems": {...},
    --   "ayurvedic_assessment": {...},
    --   "document_timeline": [...],
    --   "red_flags": [...],
    --   "missing_information": [...]
    -- }

    -- Plain Text Summary (for quick viewing)
    summary_text TEXT,

    -- Generation Metadata
    generated_by VARCHAR(50), -- ai_service, doctor
    generation_model VARCHAR(100), -- e.g., "llama-3-8b-medical-v1"
    generation_confidence DECIMAL(5,4),

    -- Verification
    is_final BOOLEAN DEFAULT FALSE,
    verified_by_doctor BOOLEAN DEFAULT FALSE,
    verified_by VARCHAR(100), -- Doctor name/ID
    verified_at TIMESTAMP WITH TIME ZONE,
    doctor_edits_made BOOLEAN DEFAULT FALSE,
    edit_history JSONB, -- Track changes made by doctor

    -- FHIR Export
    fhir_bundle_id VARCHAR(100), -- Reference to exported FHIR bundle
    fhir_exported_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_summary_encounter FOREIGN KEY (encounter_id) REFERENCES encounters(id),
    CONSTRAINT unique_encounter_version UNIQUE (encounter_id, version)
);

-- Indexes
CREATE INDEX idx_summaries_encounter_id ON clinical_summaries(encounter_id);
CREATE INDEX idx_summaries_is_final ON clinical_summaries(is_final);
CREATE INDEX idx_summaries_verified ON clinical_summaries(verified_by_doctor);
CREATE INDEX idx_summaries_created_at ON clinical_summaries(created_at);

-- GIN index for JSONB queries
CREATE INDEX idx_summaries_json ON clinical_summaries USING GIN(summary_json);
```

---

### 9. red_flag_alerts

Stores detected emergency/red-flag symptoms and alerts.

```sql
CREATE TABLE red_flag_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,

    -- Alert Information
    alert_type VARCHAR(50) NOT NULL, -- cardiac, neurological, respiratory, sepsis, trauma, other
    alert_severity VARCHAR(20) NOT NULL, -- low, medium, high, critical
    alert_status VARCHAR(30) DEFAULT 'active', -- active, acknowledged, resolved, false_positive

    -- Trigger Details
    triggered_symptoms TEXT[] NOT NULL, -- List of symptoms that triggered the alert
    trigger_rule_id VARCHAR(50), -- Reference to rule engine (e.g., "CARDIAC_001")
    trigger_confidence DECIMAL(5,4),

    -- Clinical Context
    clinical_context TEXT, -- Additional context from interview
    suggested_action TEXT, -- e.g., "Refer to emergency triage immediately"

    -- Resolution
    acknowledged_by VARCHAR(100), -- Staff/doctor who acknowledged
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    resolved_by VARCHAR(100),
    resolved_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_redflag_encounter FOREIGN KEY (encounter_id) REFERENCES encounters(id)
);

-- Indexes
CREATE INDEX idx_redflag_encounter_id ON red_flag_alerts(encounter_id);
CREATE INDEX idx_redflag_status ON red_flag_alerts(alert_status);
CREATE INDEX idx_redflag_severity ON red_flag_alerts(alert_severity);
CREATE INDEX idx_redflag_created_at ON red_flag_alerts(created_at);
```

---

### 10. consents

Stores patient consent records as per DPDP Act 2023 and ABDM guidelines.

```sql
CREATE TABLE consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,

    -- Consent Details
    consent_type VARCHAR(50) NOT NULL, -- data_collection, data_sharing, abdm_integration, research
    consent_version VARCHAR(20) NOT NULL, -- e.g., "v1.0", "v2.1"
    consent_text TEXT NOT NULL, -- Full consent text shown to patient
    consent_language VARCHAR(50), -- Language in which consent was presented

    -- Patient Response
    consent_status VARCHAR(20) NOT NULL, -- granted, denied, partially_granted, revoked
    consent_method VARCHAR(50), -- verbal_audio, touchscreen_checkbox, digital_signature
    consent_audio_path VARCHAR(500), -- Recording of verbal consent (if applicable)

    -- Granular Permissions (JSONB)
    permissions_granted JSONB,
    -- Example:
    -- {
    --   "collect_clinical_history": true,
    --   "store_documents": true,
    --   "share_with_doctor": true,
    --   "share_with_his": true,
    --   "share_via_abdm": false,
    --   "use_for_research": false
    -- }

    -- ABDM Consent Artefact (if applicable)
    abdm_consent_id VARCHAR(100),
    abdm_consent_artefact JSONB,

    -- Metadata
    presented_by VARCHAR(100), -- Staff member or "kiosk_self_service"
    ip_address VARCHAR(45),
    device_id VARCHAR(100), -- Kiosk identifier

    -- Validity
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE, -- NULL = indefinite
    revoked_at TIMESTAMP WITH TIME ZONE,
    revocation_reason TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_consent_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
    CONSTRAINT fk_consent_encounter FOREIGN KEY (encounter_id) REFERENCES encounters(id)
);

-- Indexes
CREATE INDEX idx_consents_patient_id ON consents(patient_id);
CREATE INDEX idx_consents_encounter_id ON consents(encounter_id);
CREATE INDEX idx_consents_status ON consents(consent_status);
CREATE INDEX idx_consents_type ON consents(consent_type);
CREATE INDEX idx_consents_created_at ON consents(created_at);
```

---

### 11. users

Stores system users (doctors, admins, staff).

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,

    -- Profile
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    designation VARCHAR(100), -- Doctor, Nurse, Admin, etc.
    department VARCHAR(100),
    employee_id VARCHAR(50) UNIQUE,
    phone VARCHAR(15),

    -- Role & Permissions
    role VARCHAR(30) NOT NULL, -- doctor, nurse, admin, super_admin
    permissions JSONB,

    -- ABDM Integration
    hpr_id VARCHAR(50), -- Healthcare Professional Registry ID
    facility_id VARCHAR(50), -- Healthcare Facility Registry ID

    -- Security
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Password Management
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    must_change_password BOOLEAN DEFAULT FALSE
);

-- Indexes
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
```

---

### 12. audit_logs

Stores audit trail for all data access and modifications (compliance requirement).

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Event Information
    event_type VARCHAR(50) NOT NULL, -- create, read, update, delete, login, logout, export
    event_category VARCHAR(50), -- patient_data, document, summary, consent, system

    -- Actor
    user_id UUID REFERENCES users(id), -- NULL for system actions
    user_role VARCHAR(30),
    user_ip_address VARCHAR(45),

    -- Target
    target_table VARCHAR(50), -- patients, encounters, documents, etc.
    target_id UUID, -- ID of the affected record
    target_description TEXT, -- Human-readable description

    -- Action Details
    action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    old_values JSONB, -- Previous state (for updates/deletes)
    new_values JSONB, -- New state (for creates/updates)
    changes_summary TEXT, -- Summary of what changed

    -- Context
    session_id VARCHAR(100),
    device_id VARCHAR(100), -- Kiosk or workstation ID
    additional_metadata JSONB,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_target_table ON audit_logs(target_table);
CREATE INDEX idx_audit_target_id ON audit_logs(target_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(action_timestamp);
CREATE INDEX idx_audit_category ON audit_logs(event_category);

-- Composite index for common queries
CREATE INDEX idx_audit_user_timestamp ON audit_logs(user_id, action_timestamp);
```

---

## Views for Common Queries

### 1. Patient Timeline View

```sql
CREATE VIEW patient_timeline AS
SELECT 
    p.id AS patient_id,
    p.first_name,
    p.last_name,
    e.encounter_number,
    e.encounter_date,
    e.department,
    cs.summary_text AS clinical_summary,
    ARRAY_AGG(DISTINCT d.file_name) AS documents,
    ARRAY_AGG(DISTINCT rfa.alert_type) AS red_flags
FROM patients p
LEFT JOIN encounters e ON p.id = e.patient_id
LEFT JOIN clinical_summaries cs ON e.id = cs.encounter_id AND cs.is_final = TRUE
LEFT JOIN documents d ON e.id = d.encounter_id
LEFT JOIN red_flag_alerts rfa ON e.id = rfa.encounter_id
GROUP BY p.id, p.first_name, p.last_name, e.encounter_number, e.encounter_date, e.department, cs.summary_text
ORDER BY e.encounter_date DESC;
```

---

## Database Extensions Required

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable full-text search enhancements
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable JSONB operations (usually enabled by default in PostgreSQL 9.4+)
```

---

## Migration Strategy

1. **Initial Setup:** Run all CREATE TABLE statements in order (respecting foreign key dependencies).
2. **Seed Data:** Insert initial admin user and default question bank categories.
3. **Indexing:** Create indexes after bulk data loads for better performance.
4. **Versioning:** Use a migration tool like Flyway or Liquibase for schema version control.

---

## Backup & Recovery

- **Daily automated backups** using `pg_dump` with point-in-time recovery (PITR) enabled.
- **WAL archiving** for continuous backup.
- **Test recovery procedures** monthly.
- **Encrypt backups** at rest.

---

## Performance Optimization

- Use **connection pooling** (PgBouncer) for high-concurrency scenarios.
- Implement **read replicas** for reporting and analytics queries.
- Use **partitioning** for `audit_logs` and `interview_responses` tables (by date).
- Regular **VACUUM ANALYZE** to maintain query performance.

---

## Security Considerations

- All tables containing PHI (Protected Health Information) must have **row-level security (RLS)** policies.
- **Encrypt sensitive columns** (phone, email, address) at rest using pgcrypto.
- **Audit logging** is mandatory for all access to patient data.
- Implement **data retention policies** with automatic archival/deletion.
