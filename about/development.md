# SIH26047 - Development Guide

## Project: MediKiosk - AI-Powered Patient Case-Taking Software

## 1. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Patient Kiosk | Next.js / React PWA | Voice and touch interface for patients |
| Doctor Dashboard | Next.js / React | Summary review, editing, alerts and records |
| Backend API | FastAPI (Python) | REST APIs, orchestration and business logic |
| Database | PostgreSQL | Structured patient and encounter data |
| Cache / Queue | Redis | Sessions, rate limiting and background jobs |
| Object Storage | MinIO / AWS S3 | Medical documents and audio files |
| OCR | PaddleOCR | Printed and scanned document text extraction |
| Speech-to-Text | Bhashini / Whisper | Indian-language voice input |
| NLP / Extraction | spaCy + rules + LLM | Medication, diagnosis, lab value and date extraction |
| Summarization | LLM with JSON schema | Structured clinical-summary generation |
| Interoperability | FHIR R4 JSON | HIS/EMR and ABDM-ready export |
| Deployment | Docker Compose | Local demo and hackathon deployment |

---

## 2. Repository Structure

```text
medikiosk/
├── apps/
│   ├── patient-kiosk/              # Next.js PWA
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── public/
│   ├── doctor-dashboard/           # Next.js doctor portal
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── admin-console/              # Optional admin portal
├── services/
│   ├── api/                        # FastAPI backend
│   │   ├── app/
│   │   │   ├── api/
│   │   │   ├── core/
│   │   │   ├── models/
│   │   │   ├── schemas/
│   │   │   ├── services/
│   │   │   ├── workers/
│   │   │   └── main.py
│   │   ├── alembic/
│   │   └── requirements.txt
│   ├── ocr-worker/                 # OCR/document extraction worker
│   ├── ai-worker/                  # Summarization and NLP worker
│   └── fhir-adapter/               # FHIR R4 bundle generator
├── packages/
│   ├── shared-types/               # Shared TypeScript models
│   ├── question-bank/              # Clinical and Ayurvedic question sets
│   └── fhir-templates/             # FHIR mapping templates
├── infrastructure/
│   ├── docker-compose.yml
│   ├── nginx/
│   └── postgres/
├── docs/
│   ├── database_schema.md
│   ├── api_spec.md
│   ├── development.md
│   └── demo_script.md
└── README.md
```

---

## 3. Local Development Setup

### Prerequisites

- Node.js 20+
- Python 3.11+
- Docker Desktop
- Docker Compose
- PostgreSQL 16+ (or Docker container)
- Git

### Environment Variables

Create `.env` files from `.env.example`. Never commit real secrets.

```env
# Database
DATABASE_URL=postgresql+psycopg://medikiosk:password@postgres:5432/medikiosk
REDIS_URL=redis://redis:6379/0

# Storage
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=medikiosk-documents

# Auth
JWT_SECRET=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI services
WHISPER_MODEL=small
BHASHINI_API_KEY=replace-me
LLM_API_KEY=replace-me
LLM_MODEL=your-approved-model

# Integration
ABDM_MODE=mock
FHIR_BASE_URL=http://fhir-adapter:8001
```

### Start the Stack

```bash
cd infrastructure
docker compose up --build
```

Expected local services:

| Service | Local URL |
|---|---|
| Patient kiosk | http://localhost:3000 |
| Doctor dashboard | http://localhost:3001 |
| Backend API docs | http://localhost:8000/docs |
| MinIO console | http://localhost:9001 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## 4. Core User Flows

### 4.1 Patient Intake Flow

```text
Patient arrives
  → selects language
  → reads/hears consent and accepts
  → ABHA / hospital ID / new registration
  → states chief complaint through voice or touch
  → answers adaptive questions
  → completes Ayurvedic module (if selected)
  → scans/upload documents
  → reviews answers and submits
  → receives token / queue status
```

### 4.2 Doctor Review Flow

```text
Doctor logs in
  → sees queue and red-flag alerts
  → opens patient encounter
  → reviews interview summary and document timeline
  → edits / accepts / rejects AI-extracted fields
  → adds diagnosis and treatment advice
  → finalizes clinical note
  → exports FHIR bundle to mock HIS/ABDM adapter
```

---

## 5. API Design

### Authentication and Users

```http
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Patients and Encounters

```http
POST /api/v1/patients
GET  /api/v1/patients/{patient_id}
GET  /api/v1/patients/{patient_id}/timeline
POST /api/v1/encounters
GET  /api/v1/encounters/{encounter_id}
PATCH /api/v1/encounters/{encounter_id}
GET  /api/v1/encounters?status=registered
```

### Consent and Interview

```http
POST /api/v1/consents
GET  /api/v1/question-bank/{language}/{section}
POST /api/v1/interview-sessions
POST /api/v1/interview-sessions/{session_id}/responses
POST /api/v1/interview-sessions/{session_id}/next-question
POST /api/v1/interview-sessions/{session_id}/complete
```

### Documents and OCR

```http
POST /api/v1/documents/upload
GET  /api/v1/documents/{document_id}
GET  /api/v1/documents/{document_id}/entities
POST /api/v1/documents/{document_id}/verify
```

### Summaries and Alerts

```http
POST /api/v1/encounters/{encounter_id}/generate-summary
GET  /api/v1/encounters/{encounter_id}/summary
PATCH /api/v1/summaries/{summary_id}
POST /api/v1/summaries/{summary_id}/finalize
GET  /api/v1/red-flags?status=active
POST /api/v1/red-flags/{alert_id}/acknowledge
```

### FHIR / ABDM Export

```http
GET  /api/v1/encounters/{encounter_id}/fhir-bundle
POST /api/v1/encounters/{encounter_id}/export-to-his
POST /api/v1/abdm/abha/verify
POST /api/v1/abdm/consent/create
```

---

## 6. Adaptive Interview Design

### General Clinical Sections

1. Chief complaint
2. History of present illness (HPI)
3. Past medical history
4. Past surgical history
5. Medication history
6. Allergies and adverse reactions
7. Family history
8. Personal and social history
9. Review of systems
10. Vitals and basic measurements

### Ayurvedic Sections

1. Prakriti (constitution)
2. Vikriti (current imbalance)
3. Agni (digestive capacity)
4. Koshtha (bowel habit)
5. Ahara and Vihara (diet and lifestyle)
6. Nidana (possible causes)
7. Dashavidha Pariksha profile

### Dialogue Rule Example

```python
if chief_complaint == "chest pain":
    ask(["onset", "location", "character", "severity", "radiation", "duration"])
    ask(["breathlessness", "sweating", "nausea", "fainting"])
    if breathlessness and sweating:
        trigger_red_flag("CARDIAC_001")
```

**Safety rule:** The system collects and structures information; it does not make a diagnosis or prescribe treatment.

---

## 7. Document Intelligence Pipeline

```text
Upload image/PDF
  → validate type and size
  → virus scan
  → image quality check
  → image preprocessing (crop, rotate, denoise)
  → OCR extraction
  → document classification
  → entity extraction
  → confidence scoring
  → doctor verification queue
  → timeline generation
```

### Supported Entities

- Medication: name, dose, frequency, route, duration
- Diagnosis / condition
- Lab test: test name, value, unit, reference range, abnormal flag
- Procedure / surgery
- Allergy
- Date, clinician, facility

### Verification Rules

- OCR confidence < 0.80: mark as “Needs Review”.
- Medicine, diagnosis and red-flag-related extraction: always require doctor verification.
- Preserve original document and source-text snippet for every extracted entity.

---

## 8. Clinical Summary Format

The summary generator must produce validated JSON before rendering it to the doctor dashboard.

```json
{
  "chief_complaints": [{"symptom": "back pain", "duration": "3 weeks"}],
  "history_of_present_illness": "Lower-back pain for three weeks...",
  "past_medical_history": ["Type 2 diabetes"],
  "current_medications": [{"name": "Metformin", "dose": "500 mg", "frequency": "BD"}],
  "allergies": [],
  "family_history": [],
  "review_of_systems": {},
  "ayurvedic_assessment": {},
  "document_timeline": [],
  "red_flags": [],
  "missing_information": [],
  "disclaimer": "AI-generated draft. Requires clinician verification."
}
```

### Prompt Safety Guardrails

- Use an explicit JSON schema and validate every response.
- Provide only encounter-specific, de-identified input to external models where possible.
- Do not ask the model to diagnose, prescribe, assign a disease probability, or decide triage alone.
- Red flags must be detected by transparent rules, with AI used only for supporting extraction.
- Show source links and confidence values in the doctor dashboard.

---

## 9. Security and Privacy Baseline

- Use HTTPS in all environments beyond local development.
- Store passwords only using Argon2 or bcrypt hashes.
- Use role-based access control: `admin`, `doctor`, `nurse`, `triage_staff`, `kiosk_session`.
- Apply short-lived JWT access tokens and refresh tokens where needed.
- Encrypt documents and backups at rest; encrypt all traffic in transit.
- Restrict document access using signed URLs with a short expiry.
- Log all patient-data reads, edits, exports and consent changes.
- Display consent in the patient's selected language; allow refusal and revocation.
- Auto-delete unfinished kiosk sessions and temporary audio after the defined retention period.

---

## 10. Testing Strategy

| Test Type | Scope | Tooling |
|---|---|---|
| Unit tests | Rules, validation, FHIR mapping | Pytest, Vitest |
| API tests | Auth, CRUD, workflows | Pytest + HTTPX |
| UI tests | Kiosk and dashboard flows | Playwright |
| OCR tests | Sample prescription/report set | Golden test fixtures |
| Security tests | RBAC, IDOR, input validation | OWASP ZAP, manual tests |
| Accessibility | Keyboard, contrast, audio prompts | Lighthouse, manual testing |
| Demo tests | Full patient-to-doctor flow | Scripted scenario |

### Minimum Acceptance Criteria

- Patient can complete intake in Hindi and English.
- At least one red-flag scenario creates an alert visible to triage/doctor users.
- At least two sample documents can be uploaded and processed.
- Doctor can verify extracted medication/test data and finalize a summary.
- Final record exports as valid FHIR R4 JSON.
- Unauthorized users cannot access another patient’s records.

---

## 11. Deployment Plan

### Hackathon Deployment

```text
Laptop / local server
  ├── Docker Compose
  ├── Patient kiosk browser (tablet/laptop)
  ├── Doctor dashboard browser
  ├── Local PostgreSQL + Redis + MinIO
  └── Mock HIS / ABDM endpoint
```

### Production Pilot Deployment

```text
Hospital network / cloud VPC
  ├── Load balancer + HTTPS
  ├── Container platform (Kubernetes or managed containers)
  ├── Managed PostgreSQL with encrypted backup
  ├── Redis cluster
  ├── Encrypted object storage
  ├── Centralized monitoring and audit logs
  └── ABDM-approved integration environment
```

---

## 12. Demo Script

1. Select Hindi on the patient kiosk.
2. Accept audio-guided consent.
3. Create a demo patient or use mock ABHA verification.
4. State: “I have chest pain and breathlessness since morning.”
5. Answer follow-up questions; trigger a visible red-flag alert.
6. Upload a sample prescription and lab report.
7. Show OCR extraction of medicine and lab values.
8. Open doctor dashboard and display the generated structured summary.
9. Doctor edits one extracted field, acknowledges alert and finalizes the note.
10. Export/download the FHIR R4 bundle to demonstrate ABDM/HIS readiness.
