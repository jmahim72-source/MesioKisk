import json
import os
import httpx
from typing import List, Dict, Any, Optional
from services.api.app.services.dialogue_engine import DialogueEngine

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "qwen/qwen3.8-27b"
FALLBACK_MODEL = "openai/gpt-oss-120b"

class AIDialogueService:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY", "")
        self.fallback_engine = DialogueEngine()

    async def generate_next_question(
        self,
        patient_info: Dict[str, Any],
        chief_complaint: str,
        conversation_history: List[Dict[str, Any]],
        language: str = "hi"
    ) -> Dict[str, Any]:
        """
        Uses AI Clinical Reasoning to dynamically synthesize the most valuable next question.
        Falls back to deterministic rule engine if API key is missing or offline.
        """
        if not self.api_key:
            # Deterministic fallback
            answered_ids = [c.get("question_id", "") for c in conversation_history]
            fallback_q = self.fallback_engine.get_next_question(answered_ids, chief_complaint, language)
            progress = self.fallback_engine.calculate_progress(answered_ids, chief_complaint)
            return {
                "question": fallback_q,
                "clinical_reasoning": "Deterministic multi-domain clinical pathway fallback",
                "is_interview_complete": fallback_q is None,
                "progress_pct": progress
            }

        # Format history for prompt
        history_text = "\n".join([
            f"- Q: {item.get('question_text', '')}\n  A: {item.get('answer_text', '')}"
            for item in conversation_history
        ])

        question_count = len(conversation_history)
        
        system_prompt = f"""You are an expert AI clinical intake assistant for MediKiosk, an outpatient healthcare terminal at an Indian hospital.
Your goal is to conduct a smart, compassionate, and clinically rigorous intake dialogue.

CLINICAL GUIDELINES:
1. Patient Context: {patient_info.get('gender', 'Unknown')} patient, ~{patient_info.get('age', '50')} years old.
2. Chief Complaint: "{chief_complaint}"
3. Language: The patient preferred language is '{language}' ({'Hindi' if language == 'hi' else 'English'}).
4. Current question count: {question_count} answered.
5. Progression roadmap:
   - Questions 1-3: Deep-dive into specific HPI (onset, triggers, location, radiation, associated red-flag symptoms).
   - Question 4: Current regular medicines & drug allergies.
   - Question 5-6: Ayurvedic assessment (Prakriti, Agni/digestion, or bowel habits).
   - Total questions target: 5 to 7 questions total. When sufficient history is collected, set "is_interview_complete": true.

Output MUST be a single valid JSON object strictly matching this schema:
{{
  "clinical_reasoning": "Explain medical rationale for asking this question based on symptoms so far",
  "category": "hpi" | "past_history" | "medication" | "allergy" | "ayurvedic",
  "question_en": "Question in natural clinical English",
  "question_hi": "Question in fluent, respectful Hindi (Devanagari script)",
  "audio_prompt_en": "Short clear audio guidance in English",
  "audio_prompt_hi": "Short clear audio guidance in Hindi",
  "input_type": "SINGLE_CHOICE" | "MULTI_CHOICE" | "VOICE_OR_TEXT" | "FACES_SCALE",
  "options": [
    {{"value": "OPT_1", "label_en": "English label", "label_hi": "Hindi label"}},
    {{"value": "OPT_2", "label_en": "English label", "label_hi": "Hindi label"}}
  ],
  "is_interview_complete": false
}}"""

        user_content = f"Chief Complaint: {chief_complaint}\n\nPrevious Q&A History so far:\n{history_text if history_text else '(First follow-up question)'}\n\nGenerate the next best question."

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
                payload = {
                    "model": DEFAULT_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_content}
                    ],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.2
                }

                response = await client.post(GROQ_API_URL, headers=headers, json=payload)
                if response.status_code != 200:
                    # Fallback to secondary model
                    payload["model"] = FALLBACK_MODEL
                    response = await client.post(GROQ_API_URL, headers=headers, json=payload)

                if response.status_code == 200:
                    raw_content = response.json()["choices"][0]["message"]["content"]
                    parsed = json.loads(raw_content)

                    is_complete = parsed.get("is_interview_complete", False) or question_count >= 7

                    if is_complete:
                        return {
                            "question": None,
                            "clinical_reasoning": parsed.get("clinical_reasoning", "Clinical intake complete."),
                            "is_interview_complete": True,
                            "progress_pct": 100
                        }

                    # Format question into standard MediKiosk contract
                    localized_text = parsed.get("question_hi") if language == "hi" else parsed.get("question_en")
                    audio_prompt = parsed.get("audio_prompt_hi") if language == "hi" else parsed.get("audio_prompt_en")

                    formatted_options = []
                    for opt in parsed.get("options", []):
                        label = opt.get("label_hi") if language == "hi" else opt.get("label_en")
                        formatted_options.append({
                            "value": opt.get("value", label),
                            "label": label or opt.get("value")
                        })

                    qid = f"q_ai_{parsed.get('category', 'hpi')}_{question_count + 1}"

                    formatted_q = {
                        "id": qid,
                        "category": parsed.get("category", "hpi"),
                        "text": parsed.get("question_en"),
                        "localized_text": localized_text or parsed.get("question_en"),
                        "audio_prompt_text": audio_prompt or localized_text,
                        "input_type": parsed.get("input_type", "SINGLE_CHOICE"),
                        "required": True,
                        "options": formatted_options
                    }

                    progress = min(95, int(((question_count + 1) / 7) * 100))

                    return {
                        "question": formatted_q,
                        "clinical_reasoning": parsed.get("clinical_reasoning", ""),
                        "is_interview_complete": False,
                        "progress_pct": progress
                    }

        except Exception as e:
            print(f"[AIDialogueService] Groq API call error: {e}. Falling back to deterministic engine.")

        # Fallback to deterministic multi-domain engine
        answered_ids = [c.get("question_id", "") for c in conversation_history]
        fallback_q = self.fallback_engine.get_next_question(answered_ids, chief_complaint, language)
        progress = self.fallback_engine.calculate_progress(answered_ids, chief_complaint)
        return {
            "question": fallback_q,
            "clinical_reasoning": "Adaptive deterministic pathway",
            "is_interview_complete": fallback_q is None,
            "progress_pct": progress
        }
