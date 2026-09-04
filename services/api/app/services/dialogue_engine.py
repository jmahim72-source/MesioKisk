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

    def get_first_question(self, language: str = "hi") -> Optional[Dict[str, Any]]:
        if not self.questions:
            return None
        q = self.questions[0]
        return self._format_question(q, language)

    def get_next_question(self, answered_question_ids: List[str], last_answer: Dict[str, Any], language: str = "hi") -> Optional[Dict[str, Any]]:
        # Dynamic Branching Logic
        last_qid = last_answer.get("question_id", "")
        last_raw = str(last_answer.get("raw_text", "")).lower()

        # If Chief Complaint contains chest pain or heart symptoms, prioritize cardiac questions
        if "chest" in last_raw or "दर्द" in last_raw or "heart" in last_raw or "सीने" in last_raw:
            for target_id in ["q_chestpain_location_001", "q_associated_symptoms_cardiac_001", "q_pain_severity_scale_001"]:
                if target_id not in answered_question_ids:
                    q = next((item for item in self.questions if item["id"] == target_id), None)
                    if q:
                        return self._format_question(q, language)

        # Otherwise find next unanswered question in order
        for q in self.questions:
            if q["id"] not in answered_question_ids:
                return self._format_question(q, language)

        return None

    def _format_question(self, q: Dict[str, Any], language: str = "hi") -> Dict[str, Any]:
        localized_text = q.get("localized_text", {}).get(language) or q.get("localized_text", {}).get("en") or q.get("text")
        audio_prompt = q.get("audio_prompt_text", {}).get(language) or q.get("audio_prompt_text", {}).get("en")
        
        # Format options for localization
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
            "text": q["text"],
            "localized_text": localized_text,
            "audio_prompt_text": audio_prompt,
            "input_type": q["input_type"],
            "required": q.get("required", True),
            "options": formatted_options
        }
