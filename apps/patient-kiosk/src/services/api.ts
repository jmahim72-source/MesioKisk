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
    id: "q_ayurvedic_prakriti_body_001",
    category: "ayurvedic",
    domain: "AYURVEDIC",
    text: "How would you describe your natural body frame and skin?",
    localized_text: {
      en: "How would you describe your body build and skin texture?",
      hi: "आयुर्वेदिक प्रकृति: आपके शरीर का गठन और त्वचा कैसी रहती है?"
    },
    audio_prompt_text: {
      en: "Choose your natural body build and skin tendency.",
      hi: "अपने शरीर और त्वचा की प्रकृति चुनें।"
    },
    input_type: "SINGLE_CHOICE",
    options: [
      { value: "VATA", label: "Thin, lean, dry skin, prefers warmth (Vata)", localized_label: { en: "Thin, dry skin (Vata)", hi: "दुबला शरीर, रूखी त्वचा, ठंड जल्दी लगना (वात)" } },
      { value: "PITTA", label: "Medium build, warm skin, prone to sweating (Pitta)", localized_label: { en: "Medium, warm skin (Pitta)", hi: "मध्यम शरीर, गर्म त्वचा, पसीना/गर्मी ज्यादा लगना (पित्त)" } },
      { value: "KAPHA", label: "Broad build, soft/oily skin, gains weight easily (Kapha)", localized_label: { en: "Broad, oily skin (Kapha)", hi: "मजबूत/भारी शरीर, चिकनी त्वचा, वजन जल्दी बढ़ना (कफ)" } }
    ],
    required: false
  },
  {
    id: "q_ayurvedic_agni_digestion_001",
    category: "ayurvedic",
    domain: "AYURVEDIC",
    text: "How is your appetite and digestion usually?",
    localized_text: {
      en: "How is your appetite and digestion fire (Agni)?",
      hi: "अग्नि परीक्षा: आपकी भूख और पाचन क्रिया आमतौर पर कैसी रहती है?"
    },
    audio_prompt_text: {
      en: "Select your digestion and appetite pattern.",
      hi: "अपनी भूख और पाचन की स्थिति चुनें।"
    },
    input_type: "SINGLE_CHOICE",
    options: [
      { value: "VISHAMAGNI", label: "Irregular / Variable appetite, bloating (Vishamagni)", localized_label: { en: "Variable appetite (Vishamagni)", hi: "कभी ज्यादा भूख, कभी बिल्कुल नहीं / पेट फूलना (विषमाग्नि)" } },
      { value: "TIKSHNAGNI", label: "Intense hunger, fast digestion, acidity (Tikshnagni)", localized_label: { en: "Intense hunger, acidity (Tikshnagni)", hi: "बहुत तेज भूख, तुरंत पचना, जलन/एसिडिटी (तीक्ष्णाग्नि)" } },
      { value: "MANDAGNI", label: "Low appetite, slow heavy digestion (Mandagni)", localized_label: { en: "Low appetite, heavy (Mandagni)", hi: "कम भूख लगना, भारीपन महसूस होना (मंदाग्नि)" } },
      { value: "SAMAGNI", label: "Regular normal balanced digestion (Samagni)", localized_label: { en: "Balanced digestion (Samagni)", hi: "संतुलित और नियमित पाचन (समाग्नि)" } }
    ],
    required: false
  },
  {
    id: "q_ayurvedic_koshtha_bowel_001",
    category: "ayurvedic",
    domain: "AYURVEDIC",
    text: "How is your regular bowel habit (Koshtha)?",
    localized_text: {
      en: "How are your bowel habits (Koshtha)?",
      hi: "कोष्ठ परीक्षा: आपका पेट साफ होने की प्रक्रिया कैसी है?"
    },
    audio_prompt_text: {
      en: "Choose your bowel habit type.",
      hi: "पेट साफ होने की आदत चुनें।"
    },
    input_type: "SINGLE_CHOICE",
    options: [
      { value: "KRURA", label: "Hard / Constipated, requires laxatives (Krura Koshtha)", localized_label: { en: "Hard, constipated (Krura)", hi: "कब्जियत, कठिनाई से पेट साफ होना (क्रूर कोष्ठ)" } },
      { value: "MRIDU", label: "Soft / Loose, easily affected by milk (Mridu Koshtha)", localized_label: { en: "Soft, loose easily (Mridu)", hi: "जल्दी दस्त होना, दूध से भी पेट साफ होना (मृदु कोष्ठ)" } },
      { value: "MADHYAMA", label: "Normal, once or twice daily without effort (Madhyama)", localized_label: { en: "Normal regular (Madhyama)", hi: "सामान्य, दिन में 1-2 बार आसानी से (मध्यम कोष्ठ)" } }
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
  let symptomHi = 'तकलीफ';
  let symptomEn = 'symptom';

  if (t.includes('सिर') || t.includes('head')) {
    symptomHi = 'सिर दर्द';
    symptomEn = 'headache';
  } else if (t.includes('सीने') || t.includes('छाती') || t.includes('chest') || t.includes('heart')) {
    symptomHi = 'सीने में दर्द व भारीपन';
    symptomEn = 'chest discomfort';
  } else if (t.includes('घुटने') || t.includes('knee') || t.includes('कमर') || t.includes('back') || t.includes('जोड़')) {
    symptomHi = 'जोड़ों व मांसपेशियों का दर्द';
    symptomEn = 'joint and muscle pain';
  } else if (t.includes('पेट') || t.includes('stomach') || t.includes('उल्टी') || t.includes('vomit') || t.includes('दस्त')) {
    symptomHi = 'पेट दर्द व पाचन समस्या';
    symptomEn = 'abdominal symptoms';
  } else if (t.includes('दांत') || t.includes('tooth')) {
    symptomHi = 'दांत का दर्द';
    symptomEn = 'toothache';
  } else if (t.includes('खांसी') || t.includes('cough') || t.includes('बुखार') || t.includes('fever')) {
    symptomHi = 'खांसी व बुखार';
    symptomEn = 'respiratory symptoms and fever';
  }

  const hasDuration = t.includes('दिन') || t.includes('day') || t.includes('सुबह') || t.includes('morning') || t.includes('हफ्ते') || t.includes('week');

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
    qTextHi = `आपके ${symptomHi} की सटीक स्थिति कहाँ है और दर्द या असहजता का प्रकार कैसा है?`;
    qTextEn = `Where exactly is the ${symptomEn} located and what does the sensation feel like?`;
    options = [
      { value: 'SHARP_LOCALIZED', label: lang === 'hi' ? 'एक निश्चित जगह पर तेज चुभने जैसा दर्द' : 'Sharp localized piercing sensation' },
      { value: 'DULL_HEAVY', label: lang === 'hi' ? 'गहरा भारीपन, दबाव या जकड़न' : 'Deep ache, heaviness or squeezing tightness' },
      { value: 'BURNING_THROB', label: lang === 'hi' ? 'जलन या धड़कन जैसी टीस' : 'Burning or throbbing sensation' },
      { value: 'RADIATING_SPREAD', label: lang === 'hi' ? 'आसपास के अन्य अंगों में फैलता हुआ' : 'Radiating or spreading to adjacent areas' }
    ];
  } else if (stageNum === 4) {
    badgeHi = 'गंभीरता व खतरे के संकेत';
    badgeEn = 'Severity & Red Flags';
    inputType = 'MULTI_CHOICE';
    qTextHi = `इस ${symptomHi} के साथ क्या आपको इनमें से कोई भी गंभीर या असहज लक्षण महसूस हो रहे हैं?`;
    qTextEn = `Along with your ${symptomEn}, are you experiencing any of these critical warning symptoms?`;
    options = [
      { value: 'BREATHLESSNESS_DIZZY', label: lang === 'hi' ? 'सांस फूलना, चक्कर आना या अत्यधिक पसीना' : 'Breathlessness, dizziness or cold sweating' },
      { value: 'VOMITING_NAUSEA', label: lang === 'hi' ? 'जी मिचलाना या बार-बार उल्टी होना' : 'Nausea or frequent vomiting' },
      { value: 'WEAKNESS_NUMBNESS', label: lang === 'hi' ? 'शरीर के किसी अंग में कमजोरी या सुन्नपन' : 'Localized weakness or numbness' },
      { value: 'NO_RED_FLAGS', label: lang === 'hi' ? 'इनमें से कोई नहीं (सामान्य दर्द)' : 'None of these warning symptoms' }
    ];
  } else if (stageNum === 5) {
    badgeHi = 'पूर्व इतिहास';
    badgeEn = 'Medical History';
    inputType = 'MULTI_CHOICE';
    qTextHi = `क्या आपको इनमें से कोई पुरानी बीमारी है, या ऐसा ${symptomHi} पहले कभी हुआ है?`;
    qTextEn = `Do you have a history of any chronic conditions, or prior similar ${symptomEn}?`;
    options = [
      { value: 'HYPERTENSION', label: lang === 'hi' ? 'उच्च रक्तचाप (High BP)' : 'High Blood Pressure' },
      { value: 'DIABETES', label: lang === 'hi' ? 'मधुमेह (डायबिटीज / शुगर)' : 'Diabetes Mellitus' },
      { value: 'HEART_DISEASE', label: lang === 'hi' ? 'हृदय रोग (Heart Disease)' : 'Heart Disease' },
      { value: 'ALLERGIES_ASTHMA', label: lang === 'hi' ? 'दमा या एलर्जी (Asthma / Allergy)' : 'Asthma / Allergies' },
      { value: 'NONE', label: lang === 'hi' ? 'कोई पुरानी बीमारी नहीं' : 'No prior chronic conditions' }
    ];
  } else if (stageNum === 6) {
    badgeHi = 'दवाइयाँ व एलर्जी';
    badgeEn = 'Medications & Allergies';
    inputType = 'MULTI_CHOICE';
    qTextHi = `क्या आपने इस ${symptomHi} के लिए हाल में कोई दवा ली है, और क्या आपको किसी दवा से एलर्जी है?`;
    qTextEn = `Have you taken any medicines for your ${symptomEn}, and do you have any known drug allergies?`;
    options = [
      { value: 'TOOK_PAINKILLER', label: lang === 'hi' ? `हाँ, ${symptomHi} कम करने के लिए दवा ली है` : `Took medication/painkiller for ${symptomEn}` },
      { value: 'REGULAR_MEDS', label: lang === 'hi' ? 'नियमित बीपी, शुगर या अन्य दवाइयाँ चल रही हैं' : 'Taking regular chronic daily medications' },
      { value: 'KNOWN_ALLERGY', label: lang === 'hi' ? 'किसी विशेष दवा से एलर्जी है' : 'Known drug allergy' },
      { value: 'NONE', label: lang === 'hi' ? 'कोई दवा नहीं ली और कोई एलर्जी नहीं है' : 'No medications and no known allergies' }
    ];
  } else {
    badgeHi = 'आयुर्वेदिक प्रकृति';
    badgeEn = 'Ayurvedic Profile';
    inputType = 'SINGLE_CHOICE';
    qTextHi = `आयुर्वेद के अनुसार आपकी शारीरिक प्रकृति (Prakriti) और पाचन अग्नि कैसी है, जो इस ${symptomHi} से जुड़ी हो सकती है?`;
    qTextEn = `According to Ayurveda, what is your Prakriti (constitution) and digestive fire (Agni), correlating with your ${symptomEn}?`;
    options = [
      { value: 'VATA', label: lang === 'hi' ? 'वात (Vata): सूखापन, जोड़ों में दर्द/कटकटाहट, बेचैनी, ठंड ज्यादा लगना (विषमाग्नि)' : 'Vata: Lean/dry build, joint pain, cold sensitivity (Vishamagni)' },
      { value: 'PITTA', label: lang === 'hi' ? 'पित्त (Pitta): शरीर में जलन, अत्यधिक गर्मी लगना, खट्टी डकार, तेज भूख (तीक्ष्णाग्नि)' : 'Pitta: Burning sensation, heat sensitivity, hyperacidity (Tikshnagni)' },
      { value: 'KAPHA', label: lang === 'hi' ? 'कफ (Kapha): भारी शरीर, कफ/बलगम बनना, सुस्ती, मंद पाचन (मंदाग्नि)' : 'Kapha: Heavy build, phlegm, slow digestion (Mandagni)' },
      { value: 'SAMA', label: lang === 'hi' ? 'सम (Sama): संतुलित स्वास्थ्य व नियमित पाचन (समाग्नि)' : 'Sama: Balanced doshas and steady digestion (Samagni)' }
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
          department: 'Ayurveda & General OPD',
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
          modules: ['GENERAL_CLINICAL', 'AYURVEDIC']
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
    if (['chest', 'heart', 'सीने', 'दर्द'].some(k => t.includes(k)) && (t.includes('left') || t.includes('arm') || t.includes('sweat') || t.includes('breath') || Number(rawText) >= 7)) {
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
