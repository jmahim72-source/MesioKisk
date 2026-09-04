from typing import Dict, Any, List, Optional
from datetime import datetime

class SummaryGenerator:
    @staticmethod
    def generate_draft_summary(
        patient: Any,
        encounter: Any,
        interview_responses: List[Any],
        ayurvedic_data: Optional[Any],
        extracted_entities: List[Any],
        red_flags: List[Any]
    ) -> Dict[str, Any]:
        """
        Compiles patient intake responses, uploaded document entities, and Ayurvedic data
        into a structured JSON clinical summary conforming to API Contract Section 7.
        """
        # Extract Chief Complaint and HPI
        chief_complaint = encounter.chief_complaint_hint or "General OPD Health Check-up"
        hpi_elements = []
        past_medical = []
        medications = []
        allergies = []

        for resp in interview_responses:
            qid = getattr(resp, "question_id", "")
            raw = getattr(resp, "raw_text", "") or ""
            norm = getattr(resp, "normalized_answer", {}) or {}

            if "chief_complaint" in qid:
                chief_complaint = raw or chief_complaint
            elif "duration" in qid:
                hpi_elements.append(f"Duration: {raw or norm.get('duration', 'recent')}")
            elif "chestpain_location" in qid:
                hpi_elements.append(f"Location: {raw}")
            elif "associated_symptoms" in qid:
                hpi_elements.append(f"Associated symptoms: {raw}")
            elif "pain_severity" in qid:
                hpi_elements.append(f"Pain Severity: {raw}/10")
            elif "past_medical" in qid:
                if raw and raw.lower() != "none":
                    past_medical.append(raw)
            elif "medication" in qid:
                if raw and raw.lower() != "no":
                    medications.append({"name": raw, "frequency": "Daily"})
            elif "allergy" in qid:
                if raw and "no" not in raw.lower():
                    allergies.append(raw)

        # Merge entities from uploaded documents
        for ent in extracted_entities:
            etype = getattr(ent, "entity_type", "")
            norm = getattr(ent, "normalized", {})
            if etype == "MEDICATION" and norm:
                med_name = norm.get("name", "Unknown")
                if not any(m.get("name") == med_name for m in medications if isinstance(m, dict)):
                    medications.append({
                        "name": med_name,
                        "dose": norm.get("strength", ""),
                        "frequency": norm.get("frequency", "")
                    })
            elif etype == "DIAGNOSIS" and norm:
                cond = norm.get("condition", "")
                if cond and cond not in past_medical:
                    past_medical.append(cond)

        # Ayurvedic Assessment
        ayurvedic_summary = {}
        if ayurvedic_data:
            ayurvedic_summary = {
                "prakriti": getattr(ayurvedic_data, "prakriti_dominant_dosha", "VATA_PITTA") or "VATA_PITTA",
                "agni": getattr(ayurvedic_data, "agni_type", "VISHAMAGNI") or "VISHAMAGNI",
                "koshtha": getattr(ayurvedic_data, "koshtha_type", "MADHYAMA") or "MADHYAMA",
                "notes": getattr(ayurvedic_data, "ahara_vihara_notes", "Balanced vegetarian diet")
            }
        else:
            ayurvedic_summary = {
                "prakriti": "VATA_PITTA",
                "agni": "VISHAMAGNI",
                "koshtha": "MADHYAMA"
            }

        # Red Flags
        red_flag_list = [rf.suggested_action if hasattr(rf, "suggested_action") else str(rf) for rf in red_flags]

        hpi_text = ". ".join(hpi_elements) if hpi_elements else "Patient presented for routine clinical evaluation."

        summary_json = {
            "chief_complaint": chief_complaint,
            "history_present_illness": hpi_text,
            "past_medical_history": past_medical or ["None reported"],
            "medications": medications or [{"name": "No current medication", "dose": "", "frequency": ""}],
            "allergies": allergies or ["No known allergies"],
            "ayurvedic_assessment": ayurvedic_summary,
            "red_flags": red_flag_list
        }

        # Format Human Readable Text
        med_strs = []
        for m in summary_json["medications"]:
            if isinstance(m, dict):
                med_strs.append(f"{m.get('name', '')} {m.get('dose', '')}".strip())
            else:
                med_strs.append(str(m))

        summary_text = (
            f"CHIEF COMPLAINT: {chief_complaint}\n\n"
            f"HISTORY OF PRESENT ILLNESS: {hpi_text}\n\n"
            f"PAST MEDICAL HISTORY: {', '.join(summary_json['past_medical_history'])}\n\n"
            f"CURRENT MEDICATIONS: {', '.join(med_strs)}\n\n"
            f"ALLERGIES: {', '.join(summary_json['allergies'])}\n\n"
            f"AYURVEDIC PROFILE: Prakriti: {ayurvedic_summary.get('prakriti')}, Agni: {ayurvedic_summary.get('agni')}, Koshtha: {ayurvedic_summary.get('koshtha')}\n"
        )
        if red_flag_list:
            summary_text += f"\nURGENT RED-FLAG ALERTS: {'; '.join(red_flag_list)}\n"

        return {
            "summary_json": summary_json,
            "summary_text": summary_text
        }
