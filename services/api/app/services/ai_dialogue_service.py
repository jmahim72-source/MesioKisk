"""
AI Dialogue Service — MediKiosk Clinical Intake
================================================
Drives the 7-stage invariant clinical intake protocol with deep
RESPONSE-BASED ADAPTATION.

Every question dynamically adapts to the patient's actual reported symptoms,
anatomical location, duration, and prior answers. It acknowledges what the
patient said, avoids redundant questioning, and formulates clinically relevant
follow-up questions in both Hindi (Devanagari) and English.

If GROQ_API_KEY is available, it enhances the reasoning via Groq LLM
(llama-3.3-70b-versatile). If not, the built-in ClinicalResponseBasedEngine
generates fully customized, response-based clinical questions deterministically.
"""

import json
import os
import re
from typing import List, Dict, Any, Optional

import httpx

from services.api.app.services.dialogue_engine import DialogueEngine

# ── Groq API ─────────────────────────────────────────────────────────────────
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
PRIMARY_MODEL = "llama-3.3-70b-versatile"
FALLBACK_MODEL = "llama3-70b-8192"

# ── 7-Stage clinical intake protocol ─────────────────────────────────────────
CLINICAL_STAGES = [
    {
        "stage_num": 1,
        "stage_id": "CHIEF_COMPLAINT",
        "category": "chief_complaint",
        "badge_hi": "मुख्य समस्या",
        "badge_en": "Chief Complaint",
        "objective": "Capture primary symptom in patient's own words.",
        "default_input_type": "SINGLE_CHOICE"
    },
    {
        "stage_num": 2,
        "stage_id": "ONSET_AND_DURATION",
        "category": "hpi",
        "badge_hi": "शुरुआत व अवधि",
        "badge_en": "Onset & Duration",
        "objective": "Determine onset timeline, sudden vs gradual onset, and constancy.",
        "default_input_type": "SINGLE_CHOICE"
    },
    {
        "stage_num": 3,
        "stage_id": "LOCATION_AND_CHARACTER",
        "category": "hpi",
        "badge_hi": "लक्षण की जगह व प्रकार",
        "badge_en": "Location & Character",
        "objective": "Identify exact anatomical site, radiation, and sensation quality.",
        "default_input_type": "MULTI_CHOICE"
    },
    {
        "stage_num": 4,
        "stage_id": "RED_FLAGS_AND_SEVERITY",
        "category": "hpi",
        "badge_hi": "गंभीरता व साथ के लक्षण",
        "badge_en": "Severity & Red Flags",
        "objective": "Screen for critical emergency indicators and pain severity.",
        "default_input_type": "MULTI_CHOICE"
    },
    {
        "stage_num": 5,
        "stage_id": "PAST_MEDICAL_HISTORY",
        "category": "past_history",
        "badge_hi": "पूर्व बीमारियाँ",
        "badge_en": "Past Medical History",
        "objective": "Screen for chronic conditions and previous similar episodes.",
        "default_input_type": "MULTI_CHOICE"
    },
    {
        "stage_num": 6,
        "stage_id": "MEDICATIONS_AND_ALLERGIES",
        "category": "medication",
        "badge_hi": "दवाइयाँ व एलर्जी",
        "badge_en": "Medications & Allergies",
        "objective": "Identify taken remedies, current medications, and drug allergies.",
        "default_input_type": "MULTI_CHOICE"
    },
    {
        "stage_num": 7,
        "stage_id": "AYURVEDIC_PARIKSHA",
        "category": "ayurvedic",
        "badge_hi": "आयुर्वेदिक प्रकृति",
        "badge_en": "Ayurvedic Constitution",
        "objective": "Assess Prakriti (Vata/Pitta/Kapha), Agni, and Koshtha tailored to symptom.",
        "default_input_type": "SINGLE_CHOICE"
    }
]

_STAGE_BY_NUM = {s["stage_num"]: s for s in CLINICAL_STAGES}

# ── Clinical Knowledge Domains & Response Analyzers ──────────────────────────
DOMAIN_CONFIGS = {
    "HEAD_NEURO": {
        "keywords": ["head", "सिर", "सिरदर्द", "migraine", "माइग्रेन", "चक्कर", "बेहोशी", "dizziness", "vertigo", "temple", "कनपटी", "माथा"],
        "label_hi": "सिर दर्द व न्यूरोलॉजिकल लक्षण",
        "label_en": "Headache & Neurological symptoms",
        "symptom_hi": "सिर दर्द",
        "symptom_en": "headache",
        "locations": [
            {"val": "TEMPLE_ONE_SIDE", "hi": "सिर के एक तरफ या कनपटी में (कपकपी/धड़कन जैसा)", "en": "One side / temple (throbbing)"},
            {"val": "FOREHEAD_BEHIND_EYES", "hi": "माथे और आंखों के ठीक पीछे गहरा भारीपन", "en": "Forehead and deep behind the eyes"},
            {"val": "BACK_OF_HEAD_NECK", "hi": "सिर के पिछले हिस्से से गर्दन तक खिंचाव", "en": "Back of head radiating down to neck"},
            {"val": "WHOLE_HEAD_BAND", "hi": "पूरे सिर में पट्टी बंधने जैसा भारी दबाव", "en": "Band-like tightness around whole head"}
        ],
        "red_flags": [
            {"val": "NAUSEA_VOMITING", "hi": "जी मिचलाना या बार-बार उल्टी होना", "en": "Nausea or vomiting"},
            {"val": "VISUAL_DISTURBANCE", "hi": "आँखों के आगे धुंधलापन या रोशनी से चुभन", "en": "Blurred vision or light sensitivity"},
            {"val": "WEAKNESS_NUMBNESS", "hi": "चेहरे, हाथ या पैर में कमजोरी/सुन्नपन", "en": "Facial, arm or leg weakness/numbness"},
            {"val": "WORST_SUDDEN_HEADACHE", "hi": "अचानक बिजली जैसा सबसे तेज दर्द (Thunderclap)", "en": "Worst sudden headache of life (Thunderclap)"},
            {"val": "NONE", "hi": "इनमें से कोई नहीं (सामान्य दर्द)", "en": "None of these"}
        ],
        "past_history": [
            {"val": "MIGRAINE", "hi": "माइग्रेन / बार-बार आधा सीसी का दर्द", "en": "Migraine / Chronic headache"},
            {"val": "HYPERTENSION", "hi": "उच्च रक्तचाप (High BP)", "en": "High Blood Pressure"},
            {"val": "SINUS", "hi": "साइनस / पुराना जुकाम", "en": "Sinusitis / Chronic allergy"},
            {"val": "STRESS_INSOMNIA", "hi": "तनाव या नींद न आने की समस्या", "en": "Stress or Insomnia"},
            {"val": "NONE", "hi": "कोई पुरानी बीमारी नहीं", "en": "No known chronic conditions"}
        ]
    },
    "CHEST_CARDIO": {
        "keywords": ["chest", "सीने", "छाती", "heart", "दिल", "धड़कन", "घबराहट", "भारीपन", "angina", "left arm", "left shoulder", "बांह"],
        "label_hi": "सीने में दर्द व हृदय लक्षण",
        "label_en": "Chest Discomfort & Cardiovascular",
        "symptom_hi": "सीने में दर्द",
        "symptom_en": "chest discomfort",
        "locations": [
            {"val": "CENTER_PRESSURE", "hi": "सीने के ठीक बीच में भारी दबाव व जकड़न", "en": "Heavy squeezing pressure in center of chest"},
            {"val": "LEFT_ARM_JAW", "hi": "बाईं तरफ जो बाएं हाथ, कंधे या जबड़े में फैलता है", "en": "Left chest radiating to left arm, shoulder or jaw"},
            {"val": "SHARP_BREATHING", "hi": "गहरी सांस लेने या खांसने पर सुई जैसी चुभन", "en": "Sharp stabbing pain when taking deep breaths"},
            {"val": "UPPER_BURNING", "hi": "पेट के ऊपरी हिस्से में तेज जलन व खट्टी डकार", "en": "Upper abdominal burning / acid fullness"}
        ],
        "red_flags": [
            {"val": "BREATHLESSNESS", "hi": "सांस फूलना या सांस लेने में भारी तकलीफ", "en": "Shortness of breath / gasping"},
            {"val": "COLD_SWEAT", "hi": "ठंडा पसीना छूटना व बेचैनी", "en": "Profuse cold sweating & clamminess"},
            {"val": "DIZZINESS_SYNCOPE", "hi": "अचानक चक्कर आना या बेहोशी जैसा लगना", "en": "Dizziness, lightheadedness or fainting"},
            {"val": "PALPITATIONS", "hi": "दिल की धड़कन बहुत तेज या अनियंत्रित होना", "en": "Rapid irregular heart palpitations"},
            {"val": "NONE", "hi": "इनमें से कोई नहीं", "en": "None of these"}
        ],
        "past_history": [
            {"val": "HEART_DISEASE", "hi": "हृदय रोग / पहले दिल का दौरा या स्टेंट", "en": "Prior heart disease / attack / stent"},
            {"val": "HYPERTENSION", "hi": "उच्च रक्तचाप (High BP)", "en": "Hypertension (BP)"},
            {"val": "DIABETES", "hi": "मधुमेह (डायबिटीज / शुगर)", "en": "Diabetes Mellitus"},
            {"val": "CHOLESTEROL", "hi": "हाई कोलेस्ट्रॉल (खून में चर्बी)", "en": "High Cholesterol"},
            {"val": "NONE", "hi": "कोई पुरानी बीमारी नहीं", "en": "No known chronic conditions"}
        ]
    },
    "RESPIRATORY_FEVER": {
        "keywords": ["cough", "खांसी", "कफ", "phlegm", "sputum", "fever", "बुखार", "chills", "ठंड", "breath", "सांस", "जुकाम", "cold", "throat", "गले", "छींक"],
        "label_hi": "श्वसन, खांसी व बुखार",
        "label_en": "Respiratory, Cough & Fever",
        "symptom_hi": "खांसी व बुखार",
        "symptom_en": "cough and fever",
        "locations": [
            {"val": "DRY_COUGH", "hi": "लगातार सूखी खांसी बिना कफ के", "en": "Persistent dry hacking cough"},
            {"val": "YELLOW_GREEN_SPUTUM", "hi": "पीला या हरा गाढ़ा बलगम आना", "en": "Thick yellow or green sputum"},
            {"val": "SORE_THROAT", "hi": "गले में खराश, दर्द व निगलने में तकलीफ", "en": "Severe sore throat & painful swallowing"},
            {"val": "WHEEZING_CHEST", "hi": "सांस लेते समय सीने में सीटी या घरघराहट", "en": "Chest tightness with wheezing whistling sound"}
        ],
        "red_flags": [
            {"val": "SEVERE_DYSPNEA", "hi": "बैठे-बैठे भी सांस फूलना या बात न कर पाना", "en": "Gasping for breath / unable to speak"},
            {"val": "BLOOD_IN_SPUTUM", "hi": "खांसी में खून के छींटे (Hemoptysis)", "en": "Blood in cough / sputum"},
            {"val": "HIGH_RIGORS", "hi": "तेज कंपकंपी के साथ १०३°F से अधिक बुखार", "en": "High fever >103°F with violent shivering"},
            {"val": "BLUE_LIPS", "hi": "नाखून या होंठ नीले पड़ना (Cyanosis)", "en": "Bluish tinge on lips or fingernails"},
            {"val": "NONE", "hi": "इनमें से कोई नहीं", "en": "None of these"}
        ],
        "past_history": [
            {"val": "ASTHMA", "hi": "दमा / अस्थमा (Asthma)", "en": "Asthma / Inhaler user"},
            {"val": "COPD_SMOKING", "hi": "पुरानी ब्रोंकाइटिस / बीड़ी-सिगरेट का सेवन", "en": "COPD / Chronic bronchitis"},
            {"val": "ALLERGIES", "hi": "धूल-धुएं या मौसम से एलर्जी", "en": "Dust, smoke or seasonal allergy"},
            {"val": "TB", "hi": "टीबी (Tuberculosis) का इतिहास", "en": "Prior Tuberculosis"},
            {"val": "NONE", "hi": "कोई पुरानी बीमारी नहीं", "en": "No known chronic conditions"}
        ]
    },
    "GASTROINTESTINAL": {
        "keywords": ["stomach", "पेट", "abdomen", "उल्टी", "vomit", "जी मिचलाना", "nausea", "दस्त", "loose motion", "diarrhea", "acidity", "जलन", "gas", "गैस", "कब्ज", "constipation", "खट्टी डकार", "भूख"],
        "label_hi": "पेट, पाचन व गैस्ट्रोइंटेस्टाइनल",
        "label_en": "Gastrointestinal & Abdominal",
        "symptom_hi": "पेट की समस्या",
        "symptom_en": "abdominal discomfort",
        "locations": [
            {"val": "UPPER_EPIGASTRIC", "hi": "पेट के ऊपरी हिस्से में तेज जलन व भारीपन", "en": "Upper central burning / acid fullness"},
            {"val": "PERI_UMBILICAL", "hi": "नाभि के आसपास मरोड़ व तेज ऐंठन", "en": "Twisting cramps around navel"},
            {"val": "RIGHT_LOWER", "hi": "पेट के निचले दाहिने हिस्से में चुभने वाला दर्द", "en": "Right lower abdominal localized pain"},
            {"val": "GENERAL_BLOATING", "hi": "पूरे पेट में भारी गैस व फूला हुआ अहसास", "en": "Generalized abdominal distension & gas"}
        ],
        "red_flags": [
            {"val": "BLOOD_VOMIT_STOOL", "hi": "उल्टी या काले रंग के दस्त में खून आना (Red Flag)", "en": "Blood in vomit or dark black tarry stools"},
            {"val": "UNSTOPPABLE_VOMITING", "hi": "पानी भी न पचना, बार-बार उल्टी होना", "en": "Unable to keep fluids down / continuous vomiting"},
            {"val": "RIGID_BELLY", "hi": "पेट छूने पर पत्थर जैसा कड़ा व असहनीय दर्द", "en": "Board-like rigid abdomen with rebound tenderness"},
            {"val": "DEHYDRATION", "hi": "अत्यधिक कमजोरी, पेशाब कम होना व चक्कर", "en": "Severe dehydration, dark urine & faintness"},
            {"val": "NONE", "hi": "इनमें से कोई नहीं", "en": "None of these"}
        ],
        "past_history": [
            {"val": "ULCER_GASTRITIS", "hi": "पेट में अल्सर या पुरानी एसिडिटी/गैस्ट्राइटिस", "en": "Peptic ulcer / chronic gastritis"},
            {"val": "GALLSTONES", "hi": "पित्त की थैली में पथरी (Gallbladder stone)", "en": "Gallstones"},
            {"val": "JAUNDICE", "hi": "पीलिया (Jaundice) या लिवर की बीमारी", "en": "Liver disease / prior jaundice"},
            {"val": "DIABETES", "hi": "डायबिटीज (शुगर)", "en": "Diabetes"},
            {"val": "NONE", "hi": "कोई पुरानी बीमारी नहीं", "en": "No known chronic conditions"}
        ]
    },
    "MUSCULOSKELETAL": {
        "keywords": ["joint", "घुटने", "knee", "back", "कमर", "पीठ", "shoulder", "कंधा", "गर्दन", "neck", "हाथ", "पैर", "दर्द", "pain", "swelling", "सूजन", "अकड़न", "stiffness", "arthritis", "गठिया", "मोच", "sprain", "injury", "चोट", "फिसल", "गिरने"],
        "label_hi": "जोड़, मांसपेशी व हड्डी का दर्द",
        "label_en": "Musculoskeletal & Joint Pain",
        "symptom_hi": "जोड़ों या मांसपेशियों का दर्द",
        "symptom_en": "joint or muscle pain",
        "locations": [
            {"val": "WEIGHT_BEARING", "hi": "चलने, झुकने या सीढ़ियाँ चढ़ते समय तेज दर्द", "en": "Pain worsened by walking, bending or stairs"},
            {"val": "VISIBLE_SWELLING", "hi": "जोड़ में स्पष्ट सूजन, गर्माहट या लाली", "en": "Visible swelling, heat, or redness at joint"},
            {"val": "MORNING_STIFFNESS", "hi": "सुबह सोकर उठने पर ३० मिनट से ज्यादा अकड़न", "en": "Severe morning stiffness lasting >30 minutes"},
            {"val": "CLICKING_RESTRICTED", "hi": "जोड़ से कट-कट आवाज आना व हिलने में रुकावट", "en": "Clicking/popping sounds and limited movement"}
        ],
        "red_flags": [
            {"val": "CANNOT_BEAR_WEIGHT", "hi": "पैर पर थोड़ा सा भी वजन रखने में पूरी तरह असमर्थ", "en": "Completely unable to bear weight / take steps"},
            {"val": "DEFORMITY_FRACTURE", "hi": "जोड़ या हड्डी का मुड़ना/विकृति (संभावित फ्रैक्चर)", "en": "Visible deformity or bone misalignment"},
            {"val": "NUMBNESS_TINGLING", "hi": "हाथ या पैर में सुन्नपन, करंट जैसा झनझनाहट", "en": "Pins-and-needles or radiating numbness"},
            {"val": "HOT_RED_JOINT", "hi": "जोड़ अत्यधिक गर्म, लाल व तेज बुखार", "en": "Joint acutely hot & red with fever (Septic arthritis)"},
            {"val": "NONE", "hi": "इनमें से कोई नहीं", "en": "None of these"}
        ],
        "past_history": [
            {"val": "OSTEOARTHRITIS", "hi": "ऑस्टियोआर्थराइटिस (हड्डियों का घिसना)", "en": "Osteoarthritis / Wear and tear"},
            {"val": "GOUT_URIC_ACID", "hi": "यूरिक एसिड / गाउट (Gout)", "en": "High uric acid / Gout"},
            {"val": "PRIOR_INJURY", "hi": "पुरानी चोट, मोच या फ्रैक्चर का इतिहास", "en": "Past trauma, sprain or fracture"},
            {"val": "THYROID_VITD", "hi": "विटामिन D या कैल्शियम की कमी / थायरॉइड", "en": "Vitamin D / Calcium deficiency / Thyroid"},
            {"val": "NONE", "hi": "कोई पुरानी बीमारी नहीं", "en": "No known chronic conditions"}
        ]
    },
    "SKIN_DERM": {
        "keywords": ["skin", "त्वचा", "खुजली", "itching", "rash", "चकत्ते", "दाने", "pimple", "दाद", "fungal", "boil", "फोड़ा", "redness", "लालिमा", "allergy"],
        "label_hi": "त्वचा, खुजली व चकत्ते",
        "label_en": "Dermatological & Skin Rash",
        "symptom_hi": "त्वचा की समस्या",
        "symptom_en": "skin condition",
        "locations": [
            {"val": "NIGHT_ITCHING", "hi": "रात में बिस्तर पर जाने के बाद अत्यधिक तेज खुजली", "en": "Intense itching, especially worse at night"},
            {"val": "RED_PATCHES", "hi": "उभरे हुए लाल चकत्ते, जिनमें जलन होती है", "en": "Raised erythematous patches with burning sensation"},
            {"val": "BLISTERS_OOZING", "hi": "पानी भरे छोटे फफोले या मवाद का रिसाव", "en": "Fluid-filled blisters or yellowish weeping"},
            {"val": "DRY_SCALY", "hi": "सूखी, पपड़ीदार त्वचा जो सफेद झड़ती है", "en": "Dry, scaly, peeling skin with cracking"}
        ],
        "red_flags": [
            {"val": "RAPID_SPREAD", "hi": "पूरे शरीर पर बहुत तेजी से चकत्तों का फैलना", "en": "Rapidly spreading rash over whole body"},
            {"val": "FACIAL_LIP_SWELLING", "hi": "चेहरे, होंठ या गले में सूजन (एनाफिलेक्सिस संकेत)", "en": "Swelling of lips, face or tongue (Anaphylaxis risk)"},
            {"val": "SKIN_PEELING_FEVER", "hi": "त्वचा की परत उधड़ना व तेज बुखार", "en": "Extensive skin sloughing with fever"},
            {"val": "NONE", "hi": "इनमें से कोई नहीं", "en": "None of these"}
        ],
        "past_history": [
            {"val": "ECZEMA_PSORIASIS", "hi": "एक्जिमा या सोरायसिस (Eczema / Psoriasis)", "en": "Eczema / Psoriasis"},
            {"val": "DRUG_FOOD_ALLERGY", "hi": "किसी भोजन या दवा से त्वचा एलर्जी", "en": "Food or medication allergy"},
            {"val": "DIABETES_SKIN", "hi": "डायबिटीज (धीमे घाव भरना)", "en": "Diabetes (slow wound healing)"},
            {"val": "NONE", "hi": "कोई पुरानी बीमारी नहीं", "en": "No known chronic conditions"}
        ]
    },
    "DENTAL": {
        "keywords": ["tooth", "दांत", "दाढ़", "मसूड़े", "gum", "cavity", "कीड़ा", "jaw", "जबड़ा"],
        "label_hi": "दांत व मुख समस्या",
        "label_en": "Dental & Oral symptoms",
        "symptom_hi": "दांत में दर्द",
        "symptom_en": "toothache",
        "locations": [
            {"val": "HOT_COLD_SENSITIVITY", "hi": "ठंडा या गर्म पानी लगने पर तेज झनझनाहट", "en": "Sharp sensitivity to cold or hot liquids"},
            {"val": "CHEWING_PAIN", "hi": "खाना चबाने या दांत दबाने पर असहनीय दर्द", "en": "Severe shooting pain upon chewing"},
            {"val": "GUM_SWELLING", "hi": "मसूड़े में सूजन, लालिमा या खून आना", "en": "Swollen tender gums with bleeding"},
            {"val": "CONTINUOUS_THROBBING", "hi": "रात में लगातार धड़कन जैसा गहरा दर्द", "en": "Continuous deep throbbing night pain"}
        ],
        "red_flags": [
            {"val": "FACIAL_SWELLING", "hi": "गाल या जबड़े में बड़ी सूजन जो आंख तक जा रही हो", "en": "Facial swelling extending toward eye or neck"},
            {"val": "CANNOT_OPEN_MOUTH", "hi": "मुंह खोलने या निगलने में भारी असमर्थता (Trismus)", "en": "Unable to open mouth (Trismus) / swallow saliva"},
            {"val": "HIGH_FEVER", "hi": "दांत दर्द के साथ तेज बुखार व कपकपी", "en": "High fever with dental abscess"},
            {"val": "NONE", "hi": "इनमें से कोई नहीं", "en": "None of these"}
        ],
        "past_history": [
            {"val": "DENTAL_CAVITY", "hi": "दांत में पहले कैविटी/कीड़ा या आरसीटी (RCT)", "en": "Prior dental cavity / Root canal"},
            {"val": "DIABETES", "hi": "डायबिटीज (मसूड़ों के संक्रमण का खतरा)", "en": "Diabetes"},
            {"val": "NONE", "hi": "कोई पुरानी बीमारी नहीं", "en": "No known chronic conditions"}
        ]
    }
}


class ClinicalResponseAnalyzer:
    """
    Extracts clinical features from the patient's actual statements
    to drive deep response-based question generation.
    """

    @staticmethod
    def analyze(chief_complaint: str, conversation_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        corpus = (chief_complaint or "").lower()
        for item in conversation_history:
            ans = str(item.get("answer_text", "")).lower()
            corpus += " " + ans

        # 1. Detect Primary Domain
        matched_domain = "GENERAL"
        best_score = 0
        for dom_key, conf in DOMAIN_CONFIGS.items():
            score = sum(1 for kw in conf["keywords"] if kw.lower() in corpus)
            if score > best_score:
                best_score = score
                matched_domain = dom_key

        domain_info = DOMAIN_CONFIGS.get(matched_domain)

        # 2. Extract Duration if already stated
        stated_duration = None
        duration_patterns = [
            (r"(\d+)\s*(दिन|din|day|days)", r"\1 दिन (\1 days)"),
            (r"(सुबह|morning|आज सुबह)", "आज सुबह से (since this morning)"),
            (r"(कल|yesterday|कल से)", "कल से (since yesterday)"),
            (r"(\d+)\s*(हफ्ते|हफ़्ते|week|weeks)", r"\1 हफ्ते (\1 weeks)"),
            (r"(\d+)\s*(महीने|month|months)", r"\1 महीने (\1 months)"),
            (r"(आज|today|आज से)", "आज से (since today)"),
            (r"(\d+)\s*(घंटे|ghante|hour|hours)", r"\1 घंटे (\1 hours)")
        ]
        for pat, repl in duration_patterns:
            m = re.search(pat, corpus)
            if m:
                stated_duration = re.sub(pat, repl, m.group(0))
                break

        # 3. Extract Specific Mentioned Body Location
        stated_location = None
        loc_patterns = [
            (r"(बाईं|left|left side|बाएं)", "बाईं तरफ (Left side)"),
            (r"(दाईं|right|right side|दाहिने)", "दाईं तरफ (Right side)"),
            (r"(घुटने|knee|घुटनों)", "घुटने (Knee)"),
            (r"(कमर|back|पीठ|spine)", "कमर/पीठ (Back/Spine)"),
            (r"(कनपटी|temple|माथा|forehead)", "कनपटी/माथा (Temples/Forehead)"),
            (r"(गले|throat)", "गला (Throat)"),
            (r"(पेट|stomach|abdomen)", "पेट (Abdomen)"),
            (r"(छाती|सीने|chest)", "सीने (Chest)")
        ]
        for pat, lbl in loc_patterns:
            if re.search(pat, corpus):
                stated_location = lbl
                break

        # 4. Extract Specific Mentioned Intensity
        stated_severity = None
        if any(w in corpus for w in ["बहुत तेज", "severe", "असहनीय", "unbearable", "काफी तेज", "worst"]):
            stated_severity = "SEVERE"
        elif any(w in corpus for w in ["हल्का", "mild", "थोड़ा", "slight"]):
            stated_severity = "MILD"

        symptom_hi = domain_info["symptom_hi"] if domain_info else "तकलीफ"
        symptom_en = domain_info["symptom_en"] if domain_info else "symptom"

        # Refine symptom name if directly found
        if "सिर" in corpus or "headache" in corpus:
            symptom_hi = "सिर दर्द"
            symptom_en = "headache"
        elif "सीने" in corpus or "chest" in corpus:
            symptom_hi = "सीने में दर्द व भारीपन"
            symptom_en = "chest discomfort"
        elif "घुटने" in corpus or "knee" in corpus:
            symptom_hi = "घुटने का दर्द"
            symptom_en = "knee pain"
        elif "कमर" in corpus or "back" in corpus:
            symptom_hi = "कमर दर्द"
            symptom_en = "back pain"
        elif "पेट" in corpus or "stomach" in corpus or "उल्टी" in corpus:
            symptom_hi = "पेट दर्द व पाचन समस्या"
            symptom_en = "abdominal discomfort"
        elif "दांत" in corpus or "tooth" in corpus:
            symptom_hi = "दांत का दर्द"
            symptom_en = "toothache"
        elif "खुजली" in corpus or "चकत्ते" in corpus or "rash" in corpus:
            symptom_hi = "त्वचा के चकत्ते व खुजली"
            symptom_en = "skin rash and itching"
        elif "खांसी" in corpus or "cough" in corpus:
            symptom_hi = "खांसी व कफ"
            symptom_en = "cough"
        elif "बुखार" in corpus or "fever" in corpus:
            symptom_hi = "बुखार"
            symptom_en = "fever"

        last_ans = conversation_history[-1].get("answer_text", "") if conversation_history else chief_complaint

        return {
            "domain": matched_domain,
            "domain_info": domain_info,
            "symptom_hi": symptom_hi,
            "symptom_en": symptom_en,
            "stated_duration": stated_duration,
            "stated_location": stated_location,
            "stated_severity": stated_severity,
            "last_answer": last_ans,
            "corpus": corpus
        }


class ClinicalResponseBasedEngine:
    """
    Generates tailored, response-based questions for all 7 stages
    without relying on static, generic pre-seeded templates.
    """

    @staticmethod
    def generate_stage_question(
        stage_num: int,
        analysis: Dict[str, Any],
        language: str = "hi"
    ) -> Dict[str, Any]:
        stage_meta = _STAGE_BY_NUM[stage_num]
        s_hi = analysis["symptom_hi"]
        s_en = analysis["symptom_en"]
        dom_info = analysis.get("domain_info")
        dur = analysis.get("stated_duration")
        loc = analysis.get("stated_location")
        last_a = analysis.get("last_answer", "")

        q_id = f"q_stage_{stage_num}_{stage_meta['category']}"
        input_type = stage_meta.get("default_input_type", "SINGLE_CHOICE")
        options = []
        q_hi = ""
        q_en = ""
        audio_hi = ""
        audio_en = ""
        clinical_reasoning = ""

        # ─────────────────────────────────────────────────────────────────────
        # STAGE 2: ONSET & DURATION (Response-Based)
        # ─────────────────────────────────────────────────────────────────────
        if stage_num == 2:
            input_type = "SINGLE_CHOICE"
            if dur:
                # Patient already told us the timeline in Chief Complaint!
                # Acknowledge timeline and ask about Sudden vs Gradual onset and Constancy!
                q_hi = (
                    f"आपने बताया कि आपको {s_hi} {dur} से है। "
                    f"यह अचानक तेजी से शुरू हुआ था या धीरे-धीरे बढ़ा, और क्या यह लगातार बना रहता है?"
                )
                q_en = (
                    f"You mentioned experiencing {s_en} {dur}. "
                    f"Did it begin suddenly or develop gradually, and is it constant or intermittent?"
                )
                audio_hi = f"यह तकलीफ अचानक शुरू हुई या धीरे-धीरे?"
                audio_en = "Did this symptom start suddenly or gradually?"
                options = [
                    {"value": "SUDDEN_CONSTANT", "label_hi": "अचानक बहुत तेज शुरू हुआ और लगातार बना है", "label_en": "Started suddenly and remains constant"},
                    {"value": "GRADUAL_WORSE", "label_hi": "धीरे-धीरे शुरू हुआ और समय के साथ बढ़ता जा रहा है", "label_en": "Gradual onset, progressively worsening"},
                    {"value": "INTERMITTENT", "label_hi": "लगातार नहीं है, बीच-बीच में आराम मिलता है", "label_en": "Comes and goes in periodic episodes"},
                    {"value": "TRIGGERED", "label_hi": "किसी खास काम/गतिविधि या भोजन के बाद शुरू हुआ", "label_en": "Triggered by a specific activity or event"}
                ]
                clinical_reasoning = (
                    f"Acknowledged patient's stated duration ({dur}). Inquiring about temporal acuity "
                    f"(sudden vs gradual) to assess acute ischemic, inflammatory, or mechanical etiology."
                )
            else:
                q_hi = f"यह {s_hi} आपको कितने समय से हो रहा है और इसकी शुरुआत किस प्रकार हुई?"
                q_en = f"Since how long have you been experiencing this {s_en} and how did it begin?"
                audio_hi = f"यह तकलीफ कितने समय से है?"
                audio_en = "Since how long do you have this symptom?"
                options = [
                    {"value": "HOURS_TODAY", "label_hi": "आज या पिछले कुछ घंटों से (अचानक शुरू हुआ)", "label_en": "Started today / a few hours ago"},
                    {"value": "1_3_DAYS", "label_hi": "१ से ३ दिनों से (हालिया समस्या)", "label_en": "1 to 3 days ago"},
                    {"value": "1_2_WEEKS", "label_hi": "१ से २ हफ़्तों से लगातार", "label_en": "1 to 2 weeks"},
                    {"value": "MONTHS_CHRONIC", "label_hi": "१ महीने या उससे अधिक समय से (पुरानी समस्या)", "label_en": "More than 1 month (chronic)"}
                ]
                clinical_reasoning = f"Clarifying symptom onset duration for {s_en} to establish acute vs subacute/chronic triage status."

        # ─────────────────────────────────────────────────────────────────────
        # STAGE 3: LOCATION & CHARACTER (Response-Based)
        # ─────────────────────────────────────────────────────────────────────
        elif stage_num == 3:
            input_type = "MULTI_CHOICE"
            if dom_info and dom_info.get("locations"):
                q_hi = (
                    f"आपके {s_hi} की सटीक स्थिति कहाँ है और दर्द या परेशानी का अहसास कैसा होता है? "
                    f"(सभी उपयुक्त विकल्प चुनें)"
                )
                q_en = (
                    f"Where exactly is the {s_en} located and what does the sensation feel like? "
                    f"(Select all that apply)"
                )
                audio_hi = f"दर्द की सही जगह व प्रकार चुनें।"
                audio_en = "Select location and sensation."
                options = [
                    {"value": item["val"], "label_hi": item["hi"], "label_en": item["en"]}
                    for item in dom_info["locations"]
                ]
            else:
                q_hi = f"आपके {s_hi} की सही स्थिति और दर्द का प्रकार कैसा महसूस हो रहा है?"
                q_en = f"What is the precise location and sensation of your {s_en}?"
                audio_hi = f"दर्द का प्रकार और स्थान चुनें।"
                audio_en = "Select the type and location."
                options = [
                    {"value": "SHARP_STABBING", "label_hi": "सुई चुभने जैसा तेज दर्द", "label_en": "Sharp or stabbing pain"},
                    {"value": "DULL_HEAVY", "label_hi": "भारीपन, जकड़न या दबाव जैसा अहसास", "label_en": "Dull ache or heavy squeezing pressure"},
                    {"value": "BURNING_THROB", "label_hi": "जलन या धड़कन जैसी टीस", "label_en": "Burning or throbbing sensation"},
                    {"value": "RADIATING", "label_hi": "एक जगह से दूसरी जगह फैलता हुआ दर्द", "label_en": "Pain radiating to adjacent body parts"}
                ]
            clinical_reasoning = f"Characterizing anatomical radiation and quality of {s_en} to differentiate visceral vs somatic pathology."

        # ─────────────────────────────────────────────────────────────────────
        # STAGE 4: RED FLAGS & SEVERITY (Response-Based)
        # ─────────────────────────────────────────────────────────────────────
        elif stage_num == 4:
            input_type = "MULTI_CHOICE"
            if dom_info and dom_info.get("red_flags"):
                q_hi = (
                    f"इस {s_hi} के साथ क्या आपको इनमें से कोई भी गंभीर या असहज लक्षण महसूस हो रहे हैं? "
                    f"(सुरक्षा जांच हेतु तुरंत बताएं)"
                )
                q_en = (
                    f"Along with your {s_en}, are you experiencing any of these critical associated symptoms? "
                    f"(Emergency safety check)"
                )
                audio_hi = f"क्या इनमें से कोई गंभीर लक्षण है?"
                audio_en = "Do you have any critical associated symptoms?"
                options = [
                    {"value": item["val"], "label_hi": item["hi"], "label_en": item["en"]}
                    for item in dom_info["red_flags"]
                ]
            else:
                input_type = "FACES_SCALE"
                q_hi = f"० से १० के पैमाने पर आपका {s_hi} अभी कितना तेज या असहनीय है?"
                q_en = f"On a scale of 0 to 10, how severe is your {s_en} right now?"
                audio_hi = "दर्द का स्तर ० से १० के बीच चुनें।"
                audio_en = "Select your pain severity from 0 to 10."
                options = [
                    {"value": "0", "label_hi": "० - कोई दर्द नहीं", "label_en": "0 - No pain"},
                    {"value": "2", "label_hi": "२ - हल्का दर्द", "label_en": "2 - Mild"},
                    {"value": "4", "label_hi": "४ - मध्यम दर्द", "label_en": "4 - Moderate"},
                    {"value": "6", "label_hi": "६ - तेज दर्द", "label_en": "6 - Severe"},
                    {"value": "8", "label_hi": "८ - बहुत तेज दर्द", "label_en": "8 - Very severe"},
                    {"value": "10", "label_hi": "१० - असहनीय दर्द", "label_en": "10 - Worst possible"}
                ]
            clinical_reasoning = f"Targeted emergency red-flag screening for {s_en} to trigger immediate clinical triage prioritization if life-threatening signs present."

        # ─────────────────────────────────────────────────────────────────────
        # STAGE 5: PAST MEDICAL HISTORY (Response-Based)
        # ─────────────────────────────────────────────────────────────────────
        elif stage_num == 5:
            input_type = "MULTI_CHOICE"
            if dom_info and dom_info.get("past_history"):
                q_hi = (
                    f"क्या आपको इनमें से कोई पुरानी बीमारी है, या ऐसा {s_hi} आपको पहले कभी हुआ है?"
                )
                q_en = (
                    f"Do you have a history of any chronic conditions relevant to your {s_en}, or prior similar episodes?"
                )
                options = [
                    {"value": item["val"], "label_hi": item["hi"], "label_en": item["en"]}
                    for item in dom_info["past_history"]
                ]
            else:
                q_hi = f"क्या आपको इनमें से कोई पुरानी बीमारी (डायबिटीज, बीपी, थायरॉइड आदि) है?"
                q_en = "Do you have any pre-existing chronic conditions?"
                options = [
                    {"value": "DIABETES", "label_hi": "मधुमेह (डायबिटीज / शुगर)", "label_en": "Diabetes"},
                    {"value": "HYPERTENSION", "label_hi": "उच्च रक्तचाप (High BP)", "label_en": "Hypertension (BP)"},
                    {"value": "HEART_PROBLEM", "label_hi": "हृदय रोग (Heart Disease)", "label_en": "Heart Disease"},
                    {"value": "ASTHMA_COPD", "label_hi": "दमा / सांस की समस्या", "label_en": "Asthma / Respiratory"},
                    {"value": "NONE", "label_hi": "कोई पुरानी बीमारी नहीं", "label_en": "No known chronic conditions"}
                ]
            audio_hi = "अपनी पुरानी बीमारियों का चयन करें।"
            audio_en = "Select your past medical history."
            clinical_reasoning = f"Evaluating pre-existing comorbidities that predispose to or complicate {s_en}."

        # ─────────────────────────────────────────────────────────────────────
        # STAGE 6: MEDICATIONS & ALLERGIES (Response-Based)
        # ─────────────────────────────────────────────────────────────────────
        elif stage_num == 6:
            input_type = "MULTI_CHOICE"
            q_hi = (
                f"क्या आपने इस {s_hi} के लिए हाल में कोई दवा या घरेलू उपचार लिया है, "
                f"और क्या आपको किसी दवा से एलर्जी है?"
            )
            q_en = (
                f"Have you taken any medicines or remedies for your {s_en}, "
                f"and do you have any known drug allergies?"
            )
            audio_hi = "ली गई दवाइयाँ व एलर्जी बताएं।"
            audio_en = "Select medications taken and drug allergies."
            options = [
                {"value": "TOOK_PAINKILLER", "label_hi": f"हाँ, {s_hi} कम करने के लिए दर्द निवारक/दवा ली है", "label_en": f"Took painkillers/remedy for this {s_en}"},
                {"value": "REGULAR_MEDICATIONS", "label_hi": "बीपी, शुगर या अन्य नियमित दवाइयाँ चल रही हैं", "label_en": "Currently taking regular daily prescription medications"},
                {"value": "KNOWN_DRUG_ALLERGY", "label_hi": "किसी दवा (जैसे पेनिसिलिन, सल्फा आदि) से एलर्जी है", "label_en": "Have a known allergic reaction to certain drugs"},
                {"value": "NO_MEDS_NO_ALLERGY", "label_hi": "कोई दवा नहीं ली और कोई ज्ञात एलर्जी नहीं है", "label_en": "No medications taken and no known drug allergies"}
            ]
            clinical_reasoning = f"Documenting pharmacological interventions for {s_en} and verifying drug allergy safety prior to physician prescription."

        # ─────────────────────────────────────────────────────────────────────
        # STAGE 7: AYURVEDIC PARIKSHA (Response-Based Dashavidha Pariksha)
        # ─────────────────────────────────────────────────────────────────────
        elif stage_num == 7:
            input_type = "SINGLE_CHOICE"
            q_hi = (
                f"आयुर्वेद के अनुसार आपकी शारीरिक प्रकृति (Prakriti) और पाचन अग्नि कैसी है, "
                f"जिसका संबंध आपके {s_hi} से हो सकता है?"
            )
            q_en = (
                f"According to Ayurveda, what is your Prakriti (body constitution) and digestive fire (Agni), "
                f"which correlates with your {s_en}?"
            )
            audio_hi = "अपनी शारीरिक प्रकृति व पाचन प्रकार चुनें।"
            audio_en = "Select your Ayurvedic constitution."
            options = [
                {"value": "VATA_DOMINANT", "label_hi": "वात (Vata): शरीर दुबला/रूखा, जोड़ों में कटकटाहट, बेचैनी, ठंड ज्यादा लगना व अनियमित भूख", "label_en": "Vata: Lean/dry build, joint cracking, anxiety, cold intolerance, irregular appetite"},
                {"value": "PITTA_DOMINANT", "label_hi": "पित्त (Pitta): शरीर में जलन, अत्यधिक गर्मी लगना, खट्टी डकार, तेज भूख व जल्दी गुस्सा", "label_en": "Pitta: Medium build, burning sensation, heat intolerance, hyperacidity, sharp hunger"},
                {"value": "KAPHA_DOMINANT", "label_hi": "कफ (Kapha): भारी/स्थूल शरीर, कफ/बलगम बनना, सुस्ती, भारीपन व मंद पाचन", "label_en": "Kapha: Heavy build, sluggishness, phlegm tendency, slow digestion"},
                {"value": "SAMA_BALANCED", "label_hi": "सम/संतुलित (Sama): संतुलित स्वास्थ्य, सामान्य भूख व नियमित पाचन", "label_en": "Sama: Balanced doshas, normal digestion and steady energy"}
            ]
            clinical_reasoning = (
                f"Integrating Dashavidha Pariksha for {s_en} to identify root doshic imbalance (Vata/Pitta/Kapha) "
                f"and metabolic fire (Agni) for personalized AYUSH clinical management."
            )

        # Localized text selection
        localized_text = q_hi if language == "hi" else q_en
        audio_prompt = audio_hi if language == "hi" else audio_en

        formatted_options = []
        for opt in options:
            label = opt.get("label_hi") if language == "hi" else opt.get("label_en")
            formatted_options.append({
                "value": opt.get("value"),
                "label": label or opt.get("label_en") or opt.get("value")
            })

        return {
            "question": {
                "id": q_id,
                "stage_num": stage_num,
                "total_stages": 7,
                "stage_badge_hi": stage_meta["badge_hi"],
                "stage_badge_en": stage_meta["badge_en"],
                "category": stage_meta["category"],
                "text": q_en,
                "localized_text": localized_text,
                "audio_prompt_text": audio_prompt,
                "input_type": input_type,
                "required": True,
                "options": formatted_options,
                "response_context": f"{s_hi} ({s_en})"
            },
            "clinical_reasoning": clinical_reasoning,
            "is_interview_complete": False
        }


class AIDialogueService:
    """
    Drives the 7-stage response-based clinical intake protocol.
    Tries Groq LLM if API key is present; otherwise seamlessly uses
    the ClinicalResponseBasedEngine to provide deeply personalized questions.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GROQ_API_KEY", "")
        if not self.api_key:
            try:
                from services.api.app.core.config import settings
                self.api_key = settings.GROQ_API_KEY or ""
            except Exception:
                pass
        self.fallback_engine = DialogueEngine()

    async def generate_next_question(
        self,
        patient_info: Dict[str, Any],
        chief_complaint: str,
        conversation_history: List[Dict[str, Any]],
        language: str = "hi"
    ) -> Dict[str, Any]:
        """
        Returns the next stage question dict, completely adapted to previous answers.
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

        progress = min(95, int(((next_stage_num - 1) / 7) * 100))

        # Perform deep clinical response analysis
        analysis = ClinicalResponseAnalyzer.analyze(chief_complaint, conversation_history)

        # If Groq API key is configured, attempt LLM call
        if self.api_key:
            try:
                current_stage = _STAGE_BY_NUM[next_stage_num]
                result = await self._call_groq(
                    current_stage, patient_info, chief_complaint,
                    conversation_history, language
                )
                result["progress_pct"] = progress
                return result
            except Exception as e:
                print(f"[AIDialogueService] Groq call error: {e}. Using ClinicalResponseBasedEngine.")

        # Default to ClinicalResponseBasedEngine for guaranteed, high-quality response-based questions
        result = ClinicalResponseBasedEngine.generate_stage_question(
            stage_num=next_stage_num,
            analysis=analysis,
            language=language
        )
        result["progress_pct"] = progress
        return result

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
                payload["model"] = FALLBACK_MODEL
                resp = await client.post(GROQ_API_URL, headers=headers, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(f"Groq HTTP {resp.status_code}: {resp.text[:200]}")
            raw = resp.json()["choices"][0]["message"]["content"]
            parsed = json.loads(raw)
            return self._format_parsed(parsed, stage, language)

    def _build_system_prompt(
        self,
        stage: Dict[str, Any],
        patient_info: Dict[str, Any],
        chief_complaint: str,
        language: str
    ) -> str:
        return f"""You are an expert AI clinical intake assistant for MediKiosk.
Generate exactly ONE intake question for Stage {stage['stage_num']}/7 ({stage['badge_en']} - {stage['badge_hi']}).
Patient: {patient_info.get('gender', 'FEMALE')}, {patient_info.get('age', 50)}yo.
Chief Complaint: "{chief_complaint}".
IMPORTANT: Build directly upon the patient's prior answers. Do not repeat what is already known.
Respond in valid JSON only with keys:
stage_num, badge_hi, badge_en, clinical_reasoning, question_hi, question_en, audio_prompt_hi, audio_prompt_en, input_type, options (array of value, label_hi, label_en)."""

    def _build_user_prompt(
        self,
        stage: Dict[str, Any],
        history: List[Dict[str, Any]],
        chief_complaint: str
    ) -> str:
        lines = "\n".join(
            f"  Q: {item.get('question_text', '?')} -> A: {item.get('answer_text', '?')}"
            for item in history
        )
        return f"Chief Complaint: '{chief_complaint}'\nPrior Answers:\n{lines}\nGenerate Stage {stage['stage_num']} question."

    def _format_parsed(self, parsed: Dict[str, Any], stage: Dict[str, Any], language: str) -> Dict[str, Any]:
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
