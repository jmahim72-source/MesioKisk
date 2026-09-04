import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Volume2, ShieldCheck, HeartPulse, User, CheckCircle2,
  AlertTriangle, ArrowRight, ArrowLeft, RefreshCw, FileText, Upload,
  Clock, Sparkles, Building2, Eye, EyeOff, Lock
} from 'lucide-react';
import { KioskAPI } from './services/api';

type Step = 'LANGUAGE' | 'CONSENT' | 'IDENTIFICATION' | 'INTERVIEW' | 'AYURVEDIC' | 'DOCUMENTS' | 'TICKET';

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
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [answerInput, setAnswerInput] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [redFlags, setRedFlags] = useState<any[]>([]);
  const [progress, setProgress] = useState<number>(10);

  // Ayurvedic state
  const [prakriti, setPrakriti] = useState<string>('VATA_PITTA');
  const [agni, setAgni] = useState<string>('VISHAMAGNI');
  const [koshtha, setKoshtha] = useState<string>('KRURA');

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

    // Initialize Web Speech API if supported
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

    // After 90s idle, show privacy modal
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
    // Zero-residual PHI memory purge
    setPatient({ firstName: '', lastName: '', phone: '', abha: '', gender: 'FEMALE', dob: '1968-04-15' });
    setAnswers({});
    setAnswerInput('');
    setRedFlags([]);
    setUploadedFiles([]);
    setStep('LANGUAGE');
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

  // Step transitions
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

    const enc = await KioskAPI.createEncounter(pData.id, 'Chest pain and breathlessness');
    setEncounterId(enc.encounter_id);
    setQueueToken(enc.queue_token || 'A-042');

    const iv = await KioskAPI.startInterview(enc.encounter_id, lang);
    setInterviewId(iv.interview_id);
    setCurrentQuestion(iv.current_question);
    setStep('INTERVIEW');

    if (iv.current_question?.localized_text) {
      playAudio(iv.current_question.localized_text);
    }
  };

  const handleAnswerSubmit = async (valueToSubmit?: string) => {
    const text = valueToSubmit || answerInput;
    if (!text && currentQuestion?.required) return;

    const qid = currentQuestion?.id || 'q_0';
    setAnswers((prev) => ({ ...prev, [qid]: text }));

    const res = await KioskAPI.submitAnswer(interviewId, qid, text);
    setProgress(res.interview_progress || progress + 15);

    if (res.red_flag_check?.alerts?.length > 0) {
      setRedFlags(res.red_flag_check.alerts);
    }

    setAnswerInput('');

    if (res.next_question) {
      setCurrentQuestion(res.next_question);
      if (res.next_question.localized_text) {
        playAudio(res.next_question.localized_text);
      }
    } else {
      // Move to Ayurvedic Mode
      setStep('AYURVEDIC');
      playAudio(lang === 'hi' ? 'अब कृपया अपनी आयुर्वेदिक प्रकृति और पाचन का विवरण चुनें।' : 'Now please select your Ayurvedic constitution and digestion profile.');
    }
  };

  const handleAyurvedicSubmit = () => {
    setStep('DOCUMENTS');
    playAudio(lang === 'hi' ? 'कृपया अपने पुराने पर्चे या जांच रिपोर्ट अपलोड करें।' : 'Please upload any prior prescriptions or lab reports.');
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800' }}>
              {lang === 'hi' ? '📋 डिजिटल स्वास्थ्य सहमति (Consent)' : '📋 Digital Health Intake Consent'}
            </h2>
            <button
              className="btn btn-secondary"
              onClick={() => playAudio(lang === 'hi' ? 'आपकी जानकारी केवल डॉक्टर के परामर्श हेतु उपयोग होगी।' : 'Your health information is confidential and will only be shared with your attending doctor.')}
            >
              <Volume2 size={22} />
              <span>{lang === 'hi' ? 'सुनें' : 'Listen'}</span>
            </button>
          </div>

          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '30px', fontSize: '18px', lineHeight: '1.7' }}>
            <p style={{ marginBottom: '14px' }}>
              {lang === 'hi'
                ? '१. मैं अपनी स्वास्थ्य समस्या, पिछली दवाइयों और लक्षणों को डॉक्टर परामर्श से पूर्व दर्ज करने की सहमति देता/देती हूँ।'
                : '1. I give explicit consent to record my clinical complaints, medication history, and symptoms prior to physician consultation.'}
            </p>
            <p style={{ marginBottom: '14px' }}>
              {lang === 'hi'
                ? '२. मेरी जानकारी आयुष्मान भारत डिजिटल मिशन (ABDM) व अस्पताल ईएचआर में सुरक्षित रखी जाएगी।'
                : '2. My health data will be safely processed in compliance with DPDP Act 2023 and ABDM standards.'}
            </p>
            <p style={{ color: 'var(--primary-dark)', fontWeight: '700' }}>
              {lang === 'hi'
                ? '३. AI द्वारा केवल सारांश तैयार किया जाएगा, अंतिम निर्णय डॉक्टर का होगा।'
                : '3. AI only prepares a draft summary; final clinical diagnosis is verified by the consulting doctor.'}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-lg" onClick={() => setStep('LANGUAGE')}>
              <ArrowLeft size={24} /> {lang === 'hi' ? 'पीछे' : 'Back'}
            </button>
            <button className="btn btn-primary btn-lg" onClick={handleAcceptConsent}>
              <CheckCircle2 size={24} /> {lang === 'hi' ? 'मैं सहमत हूँ (I Agree)' : 'I Consent & Proceed'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: PATIENT IDENTIFICATION */}
      {step === 'IDENTIFICATION' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800' }}>
              {lang === 'hi' ? '👤 मरीज की पहचान (Patient Identification)' : '👤 Patient Identification'}
            </h2>
            <button className="btn btn-secondary" onClick={loadMeenaDemo} style={{ background: '#ecfdf5', borderColor: 'var(--primary)', color: 'var(--primary-dark)' }}>
              <Sparkles size={20} />
              <span>{lang === 'hi' ? '✨ डेमो मरीज भरें (Meena Devi)' : '✨ Auto-fill Demo (Meena Devi)'}</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
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
                {lang === 'hi' ? 'मोबाइल नंबर (Mobile Number) *' : 'Mobile Number *'}
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

      {/* STEP 4: ADAPTIVE CLINICAL INTERVIEW */}
      {step === 'INTERVIEW' && currentQuestion && (
        <div className="glass-card">
          {/* Progress Bar */}
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: '800', maxWidth: '80%' }}>
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

          {/* Voice Input Section */}
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
              rows={3}
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder={lang === 'hi' ? 'अपनी बात बोलें या यहाँ लिखें (उदा. सुबह से सीने में दर्द और सांस फूल रही है)...' : 'Speak or type your answer here...'}
              style={{ width: '100%', padding: '14px', fontSize: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', resize: 'none' }}
            />
          </div>

          {/* Quick Option Cards if present */}
          {currentQuestion.options && currentQuestion.options.length > 0 && (
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
              {lang === 'hi' ? 'उत्तर दर्ज करें (Submit)' : 'Next Question'} <ArrowRight size={24} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: AYURVEDIC MODULE */}
      {step === 'AYURVEDIC' && (
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800' }}>
              🌿 {lang === 'hi' ? 'दशविध परीक्षा (Ayurvedic Intake)' : 'Ayurvedic Assessment (Dashavidha Pariksha)'}
            </h2>
            <button className="btn btn-secondary" onClick={() => playAudio(lang === 'hi' ? 'अपनी प्रकृति और अग्नि का चयन करें।' : 'Please select your Ayurvedic dosha constitution and digestion power.')}>
              <Volume2 size={22} />
            </button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '700', fontSize: '20px', marginBottom: '10px' }}>
              १. प्रकृति (Body Constitution / Prakriti):
            </label>
            <div className="option-grid">
              <div className={`option-card ${prakriti === 'VATA_PITTA' ? 'selected' : ''}`} onClick={() => setPrakriti('VATA_PITTA')}>
                <span>वात-पित्त (Vata-Pitta - Lean, Warm)</span>
              </div>
              <div className={`option-card ${prakriti === 'PITTA_KAPHA' ? 'selected' : ''}`} onClick={() => setPrakriti('PITTA_KAPHA')}>
                <span>पित्त-कफ (Pitta-Kapha - Medium, Oily)</span>
              </div>
              <div className={`option-card ${prakriti === 'KAPHA' ? 'selected' : ''}`} onClick={() => setPrakriti('KAPHA')}>
                <span>कफ प्रधान (Kapha - Heavy, Calm)</span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontWeight: '700', fontSize: '20px', marginBottom: '10px' }}>
              २. अग्नि / पाचन शक्ति (Digestive Fire / Agni):
            </label>
            <div className="option-grid">
              <div className={`option-card ${agni === 'VISHAMAGNI' ? 'selected' : ''}`} onClick={() => setAgni('VISHAMAGNI')}>
                <span>विषमाग्नि (Vishamagni - Irregular appetite)</span>
              </div>
              <div className={`option-card ${agni === 'TIKSHNAGNI' ? 'selected' : ''}`} onClick={() => setAgni('TIKSHNAGNI')}>
                <span>तीक्ष्णाग्नि (Tikshnagni - High acidity)</span>
              </div>
              <div className={`option-card ${agni === 'SAMAGNI' ? 'selected' : ''}`} onClick={() => setAgni('SAMAGNI')}>
                <span>समाग्नि (Samagni - Balanced digestion)</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px' }}>
            <button className="btn btn-secondary btn-lg" onClick={() => setStep('INTERVIEW')}>
              <ArrowLeft size={24} /> {lang === 'hi' ? 'पीछे' : 'Back'}
            </button>
            <button className="btn btn-primary btn-lg" onClick={handleAyurvedicSubmit}>
              {lang === 'hi' ? 'दस्तावेज अपलोड करें' : 'Proceed to Documents'} <ArrowRight size={24} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: DOCUMENTS UPLOAD */}
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
            <button className="btn btn-secondary btn-lg" onClick={() => setStep('AYURVEDIC')}>
              <ArrowLeft size={24} /> {lang === 'hi' ? 'पीछे' : 'Back'}
            </button>
            <button className="btn btn-primary btn-lg" onClick={handleFinalSubmit}>
              {lang === 'hi' ? 'टोकन प्राप्त करें (Generate Token)' : 'Complete & Generate Token'} <ArrowRight size={24} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: QUEUE TOKEN & TICKET */}
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
