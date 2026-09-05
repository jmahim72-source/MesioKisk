"""
AI Dialogue Service — MediKiosk Clinical Intake
================================================
Drives the 7-stage invariant clinical intake protocol using Groq LLM.

Each stage generates a SINGLE, contextually tailored question that builds on
the patient's previous answers. The AI is instructed with a strict JSON schema
to ensure consistent, parseable output.

Model:   llama-3.3-70b-versatile  (fast, 128k ctx, free on Groq)
Fallback: deterministic DialogueEngine when Groq is unavailable.
"""

import json
import os
from typing import List, Dict, Any, Optional

import httpx

from services.api.app.services.dialogue_engine import DialogueEngine

# ── Groq API ─────────────────────────────────────────────────────────────────
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
PRIMARY_MODEL = "llama-3.3-70b-versatile"  # best free-tier Groq model, 128k ctx
FALLBACK_MODEL = "llama3-70b-8192"         # reliable older fallback

# ── 7-Stage clinical intake protocol ─────────────────────────────────────────
CLINICAL_STAGES = [
    {
        "stage_num": 1,
        "stage_id": "CHIEF_COMPLAINT",
        "category": "chief_complaint",
        "badge_hi": "मुख्य समस्या",
        "badge_en": "Chief Complaint",
        "objective": (
            "Ask the patient to describe their primary symptom in their own words. "
            "Keep it open-ended — do NOT suggest specific symptoms."
        ),
        "default_input_type": "SINGLE_CHOICE"
    },
    {
        "stage_num": 2,
        "stage_id": "ONSET_AND_DURATION",
        "category": "hpi",
        "badge_hi": "शुरुआत व अवधि",
        "badge_en": "Onset & Duration",
        "objective": (
            "Determine WHEN the symptom started and HOW LONG it has been present. "
            "Distinguish sudden onset (minutes-hours) vs gradual (days-weeks). "
            "Tailor duration options to the reported complaint."
        ),
        "default_input_type": "SINGLE_CHOICE"
    },
    {
        "stage_num": 3,
        "stage_id": "LOCATION_AND_CHARACTER",
        "category": "hpi",
        "badge_hi": "लक्षण की जगह व प्रकार",
        "badge_en": "Location & Character",
        "objective": (
            "Identify EXACTLY where the symptom is located and what TYPE of sensation it is. "
            "For pain: sharp/burning/throbbing/cramping/heaviness/pressure. "
            "For non-pain (fever, nausea): describe quality (constant vs intermittent). "
            "Use options specific to the chief complaint."
        ),
        "default_input_type": "MULTI_CHOICE"
    },
    {
        "stage_num": 4,
        "stage_id": "RED_FLAGS_AND_SEVERITY",
        "category": "hpi",
        "badge_hi": "गंभीरता व साथ के लक्षण",
        "badge_en": "Severity & Red Flags",
        "objective": (
            "Screen for CRITICAL associated symptoms relevant to the complaint: "
            "breathlessness, sweating, high fever (>103°F/39.4°C), dizziness, "
            "fainting, bleeding, vomiting. For pain complaints also capture "
            "severity 0-10. Use FACES_SCALE for pain severity, MULTI_CHOICE for "
            "associated symptoms — pick whichever fits the chief complaint best."
        ),
        "default_input_type": "MULTI_CHOICE"
    },
    {
        "stage_num": 5,
        "stage_id": "PAST_MEDICAL_HISTORY",
        "category": "past_history",
        "badge_hi": "पूर्व बीमारियाँ",
        "badge_en": "Past Medical History",
        "objective": (
            "Screen for chronic conditions relevant to the complaint: "
            "Diabetes (मधुमेह), Hypertension (उच्च रक्तचाप), Heart disease (दिल की बीमारी), "
            "Asthma/COPD (दमा), Thyroid (थायरॉइड), Kidney disease (गुर्दे की बीमारी), "
            "None (कोई नहीं). List the most clinically relevant conditions first."
        ),
        "default_input_type": "MULTI_CHOICE"
    },
    {
        "stage_num": 6,
        "stage_id": "MEDICATIONS_AND_ALLERGIES",
        "category": "medication",
        "badge_hi": "दवाइयाँ व एलर्जी",
        "badge_en": "Medications & Allergies",
        "objective": (
            "Capture both current medications AND drug allergies in a single question. "
            "Options: currently on medications (हाँ दवाइयाँ चल रही हैं), no medicines, "
            "known drug allergy (दवाई से एलर्जी है), no known allergy."
        ),
        "default_input_type": "MULTI_CHOICE"
    },
    {
        "stage_num": 7,
        "stage_id": "AYURVEDIC_PARIKSHA",
        "category": "ayurvedic",
        "badge_hi": "आयुर्वेदिक प्रकृति",
        "badge_en": "Ayurvedic Constitution",
        "objective": (
            "Assess Prakriti (body constitution): "
            "Vata — thin/dry/cold/anxious; Pitta — medium/sharp/hot/intense; Kapha — heavy/oily/calm/slow. "
            "Also consider Agni (digestive strength) and Koshtha (bowel habit) if a GI complaint. "
            "Ask in simple, patient-friendly language."
        ),
        "default_input_type": "SINGLE_CHOICE"
    }
]

_STAGE_BY_NUM = {s["stage_num"]: s for s in CLINICAL_STAGES}

# ── Per-stage input type guidance for the AI prompt ──────────────────────────
_INPUT_TYPE_GUIDANCE = {
    1: "Use SINGLE_CHOICE — patient selects their primary symptom category.",
    2: "Use SINGLE_CHOICE — patient picks the time since symptom started.",
    3: "Use MULTI_CHOICE — patient may describe multiple locations/sensations.",
    4: (
        "Use FACES_SCALE if the complaint primarily involves pain (headache, chest pain, "
        "abdominal pain, joint pain). Use MULTI_CHOICE if the focus is associated "
        "symptoms (breathlessness, nausea, sweating). Choose the most appropriate."
    ),
    5: "Use MULTI_CHOICE — patient may have multiple chronic conditions.",
    6: "Use MULTI_CHOICE — patient selects all applicable medication/allergy options.",
    7: "Use SINGLE_CHOICE — patient identifies their body constitution type."
}


class AIDialogueService:
    """
    Drives the 7-stage clinical intake protocol using Groq LLM.

    Stage 1 (Chief Complaint) is already asked by start_interview() via the
    static DialogueEngine. When /responses is called the first time (with the
    stage-1 answer), conversation_history has 1 item → next_stage_num = 2.
    """

    def __init__(self, api_key: Optional[str] = None):
        # Priority: explicit arg → env var → pydantic settings
        self.api_key = api_key or os.environ.get("GROQ_API_KEY", "")
        if not self.api_key:
            try:
                from services.api.app.core.config import settings
                self.api_key = settings.GROQ_API_KEY or ""
            except Exception:
                pass
        self.fallback_engine = DialogueEngine()

    # ─────────────────────────────────────────────────────────────────────────
    async def generate_next_question(
        self,
        patient_info: Dict[str, Any],
        chief_complaint: str,
        conversation_history: List[Dict[str, Any]],
        language: str = "hi"
    ) -> Dict[str, Any]:
        """
        Returns the next stage question dict, or a completion signal.
        conversation_history contains ALL answers submitted so far (stage 1 included).
        """
        answered_count = len(conversation_history)
        next_stage_num = answered_count + 1

        if next_stage_num > 7:
            return {
                "question": None,
                "clinical_reasoning": "7-Stage Clinical Intake Protocol completed successfully.",
                "is_interview_complete": True,
                "progress_pct": 100
            }

        current_stage = _STAGE_BY_NUM[next_stage_num]
        progress = min(95, int(((next_stage_num - 1) / 7) * 100))

        if not self.api_key:
            return self._deterministic_fallback(
                next_stage_num, current_stage, conversation_history,
                chief_complaint, language, progress
            )

        try:
            result = await self._call_groq(
                current_stage, patient_info, chief_complaint,
                conversation_history, language
            )
            result["progress_pct"] = progress
            return result
        except Exception as e:
            print(
                f"[AIDialogueService] Groq error (stage {next_stage_num}): {e}. "
                "Falling back to deterministic engine."
            )
            return self._deterministic_fallback(
                next_stage_num, current_stage, conversation_history,
                chief_complaint, language, progress
            )

    # ─────────────────────────────────────────────────────────────────────────
    async def _call_groq(
        self,
        stage: Dict[str, Any],
        patient_info: Dict[str, Any],
        chief_complaint: str,
        history: List[Dict[str, Any]],
        language: str
    ) -> Dict[str, Any]:
        system_prompt = self._build_system_prompt(stage, patient_info, chief_complaint, language)
        user_prompt = self._build_user_prompt(stage, history, chief_complaint)

        payload = {
            "model": PRIMARY_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "max_tokens": 700,
            "temperature": 0.2,
            "top_p": 0.9
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(GROQ_API_URL, headers=headers, json=payload)

            if resp.status_code == 429:
                # Rate limited — retry with fallback model
                payload["model"] = FALLBACK_MODEL
                resp = await client.post(GROQ_API_URL, headers=headers, json=payload)

            if resp.status_code != 200:
                raise RuntimeError(f"Groq HTTP {resp.status_code}: {resp.text[:300]}")

            raw = resp.json()["choices"][0]["message"]["content"]
            if not raw or not raw.strip():
                raise ValueError("Empty response body from Groq")

            parsed = json.loads(raw)
            return self._format_parsed(parsed, stage, language)

    # ─────────────────────────────────────────────────────────────────────────
    def _build_system_prompt(
        self,
        stage: Dict[str, Any],
        patient_info: Dict[str, Any],
        chief_complaint: str,
        language: str
    ) -> str:
        lang_label = "Hindi in Devanagari script (question_hi) AND English (question_en)"
        input_guidance = _INPUT_TYPE_GUIDANCE.get(stage["stage_num"], "Use SINGLE_CHOICE.")

        return f"""You are an expert AI clinical intake assistant for MediKiosk — an Indian hospital OPD digital kiosk.

## YOUR TASK
Generate exactly ONE structured intake question for:
  Stage {stage['stage_num']} of 7 — **{stage['badge_en']}** ({stage['badge_hi']})

## STAGE CLINICAL OBJECTIVE
{stage['objective']}

## PATIENT CONTEXT
- Gender/Age: {patient_info.get('gender', 'FEMALE')} patient, ~{patient_info.get('age', 50)} years old
- Chief Complaint: "{chief_complaint}"
- Language: {lang_label}

## CLINICAL RULES
1. The question MUST directly fulfil the Stage Objective above.
2. Personalise the question to the patient's specific complaint and prior answers.
3. Do NOT repeat information already collected in earlier stages.
4. Hindi text: respectful, plain everyday Devanagari — no archaic Sanskrit.
5. English text: clear, concise clinical phrasing.
6. Options: 3–5 items, clinically meaningful for THIS patient's complaint, ordered by likelihood.

## INPUT TYPE RULE
{input_guidance}

## OUTPUT FORMAT
Respond with ONLY a single valid JSON object — no markdown fences, no extra text:
{{
  "stage_num": {stage['stage_num']},
  "badge_hi": "{stage['badge_hi']}",
  "badge_en": "{stage['badge_en']}",
  "clinical_reasoning": "<1-2 sentence rationale linking this stage question to the patient's complaint and clinical logic>",
  "question_hi": "<Respectful Hindi question in Devanagari, personalised to complaint>",
  "question_en": "<Clear English clinical question, personalised to complaint>",
  "audio_prompt_hi": "<5-7 word Hindi audio cue in Devanagari>",
  "audio_prompt_en": "<5-7 word English audio cue>",
  "input_type": "<SINGLE_CHOICE | MULTI_CHOICE | FACES_SCALE>",
  "options": [
    {{"value": "OPT_A", "label_hi": "<Hindi Devanagari label>", "label_en": "<English label>"}},
    {{"value": "OPT_B", "label_hi": "<Hindi Devanagari label>", "label_en": "<English label>"}},
    {{"value": "OPT_C", "label_hi": "<Hindi Devanagari label>", "label_en": "<English label>"}}
  ]
}}

Constraints:
- value: SHORT uppercase key like OPT_SUDDEN, OPT_NONE, OPT_DIABETES
- label_hi and label_en are REQUIRED on every option
- FACES_SCALE: only for pain severity (0-10 scale) — omit options array or set it to []
- MULTI_CHOICE: when patient should select ALL that apply
- SINGLE_CHOICE: when patient picks exactly ONE answer"""

    def _build_user_prompt(
        self,
        stage: Dict[str, Any],
        history: List[Dict[str, Any]],
        chief_complaint: str
    ) -> str:
        if history:
            lines = "\n".join(
                f"  Stage {i+1} — Q: {item.get('question_text', '?')}\n"
                f"             A: {item.get('answer_text', '?')}"
                for i, item in enumerate(history)
            )
            history_block = f"INTERVIEW HISTORY (completed stages):\n{lines}"
        else:
            history_block = "INTERVIEW HISTORY: (no prior answers — this is the first response stage)"

        return (
            f'Chief Complaint: "{chief_complaint}"\n\n'
            f"{history_block}\n\n"
            f"Generate Stage {stage['stage_num']}/7 ({stage['badge_en']}) question. "
            "Personalise based on the complaint and history. Output only the JSON object."
        )

    # ─────────────────────────────────────────────────────────────────────────
    def _format_parsed(
        self,
        parsed: Dict[str, Any],
        stage: Dict[str, Any],
        language: str
    ) -> Dict[str, Any]:
        localized_text = (
            parsed.get("question_hi") if language == "hi" else parsed.get("question_en")
        ) or parsed.get("question_en", "")

        audio_prompt = (
            parsed.get("audio_prompt_hi") if language == "hi" else parsed.get("audio_prompt_en")
        ) or localized_text[:50]

        formatted_options = []
        for opt in parsed.get("options", []):
            label = (
                opt.get("label_hi") if language == "hi" else opt.get("label_en")
            ) or opt.get("label_en") or opt.get("value", "")
            formatted_options.append({
                "value": opt.get("value", label.upper().replace(" ", "_")),
                "label": label
            })

        return {
            "question": {
                "id": f"q_stage_{stage['stage_num']}_{stage['category']}",
                "stage_num": stage["stage_num"],
                "total_stages": 7,
                "stage_badge_hi": parsed.get("badge_hi") or stage["badge_hi"],
                "stage_badge_en": parsed.get("badge_en") or stage["badge_en"],
                "category": stage["category"],
                "text": parsed.get("question_en", localized_text),
                "localized_text": localized_text,
                "audio_prompt_text": audio_prompt,
                "input_type": parsed.get("input_type", stage.get("default_input_type", "SINGLE_CHOICE")),
                "required": True,
                "options": formatted_options
            },
            "clinical_reasoning": parsed.get("clinical_reasoning", ""),
            "is_interview_complete": False
        }

    # ─────────────────────────────────────────────────────────────────────────
    def _deterministic_fallback(
        self,
        next_stage_num: int,
        current_stage: Dict[str, Any],
        conversation_history: List[Dict[str, Any]],
        chief_complaint: str,
        language: str,
        progress: int
    ) -> Dict[str, Any]:
        answered_ids = [c.get("question_id", "") for c in conversation_history]
        fallback_q = self.fallback_engine.get_next_question(answered_ids, chief_complaint, language)
        return {
            "question": fallback_q,
            "clinical_reasoning": (
                f"Deterministic fallback — Stage {next_stage_num}/7: {current_stage['badge_en']}. "
                "AI service unavailable; using static question bank."
            ),
            "is_interview_complete": fallback_q is None,
            "progress_pct": progress
        }
