import json
import os
import httpx
from typing import List, Dict, Any, Optional
from services.api.app.services.dialogue_engine import DialogueEngine

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "groq/compound"
FALLBACK_MODEL = "qwen/qwen3.8-27b"

CLINICAL_STAGES = [
    {
        "stage_num": 1,
        "stage_id": "CHIEF_COMPLAINT",
        "category": "chief_complaint",
        "badge_hi": "मुख्य समस्या",
        "badge_en": "Chief Complaint",
        "objective": "Capture primary reason for visit in patient voice or text."
    },
    {
        "stage_num": 2,
        "stage_id": "ONSET_AND_DURATION",
        "category": "hpi",
        "badge_hi": "शुरुआत व अवधि",
        "badge_en": "Onset & Duration",
        "objective": "Determine exact onset (sudden vs gradual vs intermittent) and duration (hours/days/weeks) of the primary symptom."
    },
    {
        "stage_num": 3,
        "stage_id": "LOCATION_AND_CHARACTER",
        "category": "hpi",
        "badge_hi": "लक्षण की स्थिति व प्रकार",
        "badge_en": "Location & Character",
        "objective": "Characterize specific location, sensation (sharp/burning/cramping/throbbing/heaviness), and radiation (e.g. to arm, back, jaw)."
    },
    {
        "stage_num": 4,
        "stage_id": "RED_FLAGS_AND_SEVERITY",
        "category": "hpi",
        "badge_hi": "गंभीर लक्षण व दर्द पैमाना",
        "badge_en": "Red Flags & Severity",
        "objective": "Screen for critical red-flag associated symptoms (breathlessness, diaphoresis/sweating, high fever, dizziness, syncope, bleeding) or pain scale (0-10)."
    },
    {
        "stage_num": 5,
        "stage_id": "PAST_MEDICAL_HISTORY",
        "category": "past_history",
        "badge_hi": "पूर्व स्वास्थ्य इतिहास",
        "badge_en": "Past Medical History",
        "objective": "Screen for relevant chronic conditions (Diabetes, Hypertension, Heart disease, Asthma/COPD, Thyroid, Kidney disease, None)."
    },
    {
        "stage_num": 6,
        "stage_id": "MEDICATIONS_AND_ALLERGIES",
        "category": "medication",
        "badge_hi": "दवाइयां व एलर्जी",
        "badge_en": "Medications & Allergies",
        "objective": "Inquire about regular daily prescription medicines and any known drug allergies (Penicillin, NSAIDs/Painkillers, etc.)."
    },
    {
        "stage_num": 7,
        "stage_id": "AYURVEDIC_PARIKSHA",
        "category": "ayurvedic",
        "badge_hi": "आयुर्वेदिक दशविध परीक्षा",
        "badge_en": "Ayurvedic Constitution",
        "objective": "Assess Prakriti (Vata/Pitta/Kapha body & skin), Agni (digestive fire), or Koshtha (bowel habits) in the context of the complaint."
    }
]

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
        Executes the invariant 7-Stage Clinical Intake Protocol.
        Within each stage, AI reasons through the patient's individual condition to generate
        clinically tailored questions and options.
        """
        # Calculate current stage (1-indexed based on number of answered questions)
        answered_count = len(conversation_history)
        next_stage_num = answered_count + 1

        # If all 7 stages are complete
        if next_stage_num > 7:
            return {
                "question": None,
                "clinical_reasoning": "Standard 7-Stage Clinical Intake Protocol successfully completed.",
                "is_interview_complete": True,
                "progress_pct": 100
            }

        current_stage = CLINICAL_STAGES[next_stage_num - 1]

        # If no API key, execute deterministic stage question
        if not self.api_key:
            answered_ids = [c.get("question_id", "") for c in conversation_history]
            fallback_q = self.fallback_engine.get_next_question(answered_ids, chief_complaint, language)
            progress = min(100, int((next_stage_num / 7) * 100))
            return {
                "question": fallback_q,
                "clinical_reasoning": f"Deterministic protocol for Stage {next_stage_num}/7: {current_stage['badge_en']}",
                "is_interview_complete": fallback_q is None,
                "progress_pct": progress
            }

        # Format history
        history_text = "\n".join([
            f"- Stage {i+1} Q: {item.get('question_text', '')}\n  A: {item.get('answer_text', '')}"
            for i, item in enumerate(conversation_history)
        ])

        system_prompt = f"""You are an expert AI clinical intake assistant for MediKiosk at an Indian hospital outpatient department (OPD).
You MUST generate a question strictly for the current clinical intake stage:

CURRENT MANDATORY STAGE:
Stage Number: {current_stage['stage_num']} of 7
Stage Identifier: {current_stage['stage_id']}
Clinical Stage Goal: {current_stage['objective']}
Stage Category: {current_stage['category']}

PATIENT CONTEXT:
Demographics: {patient_info.get('gender', 'Female')} patient, ~{patient_info.get('age', '50')} years old
Chief Complaint: "{chief_complaint}"
Language: {language} ({'Hindi in Devanagari' if language == 'hi' else 'English'})

STRICT SCHEMA RULES:
- question_hi MUST be clear, respectful, natural Hindi in Devanagari script.
- question_en MUST be clear clinical English.
- options MUST contain 3 to 4 clinically relevant, distinct choices with both Hindi and English labels.
- If Stage 4 and symptom is painful, input_type can be "FACES_SCALE" or "MULTI_CHOICE". Otherwise "SINGLE_CHOICE" or "MULTI_CHOICE".

Output MUST be a single valid JSON object strictly matching this schema:
{{
  "stage_num": {current_stage['stage_num']},
  "badge_hi": "{current_stage['badge_hi']}",
  "badge_en": "{current_stage['badge_en']}",
  "clinical_reasoning": "1-2 sentence medical rationale for this question tailored to the complaint and stage",
  "category": "{current_stage['category']}",
  "question_hi": "Natural Hindi question in Devanagari",
  "question_en": "Clear English question",
  "audio_prompt_hi": "Short 3-5 word audio instruction in Hindi",
  "audio_prompt_en": "Short 3-5 word audio instruction in English",
  "input_type": "SINGLE_CHOICE" | "MULTI_CHOICE" | "FACES_SCALE",
  "options": [
    {{"value": "OPT_1", "label_hi": "Hindi label 1", "label_en": "English label 1"}},
    {{"value": "OPT_2", "label_hi": "Hindi label 2", "label_en": "English label 2"}},
    {{"value": "OPT_3", "label_hi": "Hindi label 3", "label_en": "English label 3"}}
  ]
}}"""

        user_content = f"Chief Complaint: {chief_complaint}\n\nQ&A History so far:\n{history_text if history_text else '(First stage completed)'}\n\nGenerate Stage {current_stage['stage_num']}/7 question."

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
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
                    "max_tokens": 400,
                    "temperature": 0.15
                }

                response = await client.post(GROQ_API_URL, headers=headers, json=payload)
                if response.status_code != 200:
                    payload["model"] = FALLBACK_MODEL
                    response = await client.post(GROQ_API_URL, headers=headers, json=payload)

                if response.status_code == 200:
                    raw_content = response.json()["choices"][0]["message"]["content"]
                    parsed = json.loads(raw_content)

                    localized_text = parsed.get("question_hi") if language == "hi" else parsed.get("question_en")
                    audio_prompt = parsed.get("audio_prompt_hi") if language == "hi" else parsed.get("audio_prompt_en")

                    formatted_options = []
                    for opt in parsed.get("options", []):
                        label = opt.get("label_hi") if language == "hi" else opt.get("label_en")
                        formatted_options.append({
                            "value": opt.get("value", label),
                            "label": label or opt.get("value")
                        })

                    qid = f"q_stage_{current_stage['stage_num']}_{current_stage['category']}"

                    formatted_q = {
                        "id": qid,
                        "stage_num": current_stage["stage_num"],
                        "total_stages": 7,
                        "stage_badge_hi": parsed.get("badge_hi") or current_stage["badge_hi"],
                        "stage_badge_en": parsed.get("badge_en") or current_stage["badge_en"],
                        "category": current_stage["category"],
                        "text": parsed.get("question_en"),
                        "localized_text": localized_text or parsed.get("question_en"),
                        "audio_prompt_text": audio_prompt or localized_text,
                        "input_type": parsed.get("input_type", "SINGLE_CHOICE"),
                        "required": True,
                        "options": formatted_options
                    }

                    progress = min(100, int((current_stage["stage_num"] / 7) * 100))

                    return {
                        "question": formatted_q,
                        "clinical_reasoning": parsed.get("clinical_reasoning", ""),
                        "is_interview_complete": False,
                        "progress_pct": progress
                    }

        except Exception as e:
            print(f"[AIDialogueService] Groq API call error: {e}. Falling back to deterministic stage engine.")

        # Fallback to deterministic multi-domain engine
        answered_ids = [c.get("question_id", "") for c in conversation_history]
        fallback_q = self.fallback_engine.get_next_question(answered_ids, chief_complaint, language)
        progress = min(100, int((next_stage_num / 7) * 100))
        return {
            "question": fallback_q,
            "clinical_reasoning": f"Adaptive deterministic pathway for Stage {next_stage_num}/7",
            "is_interview_complete": fallback_q is None,
            "progress_pct": progress
        }
