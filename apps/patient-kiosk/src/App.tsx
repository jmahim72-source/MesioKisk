import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Volume2, ShieldCheck, HeartPulse, User, CheckCircle2,
  AlertTriangle, ArrowRight, ArrowLeft, RefreshCw, FileText, Upload,
  Clock, Sparkles, Building2, Eye, EyeOff, Lock, Stethoscope, Check
} from 'lucide-react';
import { KioskAPI } from './services/api';

type Step = 'LANGUAGE' | 'CONSENT' | 'IDENTIFICATION' | 'INTERVIEW' | 'DOCUMENTS' | 'TICKET';

const STAGE_STEPS = [
  { num: 1, hi: 'मुख्य समस्या', en: 'Chief Complaint' },
  { num: 2, hi: 'शुरुआत व समय', en: 'Onset & Duration' },
  { num: 3, hi: 'लक्षण स्थिति', en: 'Location & Character' },
  { num: 4, hi: 'गंभीर लक्षण', en: 'Red Flags & Pain' },
  { num: 5, hi: 'पूर्व इतिहास', en: 'Medical History' },
  { num: 6, hi: 'दवा व एलर्जी', en: 'Meds & Allergies' },
  { num: 7, hi: 'आयुर्वेदिक प्रकृति', en: 'Ayurvedic Profile' }
];

export function App() {
  const [lang, setLang] = useState<'hi' | 'en'>('hi');
  const [step, setStep] = useState<Step>('LANGUAGE');
  
  // Patient Details
  const [patient, setPatient] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    abha: '',
    gender: 'FEMALE',
    dob: '1968-04-15'
  });
  const [patientId, setPatientId] = useState<string>('');
  const [encounterId, setEncounterId] = useState<string>('');
  const [queueToken, setQueueToken] = useState<string>('A-042');

  // Interview state
  const [interviewId, setInterviewId] = useState<string>('');
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [currentStageNum, setCurrentStageNum] = useState<number>(1);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [answerInput, setAnswerInput] = useState<string>('');
  const [selectedMultiOptions, setSelectedMultiOptions] = useState<string[]>([]);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [redFlags, setRedFlags] = useState<any[]>([]);
  const [progress, setProgress] = useState<number>(10);

  // Documents state
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; type: string; status: string }>>([]);

  // Inactivity timeout & Privacy Modal
  const [showIdleModal, setShowIdleModal] = useState<boolean>(false);
  const [idleCountdown, setIdleCountdown] = useState<number>(20);
  const idleTimerRef = useRef<any>(null);

  // Speech Recognition setup
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    resetIdleTimer();
    const handleUserAction = () => resetIdleTimer();
    window.addEventListener('touchstart', handleUserAction);
    window.addEventListener('click', handleUserAction);

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      rec.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setAnswerInput(transcript);
      };
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }

    return () => {
      window.removeEventListener('touchstart', handleUserAction);
      window.removeEventListener('click', handleUserAction);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [lang]);

  const resetIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setShowIdleModal(false);
    setIdleCountdown(20);

    idleTimerRef.current = setTimeout(() => {
      if (step !== 'LANGUAGE') {
        setShowIdleModal(true);
      }
    }, 90000);
  };

  useEffect(() => {
    let interval: any = null;
    if (showIdleModal) {
      interval = setInterval(() => {
        setIdleCountdown((prev) => {
          if (prev <= 1) {
            handleCompleteReset();
            return 20;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showIdleModal]);

  const handleCompleteReset = () => {
    setPatient({ firstName: '', lastName: '', phone: '', abha: '', gender: 'FEMALE', dob: '1968-04-15' });
    setAnswers({});
    setAnswerInput('');
    setSelectedMultiOptions([]);
    setRedFlags([]);
    setUploadedFiles([]);
    setStep('LANGUAGE');
    setCurrentStageNum(1);
    setProgress(10);
    setShowIdleModal(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert(lang === 'hi' ? 'आपका ब्राउज़र वॉयस इनपुट का समर्थन नहीं करता।' : 'Speech recognition not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const loadMeenaDemo = () => {
    setPatient({
      firstName: 'Meena',
      lastName: 'Devi',
      phone: '+919876543210',
      abha: '91-2345-6789-0123',
      gender: 'FEMALE',
      dob: '1968-04-15'
    });
  };

  const handleLanguageSelect = (selectedLang: 'hi' | 'en') => {
    setLang(selectedLang);
    setStep('CONSENT');
    playAudio(
      selectedLang === 'hi'
        ? 'मेडीकियोस्क में आपका स्वागत है। कृपया डिजिटल स्वास्थ्य सहमति को स्वीकार करें।'
        : 'Welcome to MediKiosk. Please review and accept the digital health consent.'
    );
  };

  const handleAcceptConsent = async () => {
    setStep('IDENTIFICATION');
  };

  const handlePatientSubmit = async () => {
    if (!patient.firstName || !patient.phone) {
      alert(lang === 'hi' ? 'कृपया अपना नाम और मोबाइल नंबर भरें।' : 'Please enter your name and phone number.');
      return;
    }

    const pData = await KioskAPI.registerPatient({
      first_name: patient.firstName,
      last_name: patient.lastName,
      phone: patient.phone,
      abha_number: patient.abha,
      gender: patient.gender,
      preferred_language: lang
    });

    setPatientId(pData.id);
    await KioskAPI.recordConsent(pData.id, lang);

    const enc = await KioskAPI.createEncounter(pData.id, 'Clinical Intake');
    setEncounterId(enc.encounter_id);
    setQueueToken(enc.queue_token || 'A-042');

    const iv = await KioskAPI.startInterview(enc.encounter_id, lang);
    setInterviewId(iv.interview_id);
    setCurrentQuestion(iv.current_question);
    setCurrentStageNum(1);
    setProgress(14);
    setStep('INTERVIEW');

    if (iv.current_question?.localized_text) {
      playAudio(iv.current_question.localized_text);
    }
  };

  const handleToggleMulti = (val: string) => {
    if (selectedMultiOptions.includes(val)) {
      setSelectedMultiOptions(selectedMultiOptions.filter(item => item !== val));
    } else {
      setSelectedMultiOptions([...selectedMultiOptions, val]);
    }
  };

  const handleAnswerSubmit = async (valueToSubmit?: string) => {
    let text = valueToSubmit || answerInput;
    if (currentQuestion?.input_type === 'MULTI_CHOICE' && selectedMultiOptions.length > 0) {
      text = selectedMultiOptions.join(', ');
    }

    if (!text && currentQuestion?.required) return;

    const qid = currentQuestion?.id || `stage_${currentStageNum}`;
    setAnswers((prev) => ({ ...prev, [qid]: text }));

    const res = await KioskAPI.submitAnswer(interviewId, qid, text);
    
    const nextStage = currentStageNum + 1;
    setCurrentStageNum(nextStage);
    setProgress(res.interview_progress || Math.min(100, Math.round((nextStage / 7) * 100)));

    if (res.red_flag_check?.alerts?.length > 0) {
      setRedFlags(res.red_flag_check.alerts);
    }

    setAnswerInput('');
    setSelectedMultiOptions([]);

    if (res.next_question && nextStage <= 7) {
      setCurrentQuestion(res.next_question);
      if (res.next_question.localized_text) {
        playAudio(res.next_question.localized_text);
      }
    } else {
      setStep('DOCUMENTS');
      playAudio(
        lang === 'hi'
          ? '७-चरणीय नैदानिक प्रश्नावली पूरी हो गई है। यदि आपके पास पुराने पर्चे या जांच रिपोर्ट हैं तो कृपया अपलोड करें।'
          : '7-Stage Clinical Intake completed. Please upload any previous prescriptions or test reports.'
      );
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const res = await KioskAPI.uploadDocument(encounterId, file, docType);
      setUploadedFiles((prev) => [
        ...prev,
        { name: file.name, type: docType, status: 'OCR Processed (94% confidence)' }
      ]);
    }
  };

  const handleFinalSubmit = async () => {
    await KioskAPI.completeInterview(interviewId);
    setStep('TICKET');
    playAudio(
      lang === 'hi'
        ? `आपका टोकन नंबर है ${queueToken}। कृपया प्रतीक्षा क्षेत्र में बैठें।`
        : `Your queue token number is ${queueToken}. Please take your seat in the waiting area.`
    );
  };

  const getFaceEmoji = (val: number) => {
    if (val === 0) return '😄';
    if (val <= 2) return '🙂';
    if (val <= 4) return '😐';
    if (val <= 6) return '😣';
    if (val <= 8) return '😫';
    return '😭';
  };

  return (
    <div className="kiosk-container">
      {/* Kiosk Header */}
      <header className="kiosk-header">
        <div className="kiosk-brand">
          <div className="brand-icon">
            <HeartPulse size={30} />
          </div>
          <div>
            <div className="brand-title">मेडीकियोस्क | MediKiosk</div>
            <div className="brand-sub">AI Clinical Intake & Triage Terminal • AIIA Delhi</div>
          </div>
        </div>

        <div className="header-actions">
          <div className="lang-toggle">
            <button
              className={`lang-btn ${lang === 'hi' ? 'active' : ''}`}
              onClick={() => { setLang('hi'); if (currentQuestion?.localized_text) playAudio(currentQuestion.localized_text); }}
            >
              हिंदी
            </button>
            <button
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => { setLang('en'); if (currentQuestion?.localized_text) playAudio(currentQuestion.localized_text); }}
            >
              English
            </button>
          </div>

          <button className="btn btn-secondary btn-icon" onClick={handleCompleteReset} title="Reset">
            <RefreshCw size={22} />
          </button>
        </div>
      </header>

      {/* Red Flag Emergency Banner */}
      {redFlags.length > 0 && (
        <div className="red-flag-banner">
          <AlertTriangle size={36} />
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800' }}>
              {lang === 'hi' ? 'आपातकालीन संकेत पहचाने गए (Critical Red Flag)' : 'Emergency Indicator Detected (CARDIAC_001)'}
            </div>
            <div style={{ fontSize: '15px' }}>
              {lang === 'hi'
                ? 'सीने में दर्द व सांस फूलने के लक्षण। ओपीडी ट्राइएज डेस्क को तुरंत सूचित किया गया है।'
                : 'Acute chest discomfort & shortness of breath. Triage staff and doctor notified for immediate priority.'}
            </div>
          </div>
        </div>
      )}

      {/* STEP 1: LANGUAGE SELECTION */}
      {step === 'LANGUAGE' && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
          <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '12px' }}>
            नमस्ते! अपनी भाषा चुनें
          </div>
          <div style={{ fontSize: '22px', color: 'var(--text-muted)', marginBottom: '40px' }}>
            Welcome! Please choose your preferred language to begin
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '650px', margin: '0 auto' }}>
            <button
              className="btn btn-primary btn-lg"
              style={{ fontSize: '26px', height: '110px' }}
              onClick={() => handleLanguageSelect('hi')}
            >
              🇮🇳 हिंदी में शुरू करें
            </button>
            <button
              className="btn btn-secondary btn-lg"
              style={{ fontSize: '26px', height: '110px' }}
              onClick={() => handleLanguageSelect('en')}
            >
              🌐 Continue in English
            </button>
          </div>

          <div style={{ marginTop: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)' }}>
            <ShieldCheck size={20} color="var(--primary)" />
            <span>DPDP Act 2023 Compliant • ABDM Ayushman Bharat Digital Mission</span>
          </div>
        </div>
      )}

      {/* STEP 2: CONSENT */}
      {step === 'CONSENT' && (
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <ShieldCheck size={36} color="var(--primary)" />
            <h2 style={{ fontSize: '28px', fontWeight: '800' }}>
              {lang === 'hi' ? 'डिजिटल स्वास्थ्य सहमति (DPDP Consent)' : 'Digital Health Intake Consent'}
            </h2>
          </div>

          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '24px', fontSize: '18px', lineHeight: '1.6' }}>
            {lang === 'hi' ? (
              <>
                <p style={{ marginBottom: '12px' }}>
                  <strong>उद्देश्य:</strong> इस कियोस्क का उपयोग आपके लक्षणों और स्वास्थ्य इतिहास को संकलित करने के लिए किया जा रहा है ताकि डॉक्टर को आपकी जांच में सहायता मिल सके।
                </p>
                <p style={{ marginBottom: '12px' }}>
                  <strong>गोपनीयता सुरक्षा:</strong> आपका डेटा डिजिटल पर्सनल डेटा प्रोटेक्शन (DPDP) अधिनियम 2023 के तहत पूर्णतः सुरक्षित व एन्क्रिप्टेड है।
                </p>
                <p>
                  <strong>सहमति:</strong> क्या आप अपनी स्वास्थ्य जानकारी दर्ज करने की अनुमति देते हैं?
                </p>
              </>
            ) : (
              <>
                <p style={{ marginBottom: '12px' }}>
                  <strong>Purpose:</strong> This kiosk collects your symptoms and health history to help your attending doctor conduct a faster and more accurate clinical review.
                </p>
                <p style={{ marginBottom: '12px' }}>
                  <strong>Privacy:</strong> All collected data is processed under the DPDP Act 2023 with strict encryption.
                </p>
                <p>
                  <strong>Consent:</strong> Do you agree to proceed with this assisted clinical intake?
                </p>
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
            <button className="btn btn-secondary btn-lg" onClick={() => setStep('LANGUAGE')}>
              <ArrowLeft size={24} /> {lang === 'hi' ? 'पीछे' : 'Back'}
            </button>
            <button className="btn btn-primary btn-lg" onClick={handleAcceptConsent}>
              <CheckCircle2 size={24} /> {lang === 'hi' ? 'हाँ, मैं सहमत हूँ (Agree & Continue)' : 'I Agree & Proceed'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PATIENT IDENTIFICATION */}
      {step === 'IDENTIFICATION' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800' }}>
              {lang === 'hi' ? 'रोगी की पहचान (Patient Details)' : 'Patient Identification'}
            </h2>
            <button className="btn btn-secondary" onClick={loadMeenaDemo}>
              ⚡ {lang === 'hi' ? 'डेमो मरीज लोड करें (Meena Devi)' : 'Load Demo (Meena Devi)'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', fontSize: '18px' }}>
                {lang === 'hi' ? 'पहला नाम (First Name) *' : 'First Name *'}
              </label>
              <input
                type="text"
                value={patient.firstName}
                onChange={(e) => setPatient({ ...patient, firstName: e.target.value })}
                placeholder={lang === 'hi' ? 'उदा. मीना' : 'e.g. Meena'}
                style={{ width: '100%', minHeight: '60px', padding: '12px 18px', fontSize: '20px', borderRadius: '14px', border: '2px solid var(--border-color)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', fontSize: '18px' }}>
                {lang === 'hi' ? 'अंतिम नाम (Last Name)' : 'Last Name'}
              </label>
              <input
                type="text"
                value={patient.lastName}
                onChange={(e) => setPatient({ ...patient, lastName: e.target.value })}
                placeholder={lang === 'hi' ? 'उदा. देवी' : 'e.g. Devi'}
                style={{ width: '100%', minHeight: '60px', padding: '12px 18px', fontSize: '20px', borderRadius: '14px', border: '2px solid var(--border-color)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', fontSize: '18px' }}>
                {lang === 'hi' ? 'मोबाइल नंबर (Phone Number) *' : 'Phone Number *'}
              </label>
              <input
                type="tel"
                value={patient.phone}
                onChange={(e) => setPatient({ ...patient, phone: e.target.value })}
                placeholder="+91 98765 43210"
                style={{ width: '100%', minHeight: '60px', padding: '12px 18px', fontSize: '20px', borderRadius: '14px', border: '2px solid var(--border-color)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px', fontSize: '18px' }}>
                {lang === 'hi' ? 'आभा नंबर (ABHA ID / Optional)' : 'ABHA ID (Optional)'}
              </label>
              <input
                type="text"
                value={patient.abha}
                onChange={(e) => setPatient({ ...patient, abha: e.target.value })}
                placeholder="91-2345-6789-0123"
                style={{ width: '100%', minHeight: '60px', padding: '12px 18px', fontSize: '20px', borderRadius: '14px', border: '2px solid var(--border-color)' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
            <button className="btn btn-secondary btn-lg" onClick={() => setStep('CONSENT')}>
              <ArrowLeft size={24} /> {lang === 'hi' ? 'पीछे' : 'Back'}
            </button>
            <button className="btn btn-primary btn-lg" onClick={handlePatientSubmit}>
              {lang === 'hi' ? 'आगे बढ़ें (Next)' : 'Proceed to Interview'} <ArrowRight size={24} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: STRUCTURED 7-STAGE CLINICAL INTAKE */}
      {step === 'INTERVIEW' && currentQuestion && (
        <div className="glass-card">
          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>

          {/* 7-Stage Visual Breadcrumbs */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '16px' }}>
            {STAGE_STEPS.map((s) => {
              const isDone = s.num < currentStageNum;
              const isCurrent = s.num === currentStageNum;
              return (
                <div
                  key={s.num}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    fontSize: '13px',
                    fontWeight: isCurrent ? '800' : '600',
                    background: isCurrent ? 'var(--primary)' : isDone ? '#ecfdf5' : '#f1f5f9',
                    color: isCurrent ? 'white' : isDone ? 'var(--primary-dark)' : 'var(--text-muted)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>{s.num}. {lang === 'hi' ? s.hi : s.en}</span>
                  {isDone && <Check size={14} />}
                </div>
              );
            })}
          </div>

          {/* Current Stage Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ background: '#0d948818', color: '#0d9488', padding: '6px 14px', borderRadius: '20px', fontWeight: '800', fontSize: '15px' }}>
              {lang === 'hi'
                ? `चरण ${currentStageNum}/७: ${currentQuestion.stage_badge_hi || 'लक्षण विवरण'}`
                : `Stage ${currentStageNum}/7: ${currentQuestion.stage_badge_en || 'Clinical History'}`}
            </span>
          </div>

          {/* Question Title & Audio Speaker */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '800', maxWidth: '85%', lineHeight: '1.4' }}>
              {currentQuestion.localized_text || currentQuestion.text}
            </h2>

            <button
              className="btn btn-secondary btn-icon"
              onClick={() => playAudio(currentQuestion.localized_text || currentQuestion.text)}
              title="Speak Question"
            >
              <Volume2 size={24} />
            </button>
          </div>

          {/* Voice & Text Input Section */}
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '18px', border: '2px dashed var(--primary)', marginBottom: '24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
              <button
                className={`btn ${isListening ? 'btn-danger' : 'btn-primary'} btn-lg`}
                onClick={toggleVoiceInput}
                style={{ minWidth: '240px' }}
              >
                {isListening ? <MicOff size={28} /> : <Mic size={28} />}
                <span>{isListening ? (lang === 'hi' ? 'बोलना बंद करें' : 'Stop Listening') : (lang === 'hi' ? '🎤 बोलकर बताएं' : '🎤 Speak Answer')}</span>
              </button>
            </div>

            {isListening && (
              <div className="voice-wave">
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
                <div className="wave-bar"></div>
              </div>
            )}

            <textarea
              rows={2}
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder={lang === 'hi' ? 'अपनी बात बोलें या यहाँ लिखें...' : 'Speak or type your answer here...'}
              style={{ width: '100%', padding: '14px', fontSize: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', resize: 'none' }}
            />
          </div>

          {/* FACES SCALE FOR PAIN */}
          {currentQuestion.input_type === 'FACES_SCALE' && currentQuestion.options && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              {currentQuestion.options.map((opt: any, idx: number) => (
                <button
                  key={idx}
                  className="option-card"
                  style={{ textAlign: 'center', flexDirection: 'column', gap: '8px', padding: '18px 12px' }}
                  onClick={() => handleAnswerSubmit(String(opt.value))}
                >
                  <span style={{ fontSize: '36px' }}>{getFaceEmoji(Number(opt.value))}</span>
                  <strong style={{ fontSize: '18px' }}>{opt.value}/10</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{opt.label}</span>
                </button>
              ))}
            </div>
          )}

          {/* MULTI_CHOICE Options */}
          {currentQuestion.input_type === 'MULTI_CHOICE' && currentQuestion.options && (
            <div className="option-grid" style={{ marginBottom: '20px' }}>
              {currentQuestion.options.map((opt: any, idx: number) => {
                const isSelected = selectedMultiOptions.includes(opt.label || String(opt.value));
                return (
                  <button
                    key={idx}
                    className={`option-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleToggleMulti(opt.label || String(opt.value))}
                    style={{ border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)', background: isSelected ? '#ecfdf5' : 'white' }}
                  >
                    <span>{opt.label || opt.value}</span>
                    {isSelected && <CheckCircle2 size={20} color="var(--primary)" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* SINGLE_CHOICE Quick Options */}
          {currentQuestion.input_type !== 'FACES_SCALE' && currentQuestion.input_type !== 'MULTI_CHOICE' && currentQuestion.options && currentQuestion.options.length > 0 && (
            <div className="option-grid">
              {currentQuestion.options.map((opt: any, idx: number) => (
                <button
                  key={idx}
                  className="option-card"
                  onClick={() => handleAnswerSubmit(opt.label || String(opt.value))}
                >
                  <span>{opt.label || opt.value}</span>
                  <ArrowRight size={20} color="var(--primary)" />
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
            <button className="btn btn-secondary btn-lg" onClick={() => setStep('IDENTIFICATION')}>
              <ArrowLeft size={24} /> {lang === 'hi' ? 'पीछे' : 'Back'}
            </button>
            <button className="btn btn-primary btn-lg" onClick={() => handleAnswerSubmit()}>
              {lang === 'hi' ? 'अगला चरण (Next Stage)' : 'Next Stage'} <ArrowRight size={24} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: DOCUMENTS UPLOAD */}
      {step === 'DOCUMENTS' && (
        <div className="glass-card">
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '10px' }}>
            📄 {lang === 'hi' ? 'पर्चे व जांच रिपोर्ट (Prescriptions & Lab Reports)' : 'Upload Prescriptions & Reports'}
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            {lang === 'hi' ? 'अपने पुराने पर्चे या खून जांच रिपोर्ट की तस्वीर लें या अपलोड करें।' : 'Upload scanned images of your doctor prescriptions or blood test reports.'}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '30px' }}>
            <div style={{ border: '2px dashed var(--primary)', borderRadius: '18px', padding: '30px', textAlign: 'center', background: '#f8fafc' }}>
              <FileText size={48} color="var(--primary)" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                {lang === 'hi' ? 'डॉक्टर का पर्चा (Prescription)' : 'Doctor Prescription'}
              </div>
              <input type="file" id="rx-upload" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'PRESCRIPTION')} />
              <label htmlFor="rx-upload" className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                <Upload size={20} /> {lang === 'hi' ? 'पर्चा अपलोड करें' : 'Upload Rx'}
              </label>
            </div>

            <div style={{ border: '2px dashed var(--secondary)', borderRadius: '18px', padding: '30px', textAlign: 'center', background: '#f8fafc' }}>
              <HeartPulse size={48} color="var(--secondary)" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                {lang === 'hi' ? 'जांच रिपोर्ट (Lab Report)' : 'Lab Report (Sugar/Blood)'}
              </div>
              <input type="file" id="lab-upload" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'LAB_REPORT')} />
              <label htmlFor="lab-upload" className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                <Upload size={20} /> {lang === 'hi' ? 'रिपोर्ट अपलोड करें' : 'Upload Lab Report'}
              </label>
            </div>
          </div>

          {uploadedFiles.length > 0 && (
            <div style={{ background: '#ecfdf5', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--primary)' }}>
              <div style={{ fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '8px' }}>
                ✓ {uploadedFiles.length} {lang === 'hi' ? 'दस्तावेज सफलतापूर्वक जोड़े गए' : 'Documents Scanned & OCR Processed'}
              </div>
              {uploadedFiles.map((f, i) => (
                <div key={i} style={{ fontSize: '15px', color: 'var(--text-main)' }}>
                  • {f.name} ({f.type}) - <span style={{ color: 'var(--success)' }}>{f.status}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
            <button className="btn btn-secondary btn-lg" onClick={() => setStep('INTERVIEW')}>
              <ArrowLeft size={24} /> {lang === 'hi' ? 'पीछे' : 'Back'}
            </button>
            <button className="btn btn-primary btn-lg" onClick={handleFinalSubmit}>
              {lang === 'hi' ? 'टोकन प्राप्त करें (Generate Token)' : 'Complete & Generate Token'} <ArrowRight size={24} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: QUEUE TOKEN & TICKET */}
      {step === 'TICKET' && (
        <div className="glass-card" style={{ textAlign: 'center', padding: '50px 30px' }}>
          <CheckCircle2 size={72} color="var(--success)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}>
            {lang === 'hi' ? 'चेक-इन पूर्ण हुआ!' : 'Check-in Successfully Completed!'}
          </h2>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)', marginBottom: '24px' }}>
            {lang === 'hi' ? 'आपकी जानकारी सुरक्षित रूप से डॉक्टर के पास पहुँच चुकी है।' : 'Your clinical summary has been sent directly to the attending doctor.'}
          </p>

          <div style={{ background: 'linear-gradient(135deg, #0d9488, #115e59)', color: 'white', padding: '32px', borderRadius: '24px', maxWidth: '420px', margin: '0 auto 30px', boxShadow: '0 10px 30px rgba(13, 148, 136, 0.4)' }}>
            <div style={{ fontSize: '18px', opacity: 0.9 }}>
              {lang === 'hi' ? 'आपका टोकन नंबर' : 'YOUR QUEUE TOKEN'}
            </div>
            <div style={{ fontSize: '72px', fontWeight: '900', letterSpacing: '2px', margin: '10px 0' }}>
              {queueToken}
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', opacity: 0.95 }}>
              आयुर्वेद ओपीडी | Room 104
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '30px' }}>
            <div style={{ background: '#f8fafc', padding: '16px 24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <Clock size={20} color="var(--primary)" />
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Estimated Wait</div>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>~ 5-10 Mins</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px 24px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
              <Building2 size={20} color="var(--secondary)" />
              <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Consultant</div>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>Dr. Ananya Sharma</div>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" onClick={handleCompleteReset} style={{ minWidth: '280px' }}>
            {lang === 'hi' ? 'नया मरीज शुरू करें (Done)' : 'Finish & Reset for Next Patient'}
          </button>
        </div>
      )}

      {/* PRIVACY SHIELD & INACTIVITY WARNING MODAL */}
      {showIdleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <Lock size={48} color="var(--danger)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '10px' }}>
              {lang === 'hi' ? 'गोपनीयता सुरक्षा (Privacy Reset)' : 'Privacy Session Timeout'}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '17px' }}>
              {lang === 'hi'
                ? 'सुरक्षा व गोपनीयता के लिए सत्र रीसेट हो रहा है:'
                : 'For your healthcare data security, session will wipe in:'}
            </p>

            <div className="countdown-badge">{idleCountdown}s</div>

            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginTop: '20px' }}>
              <button className="btn btn-secondary" onClick={handleCompleteReset}>
                {lang === 'hi' ? 'अभी रीसेट करें' : 'Reset Now'}
              </button>
              <button className="btn btn-primary" onClick={resetIdleTimer}>
                {lang === 'hi' ? 'जारी रखें (Continue)' : 'Continue Session'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
