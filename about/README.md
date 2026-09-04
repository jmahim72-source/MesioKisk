# MediKiosk - Project Documentation (`about/`)

This directory contains the foundational specifications, system architecture, and API contracts for **MediKiosk - AI Clinical Intake Platform** (SIH Problem Statement ID: `SIH26047`).

---

## Documentation Index

1. **[Project Constitution](file:///c:/Users/mahim/OneDrive/Desktop/MesioKisk/about/project-constitution.md)**
   - Project overview, SIH statement details, vision & mission.
   - Core objectives (primary & secondary) and target personas (patients, doctors, admins).
   - MVP vs Post-MVP feature matrix, success metrics, constraints & assumptions.
   - Risk management, ethical considerations, and sustainability roadmap.

2. **[Architecture Document](file:///c:/Users/mahim/OneDrive/Desktop/MesioKisk/about/architecture.md)**
   - 6-layer modular architecture:
     - **Layer 1: User Interfaces**: Patient Kiosk PWA, Doctor Dashboard, Admin Console (React 18, Vite, Tailwind CSS).
     - **Layer 2: API Gateway**: FastAPI / Node.js with JWT auth and Redis rate limiting.
     - **Layer 3: Core Services**: Auth, Patient, Interview, Document, Summary.
     - **Layer 4: AI/ML Services**: ASR (Bhashini/Vakyansh/Whisper), Dialogue Engine (Ayurvedic Dashavidha Pariksha), OCR (PaddleOCR), NLP (spaCy/transformers), LLM Summary AI, Red-Flag Rule Engine.
     - **Layer 5: Data Layer**: PostgreSQL 15+, Redis 7, MinIO/S3, Elasticsearch/OpenSearch.
     - **Layer 6: Integration Layer**: FHIR R4 Bundle Export, ABDM Adapter v6.5.0, HIS/EMR connectors.
   - Complete Data Flow Diagrams and Security/Deployment Architecture.

3. **[API Contract](file:///c:/Users/mahim/OneDrive/Desktop/MesioKisk/about/api-contract.md)**
   - Base URL (`https://api.medikiosk.in/api/v1`), HTTP headers, standard response envelopes, and status codes.
   - Endpoints covering Auth, Patient Management, Consent Management, Encounter Management, Adaptive Interviews, Document Processing (OCR/NLP entity verification), Clinical Summaries, Red-Flag Alerts, and FHIR/ABDM Export.
   - Asynchronous webhook events, idempotency keys, and rate-limiting specifications.

4. **[Development Guide](file:///c:/Users/mahim/OneDrive/Desktop/MesioKisk/about/development.md)**
   - Repository monorepo structure (`apps/`, `services/`, `packages/`, `infrastructure/`).
   - Local setup with Docker Compose, environment configuration, and service ports.
   - Core patient intake and doctor review user flows.
   - Adaptive clinical interview design, Ayurvedic sections, and dialogue safety rules.
   - Document intelligence pipeline (OCR, entity extraction, doctor verification).
   - Structured JSON summary format, prompt safety guardrails, testing, and demo script.

5. **[Database Schema Documentation](file:///c:/Users/mahim/OneDrive/Desktop/MesioKisk/about/database_schema.md)**
   - Complete PostgreSQL schema definitions and DDL for all 12 core tables:
     - `patients`, `encounters`, `interview_sessions`, `interview_responses`, `ayurvedic_assessments` (Dashavidha Pariksha)
     - `documents`, `extracted_entities`, `clinical_summaries`, `red_flag_alerts`, `consents` (DPDP Act 2023 & ABDM), `users`, `audit_logs`
   - Conceptual ERD, performance indexes, GIN full-text search indexes, views (`patient_timeline`), and security/backup strategies.

6. **[Full Implementation Plan](file:///c:/Users/mahim/OneDrive/Desktop/MesioKisk/about/implementation-plan.md)**
   - MVP scope (must-have demo-critical vs should-have), team role allocation, and work breakdown structure (Product, Backend, AI/ML, QA).
   - 14-day phased roadmap and 36-hour hackathon sprint plan.
   - P0/P1/P2 priority backlog, red-flag emergency detection rule set, success metrics, risk register, and scripted demo persona (Meena Devi).

7. **[Testing & Demo Dataset](file:///c:/Users/mahim/OneDrive/Desktop/MesioKisk/about/test-data.md)**
   - System login credentials for doctor and admin roles.
   - 4 pre-configured patient personas (Meena Devi, Rajesh Sharma, Gurpreet Singh, Savita Patel).
   - Red-flag voice/text test prompts, sample prescription text, lab report data, and sample cURL requests.
