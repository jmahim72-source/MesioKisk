from sqlalchemy.orm import Session
from datetime import datetime, timezone
from services.api.app.core.database import Base, engine, SessionLocal
from services.api.app.core.security import get_password_hash
from services.api.app.models.models import (
    User, Patient, Consent, Encounter, InterviewSession, InterviewResponse,
    AyurvedicAssessment, Document, ExtractedEntity, ClinicalSummary, RedFlagAlert, AuditLog
)

def init_db(db: Session = None):
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    close_session = False
    if db is None:
        db = SessionLocal()
        close_session = True

    try:
        # Seed Doctor user if not exists
        doctor = db.query(User).filter(User.username == "doctor@hospital.gov.in").first()
        if not doctor:
            doctor = User(
                id="usr_doctor_01",
                username="doctor@hospital.gov.in",
                email="doctor@hospital.gov.in",
                password_hash=get_password_hash("secure-password"),
                first_name="Dr. Ananya",
                last_name="Sharma",
                designation="Senior Consultant Physician",
                department="Ayurveda & General Medicine",
                employee_id="DOC-2026-089",
                role="DOCTOR",
                hpr_id="HPR-91-8877-6655",
                facility_id="fac_aiia_delhi"
            )
            db.add(doctor)

        # Seed Admin user if not exists
        admin = db.query(User).filter(User.username == "admin@hospital.gov.in").first()
        if not admin:
            admin = User(
                id="usr_admin_01",
                username="admin@hospital.gov.in",
                email="admin@hospital.gov.in",
                password_hash=get_password_hash("admin-password"),
                first_name="Hospital",
                last_name="Administrator",
                designation="IT Systems Director",
                department="Hospital Operations",
                role="ADMIN"
            )
            db.add(admin)

        # Seed Demo Patient (Meena Devi from Demo Script)
        patient = db.query(Patient).filter(Patient.hospital_patient_id == "HOSP-2026-001245").first()
        if not patient:
            patient = Patient(
                id="pat_meena_01",
                abha_number="91-2345-6789-0123",
                abha_number_masked="91-2345-XXXX-0123",
                abha_health_id="meenadevi@abdm",
                hospital_patient_id="HOSP-2026-001245",
                first_name="Meena",
                last_name="Devi",
                date_of_birth="1968-04-15",
                gender="FEMALE",
                phone="+919876543210",
                preferred_language="hi",
                is_low_literacy=True,
                address={"line1": "Village Rampur", "district": "Meerut", "state": "Uttar Pradesh", "pincode": "250001"},
                emergency_contact={"name": "Suresh Kumar", "relationship": "SON", "phone": "+919876543211"}
            )
            db.add(patient)
            db.flush()

            # Seed Consent
            consent = Consent(
                id="con_meena_01",
                patient_id=patient.id,
                purpose="CLINICAL_INTAKE",
                data_categories=["DEMOGRAPHICS", "CLINICAL_HISTORY", "DOCUMENTS"],
                language="hi",
                method="KIOSK_AUDIO_ACKNOWLEDGMENT",
                status="GRANTED"
            )
            db.add(consent)

            # Seed Encounter
            encounter = Encounter(
                id="enc_meena_01",
                patient_id=patient.id,
                encounter_number="OPD-2026-001245",
                encounter_date=datetime.now().strftime("%Y-%m-%d"),
                encounter_type="OUTPATIENT",
                department="Ayurveda OPD",
                practitioner_id="usr_doctor_01",
                queue_token="A-042",
                status="READY_FOR_REVIEW",
                priority="EMERGENCY",
                chief_complaint_hint="Chest pain and breathlessness since morning"
            )
            db.add(encounter)
            db.flush()

            # Seed Ayurvedic Assessment
            ayur = AyurvedicAssessment(
                id="ayur_meena_01",
                encounter_id=encounter.id,
                prakriti_dominant_dosha="VATA_PITTA",
                prakriti_vata_score=8,
                prakriti_pitta_score=6,
                prakriti_kapha_score=3,
                agni_type="VISHAMAGNI",
                koshtha_type="KRURA",
                ahara_vihara_notes="Irregular eating times, dry foods, disturbed sleep."
            )
            db.add(ayur)

            # Seed Red Flag Alert
            red_flag = RedFlagAlert(
                id="alert_meena_01",
                encounter_id=encounter.id,
                rule_id="CARDIAC_001",
                alert_type="Possible Acute Coronary Syndrome",
                severity="CRITICAL",
                status="ACTIVE",
                triggered_symptoms=["Chest pain", "Breathlessness", "Cold sweating"],
                suggested_action="Immediate triage assessment recommended. Perform stat ECG and inform attending physician."
            )
            db.add(red_flag)

            # Seed Document & Extracted Entities
            doc = Document(
                id="doc_meena_rx_01",
                encounter_id=encounter.id,
                patient_id=patient.id,
                file_name="prescription_jan_2026.jpg",
                file_type="PRESCRIPTION",
                storage_path="/documents/prescription_jan_2026.jpg",
                ocr_status="COMPLETED",
                ocr_text="Rx: Tab Metformin 500mg PO BD x 1 month (After meals)\nTab Telmisartan 40mg PO OD\nDiagnosis: Type 2 Diabetes Mellitus, Essential Hypertension",
                ocr_confidence=0.94
            )
            db.add(doc)
            db.flush()

            entity1 = ExtractedEntity(
                id="ent_01",
                document_id=doc.id,
                encounter_id=encounter.id,
                entity_type="MEDICATION",
                raw_text="Metformin 500 mg BD",
                normalized={"name": "Metformin", "strength": "500 mg", "frequency": "TWICE_DAILY"},
                confidence=0.95,
                verification_status="PENDING",
                source_snippet="Tab Metformin 500mg PO BD"
            )
            entity2 = ExtractedEntity(
                id="ent_02",
                document_id=doc.id,
                encounter_id=encounter.id,
                entity_type="MEDICATION",
                raw_text="Telmisartan 40 mg OD",
                normalized={"name": "Telmisartan", "strength": "40 mg", "frequency": "ONCE_DAILY"},
                confidence=0.92,
                verification_status="PENDING",
                source_snippet="Tab Telmisartan 40mg PO OD"
            )
            db.add(entity1)
            db.add(entity2)

            # Seed Clinical Summary Draft
            summary = ClinicalSummary(
                id="sum_meena_01",
                encounter_id=encounter.id,
                version=1,
                status="DRAFT",
                summary_json={
                    "chief_complaint": "Chest pain and breathlessness since morning (4 hours)",
                    "history_present_illness": "58-year-old female presented with retrosternal chest heaviness radiating to left shoulder associated with cold sweating and shortness of breath.",
                    "past_medical_history": ["Type 2 Diabetes Mellitus", "Essential Hypertension"],
                    "medications": [
                        {"name": "Metformin", "dose": "500 mg", "frequency": "TWICE_DAILY"},
                        {"name": "Telmisartan", "dose": "40 mg", "frequency": "ONCE_DAILY"}
                    ],
                    "allergies": ["No known drug allergies"],
                    "ayurvedic_assessment": {
                        "prakriti": "VATA_PITTA",
                        "agni": "VISHAMAGNI",
                        "koshtha": "KRURA"
                    },
                    "red_flags": ["Possible Acute Coronary Syndrome (CARDIAC_001)"]
                },
                summary_text="Patient Meena Devi (58 F) presented with acute chest discomfort and shortness of breath. History of Type 2 Diabetes and Hypertension.",
                generated_by="AI_SERVICE",
                generation_confidence=0.93
            )
            db.add(summary)

        db.commit()
    finally:
        if close_session:
            db.close()

if __name__ == "__main__":
    init_db()
    print("Database seeded successfully.")
