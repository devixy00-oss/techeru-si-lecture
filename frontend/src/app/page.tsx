"use client";

import { useState, useEffect, useRef } from 'react';
import { Plus, Send, Loader2, User, LogOut, ChevronDown, Video, Trash2, MessageSquare, BookOpen, Layers, PlusCircle, Sparkles, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import LiveClassMode from '@/components/LiveClassMode';
import FlashcardDeck from '@/components/FlashcardDeck';

// ─── Types ───────────────────────────────────────────────────────
type Role = 'user' | 'tutor' | 'pip';
type Message = { role: Role; content: string };
type BackendSession = { id: number; title: string; summary_notes: string | null; raw_transcript: string | null };
type Chat = {
  id: string;
  name: string;
  createdAt: number;
  messages: Message[];
  sessionIds: number[];
  waitingForPdf: number | null; 
};

// ─── Helpers ─────────────────────────────────────────────────────
function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function loadChats(): Chat[] {
  try { return JSON.parse(localStorage.getItem('techeru_chats') || '[]'); } catch { return []; }
}
function saveChats(chats: Chat[]) {
  localStorage.setItem('techeru_chats', JSON.stringify(chats));
}
const YES_WORDS = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'let', 'start', 'go', 'begin', 'ready', 'do it', 'y'];
const NO_WORDS  = ['no', 'nope', 'not now', 'later', 'save', 'skip', 'nah', 'n'];

// ─── Component ───────────────────────────────────────────────────
export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showPipChat, setShowPipChat] = useState(false);
  const [pipInput, setPipInput] = useState('');
  const [pipMessages, setPipMessages] = useState<{role:string, content:string}[]>([{role:'pip', content:'Hey! I\'m Pip! Need quick help?'}]);
  const [isLiveClass, setIsLiveClass] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadLabel, setUploadLabel] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(null);
  const [allSessions, setAllSessions] = useState<BackendSession[]>([]);
  const [rightTab, setRightTab] = useState<'notes' | 'flashcards'>('notes');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Computed ──
  const activeChat = chats.find(c => c.id === activeChatId) ?? null;

  // ── Init ──
  useEffect(() => {
    const stored = localStorage.getItem('techeru_user');
    if (stored) setUser(JSON.parse(stored));
    const saved = loadChats();
    if (saved.length > 0) {
      setChats(saved);
      setActiveChatId(saved[0].id);
    } else {
      createNewChat(true);
    }
    fetch('http://localhost:8000/api/sessions').then(r => r.json()).then(setAllSessions).catch(console.error);
  }, []);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeChat?.messages, isSending]);

  // ── Chat Management ──
  function createNewChat(init = false) {
    const id = genId();
    const newChat: Chat = {
      id,
      name: 'New Chat',
      createdAt: Date.now(),
      messages: [
        { role: 'tutor', content: "Hey! 👋 I'm **Techeru**, your AI teacher 🐱\n\nUpload a PDF using the **+ Add source** button on the left, and I'll start teaching you about it!" },
      ],
      sessionIds: [],
      waitingForPdf: null,
    };
    const updated = init ? [newChat] : [newChat, ...chats];
    setChats(updated);
    saveChats(updated);
    setActiveChatId(id);
  }

  function updateChat(id: string, patch: Partial<Chat>) {
    setChats(prev => {
      const updated = prev.map(c => c.id === id ? { ...c, ...patch } : c);
      saveChats(updated);
      return updated;
    });
  }

  function addMessage(chatId: string, msg: Message) {
    setChats(prev => {
      const updated = prev.map(c => c.id === chatId ? { ...c, messages: [...c.messages, msg] } : c);
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
      const res = await fetch('http://localhost:8000/api/ingestion/upload', { method: 'POST', body: formData });
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
      addMessage(activeChatId, { role: 'pip', content: "😬 Oops! Upload failed. Try again?" });
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
          return exists ? prev.map(s => s.id === sessionId ? session : s) : [session, ...prev];
        });
        if (session.summary_notes || attempts > 3) {
          setUploading(false);
          setUploadLabel('');
          addMessage(chatId, {
            role: 'tutor',
            content: "📥 Got it! I just finished reading **" + filename + "** 📄\n\nShall we **start the class now**? 🐱✨\n\n👉 Say **yes** to begin learning\n👉 Say **later** to save it for another day"
          });
          updateChat(chatId, { waitingForPdf: sessionId });
        } else if (attempts < 40) {
          attempts++;
          setTimeout(poll, 3000);
        } else {
          setUploading(false);
          setUploadLabel('');
        }
      } catch { setUploading(false); }
    };
    poll();
  }

  // ── Send Message ──
  async function sendMessage() {
    if (!chatInput.trim() || isSending || !activeChatId) return;
    const text = chatInput.trim();
    setChatInput('');
    addMessage(activeChatId, { role: 'user', content: text });

    const chat = chats.find(c => c.id === activeChatId);

    if (chat?.waitingForPdf) {
      const lower = text.toLowerCase();
      const isYes = YES_WORDS.some(w => lower.includes(w));
      const isNo  = NO_WORDS.some(w => lower.includes(w));

      if (isYes) {
        updateChat(activeChatId, { waitingForPdf: null });
        setIsSending(true);
        addMessage(activeChatId, { role: 'pip', content: "🎉 Yes! Let's go! Techeru is loading up the lesson... 🐭✨" });
        try {
          const res = await fetch(`http://localhost:8000/api/sessions/${chat.waitingForPdf}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: "Start teaching me the content of this PDF from the beginning. Be fun, clear, and use emojis!" }),
          });
          const data = await res.json();
          addMessage(activeChatId, { role: 'tutor', content: data.reply });
        } catch {
          addMessage(activeChatId, { role: 'tutor', content: "⚠️ Connection error!" });
        } finally { setIsSending(false); }
        return;
      }
      if (isNo) {
        updateChat(activeChatId, { waitingForPdf: null });
        addMessage(activeChatId, { role: 'tutor', content: "No worries! 😊 I saved your PDF for whenever you're ready. You can add more PDFs to this chat or start a new one on the left!" });
        return;
      }
    }

    setIsSending(true);
    const sessionId = chat?.sessionIds[chat.sessionIds.length - 1];
    try {
      if (!sessionId) {
        addMessage(activeChatId, { role: 'tutor', content: "📂 Upload a PDF first using the **+ Add source** button!" });
        setIsSending(false);
        return;
      }
      const res = await fetch(`http://localhost:8000/api/sessions/${sessionId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      addMessage(activeChatId, { role: 'tutor', content: data.reply });
    } catch {
      addMessage(activeChatId, { role: 'tutor', content: "⚠️ Connection error!" });
    } finally { setIsSending(false); }
  }

  function handleLogout() {
    localStorage.removeItem('techeru_user');
    window.location.href = '/login';
  }

  if (isLiveClass) return <LiveClassMode sessions={allSessions} onExit={() => setIsLiveClass(false)} />;

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="h-screen overflow-hidden bg-[#0a0c14] text-white flex flex-col">
      {/* ── TOP NAV (Matches original image exactly) ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0a0c14]">
        <div className="flex items-center gap-3">
          <img src="/logo_cat.png" alt="Techeru Logo" className="w-10 h-10 object-contain drop-shadow-md" />
          <span className="font-bold text-xl tracking-tight text-white">Techeru AI</span>
        </div>

        <nav className="flex items-center gap-8 text-sm font-medium">
          <span className="text-white cursor-pointer">My Notebooks</span>
          <span className="text-gray-500 hover:text-gray-300 cursor-pointer transition">Study Tools</span>
        </nav>

        <div className="flex items-center gap-3">
          {/* Replaced Live Class button with Profile as requested */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 text-sm font-medium transition"
            >
              {user?.avatar
                ? <img src={user.avatar} alt="" className="w-5 h-5 rounded-full" />
                : <User className="w-4 h-4" />}
              <span>{user?.name ?? 'Guest'}</span>
            </button>
            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#1a1f33] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden text-left flex flex-col">
                {!user?.email ? (
                  <>
                    <a href="/login" className="block px-4 py-3 text-sm text-white hover:bg-white/5 border-b border-white/10">Log In</a>
                    <a href="/login?tab=signup" className="block px-4 py-3 text-sm text-blue-400 hover:bg-white/5 border-b border-white/10 font-medium">Create Account</a>
                  </>
                ) : (
                  <div className="px-4 py-3 border-b border-white/10">
                    <p className="text-sm text-white font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                )}
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── 3-PANE LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* ── LEFT PANE: Sources & History ── */}
        <aside className="w-[300px] bg-[#0a0c14] border-r border-white/5 p-5 flex flex-col shrink-0 relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Sources</h2>
            <button onClick={() => createNewChat(false)} className="text-blue-400 hover:text-blue-300">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {/* Show all chat history (subjects) as sources here */}
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
                <div className={`p-1.5 rounded-lg ${activeChatId === chat.id ? 'bg-red-500/20 text-red-400' : 'bg-white/5'}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <span className="truncate flex-1 text-sm">{chat.name}</span>
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
              <Plus className="w-5 h-5" />
              <span className="text-sm">Add source</span>
              <input ref={fileRef} type="file" accept=".pdf,audio/*" onChange={handleUpload} className="hidden" />
            </label>
          </div>

          {/* Rat Assistant Button & Chat Box */}
          <div className="mt-auto flex flex-col items-start relative z-20">
            {showPipChat && (
              <div className="w-64 bg-[#1e212b] border border-white/10 rounded-2xl p-3 mb-2 shadow-2xl flex flex-col ml-2">
                <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-gray-300 flex items-center gap-1"><Sparkles className="w-3 h-3 text-yellow-400"/> Pip Assistant</span>
                  <button onClick={() => setShowPipChat(false)} className="text-gray-500 hover:text-white">&times;</button>
                </div>
                <div className="h-40 overflow-y-auto space-y-2 mb-2 pr-1 custom-scrollbar">
                  {pipMessages.map((msg, i) => (
                    <div key={i} className={`text-xs p-2 rounded-lg ${msg.role === 'pip' ? 'bg-purple-900/30 text-purple-200' : 'bg-blue-600/30 text-blue-100 ml-4'}`}>
                      {msg.content}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-auto">
                  <input type="text" value={pipInput} onChange={e=>setPipInput(e.target.value)} onKeyDown={e => {
                    if(e.key === 'Enter' && pipInput.trim()) {
                      setPipMessages([...pipMessages, {role:'user', content:pipInput}, {role:'pip', content:'I am just a tiny mouse, but I am learning! 🐭'}]);
                      setPipInput('');
                    }
                  }} placeholder="Ask Pip..." className="flex-1 bg-black/30 border border-white/5 rounded-md px-2 py-1 text-xs text-white outline-none" />
                </div>
              </div>
            )}
            <button onClick={() => setShowPipChat(!showPipChat)} className="hover:scale-110 transition-transform pl-2 group relative">
              <img src="/pip.png" alt="Pip" className="w-24 drop-shadow-xl filter" style={{ filter: 'drop-shadow(0 10px 8px rgba(0,0,0,0.5))' }} />
              <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">Need help?</div>
            </button>
          </div>
        </aside>

        {/* ── MIDDLE PANE: Chat Learning Board ── */}
        <main className="flex-1 bg-[#10121a] flex flex-col relative border-r border-white/5 shadow-inner">
          <div className="px-8 pt-8 pb-4 border-b border-white/5">
            <h1 className="text-2xl font-bold text-white mb-2">{activeChat?.name || "Study Notebook"}</h1>
            <div className="flex items-center gap-3 mt-4">
              <button onClick={() => setRightTab('notes')} className="px-4 py-2 bg-[#1e212b] hover:bg-white/10 rounded-lg text-sm text-gray-300 flex items-center gap-2 border border-white/5 transition">
                <BookOpen className="w-4 h-4 text-blue-400" /> Summary
              </button>
              <button onClick={() => setRightTab('flashcards')} className="px-4 py-2 bg-[#1e212b] hover:bg-white/10 rounded-lg text-sm text-gray-300 flex items-center gap-2 border border-white/5 transition">
                <Layers className="w-4 h-4 text-purple-400" /> Quiz Test
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
            {(activeChat?.messages ?? []).map((msg, idx) => (
              <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'tutor' && <img src="/avatar.jpg" alt="Techeru" className="w-10 h-10 rounded-full object-cover shadow-lg shrink-0 border border-white/10" />}
                {msg.role === 'pip' && <img src="/pip.png" alt="Pip" className="w-10 h-10 object-contain shrink-0" />}
                <div className={`px-5 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm max-w-[85%] ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-[#1e212b] border border-white/5 text-gray-200 rounded-bl-none prose prose-invert max-w-none'
                }`}>
                  {msg.role === 'user' ? msg.content : <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex gap-4 items-center">
                <img src="/avatar.jpg" className="w-10 h-10 rounded-full object-cover shadow-lg shrink-0 border border-white/10" alt="" />
                <div className="bg-[#1e212b] border border-white/5 px-5 py-4 rounded-2xl rounded-bl-none flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0s' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            )}
            <div ref={chatBottomRef} className="h-4" />
          </div>

          <div className="p-6 bg-[#10121a]">
            <div className="flex items-center gap-3 bg-[#1e212b] border border-white/10 rounded-full px-5 py-3 shadow-lg focus-within:border-blue-500/50 transition-all">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder={activeChat?.waitingForPdf ? "Say yes to start or later to save..." : "Ask Techeru anything about your notes..."}
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
        </main>

        {/* ── RIGHT PANE: Techeru Avatar & Live Class ── */}
        <aside className="w-[320px] bg-[#0a0c14] p-8 flex flex-col items-center justify-center shrink-0 text-center">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes breathe {
              0%, 100% { transform: translateY(0) scale(1); }
              50% { transform: translateY(-5px) scale(1.02); }
            }
            .animate-breathe { animation: breathe 4s ease-in-out infinite; }
          `}} />
          <div className="relative mb-6 flex justify-center">
            <div className="w-48 h-48 rounded-full bg-gradient-to-b from-blue-500/20 to-purple-500/20 absolute -inset-4 blur-xl opacity-50" />
            <img src="/techeru_cutout.png" alt="Techeru AI" className="w-56 h-56 object-contain relative z-10 drop-shadow-2xl animate-breathe" />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-1">Techeru AI</h2>
          <p className="text-sm text-gray-400 mb-3">Your personal AI tutor</p>
          
          <div className="flex items-center gap-2 text-xs font-medium text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full mb-6 border border-green-400/20">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Ready to teach
          </div>
          
          <p className="text-xs text-gray-500 mb-8 max-w-[200px] leading-relaxed">
            I've reviewed your sources. Start a Live Class and I'll teach you everything visually!
          </p>

          <button
            onClick={() => setIsLiveClass(true)}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-600/20"
          >
            <Video className="w-5 h-5" /> Start Live Class
          </button>
        </aside>

      </div>
    </div>
  );
}
