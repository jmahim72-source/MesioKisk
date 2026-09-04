import pytest
from fastapi.testclient import TestClient
from services.api.app.main import app
from services.api.app.seed.seed_data import init_db
from services.api.app.services.dialogue_engine import DialogueEngine

@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    init_db()

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_auth_login_success():
    response = client.post("/api/v1/auth/login", json={
        "username": "doctor@hospital.gov.in",
        "password": "secure-password",
        "role": "DOCTOR"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert data["data"]["user"]["role"] == "DOCTOR"

def test_patient_search_and_get():
    response = client.get("/api/v1/patients/search?q=Meena")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) > 0
    patient_id = data["data"][0]["id"]

    get_resp = client.get(f"/api/v1/patients/{patient_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["first_name"] == "Meena"

def test_encounter_queue():
    response = client.get("/api/v1/encounters/queue")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["data"]) > 0
    tokens = [e["queue_token"] for e in data["data"]]
    assert any("A-" in t for t in tokens)

def test_clinical_summary_and_verification():
    # Get Meena encounter
    queue_resp = client.get("/api/v1/encounters/queue")
    enc_id = queue_resp.json()["data"][0]["encounter_id"]

    # Get Summary
    sum_resp = client.get(f"/api/v1/encounters/{enc_id}/summary")
    assert sum_resp.status_code == 200
    sum_data = sum_resp.json()["data"]
    assert "chief_complaint" in sum_data["sections"]

    # Verify Summary
    sum_id = sum_data["summary_id"]
    verify_resp = client.post(f"/api/v1/summaries/{sum_id}/verify", json={
        "verification_note": "Reviewed with patient and approved.",
        "doctor_id": "Dr. Ananya Sharma"
    })
    assert verify_resp.status_code == 200
    assert verify_resp.json()["data"]["status"] == "FINAL"

def test_fhir_export():
    queue_resp = client.get("/api/v1/encounters/queue")
    enc_id = queue_resp.json()["data"][0]["encounter_id"]

    export_resp = client.post(f"/api/v1/encounters/{enc_id}/export/fhir", json={
        "bundle_type": "DOCUMENT"
    })
    assert export_resp.status_code == 202
    data = export_resp.json()
    assert data["success"] is True
    bundle = data["data"]["bundle"]
    assert bundle["resourceType"] == "Bundle"
    assert len(bundle["entry"]) > 0

def test_red_flag_acknowledgment():
    queue_resp = client.get("/api/v1/encounters/queue")
    enc_id = queue_resp.json()["data"][0]["encounter_id"]

    rf_resp = client.get(f"/api/v1/encounters/{enc_id}/red-flags")
    assert rf_resp.status_code == 200
    alerts = rf_resp.json()["data"]
    if alerts:
        alert_id = alerts[0]["alert_id"]
        ack_resp = client.post(f"/api/v1/red-flags/{alert_id}/acknowledge", json={
            "action": "TRIAGE_REFERRED",
            "note": "ECG completed and sent to cardiology."
        })
        assert ack_resp.status_code == 200
        assert ack_resp.json()["data"]["status"] == "ACKNOWLEDGED"

def test_dialogue_engine_domain_branching():
    engine = DialogueEngine()

    # Cardiac domain check
    cardio_plan = engine.get_interview_plan("Severe chest pain radiating to left arm and sweating")
    assert "q_chestpain_location_001" in cardio_plan
    assert "q_associated_symptoms_cardiac_001" in cardio_plan
    assert "q_fever_characteristics_001" not in cardio_plan

    # Fever domain check
    fever_plan = engine.get_interview_plan("३ दिन से तेज बुखार और खांसी है")
    assert "q_fever_characteristics_001" in fever_plan
    assert "q_respiratory_symptoms_001" in fever_plan
    assert "q_chestpain_location_001" not in fever_plan

    # GI domain check
    gi_plan = engine.get_interview_plan("Stomach pain, acidity, and loose motion")
    assert "q_gi_pain_location_001" in gi_plan
    assert "q_gi_associated_symptoms_001" in gi_plan
    assert "q_chestpain_location_001" not in gi_plan
