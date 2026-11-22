import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Volume2, ShieldCheck, HeartPulse, User, CheckCircle2,
  AlertTriangle, ArrowRight, ArrowLeft, RefreshCw, FileText, Upload,
  Clock, Sparkles, Building2, Eye, EyeOff, Lock, Stethoscope, Check,
  Activity, SlidersHorizontal, Radio, X, VolumeX, Play, HelpCircle
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

  // Voice & Speech Recognition state
  const [voiceStatus, setVoiceStatus] = useState<string>('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [lastRecognizedText, setLastRecognizedText] = useState<string>('');
  const [voiceLang, setVoiceLang] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [micVolume, setMicVolume] = useState<number>(0);
  const [showVoiceSimulator, setShowVoiceSimulator] = useState<boolean>(false);
  const [simulatorCustomText, setSimulatorCustomText] = useState<string>('');

  // Audio Device & Diagnostics state
  const [availableMics, setAvailableMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string>('');
  const [micTrackInfo, setMicTrackInfo] = useState<{ label: string; muted: boolean; readyState: string } | null>(null);
  const [echoTestState, setEchoTestState] = useState<'idle' | 'recording' | 'playing' | 'done'>('idle');

  const isListeningRef = useRef<boolean>(false);
  const recognitionInstanceRef = useRef<any>(null);
  const restartTimeoutRef = useRef<any>(null);
  const audioContextRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    resetIdleTimer();
    const handleUserAction = () => resetIdleTimer();
    window.addEventListener('touchstart', handleUserAction);
    window.addEventListener('click', handleUserAction);

    return () => {
      window.removeEventListener('touchstart', handleUserAction);
      window.removeEventListener('click', handleUserAction);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      stopVoiceInput();
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
    stopVoiceInput();
    setPatient({ firstName: '', lastName: '', phone: '', abha: '', gender: 'FEMALE', dob: '1968-04-15' });
    setAnswers({});
    setAnswerInput('');
    setSelectedMultiOptions([]);
    setRedFlags([]);
    setUploadedFiles([]);
    setLastRecognizedText('');
    setStep('LANGUAGE');
    setCurrentStageNum(1);
    setProgress(10);
    setShowIdleModal(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const playAudio = (text: string) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('SpeechSynthesis error:', e);
      }
    }
  };

  const startVolumeMeter = async (deviceId?: string) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setVoiceError(lang === 'hi' ? 'ब्राउज़र में ऑडियो कैप्चर उपलब्ध नहीं है।' : 'Audio capture not supported in this browser.');
        return;
      }

      // Stop previous stream if any
      if (mediaStreamRef.current) {
        try { mediaStreamRef.current.getTracks().forEach(t => t.stop()); } catch (e) {}
        mediaStreamRef.current = null;
      }

      const activeDevId = deviceId !== undefined ? deviceId : selectedAudioDeviceId;
      const constraints: MediaStreamConstraints = {
        audio: activeDevId
          ? { deviceId: { exact: activeDevId } }
          : {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: true
            }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;

      const track = stream.getAudioTracks()[0];
      if (track) {
        const info = {
          label: track.label || (lang === 'hi' ? 'डिफ़ॉल्ट माइक्रोफ़ोन' : 'Default Microphone'),
          muted: track.muted,
          readyState: track.readyState
        };
        setMicTrackInfo(info);

        track.onmute = () => {
          setMicTrackInfo(prev => prev ? { ...prev, muted: true } : { label: track.label || '', muted: true, readyState: track.readyState });
        };
        track.onunmute = () => {
          setMicTrackInfo(prev => prev ? { ...prev, muted: false } : { label: track.label || '', muted: false, readyState: track.readyState });
        };
      }

      // Refresh list of available input devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter(d => d.kind === 'audioinput');
        setAvailableMics(inputs);
      } catch (e) {}

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // CRITICAL FOR CHROME: AudioContext begins in 'suspended' state and needs resume()
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.2;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.fftSize);
      const interval = setInterval(() => {
        if (!isListeningRef.current) {
          clearInterval(interval);
          return;
        }

        // Time domain RMS calculation: directly sensitive to sound pressure / speech
        analyser.getByteTimeDomainData(dataArray);
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const norm = (dataArray[i] - 128) / 128; // Normalize -1.0 to 1.0
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        // Typical speech gives rms ~0.03 to 0.25; scale to 0-100%
        const level = Math.min(100, Math.round(rms * 400));
        setMicVolume(level);
      }, 50);

      audioContextRef.current = { ctx, interval };
    } catch (e: any) {
      console.warn('Volume meter audio error:', e);
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setVoiceError(
          lang === 'hi'
            ? 'माइक्रोफ़ोन अनुमति ब्लॉक है! कृपया ब्राउज़र एड्रेस बार में 🔒 लॉक पर क्लिक करके Microphone को "Allow" करें।'
            : 'Microphone permission blocked! Click the 🔒 lock icon in browser URL bar to allow microphone access.'
        );
      } else if (e.name === 'NotFoundError') {
        setVoiceError(
          lang === 'hi'
            ? 'कोई माइक्रोफ़ोन नहीं मिला! कृपया जांचें कि आपका माइक कनेक्टेड है।'
            : 'No microphone found! Please check that your microphone is plugged in.'
        );
      } else {
        setVoiceError(
          lang === 'hi'
            ? `माइक त्रुटि: ${e.message || e.name}`
            : `Microphone error: ${e.message || e.name}`
        );
      }
    }
  };

  const stopVolumeMeter = () => {
    if (audioContextRef.current) {
      try {
        clearInterval(audioContextRef.current.interval);
        audioContextRef.current.ctx.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    if (mediaStreamRef.current) {
      try {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      } catch (e) {}
      mediaStreamRef.current = null;
    }
    setMicVolume(0);
  };

  const runEchoTest = async () => {
    try {
      setEchoTestState('recording');
      const activeDevId = selectedAudioDeviceId;
      const constraints: MediaStreamConstraints = {
        audio: activeDevId ? { deviceId: { exact: activeDevId } } : true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        setEchoTestState('playing');
        audio.onended = () => {
          setEchoTestState('done');
          setTimeout(() => setEchoTestState('idle'), 3000);
        };
        audio.onerror = () => {
          setEchoTestState('idle');
        };
        audio.play().catch(e => {
          console.warn('Playback error:', e);
          setEchoTestState('idle');
        });
      };

      mediaRecorder.start();
      // Record for 3.5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 3500);
    } catch (err: any) {
      console.warn('Echo test error:', err);
      setEchoTestState('idle');
      setVoiceError(lang === 'hi' ? `माइक टेस्ट त्रुटि: ${err.message}` : `Mic test error: ${err.message}`);
    }
  };

  const handleDeviceChange = (devId: string) => {
    setSelectedAudioDeviceId(devId);
    if (isListeningRef.current) {
      startVolumeMeter(devId);
    }
  };

  const handleVoiceCommandDispatch = (rawText: string, isFinal: boolean = true) => {
    const text = rawText.trim().toLowerCase();
    setLastRecognizedText(rawText.trim());

    // 1. GLOBAL COMMANDS
    if (['reset', 'रीसेट', 'नया मरीज', 'start over', 'नया'].some(k => text.includes(k))) {
      handleCompleteReset();
      return;
    }

    if (text.includes('दोबारा बोलो') || text.includes('repeat') || text.includes('सवाल दोहराएं') || text.includes('सुनो')) {
      if (currentQuestion?.localized_text) playAudio(currentQuestion.localized_text);
      return;
    }

    // 2. STEP 1: LANGUAGE
    if (step === 'LANGUAGE') {
      if (text.includes('हिंदी') || text.includes('hindi') || text === '1' || text.includes('पहला')) {
        handleLanguageSelect('hi');
        return;
      }
      if (text.includes('english') || text.includes('अंग्रेजी') || text === '2' || text.includes('दूसरा')) {
        handleLanguageSelect('en');
        return;
      }
    }

    // 3. STEP 2: CONSENT
    if (step === 'CONSENT') {
      if (['सहमत', 'agree', 'हाँ', 'yes', 'मंजूर', 'स्वीकार', 'आगे', 'next', 'proceed'].some(w => text.includes(w))) {
        handleAcceptConsent();
        return;
      }
      if (['पीछे', 'back', 'वापस'].some(w => text.includes(w))) {
        setStep('LANGUAGE');
        return;
      }
    }

    // 4. STEP 3: IDENTIFICATION
    if (step === 'IDENTIFICATION') {
      if (['डेमो', 'demo', 'meena', 'मीना', 'भरें', 'fill'].some(w => text.includes(w))) {
        loadMeenaDemo();
        return;
      }
      if (['आगे', 'next', 'proceed', 'submit', 'शुरू', 'जारी'].some(w => text.includes(w))) {
        handlePatientSubmit();
        return;
      }
      if (['पीछे', 'back', 'वापस'].some(w => text.includes(w))) {
        setStep('CONSENT');
        return;
      }
    }

    // 5. STEP 4: INTERVIEW
    if (step === 'INTERVIEW') {
      // Put spoken speech directly into textarea live!
      setAnswerInput(rawText);

      // ONLY trigger navigation or option selection if isFinal is true!
      if (!isFinal) return;

      // Check if user said "Next" or "आगे बढ़ें"
      if (['आगे बढ़ो', 'आगे बढ़ें', 'अगला चरण', 'अगला', 'next', 'submit', 'आगे', 'done', 'हो गया'].some(cmd => text.endsWith(cmd) || text === cmd)) {
        const clean = rawText.replace(/(आगे बढ़ो|आगे बढ़ें|अगला चरण|अगला|next|submit|आगे|done|हो गया)/gi, '').trim();
        if (clean) setAnswerInput(clean);
        setTimeout(() => handleAnswerSubmit(clean || undefined), 400);
        return;
      }

      if (['पीछे', 'back', 'वापस'].some(w => text.includes(w))) {
        setStep('IDENTIFICATION');
        return;
      }

      // Check Pain Scale (FACES_SCALE)
      if (currentQuestion?.input_type === 'FACES_SCALE') {
        const numMap: Record<string, string> = {
          'शून्य': '0', 'zero': '0', '0': '0',
          'एक': '2', 'दो': '2', 'one': '2', 'two': '2', '2': '2', 'हल्का': '2', 'mild': '2',
          'तीन': '4', 'चार': '4', 'three': '4', 'four': '4', '4': '4', 'कम': '4',
          'पांच': '6', 'छह': '6', 'five': '6', 'six': '6', '6': '6', 'मध्यम': '6', 'moderate': '6',
          'सात': '8', 'आठ': '8', 'seven': '8', 'eight': '8', '8': '8', 'तेज': '8', 'severe': '8',
          'नौ': '10', 'दस': '10', 'nine': '10', 'ten': '10', '10': '10', 'असहनीय': '10', 'worst': '10'
        };
        for (const [key, val] of Object.entries(numMap)) {
          if (text.includes(key)) {
            handleAnswerSubmit(val);
            return;
          }
        }
      }

      // Check options (MULTI_CHOICE or SINGLE_CHOICE)
      if (currentQuestion?.options && currentQuestion.options.length > 0) {
        for (let i = 0; i < currentQuestion.options.length; i++) {
          const opt = currentQuestion.options[i];
          const optLabel = (opt.label || '').toLowerCase();
          const optVal = String(opt.value).toLowerCase();
          const triggers = [`विकल्प ${i + 1}`, `ऑप्शन ${i + 1}`, `option ${i + 1}`, `number ${i + 1}`];
          const ordinals = ['पहला', 'दूसरा', 'तीसरा', 'चौथा', 'पांचवां'];
          const isOrdinalMatch = ordinals[i] && text.includes(ordinals[i]);
          const isExactOpt = (optLabel && (text === optLabel || text.startsWith(optLabel))) || (optVal && text === optVal);

          if (triggers.some(t => text.includes(t)) || isOrdinalMatch || isExactOpt) {
            if (currentQuestion.input_type === 'MULTI_CHOICE') {
              handleToggleMulti(opt.label || String(opt.value));
            } else {
              handleAnswerSubmit(opt.label || String(opt.value));
            }
            return;
          }
        }
      }
    }

    // 6. STEP 5: DOCUMENTS
    if (step === 'DOCUMENTS') {
      if (['टोकन', 'token', 'समाप्त', 'complete', 'finish', 'आगे', 'next', 'done'].some(w => text.includes(w))) {
        handleFinalSubmit();
        return;
      }
      if (['पीछे', 'back', 'वापस'].some(w => text.includes(w))) {
        setStep('INTERVIEW');
        return;
      }
    }

    // 7. STEP 6: TICKET
    if (step === 'TICKET') {
      if (['नया', 'new', 'रीसेट', 'reset', 'अगला मरीज', 'finish', 'done'].some(w => text.includes(w))) {
        handleCompleteReset();
        return;
      }
    }
  };

  const safeStartRecognition = () => {
    if (!isListeningRef.current) return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceError(
        lang === 'hi'
          ? 'ब्राउज़र में Web Speech API समर्थित नहीं है। आप नीचे दिए गए त्वरित वॉयस चिप्स या वॉयस सिमुलेटर का उपयोग करें।'
          : 'Web Speech API not supported in this browser. Please use Google Chrome/Edge or tap the voice response chips below.'
      );
      setVoiceStatus(lang === 'hi' ? 'वॉयस मोड तैयार (बटन से इनपुट दें)' : 'Voice mode ready (tap chips)');
      return;
    }

    if (recognitionInstanceRef.current) {
      const old = recognitionInstanceRef.current;
      old.onend = null;
      old.onerror = null;
      old.onresult = null;
      try { old.abort(); } catch (e) {}
      recognitionInstanceRef.current = null;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = voiceLang;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setVoiceError(null);
        setVoiceStatus(
          voiceLang === 'hi-IN'
            ? '🔴 सुन रहे हैं (हिंदी)... कृपया बोलें'
            : '🔴 Listening (English)... please speak now'
        );
      };

      rec.onresult = (event: any) => {
        let fullTranscript = '';
        let hasFinal = false;

        for (let i = 0; i < event.results.length; ++i) {
          const res = event.results[i];
          fullTranscript += res[0].transcript + ' ';
          if (res.isFinal) hasFinal = true;
        }

        const candidate = fullTranscript.trim();
        if (candidate) {
          setLastRecognizedText(candidate);
          setAnswerInput(candidate);
          setVoiceStatus(lang === 'hi' ? `पहचाना गया: "${candidate}"` : `Recognized: "${candidate}"`);
          if (hasFinal) {
            handleVoiceCommandDispatch(candidate, true);
          }
        }
      };

      rec.onerror = (event: any) => {
        console.warn('SpeechRecognition error:', event.error);
        if (event.error === 'no-speech') {
          setVoiceStatus(lang === 'hi' ? '🔴 सुन रहे हैं... कृपया थोड़ा तेज बोलें' : '🔴 Listening... please speak closer to mic');
          return;
        }
        if (event.error === 'aborted') {
          return;
        }
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setVoiceError(
            lang === 'hi'
              ? 'माइक्रोफ़ोन अनुमति बंद (Blocked) है। ब्राउज़र URL बार में 🔒 पर क्लिक करके Microphone "Allow" करें।'
              : 'Microphone permission blocked. Please click the 🔒 lock icon in browser URL bar and allow microphone.'
          );
          stopVoiceInput();
        } else if (event.error === 'network') {
          setVoiceError(
            lang === 'hi'
              ? 'Google Speech नेटवर्क त्रुटि: स्पीच सर्वर कनेक्ट नहीं हो रहा। आप त्वरित वॉयस चिप्स या सिमुलेटर का उपयोग करें।'
              : 'Google Speech network error. Speech recognition server unreachable. Tap any voice chip below.'
          );
        } else if (event.error === 'audio-capture') {
          setVoiceError(
            lang === 'hi'
              ? 'ऑडियो कैप्चर त्रुटि: माइक व्यस्त हो सकता है। नीचे दिए गए वॉयस चिप्स से इनपुट दें।'
              : 'Audio capture error. Microphone might be busy. Use the voice chips below.'
          );
        }
      };

      rec.onend = () => {
        if (isListeningRef.current && rec === recognitionInstanceRef.current) {
          if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = setTimeout(() => {
            if (isListeningRef.current) {
              safeStartRecognition();
            }
          }, 250);
        } else if (!isListeningRef.current) {
          setIsListening(false);
        }
      };

      rec.start();
      recognitionInstanceRef.current = rec;
    } catch (err: any) {
      console.warn('SpeechRecognition start failed:', err);
      if (isListeningRef.current) {
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = setTimeout(() => {
          if (isListeningRef.current) safeStartRecognition();
        }, 500);
      }
    }
  };

  const startVoiceInput = () => {
    setVoiceError(null);
    setVoiceStatus(lang === 'hi' ? 'माइक शुरू हो रहा है... कृपया बोलें' : 'Microphone initializing... please speak');
    isListeningRef.current = true;
    setIsListening(true);
    startVolumeMeter();
    safeStartRecognition();
  };

  const stopVoiceInput = () => {
    isListeningRef.current = false;
    setIsListening(false);
    stopVolumeMeter();
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (recognitionInstanceRef.current) {
      const rec = recognitionInstanceRef.current;
      rec.onend = null;
      rec.onerror = null;
      rec.onresult = null;
      try { rec.abort(); } catch (e) {}
      recognitionInstanceRef.current = null;
    }
    setVoiceStatus(lang === 'hi' ? 'वॉयस इनपुट रुका हुआ है' : 'Voice input paused');
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      stopVoiceInput();
    } else {
      startVoiceInput();
    }
  };

  const simulateVoiceCommand = (commandText: string) => {
    setVoiceError(null);
    setLastRecognizedText(commandText);
    setVoiceStatus(lang === 'hi' ? `🗣️ वॉयस कमांड: "${commandText}"` : `🗣️ Voice Command: "${commandText}"`);
    handleVoiceCommandDispatch(commandText, true);
    playAudio(commandText);
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
    const qText = currentQuestion?.localized_text || currentQuestion?.text || qid;
    setAnswers((prev) => ({ ...prev, [qid]: text }));

    const res = await KioskAPI.submitAnswer(interviewId, qid, text, undefined, qText);
    
    const nextStage = currentStageNum + 1;
    setCurrentStageNum(nextStage);
    setProgress(res.interview_progress || Math.min(100, Math.round((nextStage / 7) * 100)));

    if (res.red_flag_check?.alerts?.length > 0) {
      setRedFlags(res.red_flag_check.alerts);
    }

    setAnswerInput('');
    setSelectedMultiOptions([]);

    if (res.next_question && nextStage <= 7) {
      const nq = { ...res.next_question };
      if (res.clinical_reasoning) {
        nq.clinical_reasoning = res.clinical_reasoning;
      }
      setCurrentQuestion(nq);
      if (nq.localized_text) {
        playAudio(nq.localized_text);
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
          {step === 'INTERVIEW' && (
            <button
              className={`btn ${isListening ? 'btn-danger' : 'btn-primary'}`}
              onClick={toggleVoiceInput}
              style={{
                padding: '8px 16px',
                fontSize: '15px',
                borderRadius: '24px',
                boxShadow: isListening ? '0 0 16px rgba(220, 38, 38, 0.5)' : undefined
              }}
              title={isListening ? 'माइक बंद करें (Stop Listening)' : 'माइक शुरू करें (Start Voice Assistant)'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              <span>{isListening ? (lang === 'hi' ? 'माइक सक्रिय' : 'Mic Active') : (lang === 'hi' ? 'वॉयस शुरू' : 'Voice On')}</span>
            </button>
          )}

          {step !== 'LANGUAGE' && (
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
          )}

          <button className="btn btn-secondary btn-icon" onClick={handleCompleteReset} title="Reset">
            <RefreshCw size={22} />
          </button>
        </div>
      </header>

      {/* VOICE ASSISTANT HUD BAR - ONLY SHOWN DURING CLINICAL INTERVIEW */}
      {step === 'INTERVIEW' && (
        <div style={{
          background: isListening ? '#fef2f2' : 'var(--bg-card)',
          border: isListening ? '2px solid #ef4444' : '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '20px',
          boxShadow: isListening ? '0 4px 20px rgba(239, 68, 68, 0.25)' : 'var(--shadow-sm)',
          transition: 'all 0.3s ease'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: isListening ? '#ef4444' : 'var(--primary)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isListening ? '0 0 16px rgba(239, 68, 68, 0.6)' : undefined,
              animation: isListening ? 'pulse 1.2s infinite' : undefined
            }}>
              {isListening ? <MicOff size={24} /> : <Mic size={24} />}
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>{lang === 'hi' ? '🎙️ AI वॉयस असिस्टेंट' : '🎙️ AI Voice Assistant'}</span>
                <span style={{
                  fontSize: '12px',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  background: isListening ? '#dc2626' : '#e2e8f0',
                  color: isListening ? 'white' : 'var(--text-muted)'
                }}>
                  {isListening ? (lang === 'hi' ? '🔴 सुन रहे हैं...' : '🔴 Listening...') : (lang === 'hi' ? 'स्टैंडबाय' : 'Standby')}
                </span>

                {/* Real-time VU Volume Meter dots when listening */}
                {isListening && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '6px' }} title="Microphone Live Audio Level">
                    {[10, 20, 35, 50, 70, 85].map((lvl, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: '5px',
                          height: `${10 + idx * 3}px`,
                          borderRadius: '2px',
                          background: micVolume >= lvl ? (idx > 4 ? '#ef4444' : idx > 2 ? '#f59e0b' : '#10b981') : '#cbd5e1',
                          transition: 'background 0.08s ease'
                        }}
                      />
                    ))}
                    <span style={{
                      fontSize: '12px',
                      color: micVolume > 10 ? '#059669' : '#64748b',
                      fontWeight: '800',
                      marginLeft: '4px',
                      background: micVolume > 10 ? '#dcfce7' : '#f1f5f9',
                      padding: '2px 6px',
                      borderRadius: '6px'
                    }}>
                      {micVolume}%
                    </span>
                  </div>
                )}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {micTrackInfo?.label
                  ? (lang === 'hi' ? `माइक: ${micTrackInfo.label}` : `Mic: ${micTrackInfo.label}`)
                  : (lang === 'hi' ? 'माइक से बोलें या नीचे दिए गए किसी भी वॉयस कमांड पर टैप करें' : 'Speak into your mic or tap any instant voice command chip')}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Microphone Device Selector (if multiple mics exist) */}
            {availableMics.length > 1 && (
              <select
                value={selectedAudioDeviceId}
                onChange={(e) => handleDeviceChange(e.target.value)}
                style={{
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontWeight: '600',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  maxWidth: '170px'
                }}
                title="Select Microphone Device"
              >
                <option value="">{lang === 'hi' ? '🎙️ डिफ़ॉल्ट माइक' : '🎙️ Default Mic'}</option>
                {availableMics.map((m, idx) => (
                  <option key={m.deviceId || idx} value={m.deviceId}>
                    {m.label || `Microphone ${idx + 1}`}
                  </option>
                ))}
              </select>
            )}

            {/* 3-Second Echo Test Button */}
            <button
              type="button"
              onClick={runEchoTest}
              disabled={echoTestState !== 'idle'}
              className="btn btn-secondary"
              style={{
                minHeight: '40px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: echoTestState === 'recording' ? '#fee2e2' : echoTestState === 'playing' ? '#ecfdf5' : undefined,
                borderColor: echoTestState === 'recording' ? '#ef4444' : echoTestState === 'playing' ? '#10b981' : undefined
              }}
              title="Record 3 seconds of your voice and hear it played right back"
            >
              {echoTestState === 'recording' ? (
                <>
                  <Radio size={14} color="#dc2626" className="animate-pulse" />
                  <span style={{ color: '#dc2626' }}>{lang === 'hi' ? '🔴 बोलें (3s रिकॉर्डिंग)...' : '🔴 Speak now (3s)...'}</span>
                </>
              ) : echoTestState === 'playing' ? (
                <>
                  <Volume2 size={14} color="#059669" />
                  <span style={{ color: '#059669' }}>{lang === 'hi' ? '🔊 आवाज सुन रहे हैं...' : '🔊 Playing back...'}</span>
                </>
              ) : echoTestState === 'done' ? (
                <>
                  <CheckCircle2 size={14} color="#059669" />
                  <span style={{ color: '#059669' }}>{lang === 'hi' ? 'टेस्ट सफल!' : 'Echo Test OK!'}</span>
                </>
              ) : (
                <>
                  <Volume2 size={14} />
                  <span>{lang === 'hi' ? 'माइक टेस्ट' : 'Test Mic'}</span>
                </>
              )}
            </button>

            {/* Speech Language Switcher */}
            <div style={{ display: 'flex', background: '#e2e8f0', padding: '3px', borderRadius: '20px' }}>
              <button
                type="button"
                onClick={() => {
                  setVoiceLang('hi-IN');
                  if (isListeningRef.current) {
                    safeStartRecognition();
                  }
                }}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: '700',
                  borderRadius: '16px',
                  border: 'none',
                  background: voiceLang === 'hi-IN' ? 'var(--primary)' : 'transparent',
                  color: voiceLang === 'hi-IN' ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                🇮🇳 हिंदी
              </button>
              <button
                type="button"
                onClick={() => {
                  setVoiceLang('en-IN');
                  if (isListeningRef.current) {
                    safeStartRecognition();
                  }
                }}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: '700',
                  borderRadius: '16px',
                  border: 'none',
                  background: voiceLang === 'en-IN' ? 'var(--primary)' : 'transparent',
                  color: voiceLang === 'en-IN' ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                🌐 Eng
              </button>
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => setShowVoiceSimulator(true)}
              style={{ minHeight: '40px', padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Open Voice Test & Simulator Tool"
            >
              <SlidersHorizontal size={16} />
              <span>{lang === 'hi' ? 'सिमुलेटर' : 'Simulator'}</span>
            </button>

            <button
              className={`btn ${isListening ? 'btn-danger' : 'btn-primary'}`}
              onClick={toggleVoiceInput}
              style={{ minHeight: '44px', padding: '8px 18px', fontSize: '15px' }}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              <span>{isListening ? (lang === 'hi' ? 'माइक बंद करें' : 'Stop Listening') : (lang === 'hi' ? 'माइक चालू करें' : 'Start Voice Input')}</span>
            </button>
          </div>
        </div>

        {/* Hardware / Windows Mute Warning Banner */}
        {micTrackInfo?.muted && (
          <div style={{
            background: '#fef2f2',
            border: '2px solid #ef4444',
            color: '#991b1b',
            borderRadius: '10px',
            padding: '10px 14px',
            marginTop: '10px',
            fontSize: '13px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertTriangle size={20} color="#dc2626" />
            <div>
              <div>{lang === 'hi' ? '⚠️ आपका भौतिक माइक्रोफ़ोन म्यूट (Hardware Muted) है!' : '⚠️ Your Physical Microphone is Muted in Windows/Hardware!'}</div>
              <div style={{ fontSize: '12px', fontWeight: '500', color: '#b91c1c', marginTop: '2px' }}>
                {lang === 'hi'
                  ? 'लैपटॉप कीबोर्ड पर Fn + F4 (या Mic Unmute बटन) दबाएं, या Windows Settings में माइक अनम्यूट करें।'
                  : 'Press Fn + F4 (or keyboard mic mute key), or unmute in Windows Sound Settings.'}
              </div>
            </div>
          </div>
        )}

        {/* Live Audio Waves Animation when listening */}
        {isListening && (
          <div className="voice-wave" style={{ margin: '10px 0 6px', height: '36px' }}>
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
          </div>
        )}

        {/* Recognized transcript preview */}
        {lastRecognizedText && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: '10px',
            padding: '8px 14px',
            marginTop: '10px',
            fontSize: '14px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Sparkles size={16} color="#059669" />
            <span>{lang === 'hi' ? 'पहचाना गया (Transcribed):' : 'Recognized:'} "{lastRecognizedText}"</span>
          </div>
        )}

        {/* Voice Error Banner */}
        {voiceError && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '10px',
            padding: '8px 14px',
            marginTop: '10px',
            fontSize: '13px',
            fontWeight: '600'
          }}>
            ⚠️ {voiceError}
          </div>
        )}

        {/* Dynamic Contextual Voice Commands for Current Screen */}
        <div style={{ marginTop: '12px', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
          <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {lang === 'hi' ? '⚡ इस स्क्रीन के त्वरित वॉयस कमांड (बोलें या टैप करें):' : '⚡ Voice Commands for this screen (Speak or Tap):'}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {currentStageNum === 1 && (
              <>
                <button type="button" className="voice-chip" onClick={() => simulateVoiceCommand(lang === 'hi' ? 'सीने में तेज दर्द और सांस फूल रही है' : 'Severe chest pain and breathlessness')}>
                  🎤 {lang === 'hi' ? '"सीने में तेज दर्द और सांस फूल रही है"' : '"Chest pain and breathlessness"'}
                </button>
                <button type="button" className="voice-chip" onClick={() => simulateVoiceCommand(lang === 'hi' ? 'सिर में बहुत तेज दर्द और चक्कर आ रहे हैं' : 'Severe headache and dizziness')}>
                  🎤 {lang === 'hi' ? '"सिर में बहुत तेज दर्द और चक्कर"' : '"Severe headache and dizziness"'}
                </button>
                <button type="button" className="voice-chip" onClick={() => simulateVoiceCommand(lang === 'hi' ? '२ दिन से तेज बुखार और ठंड' : 'High fever and chills for 2 days')}>
                  🎤 {lang === 'hi' ? '"२ दिन से तेज बुखार और ठंड"' : '"High fever for 2 days"'}
                </button>
              </>
            )}
            {currentStageNum === 2 && (
              <>
                <button type="button" className="voice-chip" onClick={() => simulateVoiceCommand('२ दिन से')}>
                  🎤 "२ दिन से"
                </button>
                <button type="button" className="voice-chip" onClick={() => simulateVoiceCommand('१ हफ्ते से')}>
                  🎤 "१ हफ्ते से"
                </button>
                <button type="button" className="voice-chip" onClick={() => simulateVoiceCommand('आज सुबह से')}>
                  🎤 "आज सुबह से"
                </button>
              </>
            )}
            {currentStageNum === 3 && (
              <>
                <button type="button" className="voice-chip" onClick={() => simulateVoiceCommand('सिर के दाहिने हिस्से में')}>
                  🎤 "सिर के दाहिने हिस्से में"
                </button>
                <button type="button" className="voice-chip" onClick={() => simulateVoiceCommand('सीने के बीच में भारीपन')}>
                  🎤 "सीने के बीच में भारीपन"
                </button>
                <button type="button" className="voice-chip" onClick={() => simulateVoiceCommand('पेट के ऊपरी भाग में')}>
                  🎤 "पेट के ऊपरी भाग में"
                </button>
              </>
            )}
            {currentStageNum === 4 && (
              <>
                <button type="button" className="voice-chip" onClick={() => simulateVoiceCommand('दर्द 8 है (तेज दर्द)')}>
                  🎤 "दर्द 8 (तेज दर्द)"
                </button>
                <button type="button" className="voice-chip" onClick={() => simulateVoiceCommand('दर्द 4 है (मध्यम दर्द)')}>
                  🎤 "दर्द 4 (मध्यम दर्द)"
                </button>
                <button type="button" className="voice-chip" onClick={() => simulateVoiceCommand('सांस फूलती है')}>
                  🎤 "सांस फूलती है"
                </button>
              </>
            )}
            {currentStageNum >= 5 && currentQuestion?.options?.slice(0, 3).map((opt: any, idx: number) => (
              <button key={idx} type="button" className="voice-chip" onClick={() => simulateVoiceCommand(opt.label || String(opt.value))}>
                🎤 "{opt.label || opt.value}"
              </button>
            ))}
            <button type="button" className="voice-chip" onClick={() => simulateVoiceCommand('आगे बढ़ें')}>
              🎤 "आगे बढ़ें (Next)"
            </button>
            <button type="button" className="voice-chip" onClick={() => simulateVoiceCommand('दोबारा बोलो')}>
              🎤 "दोबारा बोलो (Repeat)"
            </button>
            <button type="button" className="voice-chip" onClick={() => simulateVoiceCommand('रीसेट')} style={{ color: '#dc2626' }}>
              🔄 "रीसेट (Reset)"
            </button>
          </div>
        </div>
      </div>
      )}


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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '800' }}>
              {lang === 'hi' ? 'रोगी की पहचान (Patient Details)' : 'Patient Identification'}
            </h2>
            <button className="btn btn-secondary" onClick={loadMeenaDemo} style={{ minHeight: '44px', padding: '8px 18px', fontSize: '15px' }}>
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

          {/* Current Stage Badge & Response Context */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{ background: '#0d948818', color: '#0d9488', padding: '6px 14px', borderRadius: '20px', fontWeight: '800', fontSize: '15px' }}>
              {lang === 'hi'
                ? `चरण ${currentStageNum}/७: ${currentQuestion.stage_badge_hi || 'लक्षण विवरण'}`
                : `Stage ${currentStageNum}/7: ${currentQuestion.stage_badge_en || 'Clinical History'}`}
            </span>

            {currentQuestion.response_context && (
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px 14px', borderRadius: '20px', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} color="#0284c7" />
                <span>{lang === 'hi' ? 'लक्षण आधार: ' : 'Response focus: '}<strong>{currentQuestion.response_context}</strong></span>
              </span>
            )}
          </div>

          {currentQuestion.clinical_reasoning && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '10px 16px',
              marginBottom: '16px',
              fontSize: '14px',
              color: '#166534',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Sparkles size={16} color="#16a34a" />
              <span>
                <strong>{lang === 'hi' ? 'जवाब आधारित तर्क (Response-Based Logic):' : 'Response-Based Logic:'}</strong>{' '}
                {currentQuestion.clinical_reasoning}
              </span>
            </div>
          )}

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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <button
                className={`btn ${isListening ? 'btn-danger' : 'btn-primary'} btn-lg`}
                onClick={toggleVoiceInput}
                style={{ minWidth: '240px', boxShadow: isListening ? '0 0 16px rgba(220, 38, 38, 0.4)' : undefined }}
              >
                {isListening ? <MicOff size={28} /> : <Mic size={28} />}
                <span>{isListening ? (lang === 'hi' ? 'बोलना बंद करें' : 'Stop Listening') : (lang === 'hi' ? '🎤 बोलकर बताएं (Speak)' : '🎤 Speak Answer')}</span>
              </button>

              <button
                className="btn btn-primary btn-lg"
                onClick={() => handleAnswerSubmit()}
                style={{ background: '#059669', borderColor: '#059669' }}
                title="Submit current answer and proceed"
              >
                <CheckCircle2 size={24} />
                <span>{lang === 'hi' ? 'यह उत्तर जमा करें (Submit)' : 'Submit Answer'}</span>
              </button>
            </div>

            {/* Live Audio Activity VU Meter */}
            {isListening && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '6px 16px',
                borderRadius: '20px',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>
                  {lang === 'hi' ? 'माइक ध्वनि स्तर (Mic Level):' : 'Mic Audio Level:'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '18px' }}>
                  {[10, 25, 40, 55, 70, 85].map((lvl, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: '6px',
                        height: `${10 + idx * 3}px`,
                        borderRadius: '2px',
                        background: micVolume >= lvl ? (idx > 4 ? '#ef4444' : idx > 2 ? '#f59e0b' : '#10b981') : '#e2e8f0',
                        transition: 'background 0.08s ease'
                      }}
                    />
                  ))}
                  <span style={{ fontSize: '12px', fontWeight: '800', color: micVolume > 15 ? '#0d9488' : '#94a3b8', marginLeft: '4px' }}>
                    {micVolume}%
                  </span>
                </div>
              </div>
            )}

            {/* Live Voice Status & Diagnostics */}
            {voiceStatus && (
              <div style={{
                fontSize: '15px',
                fontWeight: '700',
                color: isListening ? '#dc2626' : '#0d9488',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <span>●</span>
                <span>{voiceStatus}</span>
              </div>
            )}

            {voiceError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '14px',
                fontWeight: '600',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                ⚠️ {voiceError}
              </div>
            )}

            <textarea
              rows={2}
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder={lang === 'hi' ? 'अपनी बात बोलें या यहाँ लिखें...' : 'Speak or type your answer here...'}
              style={{ width: '100%', padding: '16px', fontSize: '22px', borderRadius: '12px', border: '2px solid var(--border-color)', resize: 'none', background: '#ffffff', color: '#0f172a', fontWeight: '600' }}
            />

            {/* Stage-Specific Clinical Voice Presets (ALL 7 STAGES) */}
            <div style={{ marginTop: '14px', textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>
                {lang === 'hi' ? '⚡ त्वरित वॉयस उत्तर (बोलें या टैप करें):' : '⚡ Quick Spoken Response Presets (Speak or Tap):'}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {currentStageNum === 1 && [
                  { hi: 'सुबह से सीने में तेज दर्द और सांस फूल रही है', en: 'Severe chest pain and breathlessness since morning' },
                  { hi: '२ दिन से सिर में बहुत तेज दर्द है और उल्टी जैसा लग रहा है', en: 'Severe throbbing headache for 2 days with nausea' },
                  { hi: 'दाहिने घुटने में सूजन है और चलने में तेज दर्द होता है', en: 'Right knee is swollen and painful to walk on' },
                  { hi: 'पेट में बहुत तेज जलन और गैस बन रही है', en: 'Severe burning stomach pain and acidity' },
                  { hi: 'तेज बुखार और ठंड लग रही है', en: 'High fever with chills and body ache' }
                ].map((preset, idx) => (
                  <button key={idx} type="button" className="voice-chip" onClick={() => simulateVoiceCommand(lang === 'hi' ? preset.hi : preset.en)}>
                    <span>🎤</span>
                    <span>{lang === 'hi' ? preset.hi : preset.en}</span>
                  </button>
                ))}

                {currentStageNum === 2 && [
                  { hi: 'आज सुबह से अचानक शुरू हुआ', en: 'Started suddenly this morning' },
                  { hi: '२ से ३ दिन से लगातार है', en: 'Persisting for 2 to 3 days' },
                  { hi: 'लगभग १ हफ्ते से है', en: 'For about 1 week' },
                  { hi: '१ महीने से पुराना दर्द है', en: 'Chronic pain for over a month' }
                ].map((preset, idx) => (
                  <button key={idx} type="button" className="voice-chip" onClick={() => simulateVoiceCommand(lang === 'hi' ? preset.hi : preset.en)}>
                    <span>🎤</span>
                    <span>{lang === 'hi' ? preset.hi : preset.en}</span>
                  </button>
                ))}

                {currentStageNum === 3 && [
                  { hi: 'सिर के दाहिने हिस्से में तेज खिंचाव', en: 'Right temporal side throbbing pain' },
                  { hi: 'सीने के बीच में भारी दबाव', en: 'Heavy crushing pressure in center of chest' },
                  { hi: 'पेट के ऊपरी हिस्से में नाभि के पास', en: 'Upper abdomen near epigastric area' },
                  { hi: 'दोनों घुटनों और एड़ियों में', en: 'Both knees and ankles' }
                ].map((preset, idx) => (
                  <button key={idx} type="button" className="voice-chip" onClick={() => simulateVoiceCommand(lang === 'hi' ? preset.hi : preset.en)}>
                    <span>🎤</span>
                    <span>{lang === 'hi' ? preset.hi : preset.en}</span>
                  </button>
                ))}

                {currentStageNum === 4 && [
                  { hi: 'दर्द बहुत तेज है (स्तर ८/१०)', en: 'Very severe pain (Level 8/10)' },
                  { hi: 'मध्यम दर्द है (स्तर ५/१०)', en: 'Moderate pain (Level 5/10)' },
                  { hi: 'हल्का दर्द है (स्तर २/१०)', en: 'Mild pain (Level 2/10)' },
                  { hi: 'सांस फूलती है और पसीना आता है', en: 'Shortness of breath with cold sweating' }
                ].map((preset, idx) => (
                  <button key={idx} type="button" className="voice-chip" onClick={() => simulateVoiceCommand(lang === 'hi' ? preset.hi : preset.en)}>
                    <span>🎤</span>
                    <span>{lang === 'hi' ? preset.hi : preset.en}</span>
                  </button>
                ))}

                {currentStageNum === 5 && [
                  { hi: 'उच्च रक्तचाप (बीपी) की बीमारी है', en: 'History of Hypertension (High BP)' },
                  { hi: 'शुगर / मधुमेह (Diabetes) है', en: 'Type 2 Diabetes' },
                  { hi: 'थायरॉयड की समस्या है', en: 'Thyroid disorder' },
                  { hi: 'कोई पुरानी बीमारी नहीं है', en: 'No past chronic illness' }
                ].map((preset, idx) => (
                  <button key={idx} type="button" className="voice-chip" onClick={() => simulateVoiceCommand(lang === 'hi' ? preset.hi : preset.en)}>
                    <span>🎤</span>
                    <span>{lang === 'hi' ? preset.hi : preset.en}</span>
                  </button>
                ))}

                {currentStageNum === 6 && [
                  { hi: 'नियमित बीपी की गोली ले रहे हैं', en: 'Taking daily antihypertensive tablet' },
                  { hi: 'गैस और एंटासिड सिरप लेते हैं', en: 'Taking antacid / PPI' },
                  { hi: 'पेनिसिलिन व सल्फा दवा से एलर्जी है', en: 'Allergic to Penicillin and Sulfa' },
                  { hi: 'कोई दवा एलर्जी नहीं है', en: 'No known drug allergies' }
                ].map((preset, idx) => (
                  <button key={idx} type="button" className="voice-chip" onClick={() => simulateVoiceCommand(lang === 'hi' ? preset.hi : preset.en)}>
                    <span>🎤</span>
                    <span>{lang === 'hi' ? preset.hi : preset.en}</span>
                  </button>
                ))}

                {currentStageNum === 7 && [
                  { hi: 'वात प्रकृति (सूखापन, जोड़ों में दर्द, अनिद्रा)', en: 'Vata dominant (Dryness, joint pain, restless)' },
                  { hi: 'पित्त प्रकृति (जलन, गुस्सा, एसिडिटी, पसीना)', en: 'Pitta dominant (Heat sensation, hyperacidity, sweating)' },
                  { hi: 'कफ प्रकृति (भारीपन, कफ, सुस्ती, वजन)', en: 'Kapha dominant (Heaviness, congestion, lethargy)' },
                  { hi: 'समान त्रिदोष (संतुलित प्रकृति)', en: 'Balanced Tridosha' }
                ].map((preset, idx) => (
                  <button key={idx} type="button" className="voice-chip" onClick={() => simulateVoiceCommand(lang === 'hi' ? preset.hi : preset.en)}>
                    <span>🎤</span>
                    <span>{lang === 'hi' ? preset.hi : preset.en}</span>
                  </button>
                ))}

                <button type="button" className="voice-chip" onClick={() => simulateVoiceCommand('आगे बढ़ें')}>
                  <span>🎤</span>
                  <span>{lang === 'hi' ? 'आगे बढ़ें (Next Stage)' : 'Proceed Next'}</span>
                </button>
              </div>
            </div>
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
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '12px' }}>
                <label htmlFor="rx-upload" className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                  <Upload size={18} /> {lang === 'hi' ? 'पर्चा अपलोड करें' : 'Upload Rx'}
                </label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '13px', padding: '8px 12px' }}
                  onClick={() => {
                    const sampleFile = new File(['Tab Metformin 500mg, Tab Telmisartan 40mg, Tab Pantoprazole 40mg'], 'prescription_meena_devi.txt', { type: 'text/plain' });
                    KioskAPI.uploadDocument(encounterId, sampleFile, 'PRESCRIPTION');
                    setUploadedFiles(prev => [...prev, { name: 'prescription_meena_devi.png', type: 'PRESCRIPTION', status: 'OCR Extracted (Metformin 500mg, Telmisartan 40mg, Pantoprazole 40mg)' }]);
                  }}
                  title="Load pre-built sample doctor prescription"
                >
                  ⚡ {lang === 'hi' ? 'नमूना पर्चा' : 'Sample Rx'}
                </button>
              </div>
            </div>

            <div style={{ border: '2px dashed var(--secondary)', borderRadius: '18px', padding: '30px', textAlign: 'center', background: '#f8fafc' }}>
              <HeartPulse size={48} color="var(--secondary)" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
                {lang === 'hi' ? 'जांच रिपोर्ट (Lab Report)' : 'Lab Report (Sugar/Blood)'}
              </div>
              <input type="file" id="lab-upload" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, 'LAB_REPORT')} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '12px' }}>
                <label htmlFor="lab-upload" className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                  <Upload size={18} /> {lang === 'hi' ? 'रिपोर्ट अपलोड करें' : 'Upload Lab Report'}
                </label>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ fontSize: '13px', padding: '8px 12px' }}
                  onClick={() => {
                    const sampleFile = new File(['Fasting Blood Sugar (FBS): 168 mg/dL [HIGH], HbA1c: 8.4 % [ELEVATED]'], 'lab_report_blood_sugar_lipid.txt', { type: 'text/plain' });
                    KioskAPI.uploadDocument(encounterId, sampleFile, 'LAB_REPORT');
                    setUploadedFiles(prev => [...prev, { name: 'lab_report_blood_sugar_lipid.png', type: 'LAB_REPORT', status: 'OCR Extracted (FBS: 168 mg/dL, HbA1c: 8.4%)' }]);
                  }}
                  title="Load pre-built sample blood sugar & lipid test report"
                >
                  ⚡ {lang === 'hi' ? 'नमूना रिपोर्ट' : 'Sample Lab Report'}
                </button>
              </div>
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

      {/* VOICE SIMULATOR & DIAGNOSTICS MODAL */}
      {showVoiceSimulator && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px', textAlign: 'left', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <SlidersHorizontal size={24} color="var(--primary)" />
                <h3 style={{ fontSize: '22px', fontWeight: '800' }}>
                  {lang === 'hi' ? '🛠️ वॉयस असिस्टेंट सिमुलेटर व जांच' : '🛠️ Voice Assistant Diagnostics & Simulator'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVoiceSimulator(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={24} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '18px' }}>
              {lang === 'hi'
                ? 'यदि आपका भौतिक माइक्रोफ़ोन म्यूट या ब्लॉक है, तो आप यहाँ से कोई भी वॉयस कमांड या लक्षण बोलकर टेस्ट कर सकते हैं।'
                : 'If your physical microphone is blocked or unavailable, you can simulate and test any spoken command or clinical statement.'}
            </p>

            {/* Diagnostics status pills */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{lang === 'hi' ? 'सिस्टम वॉयस व हार्डवेयर स्थिति:' : 'System Voice & Hardware Diagnostics:'}</span>
                <span style={{ fontSize: '12px', color: '#0d9488', fontWeight: '700' }}>
                  Live VU: {micVolume}%
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div>🎤 Mic Status: <strong style={{ color: isListening ? '#16a34a' : '#64748b' }}>{isListening ? 'Active (Listening)' : 'Standby'}</strong></div>
                <div>🔊 Live Audio Level: <strong style={{ color: micVolume > 10 ? '#0d9488' : '#64748b' }}>{micVolume}%</strong></div>
                <div>🏷️ Active Device: <strong>{micTrackInfo?.label || 'Default / Not Captured'}</strong></div>
                <div>🔕 Hardware Mute: <strong style={{ color: micTrackInfo?.muted ? '#dc2626' : '#16a34a' }}>{micTrackInfo?.muted ? '🔴 MUTED (Fn+F4)' : '🟢 Unmuted'}</strong></div>
                <div>🌐 Speech API: <strong style={{ color: ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) ? '#16a34a' : '#dc2626' }}>{('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) ? 'Supported' : 'Unavailable'}</strong></div>
                <div>🗣️ Speech Lang: <strong>{voiceLang}</strong></div>
              </div>

              {/* Device Selector & Quick Echo Test */}
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {availableMics.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>{lang === 'hi' ? 'माइक चुनें:' : 'Select Mic:'}</span>
                    <select
                      value={selectedAudioDeviceId}
                      onChange={(e) => handleDeviceChange(e.target.value)}
                      style={{ padding: '4px 8px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                    >
                      <option value="">{lang === 'hi' ? 'डिफ़ॉल्ट माइक' : 'Default Mic'}</option>
                      {availableMics.map((m, idx) => (
                        <option key={m.deviceId || idx} value={m.deviceId}>{m.label || `Mic ${idx + 1}`}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button
                  type="button"
                  onClick={runEchoTest}
                  disabled={echoTestState !== 'idle'}
                  className="btn btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '12px', fontWeight: '700' }}
                >
                  {echoTestState === 'recording' ? '🔴 बोलें (3s)...' : echoTestState === 'playing' ? '🔊 सुन रहे हैं...' : '🎙️ 3s माइक टेस्ट चलाएं'}
                </button>
              </div>

              {/* Windows 0% Troubleshooting Advice */}
              <div style={{ marginTop: '12px', background: '#eff6ff', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', color: '#1e40af' }}>
                <div style={{ fontWeight: '700', marginBottom: '4px' }}>💡 यदि ध्वनि स्तर 0% (Unable to Hear) आ रहा है:</div>
                <ul style={{ margin: 0, paddingLeft: '16px', lineHeight: '1.5' }}>
                  <li><strong>कीबोर्ड म्यूट चेक करें:</strong> लैपटॉप के F4 या Mic की (Fn + F4) पर लाइट चेक करें, अनम्यूट करें।</li>
                  <li><strong>ब्राउज़र अनुमति:</strong> Chrome एड्रेस बार में 🔒 लॉक पर क्लिक करके Microphone को "Allow" करें।</li>
                  <li><strong>Windows Settings:</strong> Settings &gt; Privacy &amp; security &gt; Microphone में "Let desktop apps access your microphone" चालू करें।</li>
                  <li><strong>वैकल्पिक:</strong> आप नीचे दिए गए किसी भी लक्षण/कमांड पर तुरंत टैप करके या टाइप करके बिना माइक के भी टेस्ट कर सकते हैं।</li>
                </ul>
              </div>
            </div>

            {/* Custom Speech Simulator Input */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '700', fontSize: '15px', marginBottom: '6px' }}>
                {lang === 'hi' ? 'कस्टम वॉयस इनपुट टाइप करें व टेस्ट करें:' : 'Type any custom phrase to simulate voice:'}
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  value={simulatorCustomText}
                  onChange={(e) => setSimulatorCustomText(e.target.value)}
                  placeholder={lang === 'hi' ? 'उदा. सिर में बहुत तेज दर्द है और चक्कर आ रहे हैं' : 'e.g. Severe chest pain and breathlessness'}
                  style={{ flex: 1, padding: '12px 14px', fontSize: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && simulatorCustomText.trim()) {
                      simulateVoiceCommand(simulatorCustomText.trim());
                      setSimulatorCustomText('');
                      setShowVoiceSimulator(false);
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (simulatorCustomText.trim()) {
                      simulateVoiceCommand(simulatorCustomText.trim());
                      setSimulatorCustomText('');
                      setShowVoiceSimulator(false);
                    }
                  }}
                >
                  🗣️ {lang === 'hi' ? 'बोलें' : 'Speak'}
                </button>
              </div>
            </div>

            {/* Fast Quick Presets */}
            <div>
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '8px' }}>
                {lang === 'hi' ? 'त्वरित वॉयस टेस्ट (Click to execute):' : 'Instant Voice Presets:'}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  'हिंदी में शुरू करें',
                  'हाँ, मैं सहमत हूँ',
                  'मीना देवी',
                  'सीने में तेज दर्द और सांस फूल रही है',
                  'सिर में बहुत तेज दर्द और उल्टी',
                  '२ दिन से तेज बुखार',
                  'दर्द 8 है (तेज दर्द)',
                  'आगे बढ़ें',
                  'दोबारा बोलो',
                  'रीसेट'
                ].map((txt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="voice-chip"
                    onClick={() => {
                      simulateVoiceCommand(txt);
                      setShowVoiceSimulator(false);
                    }}
                  >
                    🎤 {txt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setShowVoiceSimulator(false)}>
                {lang === 'hi' ? 'बंद करें (Close)' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default App;
