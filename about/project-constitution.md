# Project Constitution - SIH26047: Patient Case-Taking Software

## Project Overview

- **Project Name**: MediKiosk - AI Clinical Intake Platform
- **SIH Problem Statement ID**: SIH26047
- **Organization**: Ministry of Ayush, All India Institute of Ayurveda
- **Category**: Software
- **Theme**: Smart Automation
- **Deadline**: 20 September 2026

---

## Vision Statement

To build a patient-facing, AI-powered clinical history software that works as a kiosk or assisted terminal in OPD waiting areas, enabling complete medical history capture before consultation, digitizing fragmented paper records, and generating structured, physician-ready summaries integrated with India's digital health ecosystem (ABDM).

---

## Mission

1. **Reduce OPD bottleneck** by capturing complete clinical history before patient-doctor consultation.
2. **Digitize paper records** through OCR and NLP for prescriptions and lab reports.
3. **Enable inclusive access** for elderly, rural, low-literacy, and first-time patients via voice + touch kiosk.
4. **Preserve Ayurvedic personalization** through dedicated Dashavidha Pariksha assessment.
5. **Integrate with national digital health infrastructure** via ABDM and FHIR R4 standards.

---

## Core Objectives

### Primary Objectives
1. Build a walk-up kiosk system usable by patients with zero digital literacy.
2. Capture structured clinical history in Hindi, English, and regional languages.
3. Implement Ayurvedic history mode for Dashavidha Pariksha.
4. Digitize and structure paper prescriptions and lab reports.
5. Generate physician-ready summaries with red-flag alerts.
6. Export data as FHIR R4 resources with ABDM integration.

### Secondary Objectives
1. Support ABHA ID capture and consent management.
2. Create chronological medical timelines from fragmented documents.
3. Implement rule-based emergency detection for triage prioritization.
4. Provide audit trails and privacy-compliant data handling.
5. Enable horizontal scaling for high-volume government hospital OPDs.

---

## Target Users

### Primary Users
- **Patients**: Elderly, rural, low-literacy, first-time OPD visitors in government hospitals.
- **Doctors**: AYUSH and allopathic physicians in high-volume OPD settings (2–5 min/consultation).

### Secondary Users
- **Hospital Administrators**: OPD management, reporting, compliance.
- **IT Staff**: System maintenance, troubleshooting, updates.
- **Researchers**: Ayurvedic outcome tracking, clinical data analysis.

---

## Key Features

### Must-Have (MVP)
1. Patient kiosk with voice + touch interface (Hindi + English)
2. Adaptive clinical history interview (general + Ayurvedic)
3. Document upload and OCR for prescriptions
4. Structured clinical summary generation
5. Doctor dashboard for review and editing
6. Red-flag detection and alerts
7. FHIR R4 export
8. ABDM adapter (mock integration)

### Should-Have (Post-MVP)
1. Regional language support (Tamil, Telugu, Bengali, Marathi)
2. Advanced NLP for lab report extraction
3. Full ABDM HIE-CM integration
4. HIS/EMR integration APIs
5. Analytics dashboard for hospital administrators
6. Mobile app for patient record access

### Nice-to-Have (Future)
1. AI-powered differential diagnosis suggestions
2. Predictive analytics for disease progression
3. Integration with insurance claim systems
4. Telemedicine follow-up scheduling
5. Patient education content delivery

---

## Success Metrics

### Technical Metrics
- **Speech-to-text accuracy**: >85% for Hindi/English
- **OCR accuracy**: >90% for printed prescriptions
- **Entity extraction precision**: >85%
- **System response time**: <2 seconds per interaction
- **Uptime**: >99% during OPD hours

### User Metrics
- **Patient completion rate**: >80%
- **Average interview duration**: 5–8 minutes
- **Doctor satisfaction score**: >4/5
- **Reduction in consultation time**: 2–5 minutes per patient
- **OPD throughput increase**: 10–20%

### Business Metrics
- **Paper reduction**: 70–80% in Year 1
- **Patient wait time reduction**: 60%
- **Duplicate test reduction**: 30–40%
- **ABDM compliance**: 100%

---

## Constraints and Assumptions

### Constraints
1. Must work in low-bandwidth government hospital environments.
2. Must support offline-first operation with sync capability.
3. Must comply with DPDP Act 2023 and ABDM guidelines.
4. Must be deployable on minimal hardware (tablet/PC + microphone + scanner).
5. Must support patients with zero digital literacy.

### Assumptions
1. Hospitals have basic internet connectivity (2G/3G minimum).
2. Patients willing to spend 5–8 minutes on self-interview.
3. Doctors will review and verify AI-generated summaries.
4. ABDM sandbox available for testing integration.
5. Hospital staff available for patient assistance if needed.

---

## Governance Structure

### Decision-Making
- **Technical Architecture**: Lead Developer + AI/ML Engineer
- **Clinical Content**: Medical Advisor (AYUSH physician)
- **User Experience**: UX Designer + Patient Representative
- **Compliance**: Legal/Privacy Advisor
- **Final Approval**: Project Lead

### Meeting Cadence
- **Daily standup**: 15 minutes (progress, blockers, priorities)
- **Weekly review**: 1 hour (demo, feedback, planning)
- **Bi-weekly stakeholder update**: 30 minutes (progress report)

---

## Risk Management

### High-Priority Risks
1. **ASR accuracy for accented Indian speech** $\rightarrow$ *Mitigation*: Use diverse datasets, human fallback.
2. **OCR errors on handwritten prescriptions** $\rightarrow$ *Mitigation*: Hybrid OCR + doctor verification.
3. **User adoption barriers** $\rightarrow$ *Mitigation*: Simple UI, audio guidance, staff training.
4. **Integration complexity with legacy HIS** $\rightarrow$ *Mitigation*: Mock APIs, phased rollout.

### Medium-Priority Risks
1. **Cloud service costs at scale** $\rightarrow$ *Mitigation*: Open-source tools, government cloud credits.
2. **Hardware availability for multiple kiosks** $\rightarrow$ *Mitigation*: Minimal hardware design, pilot first.
3. **Workforce constraints for support** $\rightarrow$ *Mitigation*: Remote monitoring, self-healing systems.

---

## Ethical Considerations

1. **Patient Privacy**: Explicit consent for all data collection and sharing.
2. **Data Security**: Encryption at rest and in transit, role-based access.
3. **Algorithmic Fairness**: Diverse training data, bias testing across demographics.
4. **Human Oversight**: Doctor verification for all clinical content, no autonomous diagnosis.
5. **Transparency**: Clear explanation of AI role to patients and doctors.
6. **Accountability**: Audit logs for all access and modifications.

---

## Sustainability Plan

### Short-Term (0–6 months)
- Hackathon prototype with core features
- Pilot deployment in 1–2 OPD counters
- Iterative improvement based on feedback

### Medium-Term (6–18 months)
- Full feature set with regional languages
- Multi-hospital deployment (5–10 sites)
- ABDM certification and HIS integration

### Long-Term (18+ months)
- State-wide or national rollout
- Integration with insurance and research systems
- Continuous improvement via ML feedback loops

---

## Document Maintenance

- **Owner**: Project Lead
- **Review Frequency**: Monthly
- **Version Control**: Git repository with semantic versioning
- **Change Log**: Maintained in repository root
- **Last Updated**: September 2026
- **Version**: 1.0
