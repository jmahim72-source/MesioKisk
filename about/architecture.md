# Architecture Document - SIH26047: MediKiosk

## System Overview

**MediKiosk** is a modular, AI-assisted clinical intake platform with three primary interfaces: **patient kiosk**, **doctor dashboard**, and **admin console**. The system follows a modular monolith architecture for hackathon feasibility, with clear service boundaries for future microservices migration.

---

## Architecture Principles

1. **Modularity**: Clear separation of concerns across 6 logical layers.
2. **Consent-by-Design**: Every data access requires explicit patient consent.
3. **Human-in-the-Loop**: AI generates drafts; doctors verify and finalize.
4. **Privacy-First**: Encryption, RBAC, audit logging, data minimization.
5. **Scalability**: Containerized deployment with horizontal scaling capability.
6. **Offline-First**: Core functionality works without continuous connectivity.

---

## System Architecture Layers

### Layer 1: User Interfaces (Frontend)

#### Patient Kiosk (Web PWA)
- **Technology**: React 18 + TypeScript + Vite
- **Features**:
  - Voice input via Web Speech API or microphone
  - Touch-optimized UI for tablets
  - Multi-language support (Hindi, English, regional)
  - Audio guidance for low-literacy users
  - Offline-capable with service workers
  - ABHA capture via QR scanner or manual entry

#### Doctor Dashboard (Web Application)
- **Technology**: React 18 + TypeScript + Vite
- **Features**:
  - Patient queue management
  - AI-generated summary review
  - Field-level edit/accept/reject
  - Red-flag alert notifications
  - FHIR/ABDM export triggers
  - Historical timeline visualization

#### Admin Console (Web Application)
- **Technology**: React 18 + TypeScript + Vite
- **Features**:
  - User management (doctors, staff, admins)
  - Role-based access control configuration
  - System audit log viewer
  - Kiosk health monitoring
  - Report generation and analytics

---

### Layer 2: API Gateway

- **Technology Stack**:
  - FastAPI (Python 3.11+) or Node.js (Express/NestJS)
  - JWT-based authentication
  - Rate limiting (Redis-backed)
  - Request validation and sanitization
  - Session management
  - API versioning (`v1`, `v2`, ...)

- **Key Endpoints**:
  - `/api/v1/auth/*` - Authentication and authorization
  - `/api/v1/patients/*` - Patient registration and profiles
  - `/api/v1/encounters/*` - Clinical encounter management
  - `/api/v1/interviews/*` - Interview session handling
  - `/api/v1/documents/*` - Document upload and retrieval
  - `/api/v1/summaries/*` - Clinical summary generation
  - `/api/v1/export/*` - FHIR/ABDM export

---

### Layer 3: Core Services

#### Auth Service
- JWT token generation and validation
- Role-based access control (RBAC)
- ABHA authentication integration
- Consent artefact management
- Session lifecycle management

#### Patient Service
- Patient registration (ABHA or hospital ID)
- Profile management (demographics, contact, emergency contacts)
- Encounter creation and tracking
- Patient search and retrieval

#### Interview Service
- Question bank management (general + Ayurvedic)
- Adaptive question flow logic
- Session state management
- Response capture and validation
- Multi-language question rendering

#### Document Service
- File upload handling (prescriptions, lab reports, discharge summaries)
- Storage abstraction (local, MinIO, S3)
- Document metadata management
- Access control and audit logging
- Document retrieval and streaming

#### Summary Service
- Interview data compilation
- Document extraction integration
- Clinical summary formatting
- Doctor view preparation
- Version tracking (draft $\rightarrow$ verified)

---

### Layer 4: AI/ML Services

#### ASR Service (Speech-to-Text)
- **Technology**: Bhashini API / AI4Bharat Vakyansh / Whisper
- **Features**:
  - Hindi and English speech recognition
  - Speaker diarization (optional)
  - Confidence scoring
  - Fallback to text input

#### Dialogue Engine
- **Technology**: Rule-based + LLM (constrained)
- **Features**:
  - Clinical ontology (SNOMED CT, ICD-10, Ayush terms)
  - Adaptive question branching
  - Context tracking across sessions
  - Ayurvedic mode (Dashavidha Pariksha)
  - Confidence thresholds and human fallback

#### OCR Service
- **Technology**: PaddleOCR / Tesseract + OpenCV
- **Features**:
  - Document preprocessing (deskew, denoise, binarization)
  - Multi-language text extraction
  - Handwritten text support (limited)
  - Confidence scoring per region

#### NLP Service
- **Technology**: spaCy + custom medical NER + transformers
- **Features**:
  - Medical entity extraction (drugs, doses, diagnoses)
  - Temporal expression parsing
  - Lab value extraction with units
  - Negation detection
  - Entity linking to standard terminologies

#### Summary AI
- **Technology**: LLM (Llama 3 / Mistral / GPT-4 via API)
- **Features**:
  - Template-constrained summarization
  - Structured output (JSON)
  - Source attribution for each claim
  - Confidence indicators
  - No autonomous diagnosis

#### Red-Flag Engine
- **Technology**: Rule-based expert system
- **Features**:
  - Emergency pattern detection (chest pain + breathlessness, stroke signs, sepsis indicators)
  - Triage priority assignment
  - Alert generation with explanation
  - Escalation workflow

---

### Layer 5: Data Layer

#### PostgreSQL (Primary Database)
- **Version**: 15+
- **Schema**: Normalized (3NF) with JSONB for flexible fields
- **Key Tables**:
  - `patients`: Patient demographics and ABHA
  - `encounters`: Clinical visits
  - `interviews`: Interview sessions and responses
  - `interview_responses`: Individual Q&A pairs
  - `ayurvedic_assessments`: Dashavidha Pariksha data
  - `documents`: Uploaded file metadata
  - `extracted_entities`: OCR/NLP results
  - `clinical_summaries`: AI-generated summaries
  - `red_flag_alerts`: Emergency detections
  - `audit_logs`: Access and modification events
  - `users`: System users (doctors, staff, admins)
  - `roles`: RBAC roles and permissions

#### Redis (Cache & Session Store)
- **Use Cases**:
  - JWT token blacklist
  - Session data
  - Rate limiting counters
  - Temporary interview state
  - Real-time alert pub/sub

#### Object Storage (MinIO / AWS S3)
- **Stored Objects**:
  - Scanned prescriptions and reports
  - Audio recordings (optional)
  - Processed document images
  - Exported FHIR bundles
- **Access Control**: Pre-signed URLs with expiry

#### Search Index (Elasticsearch / OpenSearch)
- **Use Cases**:
  - Full-text search across documents
  - Patient search with fuzzy matching
  - Audit log analytics
  - Real-time suggestions

---

### Layer 6: Integration Layer

#### FHIR R4 Export
- **Resources**:
  - `Patient`
  - `Encounter`
  - `Condition`
  - `MedicationRequest`
  - `Observation`
  - `DiagnosticReport`
  - `AllergyIntolerance`
  - `Composition` (clinical summary)
- **Format**: JSON bundles
- **Validation**: HAPI FHIR validator

#### ABDM Adapter
- **Components**:
  - ABHA capture and verification
  - Consent artefact creation (via HIE-CM)
  - Health Information Provider (HIP) integration
  - Health Information User (HIU) integration
  - PHR app linkage
- **Standards**: ABDM FHIR Implementation Guide v6.5.0

#### HIS/EMR Integration
- **Protocols**: REST APIs, HL7 v2, FHIR
- **Use Cases**:
  - Push clinical summaries to hospital EMR
  - Pull patient history from existing systems
  - Sync medication lists
  - Update appointment schedules

#### External ASR APIs
- **Providers**:
  - Bhashini (Government of India)
  - AI4Bharat Vakyansh (open-source)
  - Google Cloud Speech-to-Text (fallback)
- **Failover Strategy**: Primary $\rightarrow$ Secondary $\rightarrow$ Text input

---

## Data Flow Diagrams

### Patient Interview Flow
```
Patient Kiosk
  ↓ (voice/text input)
API Gateway
  ↓
Interview Service
  ↓ (audio stream)
ASR Service → Transcript
  ↓
Dialogue Engine → Next Question
  ↓
Interview Responses (JSON)
  ↓
PostgreSQL
```

### Document Processing Flow
```
Patient Kiosk (upload)
  ↓
Document Service
  ↓ (image)
Object Storage
  ↓
OCR Service → Extracted Text
  ↓
NLP Service → Structured Entities
  ↓
PostgreSQL (extracted_entities table)
```

### Clinical Summary Flow
```
Interview Responses + Extracted Entities
  ↓
Summary Service
  ↓ (structured data)
Summary AI → Draft Summary (JSON)
  ↓
Red-Flag Engine → Alerts
  ↓
PostgreSQL (clinical_summaries table)
  ↓
Doctor Dashboard (review + edit)
  ↓
Verified Summary
  ↓
FHIR Export + ABDM Integration
```

---

## Security Architecture

### Authentication
- JWT tokens with 15-minute expiry
- Refresh tokens with 7-day expiry
- ABHA OTP authentication (optional)
- Role-based access control (RBAC)

### Authorization
- Fine-grained permissions per resource
- Patient data access requires explicit consent
- Audit logging for all access events

### Data Protection
- **Encryption at rest**: AES-256 (database, object storage)
- **Encryption in transit**: TLS 1.3 (all HTTPS endpoints)
- **Field-level encryption** for sensitive data (ABHA, contact info)

### Compliance
- **DPDP Act 2023**: Consent management, data minimization, right to deletion
- **ABDM Guidelines**: HIE-CM integration, FHIR R4 compliance
- **NABH Standards**: Patient privacy, record retention

---

## Deployment Architecture

### Development Environment
- Docker Compose for local development
- PostgreSQL, Redis, MinIO containers
- Mock AI services for offline testing

### Production Environment
- Kubernetes cluster (3+ nodes)
- Horizontal pod autoscaling
- Load balancer (NGINX Ingress)
- Persistent volumes for database and storage
- Monitoring: Prometheus + Grafana
- Logging: ELK stack (Elasticsearch, Logstash, Kibana)

### Disaster Recovery
- Daily database backups (retention: 30 days)
- Cross-region replication for object storage
- **RTO**: 4 hours, **RPO**: 1 hour

---

## Technology Stack Summary

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend API** | FastAPI (Python 3.11) or Node.js (NestJS) |
| **Database** | PostgreSQL 15, Redis 7 |
| **Object Storage** | MinIO (self-hosted) or AWS S3 |
| **Search** | Elasticsearch 8 or OpenSearch |
| **ASR** | Bhashini / AI4Bharat Vakyansh / Whisper |
| **OCR** | PaddleOCR + OpenCV |
| **NLP** | spaCy + transformers (Hugging Face) |
| **LLM** | Llama 3 / Mistral (self-hosted) or GPT-4 API |
| **Containerization** | Docker, Kubernetes |
| **CI/CD** | GitHub Actions, ArgoCD |
| **Monitoring** | Prometheus, Grafana, ELK |

---

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers (scale via replicas)
- Database read replicas for high query load
- Redis cluster for distributed caching
- Object storage lifecycle policies

### Performance Optimization
- Database indexing on frequently queried fields
- CDN for static assets (frontend bundles)
- Response caching for non-personalized endpoints
- Lazy loading for document images

### Cost Optimization
- Open-source AI models where possible
- Spot instances for non-critical workloads
- Auto-scaling based on OPD peak hours
- Data archival policies for old records

---

- **Last Updated**: September 2026
- **Version**: 1.0
