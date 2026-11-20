'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Home as HomeIcon,
  BookOpen,
  Wrench,
  Trophy,
  Layers,
  BarChart2,
  Settings,
  Info,
  Search,
  Sun,
  Moon,
  Bell,
  Folder,
  ArrowLeftRight,
  Square,
  Play,
  Pause,
  CheckCircle2,
  Sparkles,
  Send,
  GraduationCap,
  Star,
  TrendingUp,
  X,
  Lightbulb,
  Volume2,
  FileText,
  HelpCircle,
  ChevronRight,
  Check,
  Plus,
  RefreshCw,
  Edit3,
  Share2,
  User,
} from 'lucide-react';
import TeacherCat3D from './TeacherCat3D';
import FlashcardDeck from './FlashcardDeck';
import { speechManager } from '@/audio/SpeechManager';
import { teacherSM, TeacherState } from '@/teacher/TeacherStateMachine';

export interface NotebookSource {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadedAt: string;
}

export interface LectureTopic {
  id: string;
  title: string;
  keyPoints: { label: string; desc: string }[];
  summary: string;
  quizQuestions: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  flashcards: { question: string; answer: string; category?: string }[];
}

export interface NotebookData {
  id: string;
  title: string;
  sourcesCount: number;
  date: string;
  sources: NotebookSource[];
  topics: LectureTopic[];
  activeTopicIndex: number;
  completedLessons: number;
  completedQuizzes: number;
  progressPercent: number;
}

interface ActiveLectureViewProps {
  notebook: NotebookData;
  onEndClass: () => void;
  onNavigateHome: () => void;
}

export default function ActiveLectureView({
  notebook,
  onEndClass,
  onNavigateHome,
}: ActiveLectureViewProps) {
  // Tabs & Navigation
  const [activeTab, setActiveTab] = useState<'lecture' | 'quiz' | 'flashcards' | 'summary' | 'notes'>('lecture');
  const [activeTopicIdx, setActiveTopicIdx] = useState(notebook.activeTopicIndex || 0);
  const currentTopic = notebook.topics[activeTopicIdx] || notebook.topics[0];

  // Theme: Day (light) and Night (dark) Mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Modals & Panels
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showChangeTopicModal, setShowChangeTopicModal] = useState(false);
  const [showPipAssistant, setShowPipAssistant] = useState(false);
  const [showPromo, setShowPromo] = useState(true);
  const [use3DAvatar, setUse3DAvatar] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showKeyPointsModal, setShowKeyPointsModal] = useState(false);

  // Chat conversation
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isPlayingTecheruAudio, setIsPlayingTecheruAudio] = useState(false);

  // Pip Chat State
  const [pipInput, setPipInput] = useState('');
  const [isPipSending, setIsPipSending] = useState(false);
  const [pipChatHistory, setPipChatHistory] = useState<{ role: 'pip' | 'user'; text: string; time: string }[]>([
    {
      role: 'pip',
      text: "Hi there! I'm Pip 💕 Whenever Techeru explains a concept, ask me and I'll break it down into simple, easy examples!",
      time: '14:06',
    },
  ]);

  // Notes state
  const [studentNotes, setStudentNotes] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return (
        localStorage.getItem(`notes_${notebook.id}_${currentTopic?.id}`) ||
        `# Notes: ${notebook.title}\n\n- Topic: ${currentTopic?.title}\n- Key Principle: Autonomy means patients have the final say on their care plan.\n- Reminder: Beneficence requires actively advocating for the patient's best outcome.`
      );
    }
    return '';
  });
  const [isNotesSaved, setIsNotesSaved] = useState(false);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Progress metrics
  const [lessonsDone, setLessonsDone] = useState(notebook.completedLessons || 12);
  const [quizzesDone, setQuizzesDone] = useState(notebook.completedQuizzes || 8);
  const [progressPct, setProgressPct] = useState(notebook.progressPercent || 75);

  // Clean Conversation Stream (No bulky blocker cards inside chat stream)
  const [conversation, setConversation] = useState<
    {
      id: string;
      sender: 'techeru' | 'pip' | 'student';
      text: string;
      time: string;
      hasAudio?: boolean;
    }[]
  >([
    {
      id: 'msg-1',
      sender: 'techeru',
      text: `Hello! 👋 Today we will learn about **${notebook.title}**.\nLet's explore the key ethical principles together! Feel free to ask any question at any time.`,
      time: '14:05',
      hasAudio: true,
    },
    {
      id: 'msg-2',
      sender: 'pip',
      text: 'That means patients have the right to make their own decisions, right? 😊 Ready when you are!',
      time: '14:06',
    },
  ]);

  const lectureEndRef = useRef<HTMLDivElement>(null);
  const pipEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    lectureEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  useEffect(() => {
    pipEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pipChatHistory]);

  // Handle Play Techeru Audio
  const playAudioGreeting = () => {
    if (isPlayingTecheruAudio) {
      speechManager.stop();
      setIsPlayingTecheruAudio(false);
      teacherSM.forceState('IDLE');
    } else {
      setIsPlayingTecheruAudio(true);
      teacherSM.forceState('SPEAKING');
      const textToSpeak = `Hello! Today we are studying ${notebook.title}. The core principles are Autonomy, Beneficence, Non-Maleficence, and Justice. What would you like to discuss first?`;
      speechManager.speak(
        textToSpeak,
        () => {
          teacherSM.forceState('SPEAKING');
        },
        () => {
          setIsPlayingTecheruAudio(false);
          teacherSM.forceState('IDLE');
        }
      );
    }
  };

  // Student Sends Message to Techeru
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSending) return;
    const query = chatInput.trim();
    setChatInput('');
    setIsSending(true);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setConversation((prev) => [
      ...prev,
      {
        id: `msg-${Date.now()}`,
        sender: 'student',
        text: query,
        time: timeStr,
      },
    ]);

    teacherSM.forceState('THINKING');

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are Professor Techeru teaching ${notebook.title}. The student asked: "${query}". Provide a clear, thorough explanation with real-world examples and encouragement.`,
        }),
      });

      let reply = '';
      if (res.ok) {
        const data = await res.json();
        reply = data.reply || data.response || '';
      }
      if (!reply) {
        reply = `Excellent point regarding **${currentTopic?.title}**! In healthcare practice, this principle ensures that clinician duties are balanced against patient rights. Always consider the ethical obligations alongside the practical outcomes.`;
      }

      teacherSM.forceState('SPEAKING');
      setConversation((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'techeru',
          text: reply,
          time: timeStr,
          hasAudio: true,
        },
      ]);

      // Pip commentary
      setTimeout(() => {
        setConversation((prev) => [
          ...prev,
          {
            id: `msg-${Date.now() + 2}`,
            sender: 'pip',
            text: `💡 Pip's Study Tip: Great question! Make sure to write down the core definition in your Notes tab to review before quizzes! 🐭✨`,
            time: timeStr,
          },
        ]);
        teacherSM.forceState('IDLE');
      }, 1000);
    } catch {
      teacherSM.forceState('IDLE');
      setConversation((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'techeru',
          text: `Great question! When analyzing **${currentTopic?.title}**, focus on how each principle guides decision-making. Would you like me to walk through a concrete clinical scenario?`,
          time: timeStr,
          hasAudio: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  // Student Sends Message to Pip
  const handleSendPipMessage = async () => {
    if (!pipInput.trim() || isPipSending) return;
    const q = pipInput.trim();
    setPipInput('');
    setIsPipSending(true);

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setPipChatHistory((prev) => [...prev, { role: 'user', text: q, time: timeStr }]);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[Answer as Pip the energetic, super-smart mouse study buddy 🐭 in 2 friendly, practical sentences]: The student asks about ${notebook.title}: ${q}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPipChatHistory((prev) => [
          ...prev,
          { role: 'pip', text: data.reply || data.response, time: timeStr },
        ]);
      } else {
        throw new Error();
      }
    } catch {
      setPipChatHistory((prev) => [
        ...prev,
        {
          role: 'pip',
          text: `🐭 Think of **${q}** as a team effort between patient and doctor! Respect the choices, avoid the risks, and do good! You've got this! 💕`,
          time: timeStr,
        },
      ]);
    } finally {
      setIsPipSending(false);
    }
  };

  // Quick Action Buttons
  const handleQuickAction = (action: 'explain' | 'examples' | 'quiz' | 'nextTopic') => {
    if (action === 'explain') {
      setChatInput('Can you explain this principle in more depth?');
      handleSendMessage();
    } else if (action === 'examples') {
      setChatInput('Can you give me 2 realistic clinical examples illustrating these principles?');
      handleSendMessage();
    } else if (action === 'quiz') {
      setActiveTab('quiz');
    } else if (action === 'nextTopic') {
      if (activeTopicIdx < notebook.topics.length - 1) {
        setActiveTopicIdx((prev) => prev + 1);
        setLessonsDone((prev) => prev + 1);
        setProgressPct((prev) => Math.min(100, prev + 5));
      }
    }
  };

  // Submit Quiz
  const handleQuizSubmit = () => {
    if (!currentTopic?.quizQuestions) return;
    let score = 0;
    currentTopic.quizQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score++;
      }
    });
    setQuizScore(score);
    setQuizSubmitted(true);
    setQuizzesDone((prev) => prev + 1);
    setProgressPct((prev) => Math.min(100, prev + 5));
  };

  // Save Notes
  const handleSaveNotes = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`notes_${notebook.id}_${currentTopic?.id}`, studentNotes);
      setIsNotesSaved(true);
      setTimeout(() => setIsNotesSaved(false), 2500);
    }
  };

  // Theme-aware styles using requested palette:
  // #EA8833 (Tiger Amber), #EEA23A (Honey Amber), #F38940 (Coral Orange), #132F45 (Deep Oceanic Slate), #32667F (Steel Cyan)
  const themeBg = isDarkMode ? 'bg-[#0d2131]' : 'bg-[#eef4f8]';
  const themeText = isDarkMode ? 'text-white' : 'text-[#132F45]';
  const headerBg = isDarkMode ? 'bg-[#132F45]/95 border-[#32667F]/40' : 'bg-white/95 border-[#32667F]/20 shadow-md';
  const sidebarBg = isDarkMode ? 'bg-[#0e2538] border-[#32667F]/30' : 'bg-[#f5f9fc] border-[#32667F]/20';
  const cardBg = isDarkMode ? 'bg-[#132F45]/85 border-[#32667F]/40' : 'bg-white/95 border-[#32667F]/25 shadow-xl';
  const chatBubbleTecheru = isDarkMode ? 'bg-[#183952] border-[#32667F]/40 text-gray-100' : 'bg-[#f0f7fb] border-[#32667F]/30 text-[#132F45] shadow-sm';
  const chatBubblePip = isDarkMode ? 'bg-[#241c30] border-pink-500/30 text-pink-100' : 'bg-[#fdf2f8] border-pink-400/40 text-[#701a75] shadow-sm';
  const inputBg = isDarkMode ? 'bg-[#0e2538]/90 border-[#32667F]/50 text-white' : 'bg-white border-[#32667F]/40 text-[#132F45] shadow-md';

  return (
    <div className={`h-screen w-screen ${themeBg} ${themeText} flex flex-col overflow-hidden font-sans select-none transition-colors duration-200`}>
      {/* ─────────────────── TOP HEADER ─────────────────── */}
      <header className={`h-16 px-6 ${headerBg} border-b backdrop-blur-xl flex items-center justify-between shrink-0 z-30 transition-colors duration-200`}>
        {/* Left: Branding with 100% Transparent Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onNavigateHome}>
          {/* Logo with 100% Transparent Background */}
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img
              src="/techeru_transparent.png"
              alt="Techeru"
              className="w-10 h-10 object-contain drop-shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo_cat.png';
              }}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className={`font-extrabold text-lg tracking-tight ${isDarkMode ? 'text-white' : 'text-[#132F45]'}`}>
                Techeru SI
              </span>
              <span className="font-extrabold text-lg text-[#F38940] tracking-tight">Lecture</span>
            </div>
            <span className={`text-[10px] tracking-wider mt-0.5 font-medium ${isDarkMode ? 'text-[#32667F]' : 'text-[#32667F]'}`}>
              Learn • Ask • Practice • Excel
            </span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="relative w-96 hidden md:block">
          <Search className="w-4 h-4 text-[#32667F] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search in your notebook..."
            className={`w-full rounded-full pl-10 pr-4 py-1.5 text-xs transition-all shadow-inner focus:outline-none ${
              isDarkMode
                ? 'bg-[#0e2538] border border-[#32667F]/50 text-gray-200 placeholder-[#32667F] focus:border-[#EA8833]'
                : 'bg-white border border-[#32667F]/30 text-[#132F45] placeholder-[#32667F] focus:border-[#EA8833]'
            }`}
          />
        </div>

        {/* Right: Controls & Guest Profile */}
        <div className="flex items-center gap-3">
          {/* Day / Night Toggle (Fully Functional!) */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-16 h-8 rounded-full p-1 flex items-center justify-between transition-all ${
              isDarkMode
                ? 'bg-[#0e2538] border border-[#32667F]/50 hover:border-[#EA8833]'
                : 'bg-white border border-[#32667F]/30 hover:border-[#EA8833] shadow-sm'
            }`}
            title={isDarkMode ? 'Switch to Day Mode' : 'Switch to Night Mode'}
          >
            <div className={`p-1 rounded-full transition-all ${!isDarkMode ? 'bg-[#EEA23A] text-white shadow-sm' : 'text-[#32667F]'}`}>
              <Sun className="w-3.5 h-3.5" />
            </div>
            <div className={`p-1 rounded-full transition-all ${isDarkMode ? 'bg-gradient-to-r from-[#EA8833] to-[#F38940] text-white shadow-sm' : 'text-[#32667F]'}`}>
              <Moon className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Notification Bell (Badge changed to 0!) */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                isDarkMode
                  ? 'bg-[#0e2538] border border-[#32667F]/50 text-gray-200 hover:border-[#EA8833]'
                  : 'bg-white border border-[#32667F]/30 text-[#132F45] hover:border-[#EA8833] shadow-sm'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#32667F] text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-md">
                0
              </span>
            </button>

            {showNotifications && (
              <div className={`absolute right-0 mt-2 w-56 rounded-2xl p-3 shadow-2xl z-50 text-xs border ${cardBg}`}>
                <p className="font-bold mb-1">Notifications</p>
                <p className="text-[11px] opacity-70">0 unread notifications • All caught up!</p>
              </div>
            )}
          </div>

          {/* Guest Mode Profile (Made Guest Mode!) */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm transition-all ${
            isDarkMode
              ? 'bg-[#0e2538] border-[#32667F]/50 text-white'
              : 'bg-white border-[#32667F]/30 text-[#132F45]'
          }`}>
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#EA8833] to-[#F38940] flex items-center justify-center text-[11px] font-extrabold text-white shadow-sm">
              G
            </div>
            <span className="text-xs font-semibold hidden sm:inline">Guest Mode</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
      </header>

      {/* ─────────────────── MAIN TWO-COLUMN BODY ─────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ────────── LEFT SIDEBAR ────────── */}
        <aside className={`w-56 ${sidebarBg} border-r p-4 flex flex-col justify-between shrink-0 select-none overflow-y-auto scrollbar-none transition-colors duration-200`}>
          <div className="space-y-1.5">
            <button
              onClick={onNavigateHome}
              className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#EA8833] via-[#EEA23A] to-[#F38940] text-white font-bold text-xs shadow-lg shadow-[#EA8833]/30 hover:opacity-95 transition-all"
            >
              <HomeIcon className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button
              onClick={() => setActiveTab('lecture')}
              className={`w-full flex items-center gap-3.5 px-4 py-2 rounded-xl font-medium text-xs transition-all ${
                isDarkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-[#132F45] hover:bg-black/5'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#EA8833]" />
              <span>My Lectures</span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`w-full flex items-center gap-3.5 px-4 py-2 rounded-xl font-medium text-xs transition-all ${
                isDarkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-[#132F45] hover:bg-black/5'
              }`}
            >
              <Wrench className="w-4 h-4 text-[#32667F]" />
              <span>Study Tools</span>
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`w-full flex items-center gap-3.5 px-4 py-2 rounded-xl font-medium text-xs transition-all ${
                isDarkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-[#132F45] hover:bg-black/5'
              }`}
            >
              <Trophy className="w-4 h-4 text-[#EEA23A]" />
              <span>Quiz Center</span>
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className={`w-full flex items-center gap-3.5 px-4 py-2 rounded-xl font-medium text-xs transition-all ${
                isDarkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-[#132F45] hover:bg-black/5'
              }`}
            >
              <Layers className="w-4 h-4 text-[#32667F]" />
              <span>Flashcards</span>
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`w-full flex items-center gap-3.5 px-4 py-2 rounded-xl font-medium text-xs transition-all ${
                isDarkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-[#132F45] hover:bg-black/5'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>Progress</span>
            </button>
            <button className={`w-full flex items-center gap-3.5 px-4 py-2 rounded-xl font-medium text-xs transition-all ${
              isDarkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-[#132F45] hover:bg-black/5'
            }`}>
              <Settings className="w-4 h-4 text-[#32667F]" />
              <span>Settings</span>
            </button>
            <button className={`w-full flex items-center gap-3.5 px-4 py-2 rounded-xl font-medium text-xs transition-all ${
              isDarkMode ? 'text-gray-300 hover:text-white hover:bg-white/5' : 'text-[#132F45] hover:bg-black/5'
            }`}>
              <Info className="w-4 h-4 text-[#32667F]" />
              <span>About</span>
            </button>
          </div>

          {/* Bottom Area: Promo Card + Pip Character */}
          <div className="pt-4 flex flex-col items-center relative">
            {/* Promo Card */}
            {showPromo && (
              <div className="w-full bg-gradient-to-r from-[#132F45] to-[#32667F]/70 border border-[#EEA23A]/40 rounded-2xl p-3 mb-4 shadow-xl relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[#EEA23A] text-sm">👑</span>
                    <span className="text-[11px] font-bold text-white tracking-wide">
                      Learn Smarter
                    </span>
                  </div>
                  <button
                    onClick={() => setShowPromo(false)}
                    className="text-gray-300 hover:text-white text-xs leading-none"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[10px] text-gray-200 font-medium">with Techeru SI!</p>
              </div>
            )}

            {/* Pip The Mouse Section */}
            <div className="w-full flex items-end justify-start relative pt-2">
              <div
                onClick={() => setShowPipAssistant(true)}
                className={`absolute -top-1 left-16 border rounded-xl px-2.5 py-1.5 shadow-xl cursor-pointer hover:border-pink-400 transition-all z-20 whitespace-nowrap ${
                  isDarkMode
                    ? 'bg-[#181c2b] border-pink-500/40'
                    : 'bg-white border-pink-400/50 text-[#701a75]'
                }`}
              >
                <p className="text-[10px] font-bold text-pink-400 flex items-center gap-1">
                  Hi! I'm Pip 💕
                </p>
                <p className={`text-[9px] ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Your study buddy!</p>
              </div>

              <button
                onClick={() => setShowPipAssistant(!showPipAssistant)}
                className="hover:scale-105 transition-transform duration-200 focus:outline-none"
                title="Click to study with Pip!"
              >
                <img
                  src="/classroom/pip_corner.png"
                  alt="Pip"
                  className="w-24 h-24 object-contain drop-shadow-2xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/pip.png';
                  }}
                />
              </button>
            </div>
          </div>
        </aside>

        {/* ────────── CENTER COLUMN: CLASSROOM WORKSPACE ────────── */}
        <main className={`flex-1 flex flex-col p-4 overflow-hidden ${themeBg} transition-colors duration-200`}>
          {/* Main Lecture Card */}
          <div className={`flex-1 flex flex-col ${cardBg} border rounded-3xl p-5 shadow-2xl backdrop-blur-2xl overflow-hidden relative min-h-0`}>
            {/* Ambient Back Glows using palette */}
            <div className="w-96 h-96 bg-[#EA8833]/10 rounded-full blur-3xl absolute -top-20 -left-20 pointer-events-none" />
            <div className="w-96 h-96 bg-[#32667F]/15 rounded-full blur-3xl absolute -bottom-20 -right-20 pointer-events-none" />

            {/* 1. Classroom Top Header Row */}
            <div className="flex items-center justify-between pb-3 border-b border-[#32667F]/30 relative z-10 shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#EA8833] to-[#F38940] flex items-center justify-center text-white shadow-lg shadow-[#EA8833]/30">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h1 className={`text-xl font-bold tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-[#132F45]'}`}>
                    {notebook.title}
                  </h1>
                  <p className="text-xs text-[#32667F] font-medium mt-0.5">
                    {notebook.sourcesCount} Sources • {notebook.date}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowKeyPointsModal(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    isDarkMode
                      ? 'bg-[#183952] border-[#32667F]/50 text-gray-200 hover:border-[#EA8833]'
                      : 'bg-[#f0f7fb] border-[#32667F]/30 text-[#132F45] hover:border-[#EA8833]'
                  }`}
                  title="View Key Principles"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-[#EEA23A]" />
                  <span>Key Points</span>
                </button>
                <button
                  onClick={() => setShowSourcesModal(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    isDarkMode
                      ? 'bg-[#183952] border-[#32667F]/50 text-gray-200 hover:border-[#EA8833]'
                      : 'bg-[#f0f7fb] border-[#32667F]/30 text-[#132F45] hover:border-[#EA8833]'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5 text-[#32667F]" />
                  <span>View Sources</span>
                </button>
                <button
                  onClick={() => setShowChangeTopicModal(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                    isDarkMode
                      ? 'bg-[#183952] border-[#32667F]/50 text-gray-200 hover:border-[#EA8833]'
                      : 'bg-[#f0f7fb] border-[#32667F]/30 text-[#132F45] hover:border-[#EA8833]'
                  }`}
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-[#F38940]" />
                  <span>Change Topic</span>
                </button>
                <button
                  onClick={onEndClass}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-[#F38940] hover:opacity-90 text-xs text-white font-bold shadow-lg shadow-rose-600/30 transition-all hover:scale-102"
                >
                  <span>End Class</span>
                  <Square className="w-3 h-3 fill-white" />
                </button>
              </div>
            </div>

            {/* 2. Workspace Navigation Tabs Row */}
            <div className="flex items-center gap-2 pt-2.5 pb-2.5 relative z-10 shrink-0">
              <button
                onClick={() => setActiveTab('lecture')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'lecture'
                    ? 'bg-gradient-to-r from-[#EA8833] to-[#F38940] text-white shadow-md shadow-[#EA8833]/30'
                    : isDarkMode
                    ? 'bg-[#0e2538] border border-[#32667F]/40 text-gray-300 hover:text-white'
                    : 'bg-[#f0f7fb] border border-[#32667F]/30 text-[#132F45] hover:bg-[#e2edf5]'
                }`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Lecture</span>
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'quiz'
                    ? 'bg-gradient-to-r from-[#EA8833] to-[#F38940] text-white shadow-md shadow-[#EA8833]/30'
                    : isDarkMode
                    ? 'bg-[#0e2538] border border-[#32667F]/40 text-gray-300 hover:text-white'
                    : 'bg-[#f0f7fb] border border-[#32667F]/30 text-[#132F45] hover:bg-[#e2edf5]'
                }`}
              >
                <Trophy className="w-3 h-3 text-[#EEA23A]" />
                <span>Quiz</span>
              </button>
              <button
                onClick={() => setActiveTab('flashcards')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'flashcards'
                    ? 'bg-gradient-to-r from-[#EA8833] to-[#F38940] text-white shadow-md shadow-[#EA8833]/30'
                    : isDarkMode
                    ? 'bg-[#0e2538] border border-[#32667F]/40 text-gray-300 hover:text-white'
                    : 'bg-[#f0f7fb] border border-[#32667F]/30 text-[#132F45] hover:bg-[#e2edf5]'
                }`}
              >
                <Layers className="w-3 h-3 text-[#32667F]" />
                <span>Flashcards</span>
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'summary'
                    ? 'bg-gradient-to-r from-[#EA8833] to-[#F38940] text-white shadow-md shadow-[#EA8833]/30'
                    : isDarkMode
                    ? 'bg-[#0e2538] border border-[#32667F]/40 text-gray-300 hover:text-white'
                    : 'bg-[#f0f7fb] border border-[#32667F]/30 text-[#132F45] hover:bg-[#e2edf5]'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-[#EEA23A]" />
                <span>Summary</span>
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'notes'
                    ? 'bg-gradient-to-r from-[#EA8833] to-[#F38940] text-white shadow-md shadow-[#EA8833]/30'
                    : isDarkMode
                    ? 'bg-[#0e2538] border border-[#32667F]/40 text-gray-300 hover:text-white'
                    : 'bg-[#f0f7fb] border border-[#32667F]/30 text-[#132F45] hover:bg-[#e2edf5]'
                }`}
              >
                <FileText className="w-3 h-3 text-emerald-400" />
                <span>Notes</span>
              </button>
            </div>

            {/* 3. Main Central Workspace Content (Maximized Chat Area with Perfect Spacing!) */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 relative z-10 min-h-0 scrollbar-thin scrollbar-thumb-[#32667F]/30">
              {/* ─── TAB 1: SPACIOUS LECTURE CHAT ─── */}
              {activeTab === 'lecture' && (
                <div className="space-y-3.5 pb-2">
                  {conversation.map((msg) => (
                    <div key={msg.id} className="space-y-2">
                      {/* Techeru Professor Message */}
                      {msg.sender === 'techeru' && (
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#EA8833] to-[#F38940] p-0.5 shrink-0 overflow-hidden shadow-md">
                            <img src="/logo_cat.png" alt="Techeru" className="w-full h-full object-contain rounded-full bg-[#132F45]" />
                          </div>
                          <div className={`flex-1 max-w-2xl ${chatBubbleTecheru} border rounded-2xl p-4 shadow-xl`}>
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-xs leading-relaxed whitespace-pre-line font-medium">
                                {msg.text}
                              </p>
                              {msg.hasAudio && (
                                <button
                                  onClick={playAudioGreeting}
                                  className="w-7 h-7 rounded-full bg-[#EA8833]/20 hover:bg-[#EA8833] border border-[#EA8833]/50 text-[#EA8833] hover:text-white flex items-center justify-center shrink-0 transition-all shadow-sm"
                                  title="Listen to Professor Techeru"
                                >
                                  {isPlayingTecheruAudio ? (
                                    <Pause className="w-3.5 h-3.5 fill-current" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                  )}
                                </button>
                              )}
                            </div>
                            <span className="block text-[10px] opacity-60 text-right mt-1.5 font-mono">
                              {msg.time}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Pip The Mouse Commentary Message */}
                      {msg.sender === 'pip' && (
                        <div className="flex items-start gap-3 ml-4">
                          <div className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-400/40 p-0.5 shrink-0 overflow-hidden shadow-md">
                            <img src="/pip.png" alt="Pip" className="w-full h-full object-contain" />
                          </div>
                          <div className={`${chatBubblePip} border rounded-2xl px-4 py-3 max-w-xl shadow-lg`}>
                            <p className="text-xs leading-relaxed font-medium">
                              {msg.text}
                            </p>
                            <span className="block text-[10px] opacity-60 text-right mt-1 font-mono">
                              {msg.time}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Student Message */}
                      {msg.sender === 'student' && (
                        <div className="flex items-start justify-end gap-3 mr-2">
                          <div className="bg-gradient-to-r from-[#EA8833] to-[#F38940] text-white rounded-2xl px-4 py-2.5 max-w-lg shadow-lg">
                            <p className="text-xs leading-relaxed font-medium">{msg.text}</p>
                            <span className="block text-[10px] text-white/70 text-right mt-1 font-mono">
                              {msg.time}
                            </span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-[#132F45] border border-[#32667F] flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md">
                            G
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isSending && (
                    <div className="flex items-center gap-2 text-xs text-[#EEA23A] bg-[#EEA23A]/10 border border-[#EEA23A]/30 rounded-xl p-2.5 w-fit">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-[#EA8833]" />
                      <span>Professor Techeru is explaining...</span>
                    </div>
                  )}

                  <div ref={lectureEndRef} />
                </div>
              )}

              {/* ─── TAB 2: INTERACTIVE QUIZ ─── */}
              {activeTab === 'quiz' && (
                <div className="space-y-4 max-w-2xl mx-auto py-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[#32667F]/30">
                    <div>
                      <h2 className={`text-base font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-[#132F45]'}`}>
                        <Trophy className="w-5 h-5 text-[#EEA23A]" />
                        {notebook.title} - Knowledge Check
                      </h2>
                      <p className="text-xs text-[#32667F] mt-0.5">
                        Test your mastery of {currentTopic?.title}.
                      </p>
                    </div>
                    {quizSubmitted && (
                      <div className="bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold px-3 py-1 rounded-xl text-xs">
                        Score: {quizScore} / {currentTopic?.quizQuestions?.length || 0}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {(currentTopic?.quizQuestions || []).map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className={`${chatBubbleTecheru} border rounded-2xl p-4 shadow-xl space-y-3`}
                      >
                        <p className="text-xs font-bold">
                          {qIdx + 1}. {q.question}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = selectedAnswers[qIdx] === oIdx;
                            const isCorrect = q.correctIndex === oIdx;
                            let btnStyle = isDarkMode ? 'bg-[#0e2538] border-[#32667F]/40 hover:border-[#EA8833]' : 'bg-white border-[#32667F]/30 hover:border-[#EA8833]';
                            if (quizSubmitted) {
                              if (isCorrect) btnStyle = 'bg-emerald-950/60 border-emerald-400 text-emerald-200';
                              else if (isSelected && !isCorrect)
                                btnStyle = 'bg-rose-950/60 border-rose-400 text-rose-200';
                            } else if (isSelected) {
                              btnStyle = 'bg-gradient-to-r from-[#EA8833] to-[#F38940] text-white';
                            }

                            return (
                              <button
                                key={oIdx}
                                disabled={quizSubmitted}
                                onClick={() =>
                                  setSelectedAnswers((prev) => ({ ...prev, [qIdx]: oIdx }))
                                }
                                className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${btnStyle}`}
                              >
                                <span>{opt}</span>
                                {quizSubmitted && isCorrect && (
                                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        {quizSubmitted && (
                          <div className="p-2.5 rounded-xl bg-[#EA8833]/15 border border-[#EA8833]/30 text-[11px] text-[#EEA23A]">
                            💡 <strong>Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2">
                    {!quizSubmitted ? (
                      <button
                        onClick={handleQuizSubmit}
                        className="px-6 py-2 bg-gradient-to-r from-[#EA8833] to-[#F38940] hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg shadow-[#EA8833]/30 transition-all"
                      >
                        Submit Answers
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedAnswers({});
                          setQuizSubmitted(false);
                        }}
                        className="px-6 py-2 bg-[#183952] border border-[#32667F]/50 text-white font-semibold text-xs rounded-xl transition-all"
                      >
                        Retake Quiz
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ─── TAB 3: FLASHCARDS ─── */}
              {activeTab === 'flashcards' && (
                <div className="max-w-xl mx-auto py-4">
                  <div className="text-center mb-4">
                    <h2 className="text-base font-bold flex items-center justify-center gap-2">
                      <Layers className="w-5 h-5 text-[#EA8833]" />
                      Active Recall Flashcards
                    </h2>
                    <p className="text-xs text-[#32667F] mt-1">
                      Flip cards to test memory retention on {notebook.title}.
                    </p>
                  </div>
                  <FlashcardDeck cards={currentTopic?.flashcards || []} />
                </div>
              )}

              {/* ─── TAB 4: LESSON SUMMARY ─── */}
              {activeTab === 'summary' && (
                <div className="max-w-2xl mx-auto py-2 space-y-4">
                  <div className={`${chatBubbleTecheru} border rounded-2xl p-5 shadow-xl space-y-3`}>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-[#EEA23A]" />
                      <h2 className="text-base font-bold">
                        {notebook.title} — Structured Summary
                      </h2>
                    </div>
                    <p className="text-xs leading-relaxed opacity-90">
                      {currentTopic?.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {currentTopic?.keyPoints.map((pt, pIdx) => (
                      <div key={pIdx} className={`${chatBubbleTecheru} border rounded-2xl p-4`}>
                        <span className="text-xs font-bold text-[#EA8833] block mb-1">
                          {pIdx + 1}. {pt.label}
                        </span>
                        <p className="text-[11px] leading-relaxed opacity-90">
                          {pt.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ─── TAB 5: STUDENT NOTES ─── */}
              {activeTab === 'notes' && (
                <div className="max-w-2xl mx-auto py-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-emerald-400" />
                        My Notebook Notes
                      </h2>
                      <p className="text-xs text-[#32667F]">
                        Notes are automatically saved to your local workspace.
                      </p>
                    </div>
                    <button
                      onClick={handleSaveNotes}
                      className="px-4 py-1.5 bg-gradient-to-r from-[#EA8833] to-[#F38940] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isNotesSaved ? 'Saved!' : 'Save Notes'}</span>
                    </button>
                  </div>
                  <textarea
                    value={studentNotes}
                    onChange={(e) => setStudentNotes(e.target.value)}
                    rows={12}
                    className={`w-full rounded-2xl p-4 text-xs leading-relaxed font-mono shadow-inner resize-none focus:outline-none focus:border-[#EA8833] ${
                      isDarkMode
                        ? 'bg-[#0e2538] border border-[#32667F]/40 text-gray-100 placeholder-gray-500'
                        : 'bg-white border border-[#32667F]/30 text-[#132F45] placeholder-gray-400 shadow-sm'
                    }`}
                    placeholder="Write your personal study takeaways, questions, and revision notes..."
                  />
                </div>
              )}
            </div>

            {/* 4. Bottom Input Bar (Cleanly Anchored at Bottom, Giving Chat Maximum Space!) */}
            <div className="pt-2 relative z-10 shrink-0">
              <div className={`${inputBg} rounded-full px-4 py-2 flex items-center gap-3 shadow-xl backdrop-blur-xl transition-colors`}>
                <Sparkles className="w-4 h-4 text-[#EA8833] shrink-0 animate-pulse" />
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask anything about this lecture..."
                  className="flex-1 bg-transparent text-xs outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isSending}
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#EA8833] to-[#F38940] hover:opacity-90 disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-md shadow-[#EA8833]/40 transition-all hover:scale-105"
                  title="Send Question"
                >
                  <Send className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 5. Bottom Learning Progress Footer Card */}
          <div className={`mt-3 ${cardBg} border rounded-2xl px-6 py-2.5 flex items-center justify-between shadow-xl shrink-0 transition-colors`}>
            {/* Lessons */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#EA8833]/20 border border-[#EA8833]/30 flex items-center justify-center text-[#EA8833]">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-xs font-bold block leading-tight ${isDarkMode ? 'text-white' : 'text-[#132F45]'}`}>{lessonsDone}</span>
                <span className="text-[10px] text-[#32667F]">Lessons</span>
              </div>
            </div>

            {/* Quizzes */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#32667F]/20 border border-[#32667F]/40 flex items-center justify-center text-[#38bdf8]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-xs font-bold block leading-tight ${isDarkMode ? 'text-white' : 'text-[#132F45]'}`}>{quizzesDone}</span>
                <span className="text-[10px] text-[#32667F]">Quizzes</span>
              </div>
            </div>

            {/* Progress Star */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#EEA23A]/20 border border-[#EEA23A]/40 flex items-center justify-center text-[#EEA23A]">
                <Star className="w-4 h-4 fill-[#EEA23A] text-[#EEA23A]" />
              </div>
              <div>
                <span className={`text-xs font-bold block leading-tight ${isDarkMode ? 'text-white' : 'text-[#132F45]'}`}>{progressPct}%</span>
                <span className="text-[10px] text-[#32667F]">Your Progress</span>
              </div>
            </div>

            {/* Semicircle Radial Progress Gauge */}
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-8 flex items-end justify-center">
                <svg viewBox="0 0 100 50" className="w-16 h-8">
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke={isDarkMode ? '#183952' : '#dbe8f2'}
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="125.6"
                    strokeDashoffset={125.6 * (1 - progressPct / 100)}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#EA8833" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className={`absolute bottom-0 text-[10px] font-bold font-mono ${isDarkMode ? 'text-white' : 'text-[#132F45]'}`}>
                  {progressPct}%
                </span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-[#EA8833]/15 flex items-center justify-center text-[#EA8833]">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </div>
        </main>

        {/* ────────── RIGHT SIDEBAR: TECHERU AI TEACHER PANEL ────────── */}
        <aside className={`w-80 ${sidebarBg} border-l p-4 flex flex-col justify-between shrink-0 select-none overflow-y-auto scrollbar-none transition-colors duration-200`}>
          {/* Header with Online Status */}
          <div className="flex items-center justify-between pb-3 border-b border-[#32667F]/30">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
              <span className={`text-xs font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-[#132F45]'}`}>
                Techeru AI Teacher
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider ml-1">
                Online
              </span>
            </div>
            <button
              onClick={() => setUse3DAvatar(!use3DAvatar)}
              className={`text-xs px-2 py-0.5 rounded border transition-all ${
                isDarkMode
                  ? 'bg-[#183952] border-[#32667F]/50 text-gray-200 hover:border-[#EA8833]'
                  : 'bg-white border-[#32667F]/30 text-[#132F45] hover:border-[#EA8833]'
              }`}
              title={use3DAvatar ? 'Switch to Studio Portrait' : 'Switch to 3D Canvas'}
            >
              {use3DAvatar ? '2D View' : '3D View'}
            </button>
          </div>

          {/* Character Viewport Frame */}
          <div className="my-3 flex flex-col items-center">
            <div className={`w-full h-56 rounded-2xl overflow-hidden relative shadow-2xl flex items-center justify-center border ${
              isDarkMode
                ? 'bg-gradient-to-b from-[#132F45] to-[#0d2131] border-[#32667F]/40'
                : 'bg-gradient-to-b from-white to-[#eef4f8] border-[#32667F]/30 shadow-lg'
            }`}>
              {use3DAvatar ? (
                <div className="w-full h-full relative">
                  <TeacherCat3D
                    cameraPreset="upper"
                    teacherState="IDLE"
                    modelUrl="/models/teacher-cat.glb?v=20261119"
                  />
                  <div className="absolute top-2 right-2 bg-[#132F45]/80 border border-[#32667F]/50 text-[9px] text-[#EEA23A] px-2 py-0.5 rounded-full font-mono backdrop-blur-sm">
                    3D Studio
                  </div>
                </div>
              ) : (
                <div className="w-full h-full relative flex items-center justify-center">
                  <img
                    src="/classroom/techeru_panel.jpg"
                    alt="Techeru AI Teacher"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/character/official_cat_ref.jpg';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>
              )}
            </div>

            {/* Banner Below Avatar */}
            <div className={`w-full mt-2.5 border rounded-xl px-3 py-2 text-center shadow-sm ${
              isDarkMode ? 'bg-[#183952]/80 border-[#32667F]/40' : 'bg-white border-[#32667F]/30'
            }`}>
              <p className="text-[11px] font-medium">
                I'm <strong className="text-[#EA8833] font-bold">Techeru</strong>! Let's learn{' '}
                <span className="font-semibold text-[#EEA23A]">{notebook.title}</span> together! ✨
              </p>
            </div>
          </div>

          {/* Quick Summary Card */}
          <div className={`border rounded-2xl p-3.5 shadow-xl space-y-2 mb-3 ${
            isDarkMode
              ? 'bg-gradient-to-b from-[#183952]/90 to-[#132F45] border-[#32667F]/40'
              : 'bg-white border-[#32667F]/25 shadow-md'
          }`}>
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-[#EEA23A] text-[#EEA23A]" />
              <span className={`text-xs font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-[#132F45]'}`}>
                Quick Summary
              </span>
            </div>
            <p className={`text-[11px] leading-relaxed font-medium ${isDarkMode ? 'text-gray-300' : 'text-[#132F45]'}`}>
              {currentTopic?.summary}
            </p>
          </div>

          {/* Try These Actions (2x2 Grid) */}
          <div className="space-y-2 mt-auto">
            <span className="text-[10px] font-bold text-[#32667F] tracking-wider uppercase block">
              Try these actions:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickAction('explain')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-[11px] font-semibold transition-all shadow-sm ${
                  isDarkMode
                    ? 'bg-[#183952] hover:bg-[#204a69] border-[#32667F]/40 text-gray-200'
                    : 'bg-white hover:bg-[#f0f7fb] border-[#32667F]/30 text-[#132F45]'
                }`}
              >
                <BookOpen className="w-3 h-3 text-[#EA8833]" />
                <span>Explain More</span>
              </button>
              <button
                onClick={() => handleQuickAction('examples')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-[11px] font-semibold transition-all shadow-sm ${
                  isDarkMode
                    ? 'bg-[#183952] hover:bg-[#204a69] border-[#32667F]/40 text-gray-200'
                    : 'bg-white hover:bg-[#f0f7fb] border-[#32667F]/30 text-[#132F45]'
                }`}
              >
                <Lightbulb className="w-3 h-3 text-[#EEA23A]" />
                <span>Give Examples</span>
              </button>
              <button
                onClick={() => handleQuickAction('quiz')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-[11px] font-semibold transition-all shadow-sm ${
                  isDarkMode
                    ? 'bg-[#183952] hover:bg-[#204a69] border-[#32667F]/40 text-gray-200'
                    : 'bg-white hover:bg-[#f0f7fb] border-[#32667F]/30 text-[#132F45]'
                }`}
              >
                <Trophy className="w-3 h-3 text-[#F38940]" />
                <span>Start a Quiz</span>
              </button>
              <button
                onClick={() => handleQuickAction('nextTopic')}
                className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl border text-[11px] font-semibold transition-all shadow-sm ${
                  isDarkMode
                    ? 'bg-[#183952] hover:bg-[#204a69] border-[#32667F]/40 text-gray-200'
                    : 'bg-white hover:bg-[#f0f7fb] border-[#32667F]/30 text-[#132F45]'
                }`}
              >
                <span>Next Topic</span>
                <ChevronRight className="w-3 h-3 text-[#38bdf8]" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ─────────────────── KEY POINTS MODAL (Collapsible on demand) ─────────────────── */}
      {showKeyPointsModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-lg ${cardBg} border rounded-3xl p-6 shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-[#32667F]/30">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-[#EEA23A]" />
                <h3 className="text-base font-bold">Key Points: {currentTopic?.title}</h3>
              </div>
              <button onClick={() => setShowKeyPointsModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {currentTopic?.keyPoints.map((pt, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#183952]/40 border border-[#32667F]/30">
                  <div className="w-5 h-5 rounded-full bg-[#EA8833]/20 border border-[#EA8833] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-[#EA8833] stroke-[3]" />
                  </div>
                  <div>
                    <strong className="text-sm font-bold text-[#EEA23A]">{pt.label}</strong>
                    <p className="text-xs opacity-90 mt-0.5">{pt.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowKeyPointsModal(false)}
                className="px-5 py-2 bg-gradient-to-r from-[#EA8833] to-[#F38940] text-white font-bold text-xs rounded-xl shadow-md"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── PIP AI ASSISTANT MODAL / DRAWER ─────────────────── */}
      {showPipAssistant && (
        <div className="fixed bottom-6 left-6 w-80 bg-[#1e172e] border border-pink-500/40 rounded-3xl p-4 shadow-2xl z-50 flex flex-col backdrop-blur-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-2.5 border-b border-pink-500/20 mb-3">
            <div className="flex items-center gap-2">
              <img src="/pip.png" alt="Pip" className="w-7 h-7 object-contain" />
              <div>
                <span className="text-xs font-bold text-pink-200 block leading-tight">
                  Pip AI Assistant
                </span>
                <span className="text-[9px] text-pink-400 font-medium">Your Study Companion</span>
              </div>
            </div>
            <button
              onClick={() => setShowPipAssistant(false)}
              className="text-gray-400 hover:text-white text-xs p-1"
            >
              ✕
            </button>
          </div>

          <div className="h-56 overflow-y-auto space-y-2.5 pr-1 text-xs select-text scrollbar-thin scrollbar-thumb-pink-500/20">
            {pipChatHistory.map((m, i) => (
              <div
                key={i}
                className={`p-2.5 rounded-xl leading-relaxed text-xs ${
                  m.role === 'pip'
                    ? 'bg-pink-950/40 border border-pink-500/20 text-pink-100'
                    : 'bg-gradient-to-r from-[#EA8833] to-[#F38940] text-white ml-auto max-w-[85%]'
                }`}
              >
                <p>{m.text}</p>
                <span className="block text-[9px] opacity-60 text-right mt-1 font-mono">{m.time}</span>
              </div>
            ))}
            {isPipSending && (
              <div className="text-[11px] text-pink-300 bg-pink-900/30 p-2 rounded-xl animate-pulse">
                Pip is typing a study tip... 🐭💕
              </div>
            )}
            <div ref={pipEndRef} />
          </div>

          <div className="pt-3 border-t border-pink-500/20 mt-2 flex items-center gap-2">
            <input
              type="text"
              value={pipInput}
              onChange={(e) => setPipInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendPipMessage()}
              placeholder="Ask Pip anything..."
              className="flex-1 bg-[#281f3d] border border-pink-500/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-pink-300/40 focus:outline-none focus:border-pink-400"
            />
            <button
              onClick={handleSendPipMessage}
              disabled={!pipInput.trim() || isPipSending}
              className="p-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white disabled:opacity-40 transition-all shadow-md shadow-pink-600/30"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────── VIEW SOURCES MODAL ─────────────────── */}
      {showSourcesModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-lg ${cardBg} border rounded-3xl p-6 shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-[#32667F]/30">
              <div className="flex items-center gap-2.5">
                <Folder className="w-5 h-5 text-[#32667F]" />
                <h3 className="text-base font-bold">
                  Notebook Sources: {notebook.title}
                </h3>
              </div>
              <button onClick={() => setShowSourcesModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {notebook.sources.map((src) => (
                <div
                  key={src.id}
                  className="bg-[#183952]/40 border border-[#32667F]/30 rounded-2xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#EA8833]/20 border border-[#EA8833]/30 flex items-center justify-center text-[#EA8833]">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{src.name}</p>
                      <p className="text-[10px] text-[#32667F]">
                        {src.size} • Uploaded {src.uploadedAt}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 font-semibold">
                    Indexed & Active
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSourcesModal(false)}
                className="px-5 py-2 bg-gradient-to-r from-[#EA8833] to-[#F38940] text-white font-bold text-xs rounded-xl shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── CHANGE TOPIC MODAL ─────────────────── */}
      {showChangeTopicModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className={`w-full max-w-md ${cardBg} border rounded-3xl p-6 shadow-2xl space-y-4`}>
            <div className="flex items-center justify-between pb-3 border-b border-[#32667F]/30">
              <div className="flex items-center gap-2.5">
                <ArrowLeftRight className="w-5 h-5 text-[#F38940]" />
                <h3 className="text-base font-bold">Select Topic / Lesson</h3>
              </div>
              <button onClick={() => setShowChangeTopicModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {notebook.topics.map((tpc, idx) => (
                <button
                  key={tpc.id}
                  onClick={() => {
                    setActiveTopicIdx(idx);
                    setShowChangeTopicModal(false);
                    setConversation((prev) => [
                      ...prev,
                      {
                        id: `msg-${Date.now()}`,
                        sender: 'techeru',
                        text: `📚 Now focusing on **${tpc.title}**! Let's explore its core concepts and applications together!`,
                        time: 'Now',
                        hasAudio: true,
                      },
                    ]);
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    idx === activeTopicIdx
                      ? 'bg-gradient-to-r from-[#EA8833]/30 to-[#F38940]/30 border-[#EA8833] text-white shadow-md'
                      : 'bg-[#183952]/40 border-[#32667F]/30 hover:border-[#EA8833]'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">{tpc.title}</p>
                    <p className="text-[10px] text-[#32667F] mt-0.5">
                      {tpc.keyPoints.length} Key Principles
                    </p>
                  </div>
                  {idx === activeTopicIdx && <Check className="w-4 h-4 text-[#EA8833]" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
