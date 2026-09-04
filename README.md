# MediKiosk (SIH26047) - AI-Powered Patient Case-Taking Platform

**Smart India Hackathon 2026** | **Problem Statement**: `SIH26047`  
**Organization**: Ministry of Ayush & All India Institute of Ayurveda (AIIA)

MediKiosk is an AI-assisted, multilingual clinical intake and triage platform designed for hospital OPD waiting areas. It captures structured medical history through voice and touch interactions, digitizes paper prescriptions with OCR/NLP, flags life-threatening red flags, and produces clinician-verified summaries exported in HL7 FHIR R4 format.

---

## Repository Architecture

```
MesioKisk/
├── apps/
│   ├── patient-kiosk/              # React 18 + Vite Accessible Touch/Voice Kiosk PWA (Hindi/English)
│   └── doctor-dashboard/           # React 18 + Vite Physician Review & Verification Portal
├── services/
│   └── api/                        # FastAPI Backend (REST API, FSM Engine, Red Flags, OCR/NLP, FHIR R4)
├── packages/
│   ├── shared-types/               # TypeScript domain interfaces & DTOs
│   ├── question-bank/              # Localized clinical & Ayurvedic question sets (Hindi/English)
│   └── fhir-templates/             # HL7 FHIR R4 Bundle serializers
├── about/                          # Official Specifications
│   ├── project-constitution.md     # Vision, objectives, MVP scope, risk register
│   ├── architecture.md             # 6-layer modular architecture & data flows
│   ├── api-contract.md             # Full REST API Contract v1
│   ├── database_schema.md          # PostgreSQL 15+ 12-table DDL schema
│   ├── development.md              # Setup guide, safety rules & demo script
│   └── implementation-plan.md      # Workstreams, 14-day roadmap & sprint plan
└── infrastructure/
    └── docker-compose.yml          # Container configuration
```

---

## Quick Start Guide

### 1. Start the FastAPI Backend
```bash
# From workspace root
cd services/api
.venv\Scripts\activate
uvicorn services.api.app.main:app --reload --port 8000
```
- **API Swagger Docs**: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
- **Pre-seeded Demo Doctor**: `doctor@hospital.gov.in` / `secure-password`

### 2. Start the Patient Kiosk (Port 3000)
```bash
cd apps/patient-kiosk
npm run dev
```
- **Kiosk Terminal**: [http://localhost:3000](http://localhost:3000)

### 3. Start the Doctor Dashboard (Port 3001)
```bash
cd apps/doctor-dashboard
npm run dev
```
- **Doctor Portal**: [http://localhost:3001](http://localhost:3001)

---

## End-to-End Demo Script (Meena Devi Scenario)

1. **Patient Kiosk**:
   - Select **हिंदी** (Hindi) $\rightarrow$ Listen to audio consent $\rightarrow$ Tap **मैं सहमत हूँ (I Agree)**.
   - Tap **✨ ऑटो-फिल (Meena Devi, 58 F)** $\rightarrow$ Tap **आगे बढ़ें**.
   - Speak or select chief complaint: *"सुबह से सीने में तेज दर्द और सांस फूल रही है"* (Chest pain & breathlessness).
   - Complete follow-ups $\rightarrow$ **Critical Red Flag (CARDIAC_001)** alert triggers automatically.
   - Complete Ayurvedic *Dashavidha Pariksha* (Vata-Pitta, Vishamagni) $\rightarrow$ Upload sample prescription $\rightarrow$ Generate Token **A-042**.
2. **Doctor Dashboard**:
   - View live OPD queue $\rightarrow$ See prominent red emergency alert for token **A-042**.
   - Click **Review Encounter** $\rightarrow$ Inspect AI structured draft summary & extracted OCR medications (`Metformin 500mg`, `Telmisartan 40mg`).
   - Accept/Verify extracted fields $\rightarrow$ Click **Sign-Off & Clinically Verify**.
   - Click **View FHIR R4** $\rightarrow$ Inspect or download validated HL7 FHIR R4 JSON document bundle.
   - Click **Push to ABDM** $\rightarrow$ Send to ABDM HIE-CM gateway.
