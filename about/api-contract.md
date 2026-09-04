# API Contract - SIH26047: MediKiosk

## API Overview

- **Base URL**: `https://api.medikiosk.in/api/v1`
- **Protocol**: HTTPS only
- **Format**: JSON
- **Authentication**: JWT Bearer Token
- **Versioning**: URL-based (`/api/v1/`)

---

## Common Conventions

### Headers

```http
Content-Type: application/json
Authorization: Bearer <access_token>
X-Request-ID: <uuid>
X-Client-Version: 1.0.0
```

### Standard Response Envelope

#### Success Response:
```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-09-04T10:00:00Z"
  }
}
```

#### Error Response:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "phone",
        "message": "Invalid Indian mobile number"
      }
    ]
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "2026-09-04T10:00:00Z"
  }
}
```

### HTTP Status Codes

| Status | Meaning |
|---|---|
| **200** | Success |
| **201** | Resource created |
| **202** | Accepted for asynchronous processing |
| **204** | No content |
| **400** | Validation error / bad request |
| **401** | Missing or invalid authentication |
| **403** | Insufficient permissions / consent missing |
| **404** | Resource not found |
| **409** | Conflict (duplicate ABHA, active session) |
| **422** | Semantic validation error |
| **429** | Rate limit exceeded |
| **500** | Internal server error |
| **503** | Service unavailable |

---

## 1. Authentication & Authorization

### `POST /auth/login`
Authenticates doctor, staff, or administrator.

**Request:**
```json
{
  "username": "doctor@hospital.gov.in",
  "password": "secure-password",
  "role": "DOCTOR"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 900,
    "user": {
      "id": "usr_01J...",
      "name": "Dr. Ananya Sharma",
      "role": "DOCTOR",
      "hospital_id": "hosp_01J..."
    }
  }
}
```

### `POST /auth/refresh`
Refreshes an expired access token.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### `POST /auth/logout`
Invalidates the current session. Requires authentication.

### `GET /auth/me`
Returns the authenticated user profile and permissions.

---

## 2. Patient Management

### `POST /patients`
Registers a new patient using ABHA or hospital ID.

**Request:**
```json
{
  "identifier_type": "HOSPITAL_ID",
  "abha_number": "91-2345-6789-0123",
  "hospital_patient_id": "HOSP-2026-001245",
  "first_name": "Ramesh",
  "last_name": "Kumar",
  "date_of_birth": "1962-03-12",
  "gender": "MALE",
  "phone": "+919876543210",
  "preferred_language": "hi",
  "address": {
    "line1": "Village Rampur",
    "district": "Meerut",
    "state": "Uttar Pradesh",
    "pincode": "250001"
  },
  "emergency_contact": {
    "name": "Suresh Kumar",
    "relationship": "SON",
    "phone": "+919876543211"
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "pat_01J...",
    "hospital_patient_id": "HOSP-2026-001245",
    "abha_number_masked": "91-2345-XXXX-0123",
    "full_name": "Ramesh Kumar",
    "preferred_language": "hi",
    "created_at": "2026-09-04T10:00:00Z"
  }
}
```

### `GET /patients/{patient_id}`
Retrieves patient profile. Requires `PATIENT_READ` permission and active consent where applicable.

### `PATCH /patients/{patient_id}`
Updates permitted demographic fields.

### `GET /patients/search?q={query}`
Searches patients by hospital ID, ABHA (masked/authorized), name, or phone.

**Query Parameters:**
- `q` (required): Search term, minimum 3 characters
- `limit` (optional): Default 20, maximum 100
- `cursor` (optional): Pagination cursor

---

## 3. Consent Management

### `POST /patients/{patient_id}/consents`
Records patient consent before interview, document processing, or data export.

**Request:**
```json
{
  "purpose": "CLINICAL_INTAKE",
  "data_categories": ["DEMOGRAPHICS", "CLINICAL_HISTORY", "DOCUMENTS"],
  "language": "hi",
  "method": "KIOSK_AUDIO_ACKNOWLEDGMENT",
  "valid_until": "2027-09-04T00:00:00Z",
  "witness_user_id": "usr_01J..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "consent_id": "con_01J...",
    "status": "GRANTED",
    "purpose": "CLINICAL_INTAKE",
    "granted_at": "2026-09-04T10:05:00Z",
    "valid_until": "2027-09-04T00:00:00Z"
  }
}
```

### `GET /patients/{patient_id}/consents`
Returns consent history.

### `POST /patients/{patient_id}/consents/{consent_id}/revoke`
Revokes a consent artefact prospectively.

---

## 4. Encounter Management

### `POST /patients/{patient_id}/encounters`
Creates an OPD encounter and optionally issues a queue token.

**Request:**
```json
{
  "facility_id": "fac_01J...",
  "department": "AYURVEDA_OPD",
  "practitioner_id": "usr_01J...",
  "encounter_type": "OUTPATIENT",
  "chief_complaint_hint": "Back pain",
  "priority": "ROUTINE"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "encounter_id": "enc_01J...",
    "status": "ARRIVED",
    "queue_token": "A-042",
    "created_at": "2026-09-04T10:10:00Z"
  }
}
```

### `GET /encounters/{encounter_id}`
Returns encounter details, status, linked interview, documents, summary, and red flags.

### `PATCH /encounters/{encounter_id}`
Updates status: `ARRIVED`, `INTAKE_IN_PROGRESS`, `READY_FOR_REVIEW`, `IN_CONSULTATION`, `COMPLETED`, `CANCELLED`.

### `GET /encounters/queue?facility_id={id}&department={dept}`
Returns doctor/department queue ordered by priority and arrival time.

---

## 5. Interview & Clinical History

### `POST /encounters/{encounter_id}/interviews`
Starts an interview session.

**Request:**
```json
{
  "mode": "COMBINED",
  "language": "hi",
  "input_preference": "VOICE",
  "modules": ["GENERAL_CLINICAL", "AYURVEDIC"]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "interview_id": "int_01J...",
    "status": "IN_PROGRESS",
    "current_question": {
      "id": "q_chief_complaint_001",
      "text": "What problem brings you to the hospital today?",
      "localized_text": "आज आपको अस्पताल किस समस्या के लिए आना पड़ा है?",
      "input_type": "VOICE_OR_TEXT",
      "required": true
    }
  }
}
```

### `POST /interviews/{interview_id}/responses`
Submits a patient answer; returns the next adaptive question.

**Request:**
```json
{
  "question_id": "q_chief_complaint_001",
  "input_type": "VOICE",
  "audio_document_id": "doc_01J...",
  "raw_text": "मेरी कमर में तीन हफ्तों से दर्द है",
  "normalized_answer": {
    "symptom": "LOWER_BACK_PAIN",
    "duration": { "value": 3, "unit": "WEEK" }
  },
  "confidence": 0.91
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "response_id": "resp_01J...",
    "interview_progress": 18,
    "next_question": {
      "id": "q_backpain_severity_001",
      "text": "On a scale of 0 to 10, how severe is your pain?",
      "input_type": "SCALE",
      "options": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    },
    "red_flag_check": {
      "status": "NO_ALERT"
    }
  }
}
```

### `POST /interviews/{interview_id}/complete`
Completes the interview and queues summary generation.

**Response (202):**
```json
{
  "success": true,
  "data": {
    "interview_id": "int_01J...",
    "status": "COMPLETED",
    "summary_generation_job_id": "job_01J..."
  }
}
```

### `GET /interviews/{interview_id}`
Returns interview metadata, answers, progress, and completion status.

---

## 6. Document Processing

### `POST /encounters/{encounter_id}/documents`
Uploads a prescription, lab report, discharge summary, or other clinical document.

**Request:** `multipart/form-data`

| Field | Type | Required | Notes |
|---|---|---|---|
| `file` | File | Yes | PDF/JPG/PNG, max 15 MB |
| `document_type` | String | Yes | `PRESCRIPTION`, `LAB_REPORT`, `DISCHARGE_SUMMARY`, `IMAGING`, `OTHER` |
| `document_date` | Date | No | YYYY-MM-DD; inferred if absent |
| `language` | String | No | ISO 639-1 code |

**Response (202):**
```json
{
  "success": true,
  "data": {
    "document_id": "doc_01J...",
    "processing_status": "QUEUED",
    "job_id": "job_01J...",
    "original_filename": "prescription_jan_2026.jpg"
  }
}
```

### `GET /documents/{document_id}`
Returns document metadata, secure preview URL, OCR status, and extracted entities.

### `GET /documents/{document_id}/entities`
Returns extracted entities requiring doctor verification.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "document_id": "doc_01J...",
    "entities": [
      {
        "id": "ent_01J...",
        "type": "MEDICATION",
        "raw_text": "Metformin 500 mg BD",
        "normalized": {
          "name": "Metformin",
          "strength": "500 mg",
          "frequency": "TWICE_DAILY"
        },
        "confidence": 0.87,
        "verification_status": "PENDING"
      }
    ]
  }
}
```

### `PATCH /documents/{document_id}/entities/{entity_id}`
Doctor accepts, edits, or rejects an extracted entity.

**Request:**
```json
{
  "verification_status": "VERIFIED",
  "normalized": {
    "name": "Metformin",
    "strength": "500 mg",
    "frequency": "TWICE_DAILY"
  }
}
```

---

## 7. Clinical Summary & Triage

### `POST /encounters/{encounter_id}/summaries/generate`
Generates a draft clinical summary from interview and document data.

**Response (202):**
```json
{
  "success": true,
  "data": {
    "job_id": "job_01J...",
    "status": "QUEUED"
  }
}
```

### `GET /encounters/{encounter_id}/summary`
Returns latest draft or verified clinical summary.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary_id": "sum_01J...",
    "status": "DRAFT",
    "sections": {
      "chief_complaint": "Lower back pain for 3 weeks",
      "history_present_illness": "...",
      "past_medical_history": [
        "Type 2 diabetes mellitus"
      ],
      "medications": [
        "Metformin 500 mg twice daily"
      ],
      "allergies": [],
      "ayurvedic_assessment": {
        "prakriti": "VATA_PITTA",
        "agni": "VISHAMAGNI"
      },
      "red_flags": []
    },
    "source_references": [
      {
        "section": "medications",
        "source_type": "DOCUMENT",
        "source_id": "doc_01J..."
      }
    ],
    "generated_at": "2026-09-04T10:30:00Z"
  }
}
```

### `PATCH /summaries/{summary_id}`
Doctor edits individual sections or fields.

### `POST /summaries/{summary_id}/verify`
Doctor marks summary as clinically verified.

**Request:**
```json
{
  "verification_note": "Medication list confirmed with patient.",
  "doctor_id": "usr_01J..."
}
```

### `GET /encounters/{encounter_id}/red-flags`
Returns detected triage alerts.

### `POST /red-flags/{alert_id}/acknowledge`
Triage staff acknowledges an alert.

**Request:**
```json
{
  "action": "TRIAGE_REFERRED",
  "note": "Patient referred to emergency triage desk."
}
```

---

## 8. FHIR & ABDM Integration

### `POST /encounters/{encounter_id}/export/fhir`
Creates a FHIR R4 bundle from a verified encounter.

**Request:**
```json
{
  "bundle_type": "DOCUMENT",
  "include_documents": true,
  "include_ayurvedic_assessment": true
}
```

**Response (202):**
```json
{
  "success": true,
  "data": {
    "export_id": "exp_01J...",
    "status": "QUEUED",
    "format": "FHIR_R4_JSON"
  }
}
```

### `GET /exports/{export_id}`
Returns export status and downloadable FHIR bundle once complete.

### `POST /encounters/{encounter_id}/export/abdm`
Initiates consent-based ABDM/HIS export. Available only after doctor verification.

**Request:**
```json
{
  "consent_id": "con_01J...",
  "target": "MOCK_HIS",
  "resource_types": [
    "PATIENT",
    "ENCOUNTER",
    "COMPOSITION",
    "DIAGNOSTIC_REPORT"
  ]
}
```

---

## 9. Admin & Audit

### `GET /admin/audit-logs`
Returns paginated audit events. Requires `AUDIT_READ` permission.

### `GET /admin/metrics/overview`
Returns non-identifying aggregate metrics: patients served, interviews completed, OCR success rate, red flags raised, average completion time.

### `POST /admin/question-bank`
Creates or updates a clinical interview question. Requires `QUESTION_BANK_WRITE` permission and clinical review workflow.

---

## Webhooks (Optional)

### `document.processing.completed`
```json
{
  "event": "document.processing.completed",
  "document_id": "doc_01J...",
  "encounter_id": "enc_01J...",
  "processing_status": "COMPLETED",
  "entity_count": 12,
  "timestamp": "2026-09-04T10:25:00Z"
}
```

### `red_flag.detected`
```json
{
  "event": "red_flag.detected",
  "alert_id": "alert_01J...",
  "encounter_id": "enc_01J...",
  "severity": "HIGH",
  "triggered_rules": [
    "CHEST_PAIN_BREATHLESSNESS_SWEATING"
  ],
  "timestamp": "2026-09-04T10:20:00Z"
}
```

### `summary.verified`
```json
{
  "event": "summary.verified",
  "summary_id": "sum_01J...",
  "encounter_id": "enc_01J...",
  "verified_by": "usr_01J...",
  "timestamp": "2026-09-04T10:40:00Z"
}
```

---

## Idempotency

All write endpoints support an optional `Idempotency-Key` header. Reusing the same key with the same endpoint and request body returns the original response, preventing duplicate registrations, encounters, or uploads.

---

## Rate Limits

| Client Type | Limit |
|---|---|
| **Patient Kiosk** | 60 requests/minute per kiosk |
| **Doctor Dashboard** | 120 requests/minute per user |
| **Admin Console** | 60 requests/minute per user |
| **Document Upload** | 10 uploads/minute per encounter |
| **Public Auth Endpoints** | 10 requests/minute per IP |

---

- **Last Updated**: September 2026
- **API Version**: `v1`
