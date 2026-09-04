# SIH26047 - Full Implementation Plan

**Project**: MediKiosk - AI-Powered Patient Case-Taking Software

---

## Objective

Build a patient-facing, multilingual clinical intake platform for AYUSH and government hospital OPDs. The system captures structured history through voice/touch interaction, digitizes medical records, identifies urgent red flags, generates a clinician-verifiable summary, and exports ABDM-ready FHIR R4 data.

---

## 1. MVP Scope

### Must Have (Demo-Critical)

| Module | MVP Deliverable | Success Condition |
|---|---|---|
| **Patient kiosk** | Hindi + English voice/touch intake | Patient completes an interview without developer intervention |
| **Consent** | Audio/text consent with acceptance recording | No interview starts without consent |
| **Registration** | Demo patient / hospital ID / mock ABHA lookup | Encounter is created and linked to patient |
| **Adaptive interview** | Chief complaint + HPI + history + medicine/allergy questions | Questions branch based on patient answer |
| **Ayurvedic intake** | Prakriti, Agni, Koshtha, Ahara-Vihara sample module | Ayurvedic summary appears in doctor view |
| **Document upload** | Upload prescription and lab report | Original files are safely stored |
| **OCR + extraction** | Medicine, dose, lab test, value and date extraction | Extracted fields show confidence and source text |
| **Red flags** | Rule-based critical symptom detection | Alert is visible instantly to doctor/triage view |
| **Doctor dashboard** | Review, edit, verify and finalize summary | Doctor finalizes one complete encounter |
| **Interoperability** | FHIR R4 JSON bundle and mock HIS export | Download/view a valid FHIR bundle |

### Should Have (If Time Permits)
- Third regional language.
- Audio playback of every prompt.
- Timeline visualization for prior records.
- QR code for token and kiosk session recovery.
- Simple patient feedback rating.
- PDF export of finalized doctor note.
- Admin analytics dashboard.

### Out of Scope for Hackathon
- Autonomous diagnosis or treatment recommendation.
- Live production ABDM credentials/integration.
- Training medical AI models from scratch.
- Handling all handwriting styles and every Indian language.
- Direct e-prescribing or payment workflows.
- Full multi-hospital deployment and production scalability.

---

## 2. Team Roles

| Role | Primary Ownership | Key Deliverables |
|---|---|---|
| **Product / Team Lead** | Scope, UX, pitch, integration decisions | User stories, PPT, demo narrative, backlog |
| **Frontend Developer** | Kiosk and doctor dashboard | Responsive PWA, multilingual UI, review screens |
| **Backend Developer** | APIs, database, auth, workflow | FastAPI services, schema, REST API, RBAC |
| **AI/ML Developer** | ASR, OCR, NLP, summaries, red flags | Processing pipelines, extraction, prompt/schema validation |
| **UI/UX Developer** | Accessibility and visual design | Kiosk flows, audio prompts, visual system, PPT assets |
| **Domain / QA Lead** | Clinical safety, testing, FHIR mapping | Question validation, test scenarios, doctor feedback, FHIR output |

> For a 6-member SIH team, one person may own Product + UI/UX and another may own Domain + QA.

---

## 3. Work Breakdown Structure

### Workstream A: Product and UX
1. Define patient personas: elderly, rural/low-literacy, chronic patient, emergency patient, first-time visitor.
2. Map end-to-end patient, staff, and doctor journeys.
3. Define the exact MVP interview questions and response types.
4. Build kiosk screens with large buttons, high contrast, simple vocabulary, and visible progress.
5. Prepare a doctor dashboard focused on summary review, not complicated analytics.

### Workstream B: Backend and Data
1. Set up PostgreSQL, Redis, and object storage.
2. Implement patient, encounter, consent, interview, document, and summary APIs.
3. Add RBAC for doctor, triage staff, admin, and kiosk sessions.
4. Implement audit logging for data reads, edits, and exports.
5. Write FHIR export mappings and mock HIS endpoint.

### Workstream C: AI and Automation
1. Integrate speech-to-text with a fallback text-input route.
2. Build deterministic adaptive-question logic from the question bank.
3. Integrate OCR for images/PDFs and add document quality checks.
4. Extract medications, doses, lab values, dates, and diagnosis terms using rules + NLP.
5. Generate a constrained summary using validated JSON output.
6. Build rule-based red-flag detection with transparent triggers.

### Workstream D: Quality, Security and Demo
1. Create synthetic test patients and non-sensitive sample documents.
2. Test consent refusal, session expiry, unauthorized access, and document upload limits.
3. Validate all demo flows on the actual hardware/network to be used at the event.
4. Build a 3-minute and 5-minute demo script.
5. Record a fallback demo video in case live dependencies fail.

---

## 4. Suggested 14-Day Build Plan

### Days 1–2: Foundation
- **Backend**:
  - Initialize repository, Docker Compose, and environment configuration.
  - Create PostgreSQL schema and migrations for `users`, `patients`, `encounters`, `consents`, `interview_sessions`, and `interview_responses`.
  - Build API health check, authentication, and seed demo users.
- **Frontend**:
  - Create Next.js applications for kiosk and dashboard.
  - Implement design system: large font, high contrast, language selector, progress indicator.
- **Product / Domain**:
  - Finalize 25–40 questions for the MVP and 8–12 Ayurvedic questions.
  - Finalize red-flag rules and obtain informal doctor validation if possible.
- **Deliverable**: Running login, database, patient registration, and basic kiosk navigation.

### Days 3–4: Patient Intake
- **Frontend**:
  - Build consent, language selection, patient identification, and chief-complaint screens.
  - Add touch-based answer components: yes/no, choices, severity slider, date, and free text.
- **Backend**:
  - Build APIs to create patient, encounter, consent, and interview session.
  - Implement question-bank and next-question endpoints.
- **AI/ML**:
  - Integrate ASR proof of concept for Hindi/English.
  - Add text fallback and transcript confirmation screen.
- **Deliverable**: A patient completes a non-AI guided interview and records are stored.

### Days 5–6: Adaptive Questions and Ayurvedic Mode
- **AI/ML / Backend**:
  - Implement rules for chief complaints such as chest pain, fever, cough, abdominal pain, and back pain.
  - Implement medicine/allergy and past-history sections.
  - Add Ayurvedic question path: Prakriti, Agni, Koshtha, Ahara-Vihara.
- **Frontend**:
  - Display adaptive questions, progress, and review answers before submission.
  - Add audio prompt playback and simple "repeat question" control.
- **Deliverable**: Interview adapts visibly to patient answers and produces structured JSON.

### Days 7–8: Document Intelligence
- **Backend**:
  - Implement secure upload, MIME/type validation, file-size limits, and object-storage integration.
  - Add asynchronous job flow for OCR processing.
- **AI/ML**:
  - Integrate PaddleOCR/Tesseract and test against prepared documents.
  - Implement medication, test value, date, and diagnosis extraction.
  - Return confidence scores and source snippets.
- **Frontend**:
  - Build upload/scan screen and extracted-data review component.
- **Deliverable**: Prescription and lab report are uploaded, OCR processed, and key fields extracted.

### Days 9–10: Summary, Red Flags and Doctor Dashboard
- **AI/ML**:
  - Implement transparent red-flag rules: cardiac, stroke, respiratory distress, sepsis indicators.
  - Implement structured summary generator with JSON validation.
- **Frontend**:
  - Build doctor queue, red-alert banner, summary view, timeline, and field-level edit/approve/reject controls.
- **Backend**:
  - Build summary versioning, alert acknowledgement, and finalization APIs.
- **Deliverable**: Doctor receives a structured AI draft, sees alerts, and finalizes an encounter.

### Days 11–12: FHIR Export and Security
- **Backend**:
  - Map internal data to FHIR R4 resources: `Patient`, `Encounter`, `Condition`, `Observation`, `MedicationRequest`, `AllergyIntolerance`, and `DiagnosticReport`.
  - Build FHIR Bundle preview/download endpoint and mock HIS receiver.
  - Add audit logs for access, update, finalization, and export.
- **Security / QA**:
  - Enforce RBAC, signed document URLs, basic input validation, and session expiry.
  - Test doctor vs kiosk permissions.
- **Deliverable**: Finalized encounter exports as a readable FHIR R4 JSON bundle.

### Days 13–14: Polish, Testing and Presentation
- Fix critical bugs and remove unstable features.
- Add seeded demo data and demo reset capability.
- Test the exact happy path on laptop/tablet, microphone, and local network.
- Prepare screenshots, architecture, workflow, and impact slides.
- Rehearse the demo; record a fallback video.
- **Deliverable**: Stable end-to-end demonstration and SIH-ready PPT.

---

## 5. Hackathon 36-Hour Sprint Plan

If the build window is only 36 hours, use this reduced plan:

| Time Block | Priority | Output |
|---|---|---|
| **Hour 0–3** | Repo, Docker, wireframes, question bank | Running skeleton and task ownership |
| **Hour 3–8** | Patient registration, consent, basic kiosk flow | Patient + encounter created |
| **Hour 8–14** | Adaptive questionnaire, touch input, text/voice fallback | Structured interview JSON |
| **Hour 14–20** | OCR integration with fixed demo documents | Extracted medicine/lab data |
| **Hour 20–26** | Summary generation, red-flag rules, doctor dashboard | Doctor review workflow |
| **Hour 26–30** | FHIR JSON export, mock HIS, audit log | Interoperability proof |
| **Hour 30–34** | UI polish, bug fixing, seeded demo scenarios | Stable product |
| **Hour 34–36** | PPT, demo rehearsal, fallback recording | Submission-ready demo |

### Rule for the Team
Finish the happy path before adding features. Do not add a new model, language, dashboard, or integration until this works:
$$\text{Consent} \rightarrow \text{Patient registration} \rightarrow \text{Interview} \rightarrow \text{Document upload} \rightarrow \text{Summary} \rightarrow \text{Doctor verification} \rightarrow \text{FHIR export}$$

---

## 6. Priority Backlog

### P0: Must Complete
- Consent screen and language selection.
- Patient registration and encounter creation.
- Text-based adaptive interview with optional voice input.
- At least three chief complaint branches.
- One Ayurvedic history section.
- Document upload and OCR for prepared samples.
- Medication/lab-value extraction.
- Rule-based red-flag alert.
- Doctor review/edit/finalize flow.
- FHIR JSON export.

### P1: Complete if Stable
- Hindi speech-to-text.
- Timeline visualization.
- ABHA mock verification.
- PDF summary export.
- Additional regional language.
- Admin/audit dashboard.

### P2: Future Scope
- Production ABDM sandbox certification.
- More languages and offline ASR.
- Integration with live HIS/EMR.
- Advanced handwritten-prescription recognition.
- Longitudinal analytics and disease trend charts.
- Smart queue optimization.

---

## 7. Red-Flag Rule Set for MVP

| Rule ID | Trigger Pattern | Alert Level | System Action |
|---|---|---|---|
| **CARDIAC_001** | Chest pain + breathlessness + sweating/nausea | Critical | Notify triage and mark priority |
| **STROKE_001** | Sudden weakness on one side + speech difficulty/facial droop | Critical | Notify triage and mark priority |
| **RESP_001** | Severe breathlessness + cyanosis/unable to speak full sentence | Critical | Notify triage and mark priority |
| **SEPSIS_001** | Fever + confusion + very low/high temperature history | High | Prompt urgent clinical assessment |
| **BLEED_001** | Vomiting blood / black stools / uncontrolled bleeding | Critical | Notify triage and mark priority |

- **Safety wording**: *"Possible emergency indicators detected. Immediate triage assessment recommended."*
- **Constraint**: *Never display a confirmed diagnosis from the alert engine.*

---

## 8. Success Metrics

### Demo Metrics

| Metric | MVP Target |
|---|---|
| Patient intake completion time | Under 7 minutes for scripted case |
| Supported languages | Hindi + English |
| Clinical sections captured | At least 6 general + 1 Ayurvedic module |
| Documents processed | Prescription + lab report |
| Entity types extracted | Medication, dose, lab value, date, diagnosis |
| Red-flag detection | At least 2 scripted scenarios |
| Doctor review | Edit, approve and finalize summary |
| Interoperability | Valid FHIR R4 JSON bundle export |

### Pilot Metrics

| Metric | Target after Pilot |
|---|---|
| Pre-consultation history completion | 70%+ of kiosk users |
| Doctor acceptance of AI draft | 80%+ fields accepted or lightly edited |
| OCR extraction accuracy on supported formats | 85%+ after human verification |
| Time saved per consultation | Measured against hospital baseline |
| Red-flag acknowledgement time | Under 5 minutes during staffed OPD hours |
| Patient usability rating | 4/5 or higher from assisted test users |

---

## 9. Risk Register

| Risk | Impact | Mitigation |
|---|---|---|
| **Speech recognition fails in noisy OPD** | Patient cannot continue by voice | Always offer touch/text fallback; use push-to-talk and transcript review |
| **OCR fails on handwriting** | Incorrect extraction | Support printed documents first; show original document; require doctor verification |
| **LLM invents medical facts** | Clinical safety risk | Strict JSON schema, grounded inputs, validation, doctor approval, no diagnosis generation |
| **Scope becomes too large** | Incomplete demo | Follow P0/P1/P2 backlog and freeze scope early |
| **Internet unavailable** | Cloud API failure | Cache demo data; keep text flow and preprocessed OCR results; prepare offline fallback |
| **ABDM API unavailable** | Integration demo fails | Use mock ABDM/HIS adapter and show valid FHIR output |
| **Patient privacy breach** | High compliance risk | Consent, RBAC, encryption, short sessions, audit logs, synthetic demo data |
| **Hardware/microphone issue** | Demo failure | Test hardware early; keep keyboard/text input and recorded demo backup |

---

## 10. Final Demo Scenario

### Persona
**Meena Devi**, 58 years old, Hindi-speaking, first-time patient, has diabetes and brings an old prescription plus a lab report.

### Script
1. Meena selects Hindi and listens to the consent prompt.
2. She accepts consent and enters a hospital ID / uses mock ABHA lookup.
3. She says: *“Since morning, I have chest pain and breathlessness.”*
4. The system asks targeted follow-ups about location, onset, sweating, nausea, and prior history.
5. The red-flag engine detects the pattern and displays a **“Critical: Triage Assessment Required”** alert.
6. She uploads a prior prescription and a blood-sugar report.
7. OCR extracts *“Metformin 500 mg twice daily”* and a lab reading.
8. The system creates a structured clinical summary and a basic Ayurvedic profile.
9. The doctor opens the dashboard, views the alert and source-linked extraction, corrects one item, and finalizes the note.
10. The team opens/downloads the FHIR R4 bundle and shows the mock HIS acknowledgement.

### Judge Takeaway
> *"The solution captures structured patient history before consultation, includes vulnerable patients who cannot use typical apps, digitizes fragmented records, alerts staff to possible emergencies, preserves doctor control, and produces interoperable ABDM-ready health data."*

---

## 11. Definition of Done

The MVP is complete only when a demonstrator can perform the full patient-to-doctor path without editing the database, code, or API responses manually:

$$\text{Patient consent} \rightarrow \text{Registration} \rightarrow \text{Adaptive history intake} \rightarrow \text{Document scan/upload} \rightarrow \text{OCR + extraction} \rightarrow \text{Red-flag check} \rightarrow \text{AI draft summary} \rightarrow \text{Doctor verification} \rightarrow \text{FHIR R4 export}$$

> **Mandatory Clinical Guardrail**: All clinical outputs must visibly state: **“AI-generated draft; clinician verification required.”**
