from typing import List, Dict, Any, Optional

RED_FLAG_RULES = [
    {
        "rule_id": "CARDIAC_001",
        "name": "Acute Coronary Syndrome / Cardiac Emergency",
        "severity": "CRITICAL",
        "trigger_keywords": [
            "chest pain", "सीने में दर्द", "chest pressure", "छाती में दर्द", "heavy chest",
            "heart pain", "दिल में दर्द", "chest discomfort", "chest tightness", "सीने में दबाव",
            "cardiac", "heart attack", "दिल का दौरा", "angina", "left arm pain", "सीने में भारीपन",
            "left shoulder pain", "बाएं हाथ में दर्द"
        ],
        "required_associated": [],
        "suggested_action": "Immediate 12-lead ECG, troponin, continuous vitals, and urgent cardiologist review.",
        "suggested_action_hi": "तत्काल 12-लीड ईसीजी (ECG), आपातकालीन कार्डियोलॉजी व ट्राइएज डेस्क को सूचित करें।",
        "safety_wording": "Possible emergency cardiac indicators detected. Immediate triage assessment required."
    },
    {
        "rule_id": "RESP_001",
        "name": "Severe Respiratory Distress / Airway Compromise",
        "severity": "CRITICAL",
        "trigger_keywords": [
            "severe breathlessness", "breathlessness", "shortness of breath", "difficulty breathing",
            "सांस फूलना", "सांस लेने में दिक्कत", "सांस नहीं आ रही", "दम घुटना", "cyanosis", "नीला पड़ना",
            "unable to speak", "asthma attack", "wheezing", "घरघराहट", "suffocation", "stridor"
        ],
        "required_associated": [],
        "suggested_action": "Immediate high-flow oxygen, SpO2 monitoring, nebulization, and emergency physician evaluation.",
        "suggested_action_hi": "तत्काल ऑक्सीजन सहायता, SpO2 मॉनिटरिंग और आपातकालीन डॉक्टर द्वारा जांच।",
        "safety_wording": "Severe respiratory distress detected. Immediate airway and oxygen triage required."
    },
    {
        "rule_id": "STROKE_001",
        "name": "Acute Stroke / Neurological Deficit",
        "severity": "CRITICAL",
        "trigger_keywords": [
            "slurred speech", "facial droop", "sudden weakness", "paralysis", "लकवा", "कमजोरी",
            "एक तरफ कमजोरी", "बोलने में दिक्कत", "बोलने में लड़खड़ाहट", "loss of consciousness",
            "fainting", "behoshi", "बेहोशी", "seizure", "दौरा", "syncope", "hemiparesis"
        ],
        "required_associated": [],
        "suggested_action": "Immediate neurological assessment, non-contrast head CT, and stroke code protocol activation.",
        "suggested_action_hi": "तत्काल न्यूरोलॉजिकल जांच, सीटी स्कैन और स्ट्रोक कोड प्रोटोकॉल सक्रिय करें।",
        "safety_wording": "Acute neurological indicators detected. Immediate stroke triage required."
    },
    {
        "rule_id": "SEVERE_PAIN_001",
        "name": "Severe / Excruciating Pain Crisis",
        "severity": "HIGH",
        "trigger_keywords": [
            "10/10", "worst pain", "असहनीय दर्द", "बहुत तेज दर्द", "extreme pain", "excruciating",
            "unbearable pain", "severe acute pain"
        ],
        "required_associated": [],
        "suggested_action": "Prompt clinical pain assessment, targeted analgesia, and urgent doctor review.",
        "suggested_action_hi": "शीघ्र दर्द मूल्यांकन, एनाल्जेसिया और डॉक्टर द्वारा तत्काल परामर्श।",
        "safety_wording": "Severe pain crisis detected. Priority triage required."
    },
    {
        "rule_id": "BLEED_001",
        "name": "Acute Hemorrhage / Uncontrolled Bleeding",
        "severity": "CRITICAL",
        "trigger_keywords": [
            "vomiting blood", "खून की उल्टी", "black stool", "काला मल", "heavy bleeding",
            "खून बहना", "hemoptysis", "coughing blood"
        ],
        "required_associated": [],
        "suggested_action": "Immediate large-bore IV access, hemodynamic stabilization, blood typing, and emergency doctor consult.",
        "suggested_action_hi": "तत्काल आईवी ड्रिप, रक्तचाप नियंत्रण और आपातकालीन विशेषज्ञ को सूचित करें।",
        "safety_wording": "Active bleeding detected. Immediate hemodynamic stabilization required."
    },
    {
        "rule_id": "SEPSIS_001",
        "name": "Systemic Sepsis / High-Grade Toxic Febrile State",
        "severity": "HIGH",
        "trigger_keywords": [
            "high fever with confusion", "तेज बुखार और बेहोशी", "rigors", "कांपना", "very high fever",
            "104 fever", "103 fever", "altered mental state"
        ],
        "required_associated": [],
        "suggested_action": "STAT vitals, lactate, blood cultures, empiric antibiotics, and rapid physician review.",
        "suggested_action_hi": "तुरंत रक्त जांच, तापमान नियंत्रण और चिकित्सक द्वारा प्राथमिकता से परामर्श।",
        "safety_wording": "Systemic infection indicators detected. Urgent sepsis screening advised."
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
            if raw.strip() in ["8", "9", "10", "8/10", "9/10", "10/10"]:
                text_corpus += " 10/10 worst pain severe acute pain"
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
                "suggested_action_hi": rule.get("suggested_action_hi", "प्राथमिकता के आधार पर तुरंत डॉक्टर व ट्राइएज नर्सिंग स्टाफ को सूचित किया गया है।"),
                "clinical_context": f"Rule {rule['rule_id']} triggered by matched indicators: {', '.join(matched_keywords)}"
            })

    return triggered_alerts
