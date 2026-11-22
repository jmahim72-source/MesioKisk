const API_BASE_URL = 'http://localhost:8000/api/v1';

// Full Client-side Question Bank for Resilient Offline / Fallback Operation
const OFFLINE_QUESTIONS: any[] = [
  {
    id: "q_chief_complaint_001",
    category: "chief_complaint",
    domain: "ALL",
    text: "What problem brings you to the hospital today?",
    localized_text: {
      en: "What problem brings you to the hospital today?",
      hi: "आज आपको अस्पताल किस समस्या के लिए आना पड़ा है?"
    },
    audio_prompt_text: {
      en: "Please describe your main health problem or reason for visit.",
      hi: "कृपया अपनी मुख्य तकलीफ या आने का कारण बताएं।"
    },
    input_type: "VOICE_OR_TEXT",
    required: true
  },
  {
    id: "q_symptom_duration_001",
    category: "hpi",
    domain: "ALL",
    text: "Since how many days or weeks have you been having this problem?",
    localized_text: {
      en: "Since how long have you been experiencing this issue?",
      hi: "यह तकलीफ आपको कितने दिनों या हफ़्तों से हो रही है?"
    },
    audio_prompt_text: {
      en: "Select the duration of your symptom.",
      hi: "तकलीफ की अवधि चुनें।"
    },
    input_type: "SINGLE_CHOICE",
    options: [
      { value: "TODAY", label: "Started Today", localized_label: { en: "Started Today", hi: "आज से शुरू हुआ" } },
      { value: "1_3_DAYS", label: "1 - 3 Days", localized_label: { en: "1 - 3 Days", hi: "1 से 3 दिन" } },
      { value: "1_2_WEEKS", label: "1 - 2 Weeks", localized_label: { en: "1 - 2 Weeks", hi: "1 से 2 हफ़्ते" } },
      { value: "1_MONTH_PLUS", label: "More than 1 Month", localized_label: { en: "More than 1 Month", hi: "1 महीने से अधिक" } }
    ],
    required: true
  },
  {
    id: "q_chestpain_location_001",
    category: "hpi",
    domain: "CARDIOVASCULAR",
    text: "Where exactly do you feel the chest discomfort or pain?",
    localized_text: {
      en: "Where exactly do you feel the pain or pressure in your chest?",
      hi: "सीने में दर्द या भारीपन किस जगह पर महसूस हो रहा है?"
    },
    audio_prompt_text: {
      en: "Choose the location of your chest pain.",
      hi: "सीने के दर्द का स्थान चुनें।"
    },
    input_type: "SINGLE_CHOICE",
    options: [
      { value: "CENTER", label: "Center of Chest", localized_label: { en: "Center of Chest", hi: "सीने के बीच में" } },
      { value: "LEFT_SIDE", label: "Left Side radiating to Arm/Jaw", localized_label: { en: "Left Side to Arm/Jaw", hi: "बाईं तरफ / हाथ व जबड़े की ओर" } },
      { value: "RIGHT_SIDE", label: "Right Side", localized_label: { en: "Right Side", hi: "दाईं तरफ" } },
      { value: "UPPER_ABDOMEN", label: "Upper Stomach / Gastric", localized_label: { en: "Upper Stomach", hi: "पेट के ऊपरी हिस्से में" } }
    ],
    required: true
  },
  {
    id: "q_associated_symptoms_cardiac_001",
    category: "hpi",
    domain: "CARDIOVASCULAR",
    text: "Are you also experiencing any of these symptoms right now?",
    localized_text: {
      en: "Do you have breathlessness, cold sweating, or nausea?",
      hi: "क्या आपको सांस फूलना, बहुत पसीना आना या घबराहट/उल्टी जैसा लग रहा है?"
    },
    audio_prompt_text: {
      en: "Please tap all symptoms you are feeling right now.",
      hi: "कृपया जो भी लक्षण आपको हैं, उन पर टच करें।"
    },
    input_type: "MULTI_CHOICE",
    options: [
      { value: "BREATHLESSNESS", label: "Shortness of Breath", localized_label: { en: "Shortness of Breath", hi: "सांस फूलना" } },
      { value: "SWEATING", label: "Excessive Cold Sweating", localized_label: { en: "Excessive Sweating", hi: "अत्यधिक पसीना आना" } },
      { value: "NAUSEA", label: "Nausea / Vomiting", localized_label: { en: "Nausea / Vomiting", hi: "जी मिचलाना / उल्टी" } },
      { value: "DIZZINESS", label: "Dizziness / Fainting feeling", localized_label: { en: "Dizziness", hi: "चक्कर आना / बेहोशी" } },
      { value: "NONE", label: "None of the above", localized_label: { en: "None of the above", hi: "इनमें से कोई नहीं" } }
    ],
    required: true
  },
  {
    id: "q_fever_characteristics_001",
    category: "hpi",
    domain: "RESPIRATORY_FEVER",
    text: "How severe is the fever and are you experiencing chills or shivering?",
    localized_text: {
      en: "How is the fever pattern and are you shivering?",
      hi: "बुखार की तीव्रता कैसी है और क्या ठंड लगकर कंपकंपी छूट रही है?"
    },
    audio_prompt_text: {
      en: "Select the fever characteristics.",
      hi: "बुखार का प्रकार चुनें।"
    },
    input_type: "SINGLE_CHOICE",
    options: [
      { value: "HIGH_WITH_CHILLS", label: "High fever with chills & shivering", localized_label: { en: "High fever with chills", hi: "तेज बुखार व ठंड लगना" } },
      { value: "MODERATE_CONTINUOUS", label: "Moderate continuous fever", localized_label: { en: "Continuous moderate fever", hi: "हल्का-मध्यम लगातार बुखार" } },
      { value: "EVENING_RISE", label: "Rises mainly in the evening/night", localized_label: { en: "Evening rise fever", hi: "शाम या रात में बुखार बढ़ना" } },
      { value: "NO_FEVER_NOW", label: "Fever resolved, only weakness", localized_label: { en: "No fever currently", hi: "अब बुखार नहीं, केवल कमजोरी" } }
    ],
    required: true
  },
  {
    id: "q_respiratory_symptoms_001",
    category: "hpi",
    domain: "RESPIRATORY_FEVER",
    text: "Do you have cough, sore throat, or difficulty breathing?",
    localized_text: {
      en: "Select any breathing or cough symptoms you have.",
      hi: "क्या आपको खांसी, कफ, गले में खराश या सांस लेने में परेशानी है?"
    },
    audio_prompt_text: {
      en: "Choose your cough and breathing symptoms.",
      hi: "खांसी व सांस के लक्षण चुनें।"
    },
    input_type: "MULTI_CHOICE",
    options: [
      { value: "DRY_COUGH", label: "Dry Cough", localized_label: { en: "Dry Cough", hi: "सूखी खांसी" } },
      { value: "PRODUCTIVE_COUGH", label: "Cough with Sputum / Mucus", localized_label: { en: "Cough with Sputum", hi: "बलगम वाली खांसी" } },
      { value: "BREATH_SHORTNESS", label: "Shortness of Breath on Exertion", localized_label: { en: "Shortness of Breath", hi: "सांस फूलना" } },
      { value: "SORE_THROAT", label: "Sore Throat / Difficulty Swallowing", localized_label: { en: "Sore Throat", hi: "गले में खराश / दर्द" } },
      { value: "NONE", label: "None of these", localized_label: { en: "None of these", hi: "इनमें से कोई नहीं" } }
    ],
    required: true
  },
  {
    id: "q_gi_pain_location_001",
    category: "hpi",
    domain: "GASTROINTESTINAL",
    text: "Where is the abdominal discomfort or stomach pain located?",
    localized_text: {
      en: "Where is the stomach pain located?",
      hi: "पेट में दर्द या असहजता किस हिस्से में हो रही है?"
    },
    audio_prompt_text: {
      en: "Select the location of your stomach pain.",
      hi: "पेट दर्द का स्थान चुनें।"
    },
    input_type: "SINGLE_CHOICE",
    options: [
      { value: "UPPER_EPIGASTRIC", label: "Upper Central (Burning / Acidity)", localized_label: { en: "Upper Central Burning", hi: "ऊपरी मध्य भाग (जलन / गैस)" } },
      { value: "RIGHT_LOWER", label: "Right Lower Abdomen (Sharp)", localized_label: { en: "Right Lower Abdomen", hi: "पेट के निचले दाहिने हिस्से में तेज दर्द" } },
      { value: "GENERALIZED_CRAMPING", label: "All over belly / Cramping", localized_label: { en: "General Cramping", hi: "पूरे पेट में मरोड़ व ऐंठन" } },
      { value: "NO_PAIN_ONLY_UPSET", label: "No pain, only loose motion or nausea", localized_label: { en: "No pain, only upset", hi: "दर्द नहीं, सिर्फ दस्त या उल्टी" } }
    ],
    required: true
  },
  {
    id: "q_gi_associated_symptoms_001",
    category: "hpi",
    domain: "GASTROINTESTINAL",
    text: "Are you having vomiting, diarrhea, or blood in stool?",
    localized_text: {
      en: "Do you have nausea, loose stools, or vomiting?",
      hi: "क्या आपको उल्टी, दस्त (पतले दस्त), या खून आने की समस्या है?"
    },
    audio_prompt_text: {
      en: "Select your digestive symptoms.",
      hi: "पाचन और पेट के लक्षण चुनें।"
    },
    input_type: "MULTI_CHOICE",
    options: [
      { value: "VOMITING", label: "Vomiting multiple times", localized_label: { en: "Frequent Vomiting", hi: "बार-बार उल्टी होना" } },
      { value: "WATERY_DIARRHEA", label: "Watery loose stools", localized_label: { en: "Watery Diarrhea", hi: "पानी जैसे पतले दस्त" } },
      { value: "SEVERE_BLOATING", label: "Severe Gas / Bloating", localized_label: { en: "Severe Gas/Bloating", hi: "पेट फूलना व भारी गैस" } },
      { value: "BLOOD_IN_STOOL", label: "Blood in Vomit or Stool (Red Flag)", localized_label: { en: "Blood in Stool/Vomit", hi: "उल्टी या मल में खून आना" } },
      { value: "NONE", label: "None of these", localized_label: { en: "None of these", hi: "इनमें से कोई नहीं" } }
    ],
    required: true
  },
  {
    id: "q_joint_location_001",
    category: "hpi",
    domain: "MUSCULOSKELETAL",
    text: "Which joint or body part has pain, stiffness, or swelling?",
    localized_text: {
      en: "Which joint or body region is painful?",
      hi: "शरीर के किस जोड़ या अंग में दर्द, अकड़न या सूजन है?"
    },
    audio_prompt_text: {
      en: "Select the affected joint or body area.",
      hi: "प्रभावित जोड़ या अंग चुनें।"
    },
    input_type: "SINGLE_CHOICE",
    options: [
      { value: "KNEE_JOINTS", label: "Knee Joints (One or both)", localized_label: { en: "Knee Joints", hi: "घुटनों का दर्द (एक या दोनों)" } },
      { value: "LOWER_BACK", label: "Lower Back / Spine (Lumbago)", localized_label: { en: "Lower Back", hi: "कमर व रीढ़ का दर्द" } },
      { value: "SHOULDER_NECK", label: "Shoulder or Neck", localized_label: { en: "Shoulder / Neck", hi: "कंधा या गर्दन का दर्द" } },
      { value: "MULTIPLE_SMALL_JOINTS", label: "Fingers / Hands / Multiple joints", localized_label: { en: "Multiple Joints", hi: "हाथ-पैरों की उंगलियां व कई जोड़" } }
    ],
    required: true
  },
  {
    id: "q_pain_severity_scale_001",
    category: "hpi",
    domain: "PAIN_RELEVANT",
    text: "On a scale of 0 to 10, how severe is the pain right now?",
    localized_text: {
      en: "On a scale of 0 to 10, how severe is your pain?",
      hi: "0 से 10 के पैमाने पर आपका दर्द कितना तेज है?"
    },
    audio_prompt_text: {
      en: "Select your pain level from 0 no pain to 10 worst pain.",
      hi: "0 बिना दर्द से 10 सबसे तेज दर्द के बीच अपना स्तर चुनें।"
    },
    input_type: "FACES_SCALE",
    options: [
      { value: 0, label: "0 - No Pain", localized_label: { en: "0 - No Pain", hi: "0 - कोई दर्द नहीं" } },
      { value: 2, label: "2 - Mild", localized_label: { en: "2 - Mild", hi: "2 - हल्का दर्द" } },
      { value: 4, label: "4 - Moderate", localized_label: { en: "4 - Moderate", hi: "4 - मध्यम दर्द" } },
      { value: 6, label: "6 - Severe", localized_label: { en: "6 - Severe", hi: "6 - तेज दर्द" } },
      { value: 8, label: "8 - Very Severe", localized_label: { en: "8 - Very Severe", hi: "8 - बहुत तेज दर्द" } },
      { value: 10, label: "10 - Worst Possible", localized_label: { en: "10 - Worst Possible", hi: "10 - असहनीय दर्द" } }
    ],
    required: true
  },
  {
    id: "q_past_medical_history_001",
    category: "past_history",
    domain: "ALL",
    text: "Do you have any existing long-term health conditions?",
    localized_text: {
      en: "Do you have any diagnosed chronic diseases?",
      hi: "क्या आपको पहले से कोई पुरानी बीमारी या समस्या है?"
    },
    audio_prompt_text: {
      en: "Select all conditions that apply to you.",
      hi: "अपनी पुरानी बीमारियों का चयन करें।"
    },
    input_type: "MULTI_CHOICE",
    options: [
      { value: "DIABETES", label: "Diabetes (Sugar)", localized_label: { en: "Diabetes", hi: "डायबिटीज (शुगर)" } },
      { value: "HYPERTENSION", label: "High Blood Pressure (BP)", localized_label: { en: "High Blood Pressure", hi: "हाई ब्लड प्रेशर (बीपी)" } },
      { value: "HEART_DISEASE", label: "Heart Problem", localized_label: { en: "Heart Disease", hi: "हृदय रोग" } },
      { value: "ASTHMA", label: "Asthma / Breathing Trouble", localized_label: { en: "Asthma", hi: "दमा / सांस की बीमारी" } },
      { value: "THYROID", label: "Thyroid", localized_label: { en: "Thyroid", hi: "थायराइड" } },
      { value: "NONE", label: "No Known Condition", localized_label: { en: "No Known Condition", hi: "कोई पुरानी बीमारी नहीं" } }
    ],
    required: true
  },
  {
    id: "q_current_medications_001",
    category: "medication",
    domain: "ALL",
    text: "Are you currently taking any daily medicines?",
    localized_text: {
      en: "Are you taking regular prescription medications?",
      hi: "क्या आप वर्तमान में नियमित रूप से कोई दवाई ले रहे हैं?"
    },
    audio_prompt_text: {
      en: "Tap yes if taking regular medicines.",
      hi: "यदि आप नियमित दवाई लेते हैं तो हाँ चुनें।"
    },
    input_type: "SINGLE_CHOICE",
    options: [
      { value: "YES", label: "Yes, taking medicines", localized_label: { en: "Yes, taking medicines", hi: "हाँ, नियमित दवाई ले रहे हैं" } },
      { value: "NO", label: "No daily medicine", localized_label: { en: "No daily medicine", hi: "नहीं, कोई दवाई नहीं लेते" } }
    ],
    required: true
  },
  {
    id: "q_drug_allergies_001",
    category: "allergy",
    domain: "ALL",
    text: "Do you have any known allergy to medicines or foods?",
    localized_text: {
      en: "Any known allergy to medications (e.g. Penicillin, Sulfa)?",
      hi: "क्या आपको किसी दवाई या भोजन से कोई एलर्जी है?"
    },
    audio_prompt_text: {
      en: "Tell us if you have any drug allergy.",
      hi: "क्या आपको किसी दवाई से एलर्जी है?"
    },
    input_type: "SINGLE_CHOICE",
    options: [
      { value: "NO_ALLERGY", label: "No Known Allergies", localized_label: { en: "No Known Allergies", hi: "कोई एलर्जी नहीं है" } },
      { value: "PENICILLIN", label: "Penicillin / Antibiotic Allergy", localized_label: { en: "Penicillin Allergy", hi: "पेनिसिलिन / एंटीबायोटिक एलर्जी" } },
      { value: "PAINKILLERS", label: "Painkiller (NSAIDs) Allergy", localized_label: { en: "Painkiller Allergy", hi: "दर्द निवारक दवाई से एलर्जी" } },
      { value: "OTHER", label: "Other Allergy", localized_label: { en: "Other Allergy", hi: "अन्य एलर्जी" } }
    ],
    required: true
  },
  {
    id: "q_lifestyle_activity_impact_001",
    category: "lifestyle",
    domain: "GENERAL_CLINICAL",
    text: "How is this symptom affecting your daily work and mobility?",
    localized_text: {
      en: "How is this symptom affecting your daily activities and mobility?",
      hi: "दैनिक प्रभाव: इस लक्षण से आपके सामान्य कामकाज और चलने-फिरने पर क्या असर पड़ा है?"
    },
    audio_prompt_text: {
      en: "Select how your daily work and mobility are affected.",
      hi: "दैनिक कामकाज पर प्रभाव चुनें।"
    },
    input_type: "SINGLE_CHOICE",
    options: [
      { value: "SEVERE_LIMITATION", label: "Severe difficulty, unable to work or walk easily", localized_label: { en: "Severe difficulty working/walking", hi: "गंभीर कठिनाई, काम करने या चलने में असमर्थ" } },
      { value: "MODERATE_LIMITATION", label: "Moderate impact, takes extra effort to do tasks", localized_label: { en: "Moderate impact on daily tasks", hi: "मध्यम प्रभाव, काम करने में अधिक परेशानी" } },
      { value: "MILD_LIMITATION", label: "Mild discomfort, able to continue daily routine", localized_label: { en: "Mild discomfort, managing routine", hi: "हल्की तकलीफ, सामान्य दिनचर्या जारी है" } }
    ],
    required: false
  },
  {
    id: "q_sleep_pattern_001",
    category: "lifestyle",
    domain: "GENERAL_CLINICAL",
    text: "How is your sleep and resting pattern?",
    localized_text: {
      en: "How has your sleep quality been recently?",
      hi: "नींद की स्थिति: क्या इस समस्या के कारण आपकी नींद प्रभावित हो रही है?"
    },
    audio_prompt_text: {
      en: "Select your sleep quality.",
      hi: "अपनी नींद की स्थिति चुनें।"
    },
    input_type: "SINGLE_CHOICE",
    options: [
      { value: "SEVERELY_DISTURBED", label: "Pain or discomfort wakes me up frequently", localized_label: { en: "Discomfort wakes me up", hi: "तकलीफ के कारण रात में बार-बार नींद खुलती है" } },
      { value: "DIFFICULTY_FALLING_ASLEEP", label: "Takes longer to fall asleep", localized_label: { en: "Takes longer to sleep", hi: "सोने में सामान्य से अधिक समय लगता है" } },
      { value: "NORMAL_SLEEP", label: "Normal sound sleep", localized_label: { en: "Normal sleep", hi: "सामान्य और आरामदायक नींद" } }
    ],
    required: false
  },
  {
    id: "q_appetite_diet_001",
    category: "lifestyle",
    domain: "GENERAL_CLINICAL",
    text: "How is your regular appetite and food intake?",
    localized_text: {
      en: "How is your regular appetite and food intake?",
      hi: "खान-पान व भूख: हाल में आपकी भूख और खान-पान में कोई बदलाव आया है?"
    },
    audio_prompt_text: {
      en: "Choose your appetite pattern.",
      hi: "अपनी भूख की स्थिति चुनें।"
    },
    input_type: "SINGLE_CHOICE",
    options: [
      { value: "POOR_APPETITE", label: "Marked loss of appetite / nausea", localized_label: { en: "Loss of appetite", hi: "भूख में काफी कमी / मिचली" } },
      { value: "NORMAL_APPETITE", label: "Normal balanced appetite and digestion", localized_label: { en: "Normal appetite", hi: "सामान्य और नियमित भूख" } }
    ],
    required: false
  }
];

// Offline state tracker
let clientSession = {
  chiefComplaint: '',
  answeredIds: [] as string[],
  language: 'hi'
};

function formatClientQuestion(q: any, lang: string) {
  if (!q) return null;
  const loc = q.localized_text?.[lang] || q.localized_text?.en || q.text;
  const audio = q.audio_prompt_text?.[lang] || q.audio_prompt_text?.en || loc;
  const opts = (q.options || []).map((o: any) => ({
    value: o.value,
    label: o.localized_label?.[lang] || o.localized_label?.en || o.label
  }));

  return {
    id: q.id,
    category: q.category,
    domain: q.domain,
    text: q.text,
    localized_text: loc,
    audio_prompt_text: audio,
    input_type: q.input_type,
    required: q.required ?? true,
    options: opts
  };
}

function getClientNextQuestion(answeredIds: string[], chief: string, lang: string) {
  const stageNum = answeredIds.length + 1;
  if (stageNum > 7) return { question: null, plan: [1, 2, 3, 4, 5, 6, 7] };

  const t = (chief || '').toLowerCase();

  // 10-domain weighted classifier for client-side fallback
  type DomainKey = 'URINARY_KIDNEY' | 'EYE_VISION' | 'FEVER_INFECTION' | 'ENT_EAR_THROAT' | 'CHEST_CARDIO' | 'RESPIRATORY' | 'GASTROINTESTINAL' | 'MUSCULOSKELETAL' | 'HEAD_NEURO' | 'SKIN_DERM' | 'DENTAL' | 'GENERAL';

  interface DomainMeta {
    symptomHi: string;
    symptomEn: string;
    stage3QHi: string;
    stage3QEn: string;
    stage3Options: { value: string; hi: string; en: string }[];
    redFlags: { value: string; hi: string; en: string }[];
    pastHistory: { value: string; hi: string; en: string }[];
  }

  const DOMAINS: Record<DomainKey, DomainMeta> = {
    URINARY_KIDNEY: {
      symptomHi: 'पेशाब की समस्या',
      symptomEn: 'urinary symptoms',
      stage3QHi: 'पेशाब से जुड़ी किस प्रकार की परेशानी हो रही है? (सभी उपयुक्त विकल्प चुनें)',
      stage3QEn: 'What specific urinary symptoms are you experiencing? (Select all that apply)',
      stage3Options: [
        { value: 'BURNING_MICTURITION', hi: 'पेशाब करते समय तेज जलन या चुभन', en: 'Sharp burning sensation during urination' },
        { value: 'FREQUENCY_URGENCY', hi: 'बार-बार पेशाब की इच्छा या रोक न पाना', en: 'Frequent urination or sudden strong urgency' },
        { value: 'LOWER_ABDO_FLANK', hi: 'पेड़ू (निचले पेट) या कमर के एक तरफ दर्द', en: 'Lower pelvic or one-sided flank/kidney pain' },
        { value: 'WEAK_STREAM_DIFFICULTY', hi: 'पेशाब की धार कमजोर होना या रुक-रुक कर आना', en: 'Weak stream or difficulty passing urine' }
      ],
      redFlags: [
        { value: 'BLOOD_IN_URINE', hi: 'पेशाब में लाल रंग या खून के थक्के आना (Hematuria)', en: 'Visible blood or dark clots in urine' },
        { value: 'HIGH_FEVER_CHILLS', hi: 'तेज कंपकंपी के साथ बुखार व कमर दर्द', en: 'High fever with chills and back pain' },
        { value: 'COMPLETE_RETENTION', hi: 'पेशाब का बिल्कुल रुक जाना या बूंद-बूंद टपकना', en: 'Inability to pass urine / complete retention' },
        { value: 'NONE', hi: 'इनमें से कोई नहीं', en: 'None of these' }
      ],
      pastHistory: [
        { value: 'KIDNEY_STONES', hi: 'गुर्दे की पथरी (Kidney Stone) का इतिहास', en: 'Prior history of kidney stones' },
        { value: 'RECURRENT_UTI', hi: 'बार-बार पेशाब का संक्रमण (Recurrent UTI)', en: 'Recurrent urinary tract infections' },
        { value: 'PROSTATE_PROBLEM', hi: 'प्रोस्टेट ग्रंथि की समस्या', en: 'Prostate enlargement / BPH' },
        { value: 'DIABETES', hi: 'मधुमेह (डायबिटीज / शुगर)', en: 'Diabetes Mellitus' },
        { value: 'NONE', hi: 'कोई पुरानी बीमारी नहीं', en: 'No known chronic conditions' }
      ]
    },
    EYE_VISION: {
      symptomHi: 'आंख की समस्या',
      symptomEn: 'eye condition',
      stage3QHi: 'आंख में किस प्रकार की परेशानी महसूस हो रही है? (सभी उपयुक्त विकल्प चुनें)',
      stage3QEn: 'What symptoms are affecting your eyes? (Select all that apply)',
      stage3Options: [
        { value: 'REDNESS_DISCHARGE', hi: 'आंख का अत्यधिक लाल होना और कीचड़/पानी आना', en: 'Eye redness with watering or sticky discharge' },
        { value: 'PAIN_GRITTY', hi: 'आंख में कंकड़ जैसी चुभन या गहरा दर्द', en: 'Foreign body sensation or gritty sharp pain' },
        { value: 'BLURRED_VISION', hi: 'देखने में धुंधलापन या कम दिखाई देना', en: 'Blurred vision or reduced visual acuity' },
        { value: 'LIGHT_SENSITIVITY', hi: 'तेज रोशनी में आंखें न खुलना व चुभन (Photophobia)', en: 'Extreme sensitivity to light (Photophobia)' }
      ],
      redFlags: [
        { value: 'SUDDEN_VISION_LOSS', hi: 'अचानक नजर बहुत कम या बिल्कुल बंद होना', en: 'Sudden painless or painful loss of vision' },
        { value: 'CHEMICAL_TRAUMA', hi: 'आंख में कोई केमिकल, चूना या सीधी चोट लगना', en: 'Chemical burn or direct blunt trauma to eye' },
        { value: 'SEVERE_HEADACHE_HALOS', hi: 'रोशनी के चारों तरफ रंगीन छल्ले व तेज सिरदर्द', en: 'Colored halos around lights with severe headache' },
        { value: 'NONE', hi: 'इनमें से कोई नहीं', en: 'None of these' }
      ],
      pastHistory: [
        { value: 'SPECTACLES_REFRACTION', hi: 'नजर का चश्मा या लेंस (Refractive error)', en: 'Wear prescription glasses / contacts' },
        { value: 'CATARACT_GLAUCOMA', hi: 'मोतियाबिंद या काला मोतिया का इतिहास', en: 'Cataract or Glaucoma history' },
        { value: 'DIABETES_RETINA', hi: 'मधुमेह (डायबिटीज - रेटिना का जोखिम)', en: 'Diabetes Mellitus' },
        { value: 'ALLERGIC_CONJUNCTIVITIS', hi: 'आंखों की पुरानी एलर्जी', en: 'Chronic eye allergy' },
        { value: 'NONE', hi: 'कोई पुरानी बीमारी नहीं', en: 'No known chronic conditions' }
      ]
    },
    FEVER_INFECTION: {
      symptomHi: 'बुखार व संक्रमण',
      symptomEn: 'fever and infection',
      stage3QHi: 'बुखार के साथ क्या-क्या लक्षण महसूस हो रहे हैं? (सभी उपयुक्त विकल्प चुनें)',
      stage3QEn: 'What symptoms accompany your fever? (Select all that apply)',
      stage3Options: [
        { value: 'HIGH_FEVER_CONTINUOUS', hi: 'लगातार बना रहने वाला तेज बुखार', en: 'Continuous high-grade fever' },
        { value: 'INTERMITTENT_SHIVERING', hi: 'कंपकंपी व ठंड लगकर बुखार चढ़ना-उतरना', en: 'Fever spikes with violent chills and shivering' },
        { value: 'BODYACHE_FATIGUE', hi: 'तेज बदन दर्द, सिरदर्द व भारी कमजोरी', en: 'Severe generalized body ache, headache & fatigue' },
        { value: 'NIGHT_SWEATS', hi: 'रात में अत्यधिक पसीना छूटना', en: 'Profuse night sweats and exhaustion' }
      ],
      redFlags: [
        { value: 'ALTERED_CONSCIOUSNESS', hi: 'अत्यधिक सुस्ती, उलझन, बड़बड़ाना या बेहोशी', en: 'Confusion, delirium, lethargy or fainting' },
        { value: 'FEVER_STIFF_NECK', hi: 'गर्दन में अत्यधिक जकड़न व रोशनी से चुभन', en: 'Stiff neck and inability to bend head forward' },
        { value: 'FEVER_PETECHIAE', hi: 'शरीर पर लाल-बैंगनी दाने या मसूड़ों से ब्लीडिंग', en: 'Skin petechiae/bleeding spots or gum bleeding' },
        { value: 'PERSISTENT_ABOVE_103', hi: '१०३°F से अधिक अनियंत्रित तेज बुखार', en: 'Uncontrolled fever above 103°F refractory to medication' },
        { value: 'NONE', hi: 'इनमें से कोई नहीं', en: 'None of these' }
      ],
      pastHistory: [
        { value: 'CHRONIC_INFECTION', hi: 'बार-बार बुखार या टीबी (TB) का पुराना इतिहास', en: 'Recurrent infections or past Tuberculosis' },
        { value: 'DIABETES_IMMUNITY', hi: 'मधुमेह (कमजोर रोग प्रतिरोधक क्षमता)', en: 'Diabetes (compromised immunity)' },
        { value: 'RECENT_TRAVEL', hi: 'हाल ही में किसी मलेरिया/डेंगू प्रभावित क्षेत्र की यात्रा', en: 'Recent travel to endemic region' },
        { value: 'NONE', hi: 'कोई पुरानी बीमारी नहीं', en: 'No known chronic conditions' }
      ]
    },
    ENT_EAR_THROAT: {
      symptomHi: 'कान, नाक या गले की समस्या',
      symptomEn: 'ear, nose or throat condition',
      stage3QHi: 'कान, नाक या गले में क्या परेशानी हो रही है? (सभी उपयुक्त विकल्प चुनें)',
      stage3QEn: 'What ear, nose, or throat symptoms do you have? (Select all that apply)',
      stage3Options: [
        { value: 'EAR_PAIN_DISCHARGE', hi: 'कान में तेज टीस या मवाद/पानी का रिसाव', en: 'Ear pain, throbbing or fluid/pus discharge' },
        { value: 'SORE_THROAT_SWALLOW', hi: 'गले में तेज खराश, लाली व थूक निगलने में दर्द', en: 'Severe sore throat with painful swallowing' },
        { value: 'NOSE_BLOCK_COLD', hi: 'नाक बंद, लगातार छींकें या जुकाम', en: 'Nasal blockage, constant sneezing or runny nose' },
        { value: 'HEARING_TINNITUS', hi: 'कम सुनाई देना या कान में सीटी जैसी आवाज', en: 'Decreased hearing or persistent ringing (Tinnitus)' }
      ],
      redFlags: [
        { value: 'STRIDOR_AIRWAY', hi: 'सांस लेने में सीटी की आवाज या दम घुटना', en: 'Stridor / respiratory distress / choking sensation' },
        { value: 'EAR_SPREAD_MASTOID', hi: 'कान के पीछे सूजन, लाली व छूने पर असहनीय दर्द', en: 'Swelling & severe tenderness behind ear' },
        { value: 'UNABLE_SWALLOW_SALIVA', hi: 'लार भी निगलने में पूरी तरह असमर्थ होना', en: 'Inability to swallow saliva or fluids' },
        { value: 'NONE', hi: 'इनमें से कोई नहीं', en: 'None of these' }
      ],
      pastHistory: [
        { value: 'CHRONIC_SINUS_ALLERGY', hi: 'पुराना साइनस या मौसमी एलर्जी', en: 'Chronic sinusitis or seasonal allergy' },
        { value: 'EAR_DRUM_PERFORATION', hi: 'कान के पर्दे में छेद या पुराना कान बहना', en: 'Perforated ear drum / chronic otitis' },
        { value: 'TONSIL_RECURRENT', hi: 'बार-बार टॉन्सिल पकने की समस्या', en: 'Recurrent tonsillitis' },
        { value: 'NONE', hi: 'कोई पुरानी बीमारी नहीं', en: 'No known chronic conditions' }
      ]
    },
    CHEST_CARDIO: {
      symptomHi: 'सीने में दर्द व भारीपन',
      symptomEn: 'chest discomfort',
      stage3QHi: 'सीने में दर्द या भारीपन का अहसास किस प्रकार का है? (सभी उपयुक्त विकल्प चुनें)',
      stage3QEn: 'Where is the chest discomfort and what does it feel like? (Select all that apply)',
      stage3Options: [
        { value: 'CENTER_PRESSURE', hi: 'सीने के ठीक बीच में भारी दबाव व जकड़न (कसाव)', en: 'Heavy squeezing pressure in center of chest' },
        { value: 'LEFT_ARM_JAW', hi: 'बाईं तरफ जो बाएं हाथ, कंधे या जबड़े में फैलता है', en: 'Left chest radiating to left arm, shoulder or jaw' },
        { value: 'SHARP_BREATHING', hi: 'गहरी सांस लेने या खांसने पर सुई जैसी चुभन', en: 'Sharp stabbing pain when taking deep breaths' },
        { value: 'PALPITATION_FLUTTER', hi: 'दिल की असामान्य तेज धड़कन या घबराहट', en: 'Pounding palpitations or fluttering sensation' }
      ],
      redFlags: [
        { value: 'BREATHLESSNESS_REST', hi: 'बैठे-बैठे भी सांस फूलना या सांस लेने में भारी तकलीफ', en: 'Severe shortness of breath at rest / gasping' },
        { value: 'COLD_SWEAT', hi: 'ठंडा पसीना छूटना व तेज घबराहट', en: 'Profuse cold sweating & clamminess' },
        { value: 'DIZZINESS_SYNCOPE', hi: 'अचानक चक्कर आना या बेहोशी जैसा लगना', en: 'Dizziness, lightheadedness or fainting' },
        { value: 'UNRELENTING_PRESSURE', hi: 'लगातार बना हुआ असहनीय दबाव जो आराम से भी न घटे', en: 'Severe crushing pressure >15 mins at rest' },
        { value: 'NONE', hi: 'इनमें से कोई नहीं', en: 'None of these' }
      ],
      pastHistory: [
        { value: 'HEART_DISEASE', hi: 'हृदय रोग / पहले दिल का दौरा या स्टेंट', en: 'Prior heart disease / attack / stent' },
        { value: 'HYPERTENSION', hi: 'उच्च रक्तचाप (High BP)', en: 'Hypertension (BP)' },
        { value: 'DIABETES', hi: 'मधुमेह (डायबिटीज / शुगर)', en: 'Diabetes Mellitus' },
        { value: 'CHOLESTEROL', hi: 'हाई कोलेस्ट्रॉल (खून में चर्बी)', en: 'High Cholesterol' },
        { value: 'NONE', hi: 'कोई पुरानी बीमारी नहीं', en: 'No known chronic conditions' }
      ]
    },
    RESPIRATORY: {
      symptomHi: 'खांसी व सांस की समस्या',
      symptomEn: 'respiratory symptoms and cough',
      stage3QHi: 'सांस या खांसी से जुड़ी क्या तकलीफ महसूस हो रही है? (सभी उपयुक्त विकल्प चुनें)',
      stage3QEn: 'What respiratory or breathing symptoms are you experiencing? (Select all that apply)',
      stage3Options: [
        { value: 'DRY_COUGH', hi: 'लगातार सूखी खांसी बिना बलगम के', en: 'Persistent dry hacking cough' },
        { value: 'YELLOW_GREEN_SPUTUM', hi: 'पीला या हरा गाढ़ा बलगम आना', en: 'Thick yellow or green sputum' },
        { value: 'EXERTIONAL_DYSPNEA', hi: 'थोड़ा चलने या सीढ़ियां चढ़ने पर सांस फूलना', en: 'Breathlessness upon mild exertion or walking' },
        { value: 'WHEEZING_CHEST', hi: 'सांस लेते समय सीने में सीटी या घरघराहट', en: 'Chest tightness with audible wheezing' }
      ],
      redFlags: [
        { value: 'SEVERE_DYSPNEA', hi: 'बैठे-बैठे भी सांस फूलना या बात न कर पाना', en: 'Gasping for breath / unable to speak full sentences' },
        { value: 'BLOOD_IN_SPUTUM', hi: 'खांसी में खून के छींटे (Hemoptysis)', en: 'Blood in cough / sputum' },
        { value: 'BLUE_LIPS', hi: 'नाखून या होंठ नीले पड़ना (ऑक्सीजन की कमी)', en: 'Bluish tinge on lips or fingernails (Cyanosis)' },
        { value: 'STRUGGLING_TO_BREATHE', hi: 'सांस लेने में छाती का बुरी तरह खिंचना', en: 'Accessory muscle use / severe respiratory distress' },
        { value: 'NONE', hi: 'इनमें से कोई नहीं', en: 'None of these' }
      ],
      pastHistory: [
        { value: 'ASTHMA', hi: 'दमा / अस्थमा (Asthma) या इनहेलर का उपयोग', en: 'Asthma / Inhaler user' },
        { value: 'COPD_SMOKING', hi: 'पुरानी ब्रोंकाइटिस / बीड़ी-सिगरेट का सेवन', en: 'COPD / Chronic bronchitis' },
        { value: 'ALLERGIES', hi: 'धूल-धुएं या मौसम से सांस की एलर्जी', en: 'Dust, smoke or seasonal allergy' },
        { value: 'TB', hi: 'टीबी (Tuberculosis) का इतिहास', en: 'Prior Tuberculosis' },
        { value: 'NONE', hi: 'कोई पुरानी बीमारी नहीं', en: 'No known chronic conditions' }
      ]
    },
    GASTROINTESTINAL: {
      symptomHi: 'पेट दर्द व पाचन समस्या',
      symptomEn: 'abdominal discomfort',
      stage3QHi: 'पेट या पाचन से जुड़ी क्या परेशानी हो रही है? (सभी उपयुक्त विकल्प चुनें)',
      stage3QEn: 'What digestive or abdominal symptoms do you have? (Select all that apply)',
      stage3Options: [
        { value: 'UPPER_EPIGASTRIC', hi: 'पेट के ऊपरी हिस्से में तेज जलन, खट्टी डकार व भारीपन', en: 'Upper central burning / acid fullness' },
        { value: 'PERI_UMBILICAL', hi: 'नाभि के आसपास मरोड़ व पतले दस्त', en: 'Twisting cramps around navel with loose stools' },
        { value: 'RIGHT_LOWER', hi: 'पेट के निचले दाहिने हिस्से में चुभने वाला दर्द', en: 'Right lower abdominal localized sharp pain' },
        { value: 'GENERAL_BLOATING', hi: 'पूरे पेट में भारी गैस व फूला हुआ अहसास', en: 'Generalized abdominal distension & gas' }
      ],
      redFlags: [
        { value: 'BLOOD_VOMIT_STOOL', hi: 'उल्टी या काले रंग के दस्त में खून आना', en: 'Blood in vomit or dark black tarry stools' },
        { value: 'UNSTOPPABLE_VOMITING', hi: 'पानी भी न पचना, बार-बार उल्टी होना', en: 'Unable to keep fluids down / continuous vomiting' },
        { value: 'RIGID_BELLY', hi: 'पेट छूने पर पत्थर जैसा कड़ा व असहनीय दर्द', en: 'Board-like rigid abdomen with rebound tenderness' },
        { value: 'DEHYDRATION', hi: 'अत्यधिक कमजोरी, पेशाब कम होना व चक्कर', en: 'Severe dehydration, dark urine & faintness' },
        { value: 'NONE', hi: 'इनमें से कोई नहीं', en: 'None of these' }
      ],
      pastHistory: [
        { value: 'ULCER_GASTRITIS', hi: 'पेट में अल्सर या पुरानी एसिडिटी/गैस्ट्राइटिस', en: 'Peptic ulcer / chronic gastritis' },
        { value: 'GALLSTONES', hi: 'पित्त की थैली में पथरी (Gallbladder stone)', en: 'Gallstones' },
        { value: 'JAUNDICE', hi: 'पीलिया (Jaundice) या लिवर की बीमारी', en: 'Liver disease / prior jaundice' },
        { value: 'DIABETES', hi: 'डायबिटीज (शुगर)', en: 'Diabetes' },
        { value: 'NONE', hi: 'कोई पुरानी बीमारी नहीं', en: 'No known chronic conditions' }
      ]
    },
    MUSCULOSKELETAL: {
      symptomHi: 'जोड़ों या मांसपेशियों का दर्द',
      symptomEn: 'joint or muscle pain',
      stage3QHi: 'जोड़ों या मांसपेशियों में किस प्रकार का दर्द या परेशानी महसूस हो रही है? (सभी उपयुक्त विकल्प चुनें)',
      stage3QEn: 'What kind of musculoskeletal discomfort do you experience? (Select all that apply)',
      stage3Options: [
        { value: 'WEIGHT_BEARING', hi: 'चलने, झुकने या सीढ़ियाँ चढ़ते समय तेज दर्द', en: 'Pain worsened by walking, bending or stairs' },
        { value: 'VISIBLE_SWELLING', hi: 'जोड़ में स्पष्ट सूजन, गर्माहट या लाली', en: 'Visible swelling, heat, or redness at joint' },
        { value: 'MORNING_STIFFNESS', hi: 'सुबह सोकर उठने पर ३० मिनट से ज्यादा अकड़न', en: 'Severe morning stiffness lasting >30 minutes' },
        { value: 'CLICKING_RESTRICTED', hi: 'जोड़ से कट-कट आवाज आना व हिलने में रुकावट', en: 'Clicking/popping sounds and limited movement' }
      ],
      redFlags: [
        { value: 'CANNOT_BEAR_WEIGHT', hi: 'पैर पर थोड़ा सा भी वजन रखने में पूरी तरह असमर्थ', en: 'Completely unable to bear weight / take steps' },
        { value: 'DEFORMITY_FRACTURE', hi: 'जोड़ या हड्डी का मुड़ना/विकृति (संभावित फ्रैक्चर)', en: 'Visible deformity or bone misalignment' },
        { value: 'NUMBNESS_TINGLING', hi: 'हाथ या पैर में सुन्नपन, करंट जैसा झनझनाहट', en: 'Pins-and-needles or radiating numbness' },
        { value: 'HOT_RED_JOINT', hi: 'जोड़ अत्यधिक गर्म, लाल व तेज बुखार', en: 'Joint acutely hot & red with fever' },
        { value: 'NONE', hi: 'इनमें से कोई नहीं', en: 'None of these' }
      ],
      pastHistory: [
        { value: 'OSTEOARTHRITIS', hi: 'ऑस्टियोआर्थराइटिस (हड्डियों का घिसना)', en: 'Osteoarthritis / Wear and tear' },
        { value: 'GOUT_URIC_ACID', hi: 'यूरिक एसिड / गाउट (Gout)', en: 'High uric acid / Gout' },
        { value: 'PRIOR_INJURY', hi: 'पुरानी चोट, मोच या फ्रैक्चर का इतिहास', en: 'Past trauma, sprain or fracture' },
        { value: 'THYROID_VITD', hi: 'विटामिन D या कैल्शियम की कमी / थायरॉइड', en: 'Vitamin D / Calcium deficiency / Thyroid' },
        { value: 'NONE', hi: 'कोई पुरानी बीमारी नहीं', en: 'No known chronic conditions' }
      ]
    },
    HEAD_NEURO: {
      symptomHi: 'सिर दर्द',
      symptomEn: 'headache',
      stage3QHi: 'सिर दर्द या न्यूरोलॉजिकल लक्षण किस प्रकार के हैं? (सभी उपयुक्त विकल्प चुनें)',
      stage3QEn: 'Where is the headache and what sensations are associated? (Select all that apply)',
      stage3Options: [
        { value: 'TEMPLE_ONE_SIDE', hi: 'सिर के एक तरफ या कनपटी में (धड़कन/टीस जैसा)', en: 'One side / temple (throbbing/pulsating)' },
        { value: 'FOREHEAD_BEHIND_EYES', hi: 'माथे और आंखों के ठीक पीछे गहरा भारीपन', en: 'Forehead and deep behind the eyes' },
        { value: 'BACK_OF_HEAD_NECK', hi: 'सिर के पिछले हिस्से से गर्दन तक खिंचाव व तनाव', en: 'Back of head radiating down to neck' },
        { value: 'WHOLE_HEAD_BAND', hi: 'पूरे सिर में पट्टी बंधने जैसा भारी दबाव', en: 'Band-like tightness around whole head' }
      ],
      redFlags: [
        { value: 'WORST_SUDDEN_HEADACHE', hi: 'अचानक बिजली जैसा सबसे तेज दर्द (Thunderclap)', en: 'Worst sudden headache of life (Thunderclap)' },
        { value: 'FOCAL_NEURO_DEFICIT', hi: 'चेहरे का टेढ़ापन, हाथ-पैर में कमजोरी या बोली लड़खड़ाना', en: 'Facial droop, arm weakness or slurred speech' },
        { value: 'NAUSEA_VOMITING', hi: 'सिरदर्द के साथ तेज उल्टी या रोशनी से चुभन', en: 'Projectile vomiting or severe photophobia' },
        { value: 'LOSS_OF_CONSCIOUSNESS', hi: 'बेहोशी, दौरा या गंभीर उलझन', en: 'Loss of consciousness, seizures or confusion' },
        { value: 'NONE', hi: 'इनमें से कोई नहीं', en: 'None of these' }
      ],
      pastHistory: [
        { value: 'MIGRAINE', hi: 'माइग्रेन / बार-बार आधा सीसी का दर्द', en: 'Migraine / Chronic headache' },
        { value: 'HYPERTENSION', hi: 'उच्च रक्तचाप (High BP)', en: 'High Blood Pressure' },
        { value: 'SINUS', hi: 'साइनस / पुराना जुकाम', en: 'Sinusitis / Chronic allergy' },
        { value: 'STRESS_INSOMNIA', hi: 'तनाव या नींद न आने की समस्या', en: 'Stress or Insomnia' },
        { value: 'NONE', hi: 'कोई पुरानी बीमारी नहीं', en: 'No known chronic conditions' }
      ]
    },
    SKIN_DERM: {
      symptomHi: 'त्वचा की समस्या',
      symptomEn: 'skin condition',
      stage3QHi: 'त्वचा पर किस प्रकार के चकत्ते या लक्षण दिख रहे हैं? (सभी उपयुक्त विकल्प चुनें)',
      stage3QEn: 'What skin changes or rash characteristics are present? (Select all that apply)',
      stage3Options: [
        { value: 'NIGHT_ITCHING', hi: 'रात में बिस्तर पर जाने के बाद अत्यधिक तेज खुजली', en: 'Intense itching, especially worse at night' },
        { value: 'RED_PATCHES', hi: 'उभरे हुए लाल चकत्ते, जिनमें जलन होती है', en: 'Raised erythematous patches with burning sensation' },
        { value: 'BLISTERS_OOZING', hi: 'पानी भरे छोटे फफोले या मवाद का रिसाव', en: 'Fluid-filled blisters or yellowish weeping' },
        { value: 'DRY_SCALY', hi: 'सूखी, पपड़ीदार त्वचा जो सफेद झड़ती है', en: 'Dry, scaly, peeling skin with cracking' }
      ],
      redFlags: [
        { value: 'RAPID_SPREAD', hi: 'पूरे शरीर पर बहुत तेजी से चकत्तों का फैलना', en: 'Rapidly spreading rash over whole body' },
        { value: 'FACIAL_LIP_SWELLING', hi: 'चेहरे, होंठ या गले में सूजन (एनाफिलेक्सिस संकेत)', en: 'Swelling of lips, face or tongue (Anaphylaxis risk)' },
        { value: 'SKIN_PEELING_FEVER', hi: 'त्वचा की परत उधड़ना व तेज बुखार', en: 'Extensive skin sloughing with fever' },
        { value: 'NONE', hi: 'इनमें से कोई नहीं', en: 'None of these' }
      ],
      pastHistory: [
        { value: 'ECZEMA_PSORIASIS', hi: 'एक्जिमा या सोरायसिस (Eczema / Psoriasis)', en: 'Eczema / Psoriasis' },
        { value: 'DRUG_FOOD_ALLERGY', hi: 'किसी भोजन या दवा से त्वचा एलर्जी', en: 'Food or medication allergy' },
        { value: 'DIABETES_SKIN', hi: 'डायबिटीज (धीमे घाव भरना)', en: 'Diabetes (slow wound healing)' },
        { value: 'NONE', hi: 'कोई पुरानी बीमारी नहीं', en: 'No known chronic conditions' }
      ]
    },
    DENTAL: {
      symptomHi: 'दांत का दर्द',
      symptomEn: 'toothache',
      stage3QHi: 'दांत या मुंह में किस प्रकार की तकलीफ महसूस हो रही है? (सभी उपयुक्त विकल्प चुनें)',
      stage3QEn: 'What symptoms are affecting your teeth or gums? (Select all that apply)',
      stage3Options: [
        { value: 'HOT_COLD_SENSITIVITY', hi: 'ठंडा या गर्म पानी लगने पर तेज झनझनाहट', en: 'Sharp sensitivity to cold or hot liquids' },
        { value: 'CHEWING_PAIN', hi: 'खाना चबाने या दांत दबाने पर असहनीय दर्द', en: 'Severe shooting pain upon chewing' },
        { value: 'GUM_SWELLING', hi: 'मसूड़े में सूजन, लालिमा या खून आना', en: 'Swollen tender gums with bleeding' },
        { value: 'CONTINUOUS_THROBBING', hi: 'रात में लगातार धड़कन जैसा गहरा दर्द', en: 'Continuous deep throbbing night pain' }
      ],
      redFlags: [
        { value: 'FACIAL_SWELLING', hi: 'गाल या जबड़े में बड़ी सूजन जो आंख तक जा रही हो', en: 'Facial swelling extending toward eye or neck' },
        { value: 'CANNOT_OPEN_MOUTH', hi: 'मुंह खोलने या निगलने में भारी असमर्थता (Trismus)', en: 'Unable to open mouth (Trismus) / swallow saliva' },
        { value: 'HIGH_FEVER', hi: 'दांत दर्द के साथ तेज बुखार व कपकपी', en: 'High fever with dental abscess' },
        { value: 'NONE', hi: 'इनमें से कोई नहीं', en: 'None of these' }
      ],
      pastHistory: [
        { value: 'DENTAL_CAVITY', hi: 'दांत में पहले कैविटी/कीड़ा या आरसीटी (RCT)', en: 'Prior dental cavity / Root canal' },
        { value: 'DIABETES', hi: 'डायबिटीज (मसूड़ों के संक्रमण का खतरा)', en: 'Diabetes' },
        { value: 'NONE', hi: 'कोई पुरानी बीमारी नहीं', en: 'No known chronic conditions' }
      ]
    },
    GENERAL: {
      symptomHi: 'तकलीफ',
      symptomEn: 'symptom',
      stage3QHi: 'आपके लक्षण की सटीक स्थिति कहाँ है और दर्द या परेशानी का प्रकार कैसा है?',
      stage3QEn: 'Where exactly is your symptom located and what does the sensation feel like?',
      stage3Options: [
        { value: 'SHARP_LOCALIZED', hi: 'एक निश्चित जगह पर तेज चुभने जैसा दर्द', en: 'Sharp localized piercing sensation' },
        { value: 'DULL_HEAVY', hi: 'गहरा भारीपन, दबाव या जकड़न', en: 'Deep ache, heaviness or squeezing tightness' },
        { value: 'BURNING_THROB', hi: 'जलन या धड़कन जैसी टीस', en: 'Burning or throbbing sensation' },
        { value: 'RADIATING_SPREAD', hi: 'आसपास के अन्य अंगों में फैलता हुआ', en: 'Radiating or spreading to adjacent areas' }
      ],
      redFlags: [
        { value: 'BREATHLESSNESS_DIZZY', hi: 'सांस फूलना, चक्कर आना या अत्यधिक पसीना', en: 'Breathlessness, dizziness or cold sweating' },
        { value: 'VOMITING_NAUSEA', hi: 'जी मिचलाना या बार-बार उल्टी होना', en: 'Nausea or frequent vomiting' },
        { value: 'WEAKNESS_NUMBNESS', hi: 'शरीर के किसी अंग में कमजोरी या सुन्नपन', en: 'Localized weakness or numbness' },
        { value: 'NO_RED_FLAGS', hi: 'इनमें से कोई नहीं (सामान्य दर्द)', en: 'None of these warning symptoms' }
      ],
      pastHistory: [
        { value: 'HYPERTENSION', hi: 'उच्च रक्तचाप (High BP)', en: 'High Blood Pressure' },
        { value: 'DIABETES', hi: 'मधुमेह (डायबिटीज / शुगर)', en: 'Diabetes Mellitus' },
        { value: 'HEART_DISEASE', hi: 'हृदय रोग (Heart Disease)', en: 'Heart Disease' },
        { value: 'ALLERGIES_ASTHMA', hi: 'दमा या एलर्जी (Asthma / Allergy)', en: 'Asthma / Allergies' },
        { value: 'NONE', hi: 'कोई पुरानी बीमारी नहीं', en: 'No prior chronic conditions' }
      ]
    }
  };

  // Detect domain with weighted scoring
  let matchedDomain: DomainKey = 'GENERAL';
  if (t.includes('urine') || t.includes('urination') || t.includes('पेशाब') || t.includes('मूत्र') || t.includes('kidney') || t.includes('गुर्दा') || t.includes('यूरिन') || t.includes('dysuria')) {
    matchedDomain = 'URINARY_KIDNEY';
  } else if (t.includes('eye') || t.includes('आंख') || t.includes('आँख') || t.includes('दृष्टि') || t.includes('vision') || t.includes('cataract') || t.includes('cornea') || t.includes('aankh') || t.includes('ankh') || t.includes('eyepain')) {
    matchedDomain = 'EYE_VISION';
  } else if (t.includes('ear') || t.includes('कान') || t.includes('throat') || t.includes('गले') || t.includes('गला') || t.includes('tonsil') || t.includes('nose') || t.includes('नाक') || t.includes('छींक')) {
    matchedDomain = 'ENT_EAR_THROAT';
  } else if (t.includes('fever') || t.includes('बुखार') || t.includes('chills') || t.includes('कंपकंपी') || t.includes('ठंड') || t.includes('dengue') || t.includes('malaria') || t.includes('वायरल')) {
    matchedDomain = 'FEVER_INFECTION';
  } else if (t.includes('chest') || t.includes('सीने') || t.includes('छाती') || t.includes('heart') || t.includes('दिल') || t.includes('धड़कन') || t.includes('angina')) {
    matchedDomain = 'CHEST_CARDIO';
  } else if (t.includes('cough') || t.includes('खांसी') || t.includes('कफ') || t.includes('sputum') || t.includes('asthma') || t.includes('breath') || t.includes('सांस')) {
    matchedDomain = 'RESPIRATORY';
  } else if (t.includes('stomach') || t.includes('पेट') || t.includes('उल्टी') || t.includes('vomit') || t.includes('दस्त') || t.includes('loose motion') || t.includes('acidity') || t.includes('एसिडिटी')) {
    matchedDomain = 'GASTROINTESTINAL';
  } else if (t.includes('head') || t.includes('सिर') || t.includes('सिरदर्द') || t.includes('migraine') || t.includes('चक्कर') || t.includes('dizziness')) {
    matchedDomain = 'HEAD_NEURO';
  } else if (t.includes('skin') || t.includes('त्वचा') || t.includes('खुजली') || t.includes('itching') || t.includes('rash') || t.includes('चकत्ते') || t.includes('दाने')) {
    matchedDomain = 'SKIN_DERM';
  } else if (t.includes('tooth') || t.includes('दांत') || t.includes('मसूड़े') || t.includes('gum')) {
    matchedDomain = 'DENTAL';
  } else if (t.includes('knee') || t.includes('घुटने') || t.includes('back') || t.includes('कमर') || t.includes('joint') || t.includes('जोड़') || t.includes('shoulder') || t.includes('कंधा') || t.includes('ankle') || t.includes('टखने')) {
    matchedDomain = 'MUSCULOSKELETAL';
  }

  const dom = DOMAINS[matchedDomain];
  const symptomHi = dom.symptomHi;
  const symptomEn = dom.symptomEn;

  const hasDuration = t.includes('दिन') || t.includes('day') || t.includes('सुबह') || t.includes('morning') || t.includes('हफ्ते') || t.includes('week') || t.includes('महीने') || t.includes('कल');

  let qTextHi = '';
  let qTextEn = '';
  let inputType = 'SINGLE_CHOICE';
  let options: any[] = [];
  let badgeHi = '';
  let badgeEn = '';

  if (stageNum === 2) {
    badgeHi = 'शुरुआत व अवधि';
    badgeEn = 'Onset & Duration';
    inputType = 'SINGLE_CHOICE';
    if (hasDuration) {
      qTextHi = `आपने बताया कि आपको ${symptomHi} हाल से है। क्या यह अचानक बहुत तेज हुआ या धीरे-धीरे बढ़ा, और क्या यह लगातार बना रहता है?`;
      qTextEn = `You mentioned experiencing this ${symptomEn}. Did it begin suddenly or develop gradually, and is it constant or intermittent?`;
      options = [
        { value: 'SUDDEN_CONSTANT', label: lang === 'hi' ? 'अचानक तेज हुआ और लगातार बना हुआ है' : 'Started suddenly and remains constant' },
        { value: 'GRADUAL_WORSE', label: lang === 'hi' ? 'धीरे-धीरे शुरू हुआ और बढ़ता जा रहा है' : 'Gradual onset, progressively worsening' },
        { value: 'INTERMITTENT', label: lang === 'hi' ? 'लगातार नहीं है, बीच-बीच में आराम मिलता है' : 'Comes and goes in waves' },
        { value: 'TRIGGERED', label: lang === 'hi' ? 'किसी खास काम या गतिविधि के बाद शुरू हुआ' : 'Triggered by a specific activity' }
      ];
    } else {
      qTextHi = `यह ${symptomHi} आपको कितने समय से हो रहा है और इसकी शुरुआत कैसे हुई?`;
      qTextEn = `Since how long have you been experiencing this ${symptomEn} and how did it begin?`;
      options = [
        { value: 'HOURS_TODAY', label: lang === 'hi' ? 'आज या कुछ घंटों से (अचानक शुरू हुआ)' : 'Started today / a few hours ago' },
        { value: '1_3_DAYS', label: lang === 'hi' ? '१ से ३ दिनों से' : '1 to 3 days ago' },
        { value: '1_2_WEEKS', label: lang === 'hi' ? '१ से २ हफ़्तों से' : '1 to 2 weeks ago' },
        { value: 'MONTHS_CHRONIC', label: lang === 'hi' ? '१ महीने या उससे अधिक समय से' : 'More than 1 month ago' }
      ];
    }
  } else if (stageNum === 3) {
    badgeHi = 'लक्षण की स्थिति';
    badgeEn = 'Location & Character';
    inputType = 'MULTI_CHOICE';
    qTextHi = dom.stage3QHi;
    qTextEn = dom.stage3QEn;
    options = dom.stage3Options.map(opt => ({
      value: opt.value,
      label: lang === 'hi' ? opt.hi : opt.en
    }));
  } else if (stageNum === 4) {
    badgeHi = 'गंभीरता व खतरे के संकेत';
    badgeEn = 'Severity & Red Flags';
    inputType = 'MULTI_CHOICE';
    qTextHi = `इस ${symptomHi} के साथ क्या आपको इनमें से कोई भी गंभीर या असहज लक्षण महसूस हो रहे हैं? (सुरक्षा जांच)`;
    qTextEn = `Along with your ${symptomEn}, are you experiencing any of these critical warning symptoms?`;
    options = dom.redFlags.map(opt => ({
      value: opt.value,
      label: lang === 'hi' ? opt.hi : opt.en
    }));
  } else if (stageNum === 5) {
    badgeHi = 'पूर्व इतिहास';
    badgeEn = 'Medical History';
    inputType = 'MULTI_CHOICE';
    qTextHi = `क्या आपको इनमें से कोई पुरानी बीमारी है, या ऐसा ${symptomHi} पहले कभी हुआ है?`;
    qTextEn = `Do you have a history of any chronic conditions, or prior similar ${symptomEn}?`;
    options = dom.pastHistory.map(opt => ({
      value: opt.value,
      label: lang === 'hi' ? opt.hi : opt.en
    }));
  } else if (stageNum === 6) {
    badgeHi = 'दवाइयाँ व एलर्जी';
    badgeEn = 'Medications & Allergies';
    inputType = 'MULTI_CHOICE';
    qTextHi = `क्या आपने इस ${symptomHi} के लिए हाल में कोई दवा या उपचार लिया है, और क्या आपको किसी दवा से एलर्जी है?`;
    qTextEn = `Have you taken any medicines for your ${symptomEn}, and do you have any known drug allergies?`;
    options = [
      { value: 'TOOK_PAINKILLER', label: lang === 'hi' ? `हाँ, ${symptomHi} कम करने के लिए दवा ली है` : `Took medication/painkiller for ${symptomEn}` },
      { value: 'REGULAR_MEDS', label: lang === 'hi' ? 'नियमित बीपी, शुगर या अन्य दवाइयाँ चल रही हैं' : 'Taking regular chronic daily medications' },
      { value: 'KNOWN_ALLERGY', label: lang === 'hi' ? 'किसी विशेष दवा से एलर्जी है' : 'Known drug allergy' },
      { value: 'NONE', label: lang === 'hi' ? 'कोई दवा नहीं ली और कोई एलर्जी नहीं है' : 'No medications and no known allergies' }
    ];
  } else {
    badgeHi = 'जीवनशैली व प्रभाव';
    badgeEn = 'Daily Lifestyle & Impact';
    inputType = 'SINGLE_CHOICE';
    qTextHi = `इस ${symptomHi} से आपकी सामान्य दिनचर्या, नींद और कामकाज पर क्या असर पड़ रहा है?`;
    qTextEn = `How is this ${symptomEn} affecting your daily routine, sleep, and overall mobility?`;
    options = [
      { value: 'SLEEP_DISTURBED', label: lang === 'hi' ? 'नींद व विश्राम में अत्यधिक बाधा हो रही है' : 'Severe disruption to sleep and rest' },
      { value: 'ROUTINE_LIMITED', label: lang === 'hi' ? 'सामान्य कामकाज और चलने-फिरने में कठिनाई है' : 'Difficulty performing routine tasks and walking' },
      { value: 'APPETITE_AFFECTED', label: lang === 'hi' ? 'भूख में कमी और भोजन करने में परेशानी है' : 'Loss of appetite and eating difficulty' },
      { value: 'MILD_MANAGEABLE', label: lang === 'hi' ? 'हल्का असर है, सामान्य दिनचर्या जारी है' : 'Mild discomfort, able to manage daily routine' }
    ];
  }

  return {
    question: {
      id: `q_stage_${stageNum}`,
      stage_num: stageNum,
      total_stages: 7,
      stage_badge_hi: badgeHi,
      stage_badge_en: badgeEn,
      category: 'adaptive',
      text: qTextEn,
      localized_text: lang === 'hi' ? qTextHi : qTextEn,
      audio_prompt_text: lang === 'hi' ? qTextHi : qTextEn,
      input_type: inputType,
      required: true,
      options: options,
      response_context: `${symptomHi} (${symptomEn})`,
      clinical_reasoning: `Response-based adaptation focusing on ${symptomEn} reported in intake.`
    },
    plan: [1, 2, 3, 4, 5, 6, 7]
  };
}

export const KioskAPI = {
  async registerPatient(data: {
    first_name: string;
    last_name?: string;
    phone: string;
    abha_number?: string;
    date_of_birth?: string;
    gender?: string;
    preferred_language?: string;
  }) {
    try {
      const res = await fetch(`${API_BASE_URL}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('Backend offline, using local patient session', e);
    }
    // Resilient local fallback
    return {
      id: `pat_${Date.now()}`,
      hospital_patient_id: `HOSP-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      full_name: `${data.first_name} ${data.last_name || ''}`.trim(),
      abha_number_masked: data.abha_number ? `${data.abha_number.slice(0, 4)}-XXXX-0123` : '91-2345-XXXX-0123',
      phone: data.phone,
      gender: data.gender || 'FEMALE',
      preferred_language: data.preferred_language || 'hi'
    };
  },

  async recordConsent(patientId: string, language: string = 'hi') {
    try {
      const res = await fetch(`${API_BASE_URL}/patients/${patientId}/consents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purpose: 'CLINICAL_INTAKE',
          data_categories: ['DEMOGRAPHICS', 'CLINICAL_HISTORY', 'DOCUMENTS'],
          language: language,
          method: 'KIOSK_AUDIO_ACKNOWLEDGMENT'
        })
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('Consent recording offline', e);
    }
    return { consent_id: `con_${Date.now()}`, status: 'GRANTED' };
  },

  async createEncounter(patientId: string, chiefComplaintHint: string = '') {
    try {
      const res = await fetch(`${API_BASE_URL}/patients/${patientId}/encounters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: 'General Medicine & Emergency OPD',
          encounter_type: 'OUTPATIENT',
          chief_complaint_hint: chiefComplaintHint,
          priority: 'ROUTINE'
        })
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('Encounter creation offline', e);
    }
    return {
      encounter_id: `enc_${Date.now()}`,
      patient_id: patientId,
      encounter_number: `OPD-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      queue_token: `A-${String(Math.floor(10 + Math.random() * 89)).padStart(2, '0')}`,
      status: 'ARRIVED',
      priority: 'ROUTINE'
    };
  },

  async startInterview(encounterId: string, language: string = 'hi') {
    clientSession = {
      chiefComplaint: '',
      answeredIds: [],
      language
    };

    try {
      const res = await fetch(`${API_BASE_URL}/encounters/${encounterId}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          input_preference: 'VOICE_OR_TEXT',
          modules: ['GENERAL_CLINICAL', 'EMERGENCY_TRIAGE']
        })
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('Interview start offline', e);
    }

    const firstQ = OFFLINE_QUESTIONS.find(q => q.id === 'q_chief_complaint_001');
    return {
      interview_id: `int_${Date.now()}`,
      status: 'IN_PROGRESS',
      current_question: formatClientQuestion(firstQ, language)
    };
  },

  async submitAnswer(interviewId: string, questionId: string, rawText: string, normalized?: any, questionText?: string) {
    if (questionId === 'q_chief_complaint_001' || !clientSession.chiefComplaint) {
      clientSession.chiefComplaint = rawText;
    }
    if (!clientSession.answeredIds.includes(questionId)) {
      clientSession.answeredIds.push(questionId);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/interviews/${interviewId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_id: questionId,
          question_text: questionText || questionId,
          input_type: 'VOICE',
          raw_text: rawText,
          normalized_answer: normalized || { answer: rawText },
          confidence: 0.94
        })
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('Submit answer offline fallback', e);
    }

    // Dynamic offline branching fallback
    const { question: nextQ, plan } = getClientNextQuestion(
      clientSession.answeredIds,
      clientSession.chiefComplaint,
      clientSession.language
    );

    const progressPct = Math.min(100, Math.round((clientSession.answeredIds.length / plan.length) * 100));

    // Client-side red flag evaluator
    const alerts: any[] = [];
    const t = (clientSession.chiefComplaint + ' ' + rawText).toLowerCase();
    if (['chest', 'heart', 'सीने', 'छाती'].some(k => t.includes(k)) && (t.includes('left') || t.includes('arm') || t.includes('sweat') || t.includes('breath') || Number(rawText) >= 7)) {
      alerts.push({
        rule_id: 'CARDIAC_001',
        alert_type: 'RED_FLAG_CARDIAC',
        severity: 'CRITICAL',
        triggered_symptoms: ['Chest pain', 'Severe pain scale'],
        suggested_action: 'Immediate 12-lead ECG and emergency triage referral'
      });
    }

    return {
      response_id: `resp_${Date.now()}`,
      interview_progress: progressPct,
      next_question: nextQ,
      red_flag_check: {
        status: alerts.length > 0 ? 'ALERT_TRIGGERED' : 'NO_ALERT',
        alerts
      }
    };
  },

  async uploadDocument(encounterId: string, file: File, docType: string = 'PRESCRIPTION') {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', docType);

      const res = await fetch(`${API_BASE_URL}/encounters/${encounterId}/documents`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const json = await res.json();
        return json.data;
      }
    } catch (e) {
      console.warn('Document upload offline', e);
    }
    return {
      document_id: `doc_${Date.now()}`,
      processing_status: 'COMPLETED',
      original_filename: file.name,
      entity_count: 2
    };
  },

  async completeInterview(interviewId: string) {
    try {
      const res = await fetch(`${API_BASE_URL}/interviews/${interviewId}/complete`, {
        method: 'POST'
      });
      if (res.ok) {
        return (await res.json()).data;
      }
    } catch (e) {
      console.warn('Complete interview offline', e);
    }
    return { interview_id: interviewId, status: 'COMPLETED' };
  }
};
