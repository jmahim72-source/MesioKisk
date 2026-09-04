from typing import List, Dict, Any, Optional

RED_FLAG_RULES = [
    {
        "rule_id": "CARDIAC_001",
        "name": "Possible Acute Coronary Syndrome",
        "severity": "CRITICAL",
        "trigger_keywords": ["chest pain", "सीने में दर्द", "chest pressure", "छाती में दर्द", "heavy chest"],
        "required_associated": [
            ["breathlessness", "सांस फूलना", "shortness of breath", "sweating", "पसीना", "cold sweat", "nausea", "उल्टी", "घबराहट"]
        ],
        "suggested_action": "Immediate ECG and urgent cardiology / emergency triage referral.",
        "safety_wording": "Possible emergency indicators detected. Immediate triage assessment recommended."
    },
    {
        "rule_id": "STROKE_001",
        "name": "Possible Acute Cerebrovascular Event (Stroke)",
        "severity": "CRITICAL",
        "trigger_keywords": ["weakness", "कमजोरी", "paralysis", "लकवा", "facial droop", "slurred speech", "बोलने में दिक्कत"],
        "required_associated": [],
        "suggested_action": "Immediate neurological assessment and stroke code protocol activation.",
        "safety_wording": "Possible emergency indicators detected. Immediate triage assessment recommended."
    },
    {
        "rule_id": "RESP_001",
        "name": "Severe Respiratory Distress",
        "severity": "CRITICAL",
        "trigger_keywords": ["severe breathlessness", "सांस नहीं आ रही", "cyanosis", "नीला पड़ना", "unable to speak"],
        "required_associated": [],
        "suggested_action": "Immediate high-flow oxygen, SpO2 monitoring, and emergency doctor evaluation.",
        "safety_wording": "Possible emergency indicators detected. Immediate triage assessment recommended."
    },
    {
        "rule_id": "SEPSIS_001",
        "name": "Possible Sepsis Indicator",
        "severity": "HIGH",
        "trigger_keywords": ["high fever with confusion", "तेज बुखार और बेहोशी", "rigors", "कांपना"],
        "required_associated": [],
        "suggested_action": "Prompt urgent clinical vitals, blood cultures, and physician review.",
        "safety_wording": "Possible emergency indicators detected. Immediate triage assessment recommended."
    },
    {
        "rule_id": "BLEED_001",
        "name": "Acute Gastrointestinal or Uncontrolled Bleeding",
        "severity": "CRITICAL",
        "trigger_keywords": ["vomiting blood", "खून की उल्टी", "black stool", "काला मल", "heavy bleeding"],
        "required_associated": [],
        "suggested_action": "Immediate IV access, hemodynamic stabilization, and emergency triage priority.",
        "safety_wording": "Possible emergency indicators detected. Immediate triage assessment recommended."
    }
]

def evaluate_red_flags(chief_complaint: str, answers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    triggered_alerts = []
    text_corpus = (chief_complaint or "").lower()
    
    # Collect all answers text
    for ans in answers:
        raw = ans.get("raw_text", "")
        if isinstance(raw, str):
            text_corpus += " " + raw.lower()
        norm = ans.get("normalized_answer", {})
        if isinstance(norm, dict):
            for k, v in norm.items():
                text_corpus += f" {k} {v}".lower()

    for rule in RED_FLAG_RULES:
        is_triggered = False
        matched_keywords = []

        # Check main trigger keywords
        for kw in rule["trigger_keywords"]:
            if kw.lower() in text_corpus:
                is_triggered = True
                matched_keywords.append(kw)
                break

        # Check required associated symptoms if any
        if is_triggered and rule["required_associated"]:
            assoc_match = False
            for group in rule["required_associated"]:
                for kw in group:
                    if kw.lower() in text_corpus:
                        assoc_match = True
                        matched_keywords.append(kw)
                        break
            if not assoc_match:
                is_triggered = False

        if is_triggered:
            triggered_alerts.append({
                "rule_id": rule["rule_id"],
                "alert_type": rule["name"],
                "severity": rule["severity"],
                "triggered_symptoms": matched_keywords or ["Clinical risk pattern detected"],
                "suggested_action": rule["suggested_action"],
                "clinical_context": f"Rule {rule['rule_id']} triggered by matched indicators: {', '.join(matched_keywords)}"
            })

    return triggered_alerts
