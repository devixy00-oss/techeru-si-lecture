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
  Maximize2,
  Minimize2,
  Clock,
  Heart,
  Eye,
} from 'lucide-react';
import TeacherCat3D, { CameraPreset, AnimationName } from './TeacherCat3D';
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
  // Navigation & tabs
  const [activeTab, setActiveTab] = useState<'lecture' | 'quiz' | 'flashcards' | 'summary' | 'notes'>('lecture');
  const [activeTopicIdx, setActiveTopicIdx] = useState(notebook.activeTopicIndex || 0);
  const currentTopic = notebook.topics[activeTopicIdx] || notebook.topics[0];

  // Modals & Panels
  const [showSourcesModal, setShowSourcesModal] = useState(false);
  const [showChangeTopicModal, setShowChangeTopicModal] = useState(false);
  const [showPipAssistant, setShowPipAssistant] = useState(false);
  const [showPromo, setShowPromo] = useState(true);
  const [use3DAvatar, setUse3DAvatar] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);

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
      text: "Hi there! I'm Pip 💕 Whenever Techeru explains a big concept, ask me and I'll break it down into easy, bite-sized examples!",
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

  // Message flow for Lecture tab
  const [conversation, setConversation] = useState<
    {
      id: string;
      sender: 'techeru' | 'pip' | 'student';
      text: string;
      time: string;
      hasAudio?: boolean;
      keyPointsCard?: {
        points: { label: string; desc: string }[];
        illustrationUrl?: string;
      };
    }[]
  >([
    {
      id: 'msg-1',
      sender: 'techeru',
      text: `Hello! 👋 Today we will learn about **${notebook.title}**.\nLet's explore the key principles together!`,
      time: '14:05',
      hasAudio: true,
      keyPointsCard: {
        points: currentTopic?.keyPoints || [
          { label: 'Autonomy', desc: "Respect the patient's choices." },
          { label: 'Beneficence', desc: 'Do good for the patient.' },
          { label: 'Non-Maleficence', desc: 'Avoid harm.' },
          { label: 'Justice', desc: 'Ensure fair treatment.' },
        ],
        illustrationUrl: '/classroom/steth_card.jpg',
      },
    },
    {
      id: 'msg-2',
      sender: 'pip',
      text: 'That means patients have the right to make their own decisions, right? 😊',
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
      const textToSpeak = `Hello! Today we will learn about ${notebook.title}. Let's explore the key principles together: Autonomy, Beneficence, Non-Maleficence, and Justice.`;
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

    // Add student message
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
      // Call backend chat API
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `You are Professor Techeru, a distinguished university lecturer teaching ${notebook.title}. The student asked: "${query}". Answer thoroughly, accurately, with clear points and encouragement. Keep it engaging.`,
        }),
      });

      let reply = '';
      if (res.ok) {
        const data = await res.json();
        reply = data.reply || data.response || '';
      }
      if (!reply) {
        reply = `Excellent question about **${currentTopic?.title}**! In clinical practice and academic research, this principle guides critical decision-making. Always verify the core guidelines and consider both the ethical impact and practical outcomes!`;
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

      // Pip gives complementary quick tip 1 second later
      setTimeout(() => {
        setConversation((prev) => [
          ...prev,
          {
            id: `msg-${Date.now() + 2}`,
            sender: 'pip',
            text: `💡 Pip's Study Tip: Notice how Techeru highlighted the real-world connection! Try writing that in your Notes tab to help memorize it! 🐭✨`,
            time: timeStr,
          },
        ]);
        teacherSM.forceState('IDLE');
      }, 1200);
    } catch {
      teacherSM.forceState('IDLE');
      setConversation((prev) => [
        ...prev,
        {
          id: `msg-${Date.now() + 1}`,
          sender: 'techeru',
          text: `Great point! When analyzing **${currentTopic?.title}**, focus on how each principle balances patient rights against clinical duty. Let's practice with a quick quiz question whenever you're ready!`,
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
          message: `[Answer as Pip the energetic, cute, super-smart mouse study buddy 🐭 in 2 friendly, practical sentences]: The student asks about ${notebook.title}: ${q}`,
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
          text: `🐭 Got it! Think of **${q}** as a puzzle piece — remember Techeru's rule: respect choice, avoid harm, and do good! You're doing amazing! 💕`,
          time: timeStr,
        },
      ]);
    } finally {
      setIsPipSending(false);
    }
  };

  // Quick Action Buttons from Techeru's Side Panel
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

  return (
    <div className="h-screen w-screen bg-[#070b15] text-white flex flex-col overflow-hidden font-sans select-none">
      {/* ─────────────────── TOP HEADER ─────────────────── */}
      <header className="h-16 px-6 bg-[#0a1020]/90 border-b border-white/10 backdrop-blur-xl flex items-center justify-between shrink-0 z-30">
        {/* Left: Branding */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onNavigateHome}>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 p-0.5 shadow-lg shadow-orange-500/20 flex items-center justify-center">
            <img src="/logo_cat.png" alt="Techeru" className="w-9 h-9 object-contain rounded-full" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-lg text-white tracking-tight">Techeru SI</span>
              <span className="font-extrabold text-lg text-[#38bdf8] tracking-tight">Lecture</span>
            </div>
            <span className="text-[10px] text-gray-400 tracking-wider mt-0.5 font-medium">
              Learn • Ask • Practice • Excel
            </span>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="relative w-96 hidden md:block">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search in your notebook..."
            className="w-full bg-[#11192e]/80 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-xs text-gray-200 placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-all shadow-inner"
          />
        </div>

        {/* Right: Controls & User */}
        <div className="flex items-center gap-3">
          {/* Day/Night Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-16 h-8 bg-[#11192e] border border-white/10 rounded-full p-1 flex items-center justify-between hover:border-white/20 transition-all"
            title="Toggle Theme"
          >
            <div className={`p-1 rounded-full ${isDarkMode ? 'text-gray-500' : 'bg-amber-500 text-white'}`}>
              <Sun className="w-3.5 h-3.5" />
            </div>
            <div className={`p-1 rounded-full ${isDarkMode ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>
              <Moon className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Notification Bell */}
          <button className="relative w-9 h-9 bg-[#11192e] border border-white/10 rounded-full flex items-center justify-center text-gray-300 hover:text-white hover:border-blue-500/40 transition-all">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center shadow-md">
              2
            </span>
          </button>

          {/* User Profile Avatar */}
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-white/20 flex items-center justify-center font-bold text-sm text-white shadow-md shadow-blue-600/30">
            S
          </div>
        </div>
      </header>

      {/* ─────────────────── MAIN TWO-COLUMN BODY ─────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ────────── LEFT SIDEBAR ────────── */}
        <aside className="w-56 bg-[#090e1c] border-r border-white/5 p-4 flex flex-col justify-between shrink-0 select-none overflow-y-auto scrollbar-none">
          <div className="space-y-1.5">
            <button
              onClick={onNavigateHome}
              className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition-all"
            >
              <HomeIcon className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button
              onClick={() => setActiveTab('lecture')}
              className="w-full flex items-center gap-3.5 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-medium text-xs transition-all"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>My Lectures</span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className="w-full flex items-center gap-3.5 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-medium text-xs transition-all"
            >
              <Wrench className="w-4 h-4 text-cyan-400" />
              <span>Study Tools</span>
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className="w-full flex items-center gap-3.5 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-medium text-xs transition-all"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Quiz Center</span>
            </button>
            <button
              onClick={() => setActiveTab('flashcards')}
              className="w-full flex items-center gap-3.5 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-medium text-xs transition-all"
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Flashcards</span>
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className="w-full flex items-center gap-3.5 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-medium text-xs transition-all"
            >
              <BarChart2 className="w-4 h-4 text-emerald-400" />
              <span>Progress</span>
            </button>
            <button className="w-full flex items-center gap-3.5 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-medium text-xs transition-all">
              <Settings className="w-4 h-4 text-gray-400" />
              <span>Settings</span>
            </button>
            <button className="w-full flex items-center gap-3.5 px-4 py-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 font-medium text-xs transition-all">
              <Info className="w-4 h-4 text-gray-400" />
              <span>About</span>
            </button>
          </div>

          {/* Bottom Area: Promo Card + Pip Character */}
          <div className="pt-4 flex flex-col items-center relative">
            {/* Promo Card */}
            {showPromo && (
              <div className="w-full bg-gradient-to-r from-blue-900/60 to-purple-900/60 border border-purple-500/30 rounded-2xl p-3 mb-4 shadow-xl relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-amber-400 text-sm">👑</span>
                    <span className="text-[11px] font-bold text-white tracking-wide">
                      Learn Smarter
                    </span>
                  </div>
                  <button
                    onClick={() => setShowPromo(false)}
                    className="text-gray-400 hover:text-white text-xs leading-none"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-[10px] text-gray-300 font-medium">with Techeru SI!</p>
              </div>
            )}

            {/* Pip The Mouse Section */}
            <div className="w-full flex items-end justify-start relative pt-2">
              {/* Pip Speech Bubble */}
              <div
                onClick={() => setShowPipAssistant(true)}
                className="absolute -top-1 left-16 bg-[#161c2d] border border-pink-500/40 rounded-xl px-2.5 py-1.5 shadow-xl cursor-pointer hover:border-pink-400 transition-all z-20 whitespace-nowrap"
              >
                <p className="text-[10px] font-bold text-pink-300 flex items-center gap-1">
                  Hi! I'm Pip 💕
                </p>
                <p className="text-[9px] text-gray-300">Your study buddy!</p>
              </div>

              {/* Pip Cutout Image */}
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
                    // Fallback to pip.png
                    (e.target as HTMLImageElement).src = '/pip.png';
                  }}
                />
              </button>
            </div>
          </div>
        </aside>

        {/* ────────── CENTER COLUMN: CLASSROOM WORKSPACE ────────── */}
        <main className="flex-1 flex flex-col bg-[#070b15] p-5 overflow-hidden">
          {/* Top Lecture Container Card */}
          <div className="flex-1 flex flex-col bg-[#0b1224]/80 border border-white/10 rounded-3xl p-5 shadow-2xl backdrop-blur-2xl overflow-hidden relative">
            {/* Ambient Back Glow */}
            <div className="w-96 h-96 bg-blue-600/10 rounded-full blur-3xl absolute -top-20 -left-20 pointer-events-none" />
            <div className="w-96 h-96 bg-purple-600/10 rounded-full blur-3xl absolute -bottom-20 -right-20 pointer-events-none" />

            {/* 1. Classroom Top Header Row */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 relative z-10 shrink-0">
              <div className="flex items-center gap-3.5">
                {/* Glowing Book Icon */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white tracking-tight leading-tight">
                    {notebook.title}
                  </h1>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">
                    {notebook.sourcesCount} Sources • {notebook.date}
                  </p>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setShowSourcesModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#131b31]/90 border border-white/10 hover:border-purple-400/40 text-xs text-gray-200 font-semibold transition-all hover:bg-[#1a2544]"
                >
                  <Folder className="w-3.5 h-3.5 text-purple-400" />
                  <span>View Sources</span>
                </button>
                <button
                  onClick={() => setShowChangeTopicModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#131b31]/90 border border-white/10 hover:border-blue-400/40 text-xs text-gray-200 font-semibold transition-all hover:bg-[#1a2544]"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-blue-400" />
                  <span>Change Topic</span>
                </button>
                <button
                  onClick={onEndClass}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-xs text-white font-bold shadow-lg shadow-rose-600/30 transition-all hover:scale-102"
                >
                  <span>End Class</span>
                  <Square className="w-3 h-3 fill-white" />
                </button>
              </div>
            </div>

            {/* 2. Workspace Navigation Tabs Row */}
            <div className="flex items-center gap-2 pt-3 pb-3 relative z-10 shrink-0">
              <button
                onClick={() => setActiveTab('lecture')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'lecture'
                    ? 'bg-blue-600/30 border border-blue-400 text-blue-300 shadow-md shadow-blue-500/20'
                    : 'bg-[#12192e] border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Lecture</span>
              </button>
              <button
                onClick={() => setActiveTab('quiz')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'quiz'
                    ? 'bg-purple-600/30 border border-purple-400 text-purple-300 shadow-md shadow-purple-500/20'
                    : 'bg-[#12192e] border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Trophy className="w-3 h-3 text-purple-400" />
                <span>Quiz</span>
              </button>
              <button
                onClick={() => setActiveTab('flashcards')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'flashcards'
                    ? 'bg-blue-600/30 border border-blue-400 text-blue-300 shadow-md shadow-blue-500/20'
                    : 'bg-[#12192e] border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <Layers className="w-3 h-3 text-blue-400" />
                <span>Flashcards</span>
              </button>
              <button
                onClick={() => setActiveTab('summary')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'summary'
                    ? 'bg-cyan-600/30 border border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                    : 'bg-[#12192e] border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                <span>Summary</span>
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'notes'
                    ? 'bg-emerald-600/30 border border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/20'
                    : 'bg-[#12192e] border border-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3 text-emerald-400" />
                <span>Notes</span>
              </button>
            </div>

            {/* 3. Main Central Workspace Content based on Active Tab */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4 relative z-10 scrollbar-thin scrollbar-thumb-white/10">
              {/* ─── TAB 1: LECTURE CHAT ─── */}
              {activeTab === 'lecture' && (
                <div className="space-y-4 pb-4">
                  {conversation.map((msg) => (
                    <div key={msg.id} className="space-y-3">
                      {/* Techeru Professor Message */}
                      {msg.sender === 'techeru' && (
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-400/40 p-0.5 shrink-0 overflow-hidden shadow-md">
                            <img src="/logo_cat.png" alt="Techeru" className="w-full h-full object-contain" />
                          </div>
                          <div className="flex-1 max-w-2xl bg-[#12182c]/90 border border-blue-500/20 rounded-2xl p-4 shadow-xl">
                            <div className="flex items-start justify-between gap-4">
                              <p className="text-xs text-gray-200 leading-relaxed whitespace-pre-line font-medium">
                                {msg.text}
                              </p>
                              {msg.hasAudio && (
                                <button
                                  onClick={playAudioGreeting}
                                  className="w-7 h-7 rounded-full bg-blue-600/30 hover:bg-blue-600 border border-blue-400/40 text-blue-300 hover:text-white flex items-center justify-center shrink-0 transition-all"
                                  title="Listen to Techeru"
                                >
                                  {isPlayingTecheruAudio ? (
                                    <Pause className="w-3.5 h-3.5 fill-current" />
                                  ) : (
                                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                                  )}
                                </button>
                              )}
                            </div>
                            <span className="block text-[10px] text-gray-500 text-right mt-1.5 font-mono">
                              {msg.time}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Interactive Key Points Card */}
                      {msg.keyPointsCard && (
                        <div className="ml-12 max-w-2xl bg-gradient-to-r from-[#141b36] to-[#0e162c] border border-purple-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
                          <div className="flex items-center gap-2 mb-3.5">
                            <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                              <Lightbulb className="w-4 h-4 fill-amber-400 text-amber-400" />
                            </div>
                            <h3 className="text-sm font-bold text-white tracking-wide">Key Points</h3>
                          </div>

                          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
                            {/* Points List */}
                            <div className="flex-1 space-y-2.5">
                              {msg.keyPointsCard.points.map((pt, pIdx) => (
                                <div key={pIdx} className="flex items-start gap-2.5 text-xs">
                                  <div className="w-4 h-4 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                                    <Check className="w-2.5 h-2.5 text-blue-300 stroke-[3]" />
                                  </div>
                                  <p className="text-gray-200 leading-snug">
                                    <strong className="text-white font-semibold">{pt.label}</strong> – {pt.desc}
                                  </p>
                                </div>
                              ))}
                            </div>

                            {/* Stethoscope Illustration Graphic */}
                            {msg.keyPointsCard.illustrationUrl && (
                              <div className="w-44 h-28 rounded-xl overflow-hidden border border-white/10 shadow-lg shrink-0 relative bg-[#090e1c]">
                                <img
                                  src={msg.keyPointsCard.illustrationUrl}
                                  alt="Ethics Concept"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/character/official_cat_ref.jpg';
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Pip The Mouse Commentary Message */}
                      {msg.sender === 'pip' && (
                        <div className="flex items-start gap-3 ml-4">
                          <div className="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-400/40 p-0.5 shrink-0 overflow-hidden shadow-md">
                            <img src="/pip.png" alt="Pip" className="w-full h-full object-contain" />
                          </div>
                          <div className="bg-[#191528] border border-pink-500/30 rounded-2xl px-4 py-3 max-w-xl shadow-lg">
                            <p className="text-xs text-pink-100 leading-relaxed font-medium">
                              {msg.text}
                            </p>
                            <span className="block text-[10px] text-gray-500 text-right mt-1 font-mono">
                              {msg.time}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Student Message */}
                      {msg.sender === 'student' && (
                        <div className="flex items-start justify-end gap-3 mr-2">
                          <div className="bg-blue-600 text-white rounded-2xl px-4 py-2.5 max-w-lg shadow-lg">
                            <p className="text-xs leading-relaxed font-medium">{msg.text}</p>
                            <span className="block text-[10px] text-blue-200 text-right mt-1 font-mono">
                              {msg.time}
                            </span>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md">
                            S
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isSending && (
                    <div className="flex items-center gap-2 text-xs text-blue-300 bg-blue-900/20 border border-blue-500/20 rounded-xl p-2.5 w-fit">
                      <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      <span>Techeru is preparing explanation...</span>
                    </div>
                  )}

                  <div ref={lectureEndRef} />
                </div>
              )}

              {/* ─── TAB 2: INTERACTIVE QUIZ ─── */}
              {activeTab === 'quiz' && (
                <div className="space-y-4 max-w-2xl mx-auto py-2">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        {notebook.title} - Knowledge Check
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
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
                    {(currentTopic?.quizQuestions || [
                      {
                        question: 'What is the primary definition of Patient Autonomy in healthcare ethics?',
                        options: [
                          'Allowing the doctor to make all final clinical calls',
                          "Respecting the patient's right to make decisions about their own medical care",
                          'Performing emergency treatment without consultation',
                          'Treating all patients with identical medication doses',
                        ],
                        correctIndex: 1,
                        explanation:
                          'Autonomy upholds that every competent patient has the moral and legal right to self-determination regarding treatment.',
                      },
                      {
                        question: 'Which principle corresponds directly to "Do No Harm" (Primum non nocere)?',
                        options: ['Beneficence', 'Non-Maleficence', 'Justice', 'Fidelity'],
                        correctIndex: 1,
                        explanation:
                          'Non-Maleficence obligates practitioners to avoid inflicting intentional harm or unnecessary risks.',
                      },
                    ]).map((q, qIdx) => (
                      <div
                        key={qIdx}
                        className="bg-[#12182d] border border-white/10 rounded-2xl p-4 shadow-xl space-y-3"
                      >
                        <p className="text-xs font-bold text-gray-100">
                          {qIdx + 1}. {q.question}
                        </p>
                        <div className="space-y-2">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = selectedAnswers[qIdx] === oIdx;
                            const isCorrect = q.correctIndex === oIdx;
                            let btnStyle = 'bg-[#18213b] border-white/5 text-gray-300 hover:border-blue-400/30';
                            if (quizSubmitted) {
                              if (isCorrect) btnStyle = 'bg-emerald-950/60 border-emerald-400 text-emerald-200';
                              else if (isSelected && !isCorrect)
                                btnStyle = 'bg-rose-950/60 border-rose-400 text-rose-200';
                            } else if (isSelected) {
                              btnStyle = 'bg-blue-600/30 border-blue-400 text-white';
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
                          <div className="p-2.5 rounded-xl bg-blue-950/30 border border-blue-500/20 text-[11px] text-blue-200">
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
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                      >
                        Submit Answers
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedAnswers({});
                          setQuizSubmitted(false);
                        }}
                        className="px-6 py-2 bg-[#172038] hover:bg-[#202c4d] border border-white/10 text-white font-semibold text-xs rounded-xl transition-all"
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
                    <h2 className="text-base font-bold text-white flex items-center justify-center gap-2">
                      <Layers className="w-5 h-5 text-blue-400" />
                      Active Recall Flashcards
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      Flip cards to test memory retention on {notebook.title}.
                    </p>
                  </div>
                  <FlashcardDeck
                    cards={
                      currentTopic?.flashcards || [
                        {
                          question: 'What is Autonomy in healthcare ethics?',
                          answer:
                            "The moral and legal principle that acknowledges a patient's personal right to make decisions regarding their own healthcare without coercion.",
                          category: 'Principles',
                        },
                        {
                          question: 'How is Beneficence defined?',
                          answer:
                            'An ethical duty to act in the best interest of the patient, taking positive steps to prevent or remove harm.',
                          category: 'Principles',
                        },
                        {
                          question: 'What does Non-Maleficence require?',
                          answer:
                            'The obligation not to inflict harm intentionally, derived from "First, do no harm".',
                          category: 'Clinical Duty',
                        },
                        {
                          question: 'What is the Justice principle in medical care?',
                          answer:
                            'Fairness in the distribution of healthcare resources and equal treatment of patients regardless of background.',
                          category: 'Systemic Ethics',
                        },
                      ]
                    }
                  />
                </div>
              )}

              {/* ─── TAB 4: LESSON SUMMARY ─── */}
              {activeTab === 'summary' && (
                <div className="max-w-2xl mx-auto py-2 space-y-4">
                  <div className="bg-[#12182c] border border-white/10 rounded-2xl p-5 shadow-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-cyan-400" />
                      <h2 className="text-base font-bold text-white">
                        {notebook.title} — Structured Summary
                      </h2>
                    </div>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {currentTopic?.summary ||
                        'Health care ethics provides a moral framework for clinicians and patients to navigate complex medical decisions. The core cornerstone rests upon four universal pillars: Autonomy, Beneficence, Non-Maleficence, and Justice.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-[#101628] border border-blue-500/20 rounded-2xl p-4">
                      <span className="text-xs font-bold text-blue-300 block mb-1">
                        1. Autonomy
                      </span>
                      <p className="text-[11px] text-gray-300 leading-relaxed">
                        Informed consent, truth-telling, and honoring advance directives.
                      </p>
                    </div>
                    <div className="bg-[#101628] border border-emerald-500/20 rounded-2xl p-4">
                      <span className="text-xs font-bold text-emerald-300 block mb-1">
                        2. Beneficence
                      </span>
                      <p className="text-[11px] text-gray-300 leading-relaxed">
                        Maximized clinical benefit through evidence-based treatments and compassion.
                      </p>
                    </div>
                    <div className="bg-[#101628] border border-rose-500/20 rounded-2xl p-4">
                      <span className="text-xs font-bold text-rose-300 block mb-1">
                        3. Non-Maleficence
                      </span>
                      <p className="text-[11px] text-gray-300 leading-relaxed">
                        Risk management, medication error prevention, and avoiding futile treatments.
                      </p>
                    </div>
                    <div className="bg-[#101628] border border-purple-500/20 rounded-2xl p-4">
                      <span className="text-xs font-bold text-purple-300 block mb-1">
                        4. Justice
                      </span>
                      <p className="text-[11px] text-gray-300 leading-relaxed">
                        Equitable resource allocation, triage ethics, and non-discriminatory care.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── TAB 5: STUDENT NOTES ─── */}
              {activeTab === 'notes' && (
                <div className="max-w-2xl mx-auto py-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-white flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-emerald-400" />
                        My Notebook Notes
                      </h2>
                      <p className="text-xs text-gray-400">
                        Notes are automatically saved to your local workspace.
                      </p>
                    </div>
                    <button
                      onClick={handleSaveNotes}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isNotesSaved ? 'Saved!' : 'Save Notes'}</span>
                    </button>
                  </div>
                  <textarea
                    value={studentNotes}
                    onChange={(e) => setStudentNotes(e.target.value)}
                    rows={12}
                    className="w-full bg-[#11172a] border border-white/10 rounded-2xl p-4 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 leading-relaxed font-mono shadow-inner resize-none"
                    placeholder="Write your personal study takeaways, questions, and revision notes..."
                  />
                </div>
              )}
            </div>

            {/* 4. Bottom Message Input Bar */}
            <div className="pt-3 relative z-10 shrink-0">
              <div className="bg-[#12192e]/90 border border-white/15 rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl backdrop-blur-xl">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 animate-pulse" />
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask anything about this lecture..."
                  className="flex-1 bg-transparent text-xs text-white placeholder-gray-400 outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isSending}
                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/40 transition-all hover:scale-105"
                  title="Send Question"
                >
                  <Send className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 5. Bottom Learning Progress Footer Card */}
          <div className="mt-3 bg-[#0a1020]/90 border border-white/10 rounded-2xl px-6 py-2.5 flex items-center justify-between shadow-xl shrink-0">
            {/* Metric 1: Lessons */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block leading-tight">{lessonsDone}</span>
                <span className="text-[10px] text-gray-400">Lessons</span>
              </div>
            </div>

            {/* Metric 2: Quizzes */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-600/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block leading-tight">{quizzesDone}</span>
                <span className="text-[10px] text-gray-400">Quizzes</span>
              </div>
            </div>

            {/* Metric 3: Star Your Progress */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block leading-tight">{progressPct}%</span>
                <span className="text-[10px] text-gray-400">Your Progress</span>
              </div>
            </div>

            {/* Metric 4: Semicircular Radial Gauge */}
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-8 flex items-end justify-center">
                {/* SVG Semi-Circle Gauge */}
                <svg viewBox="0 0 100 50" className="w-16 h-8">
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#1e293b"
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
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#22c55e" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute bottom-0 text-[10px] font-bold text-white font-mono">
                  {progressPct}%
                </span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </div>
        </main>

        {/* ────────── RIGHT SIDEBAR: TECHERU AI TEACHER PANEL ────────── */}
        <aside className="w-80 bg-[#090e1c] border-l border-white/5 p-4 flex flex-col justify-between shrink-0 select-none overflow-y-auto scrollbar-none">
          {/* 1. Header with Online Status */}
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
              <span className="text-xs font-bold text-white tracking-wide">Techeru AI Teacher</span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider ml-1">
                Online
              </span>
            </div>
            <button
              onClick={() => setUse3DAvatar(!use3DAvatar)}
              className="text-gray-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-white/5"
              title={use3DAvatar ? 'Switch to Studio Portrait' : 'Switch to 3D Canvas'}
            >
              {use3DAvatar ? '2D' : '3D'}
            </button>
          </div>

          {/* 2. Character Viewport Frame */}
          <div className="my-3 flex flex-col items-center">
            <div className="w-full h-56 rounded-2xl bg-gradient-to-b from-[#131b31] to-[#0b1020] border border-blue-500/30 overflow-hidden relative shadow-2xl flex items-center justify-center">
              {use3DAvatar ? (
                <div className="w-full h-full relative">
                  <TeacherCat3D
                    cameraPreset="upper"
                    teacherState="IDLE"
                    modelUrl="/models/teacher-cat.glb?v=20261119"
                  />
                  <div className="absolute top-2 right-2 bg-blue-900/60 border border-blue-400/40 text-[9px] text-blue-200 px-2 py-0.5 rounded-full font-mono backdrop-blur-sm">
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
            <div className="w-full mt-2.5 bg-[#12192e] border border-white/5 rounded-xl px-3 py-2 text-center shadow-md">
              <p className="text-[11px] text-gray-200 font-medium">
                I'm <strong className="text-white font-bold">Techeru</strong>! Let's learn{' '}
                <span className="text-blue-300 font-semibold">{notebook.title}</span> together! ✨
              </p>
            </div>
          </div>

          {/* 3. Quick Summary Card */}
          <div className="bg-gradient-to-b from-[#141d36]/90 to-[#0e162c] border border-white/10 rounded-2xl p-3.5 shadow-xl space-y-2 mb-3">
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-bold text-white tracking-wide">Quick Summary</span>
            </div>
            <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
              {currentTopic?.summary ||
                'Health care ethics helps us make kind, fair, and responsible decisions in healthcare.'}
            </p>
          </div>

          {/* 4. Try These Actions (2x2 Grid) */}
          <div className="space-y-2 mt-auto">
            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase block">
              Try these actions:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickAction('explain')}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#12192e] hover:bg-[#1a2542] border border-white/10 text-[11px] text-gray-200 font-semibold transition-all shadow-sm"
              >
                <BookOpen className="w-3 h-3 text-blue-400" />
                <span>Explain More</span>
              </button>
              <button
                onClick={() => handleQuickAction('examples')}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#12192e] hover:bg-[#1a2542] border border-white/10 text-[11px] text-gray-200 font-semibold transition-all shadow-sm"
              >
                <Lightbulb className="w-3 h-3 text-amber-400" />
                <span>Give Examples</span>
              </button>
              <button
                onClick={() => handleQuickAction('quiz')}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#12192e] hover:bg-[#1a2542] border border-white/10 text-[11px] text-gray-200 font-semibold transition-all shadow-sm"
              >
                <Trophy className="w-3 h-3 text-purple-400" />
                <span>Start a Quiz</span>
              </button>
              <button
                onClick={() => handleQuickAction('nextTopic')}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-[#12192e] hover:bg-[#1a2542] border border-white/10 text-[11px] text-gray-200 font-semibold transition-all shadow-sm"
              >
                <span>Next Topic</span>
                <ChevronRight className="w-3 h-3 text-cyan-400" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ─────────────────── PIP AI ASSISTANT MODAL / DRAWER ─────────────────── */}
      {showPipAssistant && (
        <div className="fixed bottom-6 left-6 w-80 bg-[#151224] border border-pink-500/40 rounded-3xl p-4 shadow-2xl z-50 flex flex-col backdrop-blur-2xl animate-in slide-in-from-bottom duration-200">
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
                    : 'bg-purple-600 text-white ml-auto max-w-[85%]'
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
              className="flex-1 bg-[#201736] border border-pink-500/30 rounded-xl px-3 py-1.5 text-xs text-white placeholder-pink-300/40 focus:outline-none focus:border-pink-400"
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
          <div className="w-full max-w-lg bg-[#0e162c] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <Folder className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  Notebook Sources: {notebook.title}
                </h3>
              </div>
              <button
                onClick={() => setShowSourcesModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {notebook.sources.map((src) => (
                <div
                  key={src.id}
                  className="bg-[#141d36] border border-white/10 rounded-2xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">{src.name}</p>
                      <p className="text-[10px] text-gray-400">
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
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30"
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
          <div className="w-full max-w-md bg-[#0e162c] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <ArrowLeftRight className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Select Topic / Lesson</h3>
              </div>
              <button
                onClick={() => setShowChangeTopicModal(false)}
                className="text-gray-400 hover:text-white"
              >
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
                    // Add transition message in conversation
                    setConversation((prev) => [
                      ...prev,
                      {
                        id: `msg-${Date.now()}`,
                        sender: 'techeru',
                        text: `📚 Now switching our focus to **${tpc.title}**! Let's explore its core concepts and applications together!`,
                        time: 'Now',
                        hasAudio: true,
                        keyPointsCard: {
                          points: tpc.keyPoints,
                          illustrationUrl: '/classroom/steth_card.jpg',
                        },
                      },
                    ]);
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    idx === activeTopicIdx
                      ? 'bg-blue-600/30 border-blue-400 text-white shadow-md'
                      : 'bg-[#141d36] border-white/10 text-gray-300 hover:bg-[#1a2544] hover:text-white'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">{tpc.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {tpc.keyPoints.length} Key Principles
                    </p>
                  </div>
                  {idx === activeTopicIdx && <Check className="w-4 h-4 text-blue-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
