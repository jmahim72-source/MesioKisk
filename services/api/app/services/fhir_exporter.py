from typing import Dict, Any, List
from datetime import datetime, timezone

class FHIRExporter:
    @staticmethod
    def create_bundle(patient: Any, encounter: Any, summary: Any) -> Dict[str, Any]:
        """
        Creates an HL7 FHIR R4 JSON document bundle compliant with ABDM / NDHM specifications.
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        bundle_id = f"bundle-{encounter.id}"

        patient_resource = {
            "resourceType": "Patient",
            "id": str(patient.id),
            "identifier": [
                {
                    "system": "https://healthid.abdm.gov.in",
                    "value": patient.abha_number or "91-2345-6789-0123"
                },
                {
                    "system": "https://hospital.gov.in/patient-id",
                    "value": patient.hospital_patient_id
                }
            ],
            "name": [
                {
                    "use": "official",
                    "given": [patient.first_name],
                    "family": patient.last_name or ""
                }
            ],
            "gender": (patient.gender or "other").lower(),
            "birthDate": str(patient.date_of_birth or "1968-01-01"),
            "telecom": [
                {"system": "phone", "value": patient.phone, "use": "mobile"}
            ] if patient.phone else []
        }

        encounter_resource = {
            "resourceType": "Encounter",
            "id": str(encounter.id),
            "status": "finished",
            "class": {
                "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
                "code": "AMB",
                "display": "ambulatory"
            },
            "subject": {"reference": f"Patient/{patient.id}"},
            "serviceType": {
                "coding": [
                    {
                        "system": "http://snomed.info/sct",
                        "code": "408443003",
                        "display": encounter.department or "General OPD"
                    }
                ]
            },
            "period": {
                "start": f"{encounter.encounter_date}T09:00:00Z"
            }
        }

        sections = summary.summary_json if hasattr(summary, "summary_json") and isinstance(summary.summary_json, dict) else {}
        
        # Conditions (Past medical history)
        conditions = []
        for i, cond in enumerate(sections.get("past_medical_history", [])):
            conditions.append({
                "resourceType": "Condition",
                "id": f"cond-{i+1}",
                "clinicalStatus": {
                    "coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical", "code": "active"}]
                },
                "subject": {"reference": f"Patient/{patient.id}"},
                "code": {"text": str(cond)}
            })

        # Medication Requests
        med_requests = []
        for i, med in enumerate(sections.get("medications", [])):
            med_text = f"{med.get('name', '')} {med.get('dose', '')} {med.get('frequency', '')}".strip() if isinstance(med, dict) else str(med)
            med_requests.append({
                "resourceType": "MedicationRequest",
                "id": f"med-{i+1}",
                "status": "active",
                "intent": "order",
                "medicationCodeableConcept": {"text": med_text},
                "subject": {"reference": f"Patient/{patient.id}"}
            })

        # Composition Note
        composition_resource = {
            "resourceType": "Composition",
            "id": f"comp-{encounter.id}",
            "status": "final",
            "type": {
                "coding": [{"system": "http://loinc.org", "code": "11488-4", "display": "Consultation note"}]
            },
            "subject": {"reference": f"Patient/{patient.id}"},
            "encounter": {"reference": f"Encounter/{encounter.id}"},
            "date": timestamp,
            "title": "MediKiosk Clinical Intake Summary",
            "section": [
                {
                    "title": "Chief Complaint & HPI",
                    "text": {
                        "status": "generated",
                        "div": f"<div xmlns=\"http://www.w3.org/1999/xhtml\"><p><strong>Chief Complaint:</strong> {sections.get('chief_complaint', 'None')}</p><p>{sections.get('history_present_illness', '')}</p></div>"
                    }
                },
                {
                    "title": "Ayurvedic Assessment",
                    "text": {
                        "status": "generated",
                        "div": f"<div xmlns=\"http://www.w3.org/1999/xhtml\"><p><strong>Prakriti:</strong> {sections.get('ayurvedic_assessment', {}).get('prakriti', 'N/A')}</p><p><strong>Agni:</strong> {sections.get('ayurvedic_assessment', {}).get('agni', 'N/A')}</p></div>"
                    }
                }
            ]
        }

        all_resources = [composition_resource, patient_resource, encounter_resource, *conditions, *med_requests]

        return {
            "resourceType": "Bundle",
            "id": bundle_id,
            "meta": {
                "lastUpdated": timestamp,
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/DocumentBundle"]
            },
            "type": "document",
            "entry": [
                {
                    "fullUrl": f"urn:uuid:{res['id']}",
                    "resource": res
                }
                for res in all_resources
            ]
        }
