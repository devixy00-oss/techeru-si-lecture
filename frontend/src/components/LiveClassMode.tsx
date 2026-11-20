"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Send,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Hand,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  BookOpen,
  Globe,
  GraduationCap,
  RefreshCw,
  Cpu,
  Layers,
  HelpCircle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TeacherCat3D, { CameraPreset, AnimationName } from './TeacherCat3D';
import TeacherStatus from './TeacherStatus';
import TeacherSubtitles from './TeacherSubtitles';
import { teacherSM, TeacherState } from '@/teacher/TeacherStateMachine';
import { speechManager } from '@/audio/SpeechManager';

type Message = { role: 'user' | 'tutor'; content: string };

type SubjectId =
  | 'general'
  | 'nursing'
  | 'english'
  | 'science'
  | 'tech'
  | 'programming'
  | 'knowledge';

interface SubjectOption {
  id: SubjectId;
  icon: string;
  en: string;
  am: string;
}

const SUBJECTS: SubjectOption[] = [
  { id: 'general', icon: '🎓', en: 'General', am: 'አጠቃላይ' },
  { id: 'nursing', icon: '🩺', en: 'Nursing & Health', am: 'ነርሲንግና ጤና' },
  { id: 'english', icon: '🗣️', en: 'English', am: 'እንግሊዝኛ' },
  { id: 'science', icon: '🔬', en: 'Science', am: 'ሳይንስ' },
  { id: 'tech', icon: '💻', en: 'Technology', am: 'ቴክኖሎጂ' },
  { id: 'programming', icon: '⌨️', en: 'Programming', am: 'ኮዲንግ' },
  { id: 'knowledge', icon: '🌍', en: 'History & Facts', am: 'ታሪክና እውቀት' },
];

const PROMPT_CHIPS: Record<SubjectId, { en: string[]; am: string[] }> = {
  general: {
    en: [
      'Explain the core concept step by step',
      'Show me a worked example',
      'Quiz me with a practice question',
      'Summarize key formulas and rules',
    ],
    am: [
      'ዋናውን ጽንሰ-ሀሳብ በደረጃ አብራራልኝ',
      'የተግባር ምሳሌ አሳየኝ',
      'የፈተና ጥያቄ ጠይቀኝ',
      'ቁልፍ ነጥቦችን በአጭሩ አጠቃልልኝ',
    ],
  },
  nursing: {
    en: [
      'Explain patient autonomy in nursing ethics',
      'What are the 5 phases of the Nursing Process (ADPIE)?',
      'How to prioritize triage in emergency care?',
      'Explain vital signs and abnormal ranges',
    ],
    am: [
      'በነርሲንግ ውስጥ የታካሚ ራስን በራስ የማስተዳደር መርህ (Autonomy)',
      'የነርሲንግ ሂደት 5ቱ ደረጃዎች ምንድን ናቸው?',
      'የአደጋ ጊዜ ታካሚዎች ቅድሚያ አሰጣጥ (Triage)',
      'የህይወት ምልክቶች (Vital Signs) መደበኛ መጠን',
    ],
  },
  english: {
    en: [
      'Explain difference between Present Perfect and Past Simple',
      'How do I use active vs passive voice naturally?',
      'Give me 3 useful conversational idioms with examples',
      'Review my sentence and suggest better vocabulary',
    ],
    am: [
      'የእንግሊዝኛ ሰዋሰው ህጎችን በምሳሌ አብራራልኝ',
      'በእንግሊዝኛ አረፍተ ነገር ውስጥ Active እና Passive ድምጽ',
      'በንግግር ውስጥ ጠቃሚ የእንግሊዝኛ ፈሊጦች (Idioms)',
      'የእንግሊዝኛ አጠራሬን እና የቃላት ምርጫዬን አሻሽልኝ',
    ],
  },
  science: {
    en: [
      'Explain cellular respiration in simple terms',
      'What is photosynthesis and why is it essential?',
      'Explain Newton’s Three Laws of Motion with real examples',
      'How does DNA replication occur?',
    ],
    am: [
      'የህዋስ አተነፋፈስ (Cellular Respiration) እንዴት ይሰራል?',
      'ፎቶሲንተሲስ (Photosynthesis) እና ጥቅሙ',
      'የኒውተን 3ቱ የእንቅስቃሴ ህጎች በምሳሌ',
      'የዲኤንኤ (DNA) መባዛት ሂደት እንዴት ይከናወናል?',
    ],
  },
  tech: {
    en: [
      'How does cloud computing architecture work?',
      'Explain the 7 layers of the OSI model',
      'What are core principles of cybersecurity defense in depth?',
      'Explain the difference between TCP and UDP',
    ],
    am: [
      'ክላውድ ኮምፒውቲንግ (Cloud Computing) መሰረታዊ አሰራር',
      'የኮምፒውተር ኔትወርክ 7ቱ የ OSI ሞዴል ደረጃዎች',
      'የሳይበር ደህንነት መሰረታዊ መከላከያ መርሆች',
      'የ TCP እና UDP ልዩነቶች በኔትወርክ ውስጥ',
    ],
  },
  programming: {
    en: [
      'Explain Big-O time and space complexity with simple analogies',
      'Show recursion vs iteration with a code sample',
      'Explain Object-Oriented Programming (OOP) 4 pillars',
      'How do asynchronous promises and async/await work in JavaScript?',
    ],
    am: [
      'የቢግ-ኦ (Big-O) ውስብስብነት በምሳሌ አስረዳኝ',
      'የሪከርሽን (Recursion) አሰራር በኮድ ምሳሌ',
      'የኦብጀክት ኦሪየንትድ ፕሮግራሚንግ (OOP) 4ቱ ምሰሶዎች',
      'በጃቫስክሪፕት ውስጥ Async/Await እንዴት ይሰራል?',
    ],
  },
  knowledge: {
    en: [
      'Tell me about the ancient Kingdom of Aksum and its coins',
      'What triggered the Industrial Revolution and its impact?',
      'How does the United Nations Security Council work?',
      'Explain the significance of the Battle of Adwa',
    ],
    am: [
      'ስለ ጥንታዊው የአክሱም ስልጣኔ እና ሳንቲሞቹ ንገረኝ',
      'የኢንዱስትሪ አብዮት መነሻና በዓለም ላይ ያሳደረው ተጽእኖ',
      'የተባበሩት መንግስታት የጸጥታው ጥበቃ ምክር ቤት አሰራር',
      'የአድዋ ድል ታሪካዊ ፋይዳ ለጥቁር ህዝቦች ነፃነት',
    ],
  },
};

type Props = {
  sessions: any[];
  onExit: () => void;
};

function cleanNotesText(raw?: string | null, title?: string): string {
  if (!raw || raw.includes('INVALID_ARGUMENT') || raw.includes('Offline Mode')) {
    return `### Key Concepts: ${title || 'Study Material'}\n- **Core Principles:** Understanding foundational structures and definitions in your material.\n- **Step-by-Step Analysis:** Breaking complex problems into clear, logical stages.\n- **Practical Application:** Applying formulas and key takeaways to solve real examples.`;
  }
  return raw;
}

function extractKeyPointsSummary(raw?: string | null, title?: string): string {
  const cleaned = cleanNotesText(raw, title)
    .replace(/#+\s*/g, '')
    .replace(/\*\*/g, '')
    .replace(/> ⚠️.*$/gm, '')
    .trim();
  return cleaned.slice(0, 150) + (cleaned.length > 150 ? '...' : '');
}

export default function LiveClassMode({ sessions, onExit }: Props) {
  const [language, setLanguage] = useState<'en' | 'am'>('en');
  const [currentSubject, setCurrentSubject] = useState<SubjectId>('general');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'tutor',
      content:
        "🎓 **Welcome to Live Class!** I'm Techeru, your 3D personal tutor. I've loaded your study material. Ask me any question, click a quick prompt, or press the **microphone button** to speak with me directly!",
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [teacherState, setTeacherState] = useState<TeacherState>('IDLE');
  const [forcedAnimation, setForcedAnimation] = useState<AnimationName | undefined>(undefined);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('full');
  const [isFullScreenStage, setIsFullScreenStage] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [subtitleText, setSubtitleText] = useState('');
  const [isSpeakingVoice, setIsSpeakingVoice] = useState(false);
  const [showKeyPoints, setShowKeyPoints] = useState(false);
  const [showModelSheetModal, setShowModelSheetModal] = useState(false);
  const [lastTutorReply, setLastTutorReply] = useState<string>('');

  // Meshy 3D Cloud Generation State
  const [meshyApiKey, setMeshyApiKey] = useState('');
  const [meshyTaskId, setMeshyTaskId] = useState('');
  const [meshyStatus, setMeshyStatus] = useState<string>('');
  const [meshyProgress, setMeshyProgress] = useState<number>(0);
  const [isGenerating3D, setIsGenerating3D] = useState(false);
  const [genMessage, setGenMessage] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const activeSession = sessions[sessions.length - 1];

  // Subscribe to state machine updates
  useEffect(() => {
    const unsub = teacherSM.subscribe((newState) => {
      setTeacherState(newState);
    });
    return unsub;
  }, []);

  // Subscribe to subtitles
  useEffect(() => {
    const unsub = speechManager.onSubtitle((text, speaking) => {
      setSubtitleText(text);
      setIsSpeakingVoice(speaking);
    });
    return unsub;
  }, []);

  // Initial Voice & 3D Greeting on Entrance
  useEffect(() => {
    teacherSM.forceState('SPEAKING');
    setForcedAnimation('greeting');

    const greetingMessage =
      language === 'am'
        ? "እንኳን ወደ ቀጥታ 3D የመማሪያ ክፍል በደህና መጣህ! እኔ መምህርህ ቴክሩ ነኝ። የትምህርት ማስታወሻህን አንብቤ ዝግጁ ሆኛለሁ። ዛሬ ምን እንማር?"
        : "Hello student! Welcome to Live Class! I'm Techeru, your AI teacher. I've reviewed your study materials and I'm ready to teach you. What would you like to master today?";

    setLastTutorReply(greetingMessage);

    const timer = setTimeout(() => {
      speechManager.speak(
        greetingMessage,
        () => {
          setForcedAnimation('waving');
          teacherSM.forceState('SPEAKING');
        },
        () => {
          setForcedAnimation(undefined);
          teacherSM.forceState('IDLE');
        }
      );
    }, 600);

    return () => {
      clearTimeout(timer);
      speechManager.interrupt();
    };
  }, []);

  // Language Change Handler
  const handleLanguageChange = (newLang: 'en' | 'am') => {
    if (newLang === language) return;
    setLanguage(newLang);
    speechManager.setLanguage(newLang);

    const switchMsg =
      newLang === 'am'
        ? "ቋንቋውን ወደ አማርኛ ቀይረነዋል! አሁን በአማርኛ መማማር እና መጠየቅ ትችላለህ። 🇪🇹✨"
        : "Language switched to English! You can now ask questions and listen in English. 🇺🇸✨";

    setMessages((prev) => [...prev, { role: 'tutor', content: switchMsg }]);
    setLastTutorReply(switchMsg);

    teacherSM.forceState('SPEAKING');
    setForcedAnimation('nod');
    speechManager.speak(
      switchMsg,
      () => {
        teacherSM.forceState('SPEAKING');
      },
      () => {
        teacherSM.forceState('IDLE');
        setForcedAnimation(undefined);
      }
    );
  };

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveTranscript, teacherState]);

  // Handle webcam tracking
  const toggleCamera = async () => {
    if (isCameraOn) {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsCameraOn(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsCameraOn(true);
      } catch {
        alert('Camera access denied or unavailable.');
      }
    }
  };

  // Toggle Audio Mute
  const toggleAudio = () => {
    const next = !isMuted;
    setIsMuted(next);
    speechManager.setMuted(next);
  };

  // Handle Interruption
  const handleInterrupt = useCallback(() => {
    speechManager.interrupt();
    teacherSM.transition('INTERRUPT');
    setForcedAnimation('surprised');
    setTimeout(() => {
      teacherSM.forceState('LISTENING');
      setForcedAnimation('curious');
    }, 900);
  }, []);

  // Repeat Last Tutor Response
  const handleRepeatLast = () => {
    const textToRepeat = lastTutorReply || messages.filter((m) => m.role === 'tutor').pop()?.content;
    if (!textToRepeat) return;

    teacherSM.transition('AI_START_SPEAKING');
    setForcedAnimation('explaining');

    speechManager.speak(
      textToRepeat,
      () => {
        teacherSM.forceState('SPEAKING');
        setForcedAnimation('explaining');
      },
      () => {
        teacherSM.forceState('IDLE');
        setForcedAnimation(undefined);
      }
    );
  };

  // Core AI Question & Answer Flow
  const processQuestion = async (queryText: string) => {
    if (!queryText.trim()) return;
    const text = queryText.trim();
    setChatInput('');
    setLiveTranscript('');
    setMessages((prev) => [...prev, { role: 'user', content: text }]);

    // 1. Transition to THINKING
    teacherSM.transition('AI_START_THINKING');
    setForcedAnimation('thinking');

    try {
      const sessionId = activeSession?.id;
      const url = sessionId
        ? `http://localhost:8000/api/sessions/${sessionId}/chat`
        : `http://localhost:8000/api/sessions/general/chat`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language: language,
          subject: currentSubject,
        }),
      });
      const data = await res.json();
      const reply = data.reply;

      setMessages((prev) => [...prev, { role: 'tutor', content: reply }]);
      setLastTutorReply(reply);

      // 2. Transition to EXPLAINING / SPEAKING
      teacherSM.transition('AI_START_SPEAKING');
      setForcedAnimation('explaining');

      // 3. Play vocal speech with synchronized lip-sync
      await speechManager.speak(
        reply,
        () => {
          teacherSM.forceState('SPEAKING');
          setForcedAnimation('explaining');
        },
        () => {
          teacherSM.forceState('IDLE');
          setForcedAnimation(undefined);
        }
      );
    } catch {
      const fallbackReply =
        language === 'am'
          ? `ስለ **${text}** አብረን እንመርምር! 🎓\n\n1. **ዋና ጽንሰ-ሀሳብ:** በመጀመሪያ ጥያቄውን በግልጽ እንረዳ።\n2. **የተግባር አጠቃቀም:** ደረጃ በደረጃ ፎርሙላዎችን እና ህጎችን ተግባራዊ እናድርግ።\n3. **ፈጣን ፍተሻ:** መልሳችን ትክክል መሆኑን እናረጋግጥ! ✨`
          : `Let's break down **${text}** together! 🎓\n\n1. **Core Concept:** First, identify the central definition and what is being asked.\n2. **Application:** Apply the formulas or rules step-by-step.\n3. **Quick Check:** Substitute your result back to verify correctness! ✨`;

      setMessages((prev) => [...prev, { role: 'tutor', content: fallbackReply }]);
      setLastTutorReply(fallbackReply);
      teacherSM.transition('AI_START_SPEAKING');
      setForcedAnimation('explaining');

      await speechManager.speak(
        fallbackReply,
        undefined,
        () => {
          teacherSM.forceState('IDLE');
          setForcedAnimation(undefined);
        }
      );
    }
  };

  // Microphone Speech Recognition
  const toggleMicrophone = () => {
    if (isListeningMic) {
      speechManager.stopListening();
      setIsListeningMic(false);
      teacherSM.transition('STUDENT_STOP_SPEAKING');
      if (liveTranscript.trim()) {
        processQuestion(liveTranscript);
      }
    } else {
      // If teacher is talking, interrupt first!
      if (speechManager.getIsSpeaking()) {
        handleInterrupt();
      }
      setLiveTranscript('');
      teacherSM.transition('STUDENT_START_SPEAKING');
      setForcedAnimation('curious');

      const success = speechManager.startListening(
        (transcript, isFinal) => {
          setLiveTranscript(transcript);
          if (isFinal) {
            speechManager.stopListening();
            setIsListeningMic(false);
            processQuestion(transcript);
          }
        },
        (err) => {
          console.warn('Mic error:', err);
          setIsListeningMic(false);
          teacherSM.forceState('IDLE');
          setForcedAnimation(undefined);
        }
      );

      if (success) {
        setIsListeningMic(true);
      }
    }
  };

  // Meshy AI 3D Trigger
  const triggerMeshyGeneration = async () => {
    setIsGenerating3D(true);
    setGenMessage('Sending official character reference image to Meshy AI...');
    try {
      const res = await fetch('http://localhost:8000/api/3d/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: meshyApiKey || undefined }),
      });
      const data = await res.json();
      if (data.task_id) {
        setMeshyTaskId(data.task_id);
        setMeshyStatus('IN_PROGRESS');
        setGenMessage(`Generation initiated! Task ID: ${data.task_id}. Polling progress...`);
        pollMeshyTask(data.task_id);
      } else {
        setGenMessage(data.error || 'Failed to initialize Meshy generation.');
        setIsGenerating3D(false);
      }
    } catch (e: any) {
      setGenMessage(`Generation error: ${e.message}`);
      setIsGenerating3D(false);
    }
  };

  // Poll Meshy Status
  const pollMeshyTask = async (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `http://localhost:8000/api/3d/status/${taskId}?api_key=${encodeURIComponent(
            meshyApiKey
          )}`
        );
        const data = await res.json();
        if (data.progress !== undefined) {
          setMeshyProgress(data.progress);
        }
        if (data.status === 'SUCCEEDED') {
          clearInterval(interval);
          setMeshyStatus('SUCCEEDED');
          setIsGenerating3D(false);
          setGenMessage(
            '🎉 Meshy 3D generation complete! The model has been saved to /models/teacher-cat.glb.'
          );
        } else if (data.status === 'FAILED') {
          clearInterval(interval);
          setMeshyStatus('FAILED');
          setIsGenerating3D(false);
          setGenMessage(`Meshy generation failed: ${data.error || 'Unknown error'}`);
        }
      } catch (err: any) {
        clearInterval(interval);
        setIsGenerating3D(false);
        setGenMessage(`Polling error: ${err.message}`);
      }
    }, 4000);
  };

  const displayNotes = cleanNotesText(activeSession?.summary_notes, activeSession?.title);
  const displayKeyPoints = extractKeyPointsSummary(
    activeSession?.summary_notes,
    activeSession?.title
  );

  const activeChips = PROMPT_CHIPS[currentSubject] || PROMPT_CHIPS.general;
  const currentPrompts = language === 'am' ? activeChips.am : activeChips.en;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#080b12] text-white flex flex-col select-none">
      {/* ── TOP HEADER ── */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0f1117] shrink-0 z-20">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
            Live 3D Classroom
          </span>
          <span className="text-gray-600 text-sm">|</span>
          <span className="text-gray-300 text-sm truncate max-w-[280px]">
            {activeSession?.title ?? 'Interactive Study Session'}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Dual Language Switcher: English / Amharic */}
          <div className="flex items-center bg-[#171b26] border border-white/15 rounded-full p-0.5 shadow-inner">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                language === 'en'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Switch voice and text to English"
            >
              <span>🇺🇸</span> EN
            </button>
            <button
              onClick={() => handleLanguageChange('am')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
                language === 'am'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="ቋንቋውን ወደ አማርኛ ቀይር (Amharic)"
            >
              <span>🇪🇹</span> አማርኛ
            </button>
          </div>

          {/* Repeat Last Speech Button */}
          <button
            onClick={handleRepeatLast}
            title={language === 'am' ? 'የመጨረሻውን ማብራሪያ ድገም' : 'Repeat Last Explanation'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 text-xs font-medium transition shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>{language === 'am' ? 'ድገም' : 'Repeat'}</span>
          </button>

          {/* Character 3D Model Sheet & Rig Viewer */}
          <button
            onClick={() => setShowModelSheetModal(true)}
            title="Inspect 3D character turnaround views, wireframe rig, and PBR specs"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/35 hover:bg-indigo-600/30 text-xs font-medium transition shadow-sm"
          >
            <span>📐</span> Model Sheet & 3D AI
          </button>

          {/* Audio Mute/Unmute */}
          <button
            onClick={toggleAudio}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className={`p-2 rounded-full border transition ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Student Camera Tracking Toggle */}
          <button
            onClick={toggleCamera}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              isCameraOn
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            {isCameraOn ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            {isCameraOn ? 'Tracking Active' : 'Enable Tracking'}
          </button>

          {/* Full-Screen 3D Stage Toggle */}
          <button
            onClick={() => setIsFullScreenStage(!isFullScreenStage)}
            title={isFullScreenStage ? 'Split View' : 'Focus Teacher'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600/15 text-blue-300 border border-blue-500/30 hover:bg-blue-600/25 text-xs font-medium transition"
          >
            {isFullScreenStage ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" /> Split Screen
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" /> Focus Teacher
              </>
            )}
          </button>

          {/* Exit Live Class */}
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 text-xs font-medium transition"
          >
            <X className="w-3.5 h-3.5" /> Exit
          </button>
        </div>
      </header>

      {/* ── EDUCATIONAL SUBJECT SELECTOR RIBBON ── */}
      <div className="flex items-center gap-2 px-6 py-2 bg-[#0b0e17] border-b border-white/5 overflow-x-auto scrollbar-none shrink-0 z-10">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
          <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
          {language === 'am' ? 'የትምህርት ዘርፍ:' : 'Subject:'}
        </span>
        {SUBJECTS.map((sub) => (
          <button
            key={sub.id}
            onClick={() => setCurrentSubject(sub.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
              currentSubject === sub.id
                ? 'bg-blue-600 text-white shadow-md border border-blue-400/50'
                : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
            }`}
          >
            <span>{sub.icon}</span>
            <span>{language === 'am' ? sub.am : sub.en}</span>
          </button>
        ))}
      </div>

      {/* ── CLASSROOM MAIN STAGE ── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* LEFT / CENTER: 3D Teacher Cat Stage */}
        <div
          className={`${
            isFullScreenStage ? 'w-full' : 'w-1/2'
          } flex flex-col bg-gradient-to-b from-[#0d1020] via-[#090c16] to-[#060810] relative overflow-hidden border-r border-white/10 transition-all duration-300`}
        >
          {/* Top-Left Floating State Badge */}
          <div className="absolute top-4 left-5 z-20 pointer-events-auto">
            <TeacherStatus state={teacherState} />
          </div>

          {/* Top-Right Floating Key Points Card (Collapsible, never blocks cat's face) */}
          <div className="absolute top-4 right-5 z-20 pointer-events-auto">
            {showKeyPoints ? (
              <div className="bg-[#10172a]/90 border border-blue-500/30 rounded-2xl p-3.5 w-[220px] backdrop-blur-md shadow-2xl transition animate-in fade-in">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-blue-300 font-bold flex items-center gap-1.5">
                    <span>📌</span> {language === 'am' ? 'ዋና ነጥቦች' : 'Key Concepts'}
                  </p>
                  <button
                    onClick={() => setShowKeyPoints(false)}
                    className="text-gray-400 hover:text-white text-xs p-1 rounded-full hover:bg-white/10"
                    title="Minimize"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[11px] text-gray-300 leading-relaxed line-clamp-4">
                  {displayKeyPoints}
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowKeyPoints(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10172a]/80 hover:bg-[#10172a] border border-blue-500/25 rounded-full text-xs text-blue-300 font-medium backdrop-blur-md shadow-lg transition"
                title="View lesson notes"
              >
                <span>📌</span> {language === 'am' ? 'ዋና ነጥቦች' : 'Key Concepts'}
              </button>
            )}
          </div>

          {/* Center Stage: Interactive 3D WebGL Teacher Cat */}
          <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="w-full h-full flex items-center justify-center">
              <TeacherCat3D
                state={teacherState}
                animation={forcedAnimation}
                cameraPreset={cameraPreset}
                isCameraOn={isCameraOn}
              />
            </div>

            {/* Live Subtitles Overlay */}
            <TeacherSubtitles
              text={subtitleText}
              isSpeaking={isSpeakingVoice}
              speakerName={language === 'am' ? 'መምህር ቴክሩ' : 'Techeru SI Lecture'}
            />
          </div>

          {/* 3D Camera & Teaching Control Bar */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0d1322]/90 border border-white/10 backdrop-blur-md shadow-2xl z-20 max-w-[94%] overflow-x-auto scrollbar-none">
            {/* Camera Presets */}
            <div className="flex items-center gap-1 border-r border-white/10 pr-2 shrink-0">
              {(
                [
                  { id: 'full', label: '🧍 Full' },
                  { id: 'waist', label: '👔 Waist' },
                  { id: 'face', label: '👤 Face' },
                ] as { id: CameraPreset; label: string }[]
              ).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setCameraPreset(preset.id)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition ${
                    cameraPreset === preset.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Student Interruption Button */}
            {isSpeakingVoice && (
              <button
                onClick={handleInterrupt}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-600/25 text-rose-300 border border-rose-500/40 hover:bg-rose-600/35 transition animate-pulse shrink-0"
                title="Pause teacher and ask your question"
              >
                <Hand className="w-3.5 h-3.5" /> Interrupt
              </button>
            )}

            {/* Complete Poses from Reference Sheet */}
            <div className="flex items-center gap-1 pl-1 shrink-0">
              <button
                onClick={() => {
                  setForcedAnimation('idle');
                  setTimeout(() => setForcedAnimation(undefined), 3000);
                }}
                className="px-2 py-1 text-[11px] text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition"
                title="Idle stance"
              >
                🌟 Idle
              </button>
              <button
                onClick={() => {
                  setForcedAnimation('point');
                  setTimeout(() => setForcedAnimation(undefined), 3000);
                }}
                className="px-2 py-1 text-[11px] text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition"
                title="Point at blackboard/notes (Image 1/4)"
              >
                👉 Point
              </button>
              <button
                onClick={() => {
                  setForcedAnimation('clap');
                  setTimeout(() => setForcedAnimation(undefined), 3000);
                }}
                className="px-2 py-1 text-[11px] text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 rounded-full transition font-medium"
                title="Clap & Praise (Image 3!)"
              >
                👏 Praise
              </button>
              <button
                onClick={() => {
                  setForcedAnimation('waving');
                  setTimeout(() => setForcedAnimation(undefined), 3000);
                }}
                className="px-2 py-1 text-[11px] text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition"
                title="Friendly wave"
              >
                👋 Wave
              </button>
              <button
                onClick={() => {
                  setForcedAnimation('nod');
                  setTimeout(() => setForcedAnimation(undefined), 3000);
                }}
                className="px-2 py-1 text-[11px] text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition"
                title="Affirmative nod"
              >
                🙇 Nod
              </button>
              <button
                onClick={() => {
                  setForcedAnimation('thinking');
                  setTimeout(() => setForcedAnimation(undefined), 3500);
                }}
                className="px-2 py-1 text-[11px] text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition"
                title="Thoughtful chin touch"
              >
                🤔 Think
              </button>
              <button
                onClick={() => {
                  setForcedAnimation('walking');
                  setTimeout(() => setForcedAnimation(undefined), 3000);
                }}
                className="px-2 py-1 text-[11px] text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition"
                title="Walk stride"
              >
                🚶 Walk
              </button>
              <button
                onClick={() => {
                  setForcedAnimation('jumping');
                  setTimeout(() => setForcedAnimation(undefined), 2500);
                }}
                className="px-2 py-1 text-[11px] text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition"
                title="Celebration jump"
              >
                🦘 Jump
              </button>
            </div>
          </div>

          {/* Student Floating Camera Picture-in-Picture Feed */}
          {isCameraOn && (
            <div className="absolute bottom-6 left-6 w-36 h-26 rounded-2xl overflow-hidden border-2 border-blue-500/50 shadow-2xl bg-black z-20">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover scale-x-[-1]"
              />
              <div className="absolute top-2 left-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-300 bg-black/60 px-1.5 py-0.5 rounded">
                  Tracking
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Live Notes + AI Interactive Chat Board */}
        {!isFullScreenStage && (
          <div className="w-1/2 flex flex-col bg-[#0f1117] overflow-hidden select-text">
            {/* Live Notes Strip */}
            <div className="border-b border-white/10 p-5 max-h-44 overflow-y-auto shrink-0 bg-[#0c0e14]">
              <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> LIVE NOTES ·{' '}
                {(activeSession?.title || 'STUDY MATERIAL').toUpperCase()}
              </p>
              <div className="prose prose-invert prose-xs max-w-none text-gray-300 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayNotes}</ReactMarkdown>
              </div>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  } gap-3 items-end`}
                >
                  {msg.role === 'tutor' && (
                    <img
                      src="/logo_cat.png"
                      className="w-8 h-8 rounded-full object-contain bg-blue-500/10 p-0.5 shrink-0 border border-blue-500/30 shadow-md"
                      alt="Techeru"
                    />
                  )}
                  <div
                    className={`max-w-[84%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm font-medium shadow-md'
                        : 'bg-[#171b26] border border-white/10 text-gray-200 rounded-bl-sm prose prose-invert prose-sm max-w-none shadow-sm'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    )}
                  </div>
                </div>
              ))}

              {/* Student Live Speech interim preview */}
              {liveTranscript && (
                <div className="flex justify-end gap-3 items-end">
                  <div className="max-w-[84%] px-4 py-3 rounded-2xl text-sm leading-relaxed bg-blue-600/70 text-blue-100 rounded-br-sm italic animate-pulse">
                    🎙️ {liveTranscript}
                  </div>
                </div>
              )}

              {/* Teacher Thinking Animation */}
              {teacherState === 'THINKING' && (
                <div className="flex items-center gap-3">
                  <img
                    src="/logo_cat.png"
                    className="w-8 h-8 rounded-full object-contain bg-blue-500/10 p-0.5 border border-blue-500/30"
                    alt="Techeru"
                  />
                  <div className="bg-[#171b26] border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1.5 items-center">
                    <div
                      className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                      style={{ animationDelay: '0s' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    />
                    <span className="text-xs text-purple-300 ml-1 font-medium">
                      {language === 'am' ? 'ማብራሪያውን በማዘጋጀት ላይ...' : 'Formulating lesson...'}
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Prompt Suggestions Tailored to Subject & Language */}
            <div className="px-4 py-2 border-t border-white/5 bg-[#0f1117] flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
              <span className="text-[11px] text-gray-500 font-semibold flex items-center gap-1 shrink-0">
                <Sparkles className="w-3 h-3 text-yellow-400" />{' '}
                {language === 'am' ? 'ጥያቄዎች:' : 'Prompts:'}
              </span>
              {currentPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => processQuestion(prompt)}
                  className="px-3 py-1 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 rounded-full text-xs font-medium whitespace-nowrap transition"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar with Voice Microphone and Send */}
            <div className="p-4 border-t border-white/10 bg-[#0f1117] shrink-0">
              <div className="flex items-center bg-[#171b26] border border-white/10 rounded-2xl px-3 py-1.5 gap-2 focus-within:border-blue-500/50 transition">
                {/* Microphone Speech Recognition Button */}
                <button
                  onClick={toggleMicrophone}
                  title={
                    isListeningMic
                      ? language === 'am'
                        ? 'መስማትን አቁም'
                        : 'Stop Listening'
                      : language === 'am'
                      ? 'በድምጽ ተናገር'
                      : 'Speak with Techeru'
                  }
                  className={`p-2.5 rounded-xl transition ${
                    isListeningMic
                      ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-gray-300'
                  }`}
                >
                  {isListeningMic ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4 text-blue-400" />
                  )}
                </button>

                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && processQuestion(chatInput)}
                  placeholder={
                    isListeningMic
                      ? language === 'am'
                        ? 'ድምጽህን እያዳመጥኩ ነው...'
                        : 'Listening to your voice...'
                      : language === 'am'
                      ? 'መምህር ቴክሩን ማንኛውንም የትምህርት ጥያቄ ጠይቀው...'
                      : 'Ask Techeru anything about your notes...'
                  }
                  className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none py-1.5"
                />

                <button
                  onClick={() => processQuestion(chatInput)}
                  disabled={!chatInput.trim()}
                  className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition rounded-xl text-white font-medium shadow-md shadow-blue-600/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-gray-500 mt-1.5 text-center">
                {language === 'am'
                  ? 'ምላሾች በቅጽበት በድምፅ እና በከንፈር እንቅስቃሴ (Lip-sync) ይነበባሉ'
                  : 'Responses are spoken aloud with real-time lip-sync and grounded in your materials'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── 3D MODEL SHEET & RIG SPECIFICATION MODAL ── */}
      {showModelSheetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
          <div className="bg-[#0f1422] border border-blue-500/30 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#141b2d]">
              <div className="flex items-center gap-2.5">
                <span className="text-xl">📐</span>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">
                    3D CHARACTER SPECIFICATION & AI MODEL GENERATION
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Anthopomorphic Orange Tabby Cat Teacher · Official Turnaround & Meshy AI Pipeline
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/models/teacher-cat.glb"
                  download="teacher-cat.glb"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-full text-xs font-semibold text-white shadow-md transition"
                >
                  <span>⬇️</span> Download .GLB
                </a>
                <button
                  onClick={() => setShowModelSheetModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Official Reference Turnaround */}
              <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-inner group">
                <img
                  src="/character/official_cat_ref.jpg"
                  alt="3D Character Official Reference"
                  className="w-full h-auto object-contain max-h-[380px] mx-auto rounded-lg"
                />
                <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-sm px-2.5 py-1 rounded text-[10px] text-gray-300 border border-white/10">
                  Official Authoritative Character Reference Sheet
                </div>
              </div>

              {/* Meshy AI 3D Cloud Generation Box */}
              <div className="bg-[#12192c] border border-blue-500/30 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Meshy AI Cloud 3D Generator
                    </h4>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    Free / BYOK Ready
                  </span>
                </div>
                <p className="text-xs text-gray-300 mb-3">
                  Generate a complete full-body textured 3D mesh directly from the official reference
                  image using Meshy AI’s Image-to-3D API. (The high-fidelity procedural Three.js
                  sculpted cat runs automatically at zero-cost without requiring an API key).
                </p>

                <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                  <input
                    type="password"
                    placeholder="Enter Meshy API Key (or leave empty to use server default)..."
                    value={meshyApiKey}
                    onChange={(e) => setMeshyApiKey(e.target.value)}
                    className="flex-1 bg-black/30 border border-white/15 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={triggerMeshyGeneration}
                    disabled={isGenerating3D}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition whitespace-nowrap"
                  >
                    {isGenerating3D ? 'Generating...' : '✨ Generate with Meshy AI'}
                  </button>
                </div>

                {/* Progress & Status */}
                {genMessage && (
                  <div className="mt-3 p-2.5 rounded-lg bg-black/40 border border-white/10 text-xs">
                    <p className="text-gray-200">{genMessage}</p>
                    {meshyProgress > 0 && meshyProgress < 100 && (
                      <div className="w-full bg-white/10 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all duration-300"
                          style={{ width: `${meshyProgress}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Technical Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-[#161f36] border border-white/5 rounded-xl p-3">
                  <span className="text-blue-400 font-bold block mb-0.5">📦 Asset Format</span>
                  <span className="text-gray-300">Standalone Binary glTF 2.0 (.GLB)</span>
                </div>
                <div className="bg-[#161f36] border border-white/5 rounded-xl p-3">
                  <span className="text-emerald-400 font-bold block mb-0.5">🦴 Skeleton Rig</span>
                  <span className="text-gray-300">Humanoid + 7-Bone Tail & Movable Ears</span>
                </div>
                <div className="bg-[#161f36] border border-white/5 rounded-xl p-3">
                  <span className="text-purple-400 font-bold block mb-0.5">🎨 Materials</span>
                  <span className="text-gray-300">PBR Metallic-Roughness + Procedural Tabby</span>
                </div>
                <div className="bg-[#161f36] border border-white/5 rounded-xl p-3">
                  <span className="text-amber-400 font-bold block mb-0.5">🎙️ Lip-Sync</span>
                  <span className="text-gray-300">Web Audio API + Visemes (A, E, O, I, U)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
