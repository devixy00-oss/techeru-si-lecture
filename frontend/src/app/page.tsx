"use client";

import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Send,
  Loader2,
  User,
  LogOut,
  Video,
  MessageSquare,
  BookOpen,
  Layers,
  Sparkles,
  FileText,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LiveClassMode from '@/components/LiveClassMode';
import FlashcardDeck from '@/components/FlashcardDeck';

// ─── Types ───────────────────────────────────────────────────────
type Role = 'user' | 'tutor' | 'pip';
type Message = { role: Role; content: string };
type BackendSession = {
  id: number;
  title: string;
  summary_notes: string | null;
  raw_transcript: string | null;
};
type Chat = {
  id: string;
  name: string;
  createdAt: number;
  messages: Message[];
  sessionIds: number[];
  waitingForPdf: number | null;
};

// ─── Helpers ─────────────────────────────────────────────────────
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
function loadChats(): Chat[] {
  try {
    const raw: Chat[] = JSON.parse(localStorage.getItem('techeru_chats') || '[]');
    // Ensure main chat only contains user and Techeru AI messages (strip any legacy pip messages)
    return raw.map(c => ({
      ...c,
      messages: (c.messages || []).filter(
        m => m.role !== 'pip' && !m.content.includes('INVALID_ARGUMENT')
      ),
    }));
  } catch {
    return [];
  }
}
function saveChats(chats: Chat[]) {
  localStorage.setItem('techeru_chats', JSON.stringify(chats));
}
const YES_WORDS = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'let', 'start', 'go', 'begin', 'ready', 'do it', 'y'];
const NO_WORDS = ['no', 'nope', 'not now', 'later', 'save', 'skip', 'nah', 'n'];

const DEFAULT_NOTES = `# 📚 Study Summary & Key Concepts

## Overview
- **Fundamental Principles:** Core theories, definitions, and structured problem-solving methods covered in your study notebook.
- **Step-by-Step Methodology:** Break down each topic into clear, logical stages before applying formulas.
- **Key Takeaways:** Practice active recall using the **Quiz Test** tab to reinforce memory retention.

## Important Definitions
- **Concept Analysis:** Identifying relationships between variables and core rules.
- **Worked Application:** Applying theoretical principles to solve practical exercises.

## Practice Questions
1. What is the first step when analyzing a new problem in this unit?
- Identify the given variables and core principle
2. How can you verify your solution is accurate?
- Substitute the result back into the original equation or definition
`;

// ─── Component ───────────────────────────────────────────────────
export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'notes' | 'flashcards'>('chat');

  // Pip Assistant Box state (Bottom-left cutout mouse)
  const [showPipChat, setShowPipChat] = useState(false);
  const [pipInput, setPipInput] = useState('');
  const [isPipSending, setIsPipSending] = useState(false);
  const [pipMessages, setPipMessages] = useState<{ role: string; content: string }[]>([
    { role: 'pip', content: "Hey! I'm **Pip** 🐭✨ Your smart AI study assistant! Ask me anything — math, science, summaries, or quick homework help!" },
  ]);

  const [isLiveClass, setIsLiveClass] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(null);
  const [allSessions, setAllSessions] = useState<BackendSession[]>([]);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const pipBottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Computed ──
  const activeChat = chats.find(c => c.id === activeChatId) ?? null;
  const activeSessionId = activeChat?.sessionIds[activeChat.sessionIds.length - 1];
  const activeSession =
    allSessions.find(s => s.id === activeSessionId) ?? allSessions[allSessions.length - 1] ?? null;

  // ── Init ──
  useEffect(() => {
    const stored = localStorage.getItem('techeru_user');
    if (stored) setUser(JSON.parse(stored));
    const saved = loadChats();
    if (saved.length > 0) {
      setChats(saved);
      setActiveChatId(saved[0].id);
      saveChats(saved);
    } else {
      createNewChat(true);
    }
    fetch('http://localhost:8000/api/sessions')
      .then(r => r.json())
      .then(setAllSessions)
      .catch(console.error);
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages, isSending]);

  useEffect(() => {
    pipBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [pipMessages, isPipSending]);

  // ── Chat Management ──
  function createNewChat(init = false) {
    const id = genId();
    const newChat: Chat = {
      id,
      name: 'New Chat',
      createdAt: Date.now(),
      messages: [
        {
          role: 'tutor',
          content:
            "Hey! 👋 I'm **Techeru**, your AI teacher 🐱\n\nUpload a PDF using the **+ Add source** button on the left, or ask me any question right now and I'll teach you step-by-step!",
        },
      ],
      sessionIds: [],
      waitingForPdf: null,
    };
    const updated = init ? [newChat] : [newChat, ...chats];
    setChats(updated);
    saveChats(updated);
    setActiveChatId(id);
    setActiveTab('chat');
  }

  function updateChat(id: string, patch: Partial<Chat>) {
    setChats(prev => {
      const updated = prev.map(c => (c.id === id ? { ...c, ...patch } : c));
      saveChats(updated);
      return updated;
    });
  }

  function addMessage(chatId: string, msg: Message) {
    setChats(prev => {
      const updated = prev.map(c =>
        c.id === chatId ? { ...c, messages: [...c.messages, msg] } : c
      );
      saveChats(updated);
      return updated;
    });
  }

  // ── File Upload ──
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length || !activeChatId) return;
    const file = e.target.files[0];
    e.target.value = '';
    const isPDF = file.name.toLowerCase().endsWith('.pdf');
    setUploading(true);
    setUploadLabel(isPDF ? 'Reading PDF...' : 'Uploading audio...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/ingestion/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setUploadLabel('Processing...');

      const chat = chats.find(c => c.id === activeChatId);
      if (chat && chat.sessionIds.length === 0) {
        updateChat(activeChatId, { name: file.name.replace(/\.[^.]+$/, '').slice(0, 30) });
      }
      updateChat(activeChatId, { sessionIds: [...(chat?.sessionIds ?? []), data.session_id] });

      pollAndAsk(data.session_id, file.name, activeChatId);
    } catch {
      setUploading(false);
      addMessage(activeChatId, {
        role: 'tutor',
        content: "⚠️ Upload couldn't complete. Please make sure the backend server is running!",
      });
    }
  }

  async function pollAndAsk(sessionId: number, filename: string, chatId: string) {
    let attempts = 0;
    const poll = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/sessions/${sessionId}`);
        const session: BackendSession = await res.json();
        setAllSessions(prev => {
          const exists = prev.find(s => s.id === sessionId);
          return exists ? prev.map(s => (s.id === sessionId ? session : s)) : [session, ...prev];
        });
        if (session.summary_notes || attempts > 3) {
          setUploading(false);
          setUploadLabel('');
          addMessage(chatId, {
            role: 'tutor',
            content:
              '📥 Got it! I just finished reading **' +
              filename +
              '** 📄\n\nShall we **start the class now**? 🐱✨\n\n👉 Say **yes** to begin learning\n👉 Say **later** to save it for another day',
          });
          updateChat(chatId, { waitingForPdf: sessionId });
        } else if (attempts < 40) {
          attempts++;
          setTimeout(poll, 3000);
        } else {
          setUploading(false);
          setUploadLabel('');
        }
      } catch {
        setUploading(false);
      }
    };
    poll();
  }

  // ── Send Message to Techeru AI (Main Chat) ──
  async function sendMessage() {
    if (!chatInput.trim() || isSending || !activeChatId) return;
    const text = chatInput.trim();
    setChatInput('');
    setActiveTab('chat');
    addMessage(activeChatId, { role: 'user', content: text });

    const chat = chats.find(c => c.id === activeChatId);

    if (chat?.waitingForPdf) {
      const lower = text.toLowerCase();
      const isYes = YES_WORDS.some(w => lower.includes(w));
      const isNo = NO_WORDS.some(w => lower.includes(w));

      if (isYes) {
        updateChat(activeChatId, { waitingForPdf: null });
        setIsSending(true);
        try {
          const res = await fetch(`http://localhost:8000/api/sessions/${chat.waitingForPdf}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message:
                'Start teaching me the content of this PDF from the beginning. Be fun, clear, and use emojis!',
            }),
          });
          const data = await res.json();
          addMessage(activeChatId, { role: 'tutor', content: data.reply });
        } catch {
          addMessage(activeChatId, {
            role: 'tutor',
            content: "🎓 Let's dive right in! Ask me which topic or chapter you'd like to explore first!",
          });
        } finally {
          setIsSending(false);
        }
        return;
      }
      if (isNo) {
        updateChat(activeChatId, { waitingForPdf: null });
        addMessage(activeChatId, {
          role: 'tutor',
          content:
            "No worries! 😊 I saved your PDF for whenever you're ready. You can check the **Summary** or **Quiz Test** tabs above anytime!",
        });
        return;
      }
    }

    setIsSending(true);
    const sessionId = chat?.sessionIds[chat.sessionIds.length - 1] ?? activeSession?.id;
    try {
      const url = sessionId
        ? `http://localhost:8000/api/sessions/${sessionId}/chat`
        : `http://localhost:8000/api/sessions/general/chat`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      addMessage(activeChatId, { role: 'tutor', content: data.reply });
    } catch {
      addMessage(activeChatId, {
        role: 'tutor',
        content: `Great question about **${text}**! 🐱✨\n\nHere is a clear breakdown:\n- **Core Idea:** Focus on the main definition and how the parts connect.\n- **Example:** Apply it step-by-step to see the pattern in action.\n\nWant me to quiz you on this or go deeper?`,
      });
    } finally {
      setIsSending(false);
    }
  }

  // ── Send Message to Pip AI (Bottom-left Assistant Box) ──
  async function sendPipMessage() {
    if (!pipInput.trim() || isPipSending) return;
    const q = pipInput.trim();
    setPipInput('');
    setPipMessages(prev => [...prev, { role: 'user', content: q }]);
    setIsPipSending(true);

    try {
      const sessionId = activeSession?.id;
      const url = sessionId
        ? `http://localhost:8000/api/sessions/${sessionId}/chat`
        : `http://localhost:8000/api/sessions/general/chat`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[Answer as Pip the energetic, super-smart mouse study buddy 🐭 in 2-4 concise, helpful sentences]: ${q}`,
        }),
      });
      const data = await res.json();
      setPipMessages(prev => [...prev, { role: 'pip', content: data.reply }]);
    } catch {
      setPipMessages(prev => [
        ...prev,
        {
          role: 'pip',
          content: `🐭✨ Quick tip on **${q}**: Break it into small steps, write down the key formula, and test yourself with one flashcard!`,
        },
      ]);
    } finally {
      setIsPipSending(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('techeru_user');
    window.location.href = '/login';
  }

  if (isLiveClass) {
    return <LiveClassMode sessions={allSessions} onExit={() => setIsLiveClass(false)} />;
  }

  const cleanSummaryNotes =
    activeSession?.summary_notes &&
    !activeSession.summary_notes.includes('INVALID_ARGUMENT') &&
    !activeSession.summary_notes.includes('Offline Mode')
      ? activeSession.summary_notes
      : DEFAULT_NOTES;

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0a0c14] text-white flex flex-col select-none">
      {/* ── TOP NAV ── */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-white/10 bg-[#0a0c14] shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/logo_cat.png"
            alt="Techeru Logo"
            className="w-9 h-9 object-contain drop-shadow-md"
          />
          <span className="font-bold text-lg tracking-tight text-white">Techeru AI</span>
        </div>

        <nav className="flex items-center gap-8 text-sm font-medium">
          <button
            onClick={() => setActiveTab('chat')}
            className={`cursor-pointer transition ${
              activeTab === 'chat' ? 'text-white font-semibold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            My Notebooks
          </button>
          <button
            onClick={() => setActiveTab(activeTab === 'flashcards' ? 'notes' : 'flashcards')}
            className={`cursor-pointer transition ${
              activeTab !== 'chat' ? 'text-white font-semibold' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Study Tools
          </button>
        </nav>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 text-sm font-medium transition"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-5 h-5 rounded-full" />
              ) : (
                <User className="w-4 h-4" />
              )}
              <span>{user?.name ?? 'Guest'}</span>
            </button>
            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#1a1f33] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden text-left flex flex-col">
                {!user?.email ? (
                  <>
                    <a
                      href="/login"
                      className="block px-4 py-3 text-sm text-white hover:bg-white/5 border-b border-white/10"
                    >
                      Log In
                    </a>
                    <a
                      href="/login?tab=signup"
                      className="block px-4 py-3 text-sm text-blue-400 hover:bg-white/5 border-b border-white/10 font-medium"
                    >
                      Create Account
                    </a>
                  </>
                ) : (
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm text-white font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 3-PANE LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT PANE: Sources & Pip Assistant ── */}
        <aside className="w-[280px] bg-[#0a0c14] border-r border-white/5 p-5 flex flex-col shrink-0 relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Sources</h2>
            <button
              onClick={() => createNewChat(false)}
              title="Start new subject chat"
              className="text-blue-400 hover:text-blue-300 p-1 rounded-lg hover:bg-white/5 transition"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition border ${
                  activeChatId === chat.id
                    ? 'bg-white/10 border-white/10 text-white'
                    : 'bg-transparent border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-300'
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg ${
                    activeChatId === chat.id ? 'bg-red-500/20 text-red-400' : 'bg-white/5'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <span className="truncate flex-1 text-sm font-medium">{chat.name}</span>
              </div>
            ))}

            {uploading && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/20">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-sm text-gray-400">{uploadLabel}</span>
              </div>
            )}

            {/* Add Source Button */}
            <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/20 hover:border-white/40 cursor-pointer transition text-gray-400 hover:text-gray-300 mt-2">
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add source</span>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,audio/*"
                onChange={handleUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Bottom-left Cutout Pip Mouse Assistant & AI Box */}
          <div className="mt-auto pt-2 flex flex-col items-start relative z-30">
            {showPipChat && (
              <div className="w-64 bg-[#171b26] border border-purple-500/30 rounded-2xl p-3 mb-2 shadow-2xl flex flex-col">
                <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-400" /> Pip AI Assistant
                  </span>
                  <button
                    onClick={() => setShowPipChat(false)}
                    className="text-gray-400 hover:text-white text-sm leading-none px-1"
                  >
                    &times;
                  </button>
                </div>
                <div className="h-44 overflow-y-auto space-y-2 mb-2 pr-1 select-text">
                  {pipMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`text-xs p-2.5 rounded-xl leading-relaxed ${
                        msg.role === 'pip'
                          ? 'bg-purple-900/30 border border-purple-500/20 text-purple-100'
                          : 'bg-blue-600 text-white ml-4'
                      }`}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  ))}
                  {isPipSending && (
                    <div className="text-xs p-2 rounded-xl bg-purple-900/20 text-purple-300 animate-pulse">
                      Pip is thinking... 🐭✨
                    </div>
                  )}
                  <div ref={pipBottomRef} />
                </div>
                <div className="flex items-center gap-1.5 mt-auto bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5">
                  <input
                    type="text"
                    value={pipInput}
                    onChange={e => setPipInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendPipMessage()}
                    placeholder="Ask Pip anything..."
                    className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 outline-none"
                  />
                  <button
                    onClick={sendPipMessage}
                    disabled={!pipInput.trim() || isPipSending}
                    className="text-purple-400 hover:text-purple-300 disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={() => setShowPipChat(!showPipChat)}
              className="hover:scale-105 transition-transform pl-1 group relative focus:outline-none"
              title="Open Pip AI Assistant"
            >
              <img
                src="/pip.png"
                alt="Pip"
                className="w-20 h-20 object-contain drop-shadow-xl"
                style={{ filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.6))' }}
              />
              <div className="absolute -top-1 left-16 bg-purple-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg whitespace-nowrap">
                Ask Pip AI 🐭
              </div>
            </button>
          </div>
        </aside>

        {/* ── MIDDLE PANE: Chat Learning Board / Summary / Quiz Test ── */}
        <main className="flex-1 bg-[#10121a] flex flex-col relative border-r border-white/5 overflow-hidden select-text">
          <div className="px-8 pt-5 pb-4 border-b border-white/5 shrink-0">
            <h1 className="text-xl font-bold text-white">
              {activeChat?.name || 'New Chat'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {activeChat?.sessionIds.length || 0} sources loaded · Chat teaching active
            </p>
            <div className="flex items-center gap-3 mt-3">
              {activeTab !== 'chat' && (
                <button
                  onClick={() => setActiveTab('chat')}
                  className="px-3.5 py-1.5 bg-[#1e212b] hover:bg-white/10 rounded-lg text-xs font-medium text-gray-200 flex items-center gap-2 border border-white/10 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> Chat
                </button>
              )}
              <button
                onClick={() => setActiveTab(activeTab === 'notes' ? 'chat' : 'notes')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 border transition ${
                  activeTab === 'notes'
                    ? 'bg-blue-600/20 border-blue-500/40 text-blue-300'
                    : 'bg-[#1e212b] hover:bg-white/10 border-white/5 text-gray-300'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Summary
              </button>
              <button
                onClick={() => setActiveTab(activeTab === 'flashcards' ? 'chat' : 'flashcards')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 border transition ${
                  activeTab === 'flashcards'
                    ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                    : 'bg-[#1e212b] hover:bg-white/10 border-white/5 text-gray-300'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" /> Quiz Test
              </button>
            </div>
          </div>

          {/* ── VIEW 1: CHAT WITH TECHERU AI ONLY ── */}
          {activeTab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto px-8 py-5 space-y-5">
                {(activeChat?.messages ?? [])
                  .filter(msg => msg.role !== 'pip')
                  .map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-3.5 ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {msg.role === 'tutor' && (
                        <img
                          src="/logo_cat.png"
                          alt="Techeru"
                          className="w-9 h-9 rounded-full object-contain bg-blue-500/10 p-1 shadow-md shrink-0 border border-white/10"
                        />
                      )}
                      <div
                        className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm max-w-[82%] ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white rounded-br-none font-medium'
                            : 'bg-[#1e212b] border border-white/5 text-gray-200 rounded-bl-none prose prose-invert prose-sm max-w-none'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          msg.content
                        ) : (
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  ))}
                {isSending && (
                  <div className="flex gap-3.5 items-center">
                    <img
                      src="/logo_cat.png"
                      className="w-9 h-9 rounded-full object-contain bg-blue-500/10 p-1 shadow-md shrink-0 border border-white/10"
                      alt="Techeru"
                    />
                    <div className="bg-[#1e212b] border border-white/5 px-5 py-3.5 rounded-2xl rounded-bl-none flex gap-1.5">
                      <div
                        className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: '0s' }}
                      />
                      <div
                        className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                      <div
                        className="w-2 h-2 rounded-full bg-blue-400 animate-bounce"
                        style={{ animationDelay: '0.4s' }}
                      />
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} className="h-2" />
              </div>

              <div className="px-6 py-4 bg-[#10121a] shrink-0">
                <div className="flex items-center gap-3 bg-[#1e212b] border border-white/10 rounded-full px-5 py-2.5 shadow-lg focus-within:border-blue-500/50 transition-all">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder={
                      activeChat?.waitingForPdf
                        ? 'Say yes to start or later to save...'
                        : 'Ask Techeru anything about your notes...'
                    }
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!chatInput.trim() || isSending}
                    className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 disabled:opacity-50 transition"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── VIEW 2: SUMMARY NOTES ── */}
          {activeTab === 'notes' && (
            <div className="flex-1 overflow-y-auto px-8 py-6">
              <div className="bg-[#171b26] border border-white/10 rounded-2xl p-6 prose prose-invert max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {cleanSummaryNotes}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* ── VIEW 3: QUIZ TEST / FLASHCARDS ── */}
          {activeTab === 'flashcards' && (
            <div className="flex-1 overflow-y-auto px-8 py-6 flex items-center justify-center">
              <div className="w-full max-w-xl">
                <FlashcardDeck
                  summaryNotes={cleanSummaryNotes}
                  title={activeChat?.name || 'Study Quiz'}
                />
              </div>
            </div>
          )}
        </main>

        {/* ── RIGHT PANE: Techeru Cutout Avatar & Start Live Class (Fits 100% on one screen) ── */}
        <aside className="w-[300px] bg-[#0a0c14] px-6 py-5 flex flex-col items-center justify-between shrink-0 text-center overflow-hidden">
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes breathe {
              0%, 100% { transform: translateY(0) scale(1); }
              50% { transform: translateY(-4px) scale(1.02); }
            }
            .animate-breathe { animation: breathe 4s ease-in-out infinite; }
          `,
            }}
          />

          <div className="flex-1 flex flex-col items-center justify-center w-full">
            <div className="relative mb-3 flex justify-center items-center">
              <div className="w-40 h-40 rounded-full bg-gradient-to-b from-blue-500/20 to-purple-500/20 absolute blur-2xl opacity-60 pointer-events-none" />
              <img
                src="/techeru_cutout.png"
                alt="Techeru AI"
                className="w-44 h-44 object-contain relative z-10 drop-shadow-2xl animate-breathe"
              />
            </div>

            <h2 className="text-xl font-bold text-white leading-tight">Techeru AI</h2>
            <p className="text-xs text-gray-400 mt-1 mb-3">Your personal AI tutor</p>

            <div className="flex items-center gap-2 text-xs font-medium text-green-400 bg-green-400/10 px-3 py-1 rounded-full mb-4 border border-green-400/20">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Ready to teach
            </div>

            <p className="text-xs text-gray-500 max-w-[210px] leading-relaxed">
              I've reviewed your sources. Start a Live Class and I'll teach you everything visually!
            </p>
          </div>

          <button
            onClick={() => setIsLiveClass(true)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20 shrink-0"
          >
            <Video className="w-4 h-4" /> Start Live Class
          </button>
        </aside>
      </div>
    </div>
  );
}
