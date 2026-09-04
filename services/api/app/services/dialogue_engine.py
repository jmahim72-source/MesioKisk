import json
import os
from typing import List, Dict, Any, Optional

def load_question_bank() -> List[Dict[str, Any]]:
    possible_paths = [
        os.path.join(os.path.dirname(__file__), "../../../../packages/question-bank/questions.json"),
        os.path.join(os.getcwd(), "packages/question-bank/questions.json"),
        "packages/question-bank/questions.json"
    ]
    for path in possible_paths:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
    return []

QUESTION_BANK = load_question_bank()

class DialogueEngine:
    def __init__(self, questions: Optional[List[Dict[str, Any]]] = None):
        self.questions = questions or QUESTION_BANK
        self._q_map = {q["id"]: q for q in self.questions}

    def detect_domain(self, text: str) -> str:
        t = (text or "").lower()
        
        cardio_kw = ["chest", "heart", "सीने", "छाती", "धड़कन", "घबराहट", "palpitat", "angina", "cardiac", "left arm", "jaw pain"]
        if any(kw in t for kw in cardio_kw):
            return "CARDIOVASCULAR"

        resp_kw = ["fever", "बुखार", "खांसी", "cough", "cold", "जुकाम", "breath", "सांस", "throat", "गले", "कफ", "sputum", "chills", "ठंड"]
        if any(kw in t for kw in resp_kw):
            return "RESPIRATORY_FEVER"

        gi_kw = ["stomach", "पेट", "abdomen", "उल्टी", "vomit", "दस्त", "loose motion", "diarrhea", "acidity", "gas", "कब्ज", "digest", "गैस"]
        if any(kw in t for kw in gi_kw):
            return "GASTROINTESTINAL"

        msk_kw = ["joint", "घुटने", "knee", "back", "कमर", "पीठ", "shoulder", "जोड़ों", "arthritis", "सूजन", "swelling", "हड्डी", "bone", "दर्द"]
        if any(kw in t for kw in msk_kw):
            return "MUSCULOSKELETAL"

        return "GENERAL"

    def get_interview_plan(self, chief_complaint: str) -> List[str]:
        domain = self.detect_domain(chief_complaint)
        
        plan = [
            "q_chief_complaint_001",
            "q_symptom_duration_001"
        ]

        if domain == "CARDIOVASCULAR":
            plan.extend([
                "q_chestpain_location_001",
                "q_associated_symptoms_cardiac_001",
                "q_pain_severity_scale_001"
            ])
        elif domain == "RESPIRATORY_FEVER":
            plan.extend([
                "q_fever_characteristics_001",
                "q_respiratory_symptoms_001"
            ])
        elif domain == "GASTROINTESTINAL":
            plan.extend([
                "q_gi_pain_location_001",
                "q_gi_associated_symptoms_001",
                "q_pain_severity_scale_001"
            ])
        elif domain == "MUSCULOSKELETAL":
            plan.extend([
                "q_joint_location_001",
                "q_pain_severity_scale_001"
            ])
        else: # GENERAL
            plan.extend([
                "q_pain_severity_scale_001"
            ])

        # Universal medical history & medication safety
        plan.extend([
            "q_past_medical_history_001",
            "q_current_medications_001",
            "q_drug_allergies_001"
        ])

        # Ayurvedic Dashavidha Pariksha
        plan.extend([
            "q_ayurvedic_prakriti_body_001",
            "q_ayurvedic_agni_digestion_001",
            "q_ayurvedic_koshtha_bowel_001"
        ])

        return plan

    def get_first_question(self, language: str = "hi") -> Optional[Dict[str, Any]]:
        q = self._q_map.get("q_chief_complaint_001") or (self.questions[0] if self.questions else None)
        if not q:
            return None
        return self._format_question(q, language)

    def get_next_question(
        self,
        answered_question_ids: List[str],
        chief_complaint: str,
        language: str = "hi"
    ) -> Optional[Dict[str, Any]]:
        plan = self.get_interview_plan(chief_complaint)
        
        for qid in plan:
            if qid not in answered_question_ids:
                q = self._q_map.get(qid)
                if q:
                    return self._format_question(q, language)

        return None

    def calculate_progress(self, answered_question_ids: List[str], chief_complaint: str) -> int:
        plan = self.get_interview_plan(chief_complaint)
        total = len(plan)
        if total == 0:
            return 100
        answered_count = sum(1 for qid in plan if qid in answered_question_ids)
        return min(100, int((answered_count / total) * 100))

    def _format_question(self, q: Dict[str, Any], language: str = "hi") -> Dict[str, Any]:
        localized_text = q.get("localized_text", {}).get(language) or q.get("localized_text", {}).get("en") or q.get("text")
        audio_prompt = q.get("audio_prompt_text", {}).get(language) or q.get("audio_prompt_text", {}).get("en")
        
        formatted_options = []
        for opt in q.get("options", []):
            if isinstance(opt, dict):
                label = opt.get("localized_label", {}).get(language) or opt.get("localized_label", {}).get("en") or opt.get("label")
                formatted_options.append({
                    "value": opt.get("value"),
                    "label": label
                })
            else:
                formatted_options.append({"value": opt, "label": str(opt)})

        return {
            "id": q["id"],
            "category": q.get("category", "general"),
            "section": q.get("section", "general"),
            "domain": q.get("domain", "ALL"),
            "text": q["text"],
            "localized_text": localized_text,
            "audio_prompt_text": audio_prompt,
            "input_type": q["input_type"],
            "required": q.get("required", True),
            "options": formatted_options
        }
