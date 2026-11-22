import os
import json
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
import httpx

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
PRIMARY_MODEL = "openai/gpt-oss-120b"
FALLBACK_MODEL = "openai/gpt-oss-20b"

def _get_groq_api_key() -> str:
    key = os.environ.get("GROQ_API_KEY", "")
    if not key:
        from pathlib import Path
        for p in [Path(".env"), Path("services/api/.env"), Path(__file__).resolve().parents[3] / ".env"]:
            if p.is_file():
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        for line in f:
                            if line.strip().startswith("GROQ_API_KEY="):
                                return line.strip().split("=", 1)[1].strip().strip('"').strip("'")
                except Exception:
                    pass
    return key


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
        Uses Groq LLM when available for human-grade clinical synthesis,
        with a deterministic fallback if offline.
        """
        # 1. Parse Ayurvedic Profile
        ayurvedic_summary = {
            "prakriti": "Not assessed",
            "agni": "Not assessed",
            "koshtha": "Not assessed"
        }
        if ayurvedic_data:
            ayurvedic_summary = {
                "prakriti": getattr(ayurvedic_data, "primary_dosha", None) or getattr(ayurvedic_data, "prakriti", "Tridoshic (Balanced)"),
                "agni": getattr(ayurvedic_data, "agni", "Sama (Balanced)"),
                "koshtha": getattr(ayurvedic_data, "koshtha", "Madhyama (Normal)")
            }

        # 2. Extract structured fields from interview responses
        chief_complaint = getattr(encounter, "chief_complaint_hint", None) or "General OPD Health Check-up"
        hpi_elements = []
        past_medical = []
        medications = []
        allergies = []
        functional_impact = "Patient reports mild discomfort affecting daily routine."
        qa_pairs = []

        for resp in interview_responses:
            qid = str(getattr(resp, "question_id", "") or "").lower()
            qtext = str(getattr(resp, "question_text", "") or "")
            raw = str(getattr(resp, "raw_text", "") or "").strip()
            norm = getattr(resp, "normalized_answer", {}) or {}

            if raw:
                qa_pairs.append({"question": qtext or qid, "answer": raw})

            # Check stage / categories
            if "chief_complaint" in qid or "stage_1" in qid:
                if raw:
                    chief_complaint = raw
            elif "duration" in qid or "onset" in qid or "stage_2" in qid:
                if raw:
                    hpi_elements.append(f"Onset & Duration: {raw}")
            elif "location" in qid or "character" in qid or "stage_3" in qid or "chestpain_location" in qid:
                if raw:
                    hpi_elements.append(f"Location & Sensation: {raw}")
            elif "severity" in qid or "red_flag" in qid or "stage_4" in qid or "associated" in qid:
                if raw and "नहीं" not in raw.lower() and "none" not in raw.lower():
                    hpi_elements.append(f"Associated Symptoms / Warning Signs: {raw}")
            elif "past_medical" in qid or "past_history" in qid or "stage_5" in qid:
                if raw and "नहीं" not in raw.lower() and "none" not in raw.lower() and "no" not in raw.lower():
                    past_medical.append(raw)
            elif "medication" in qid or "allergy" in qid or "stage_6" in qid:
                if raw and "नहीं" not in raw.lower() and "none" not in raw.lower() and "no" not in raw.lower():
                    if "allergy" in raw.lower() or "एलर्जी" in raw:
                        allergies.append(raw)
                    else:
                        medications.append({"name": raw, "dose": "", "frequency": "Reported by patient"})
            elif "stage_7" in qid or "lifestyle" in qid or "impact" in qid:
                if raw:
                    functional_impact = raw

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

        # Red Flags
        red_flag_list = [rf.suggested_action if hasattr(rf, "suggested_action") else str(rf) for rf in red_flags]

        # 3. Attempt LLM-Powered Synthesis via Groq if key exists and responses exist
        groq_key = _get_groq_api_key()
        summary_json = None

        if groq_key and qa_pairs:
            try:
                summary_json = SummaryGenerator._synthesize_with_groq(
                    groq_key=groq_key,
                    patient=patient,
                    chief_complaint=chief_complaint,
                    qa_pairs=qa_pairs,
                    red_flags=red_flag_list,
                    extracted_entities=extracted_entities
                )
            except Exception as e:
                print(f"[SummaryGenerator] Groq synthesis fallback: {e}")

        # 4. Deterministic Fallback if LLM unavailable
        if not summary_json:
            hpi_text = ". ".join(hpi_elements) if hpi_elements else f"Patient presents with {chief_complaint} for clinical evaluation."
            summary_json = {
                "chief_complaint": chief_complaint,
                "history_present_illness": hpi_text,
                "past_medical_history": past_medical or ["None reported"],
                "medications": medications or [{"name": "No current medication", "dose": "", "frequency": ""}],
                "allergies": allergies or ["No known allergies"],
                "functional_impact": functional_impact,
                "red_flags": red_flag_list
            }

        # Ensure defaults for required fields
        if not summary_json.get("past_medical_history"):
            summary_json["past_medical_history"] = ["None reported"]
        if not summary_json.get("medications"):
            summary_json["medications"] = [{"name": "No current medication", "dose": "", "frequency": ""}]
        if not summary_json.get("allergies"):
            summary_json["allergies"] = ["No known allergies"]
        if not summary_json.get("functional_impact"):
            summary_json["functional_impact"] = functional_impact
        if not summary_json.get("red_flags"):
            summary_json["red_flags"] = red_flag_list

        # Format Human Readable Text
        med_strs = []
        for m in summary_json.get("medications", []):
            if isinstance(m, dict):
                med_strs.append(f"{m.get('name', '')} {m.get('dose', '')}".strip() or m.get("name", ""))
            else:
                med_strs.append(str(m))

        summary_text = (
            f"CHIEF COMPLAINT: {summary_json.get('chief_complaint', chief_complaint)}\n\n"
            f"HISTORY OF PRESENT ILLNESS: {summary_json.get('history_present_illness', '')}\n\n"
            f"PAST MEDICAL HISTORY: {', '.join(summary_json.get('past_medical_history', ['None reported']))}\n\n"
            f"CURRENT MEDICATIONS: {', '.join(med_strs) or 'None'}\n\n"
            f"ALLERGIES: {', '.join(summary_json.get('allergies', ['No known allergies']))}\n\n"
            f"FUNCTIONAL IMPACT: {summary_json.get('functional_impact', '')}\n\n"
            f"AYURVEDIC PROFILE: Prakriti: {ayurvedic_summary.get('prakriti')}, Agni: {ayurvedic_summary.get('agni')}, Koshtha: {ayurvedic_summary.get('koshtha')}\n"
        )
        if summary_json.get("red_flags"):
            summary_text += f"\nURGENT RED-FLAG ALERTS: {'; '.join(summary_json.get('red_flags', []))}\n"

        return {
            "summary_json": summary_json,
            "summary_text": summary_text
        }

    @staticmethod
    def _synthesize_with_groq(
        groq_key: str,
        patient: Any,
        chief_complaint: str,
        qa_pairs: List[Dict[str, str]],
        red_flags: List[str],
        extracted_entities: List[Any]
    ) -> Dict[str, Any]:
        age = 50
        gender = getattr(patient, "gender", "FEMALE")
        if patient and getattr(patient, "date_of_birth", None):
            try:
                age = max(1, 2026 - int(str(patient.date_of_birth)[:4]))
            except Exception:
                pass

        lines = "\n".join(f"- Q: {item['question']} -> A: {item['answer']}" for item in qa_pairs)

        prompt = f"""You are an expert physician reviewing patient intake data for an OPD consultation note.
Patient: {age}yo {gender}.
Chief Complaint stated: "{chief_complaint}".
Intake Q&A from Kiosk:
{lines}

Red Flags Detected: {', '.join(red_flags) if red_flags else 'None'}

Synthesize this into a structured clinical summary in English.
Respond in valid JSON only with keys:
- "chief_complaint": string (primary symptom in English)
- "history_present_illness": string (a coherent, professional 2-4 sentence clinical HPI paragraph in English detailing onset timeline, location, character, radiation, severity, aggravating/relieving factors, and accompanying symptoms)
- "past_medical_history": array of strings (e.g. ["None reported"] or chronic conditions)
- "medications": array of objects with "name", "dose", "frequency"
- "allergies": array of strings (e.g. ["No known allergies"])
- "functional_impact": string (how symptoms impact daily living, sleep, reading, mobility)
- "red_flags": array of strings (warning signs identified, or empty array)"""

        payload = {
            "model": PRIMARY_MODEL,
            "messages": [
                {"role": "system", "content": "You are a clinical documentation AI. Return valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "max_tokens": 1200,
            "temperature": 0.2
        }
        headers = {
            "Authorization": f"Bearer {groq_key}",
            "Content-Type": "application/json"
        }

        with httpx.Client(timeout=12.0) as client:
            resp = client.post(GROQ_API_URL, headers=headers, json=payload)
            if resp.status_code in [400, 404, 429]:
                payload["model"] = FALLBACK_MODEL
                resp = client.post(GROQ_API_URL, headers=headers, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"Groq summary HTTP {resp.status_code}: {resp.text[:200]}")

            raw = resp.json()["choices"][0]["message"]["content"].strip()
            if raw.startswith("```"):
                raw = re.sub(r"^```(?:json)?\s*", "", raw)
                raw = re.sub(r"\s*```$", "", raw)
            parsed = json.loads(raw)
            return parsed
