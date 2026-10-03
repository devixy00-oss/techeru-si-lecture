"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Send, Mic, MicOff, Video, VideoOff, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = { role: 'user' | 'tutor'; content: string };

type Props = {
  sessions: any[];
  onExit: () => void;
};

const EMOTION_EVENTS = [
  {
    delay: 12000,
    state: 'confused',
    alert: "🤔 Techeru noticed you look a bit confused...",
    reply: "Hey, I can see that last part wasn't totally clear! Let me break it down differently — imagine the concept as building blocks. We'll stack them one at a time. Ready? 😊",
  },
  {
    delay: 30000,
    state: 'bored',
    alert: "😴 Techeru thinks you might be losing focus...",
    reply: "Okay okay, enough serious stuff! 😄 Here's a fun fact: did you know that octopuses have three hearts? Anyway... back to your notes — but isn't it amazing how interesting science can be?",
  },
  {
    delay: 55000,
    state: 'sleepy',
    alert: "😪 Techeru detected fatigue. You deserve a break!",
    reply: "Hey — I can see you're really tired. You've been working hard and that means a LOT. Please step away from the screen for 10 minutes, have some water, and come back fresh. I'll be right here waiting for you. 💙",
  },
];

export default function LiveClassMode({ sessions, onExit }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'tutor', content: "🎓 Welcome to Live Class! I've loaded all your sources and I'm ready to teach. What would you like to learn about today?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [emotionAlert, setEmotionAlert] = useState<string | null>(null);
  const [avatarMood, setAvatarMood] = useState<'idle' | 'talking' | 'excited' | 'concerned'>('idle');
  const [isTyping, setIsTyping] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const activeSession = sessions[sessions.length - 1];

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-request camera when Live Class opens
  useEffect(() => {
    const requestCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsCameraOn(true);

        EMOTION_EVENTS.forEach(({ delay, alert, reply }) => {
          setTimeout(() => {
            setEmotionAlert(alert);
            setAvatarMood('concerned');
            setMessages(prev => [...prev, { role: 'tutor', content: reply }]);
            setTimeout(() => { setEmotionAlert(null); setAvatarMood('idle'); }, 6000);
          }, delay);
        });
      } catch {
        // Camera denied — silently continue without tracking
        console.log("Camera access not granted.");
      }
    };
    requestCamera();
  }, []);

  const toggleCamera = async () => {
    if (isCameraOn) {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsCameraOn(false);
      setEmotionAlert(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsCameraOn(true);

        // Simulate emotion detection events
        EMOTION_EVENTS.forEach(({ delay, state, alert, reply }) => {
          setTimeout(() => {
            setEmotionAlert(alert);
            setAvatarMood('concerned');
            setMessages(prev => [...prev, { role: 'tutor', content: reply }]);
            setTimeout(() => { setEmotionAlert(null); setAvatarMood('idle'); }, 5000);
          }, delay);
        });
      } catch {
        alert("Camera access denied.");
      }
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const text = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsTyping(true);
    setAvatarMood('talking');

    try {
      const sessionId = activeSession?.id;
      if (sessionId) {
        const res = await fetch(`http://localhost:8000/api/sessions/${sessionId}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'tutor', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'tutor', content: "Please add a source to your notebook first, then I can answer questions grounded in your materials!" }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'tutor', content: "Connection error — make sure the backend is running!" }]);
    } finally {
      setIsTyping(false);
      setAvatarMood('idle');
    }
  };

  const avatarAnimation: Record<string, string> = {
    idle: 'animate-none',
    talking: 'animate-bounce',
    excited: 'animate-spin',
    concerned: 'animate-pulse',
  };

  return (
    <div className="h-screen overflow-hidden bg-[#080b12] text-white flex flex-col">
      {/* Live Class Top Bar */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0f1117]">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-semibold text-red-400 uppercase tracking-wider">Live Class</span>
          <span className="text-gray-500 text-sm">|</span>
          <span className="text-gray-400 text-sm">{activeSession?.title ?? 'No source loaded'}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleCamera}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition ${isCameraOn ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}
          >
            {isCameraOn ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            {isCameraOn ? 'Tracking On' : 'Enable Tracking'}
          </button>
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 text-xs transition"
          >
            <X className="w-3.5 h-3.5" /> Exit Live Class
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDE: Techeru Avatar Stage */}
        <div className="w-1/2 flex flex-col bg-gradient-to-b from-[#0d1020] to-[#080b12] relative overflow-hidden border-r border-white/10">
          {/* Holographic platform glow */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-64 h-8 rounded-full bg-blue-500/20 blur-2xl" />
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-48 h-1 rounded-full bg-blue-400/30" />

          {/* Avatar center stage */}
          <div className="flex-1 flex flex-col items-center justify-center relative px-8">
            {/* Ambient glow behind avatar */}
            <div className="absolute w-72 h-72 rounded-full bg-blue-600/10 blur-3xl" />

            {/* Avatar */}
            <div className={`relative z-10 transition-all duration-500`}>
              <style dangerouslySetInnerHTML={{__html: `
                @keyframes breathe_live {
                  0%, 100% { transform: translateY(0) scale(1); }
                  50% { transform: translateY(-5px) scale(1.02); }
                }
                .animate-breathe-live { animation: breathe_live 3s ease-in-out infinite; }
              `}} />
              <img
                src="/techeru_cutout.png"
                alt="Techeru Teaching"
                className={`w-72 h-72 object-contain animate-breathe-live drop-shadow-2xl transition-all duration-300 ${
                  avatarMood === 'talking' ? 'scale-105' :
                  avatarMood === 'concerned' ? 'scale-100 opacity-90' :
                  'scale-100'
                }`}
              />
              {/* Talking indicator */}
              {avatarMood === 'talking' && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 bg-blue-400 rounded-full animate-bounce" style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 text-center z-10">
              <h2 className="font-bold text-lg text-white">Techeru AI</h2>
              <p className="text-sm text-gray-400 mt-1">
                {avatarMood === 'talking' ? '🎤 Teaching...' :
                 avatarMood === 'concerned' ? '💙 Checking on you...' :
                 '✨ Ready to teach'}
              </p>
            </div>

            {/* Holographic floating key points */}
            {activeSession?.summary_notes && (
              <div className="absolute top-8 right-4 bg-blue-900/30 border border-blue-500/20 rounded-xl p-4 max-w-[180px] backdrop-blur-sm">
                <p className="text-xs text-blue-300 font-semibold mb-2">📌 Key Points</p>
                <p className="text-xs text-gray-400 line-clamp-4">{activeSession.summary_notes.slice(0, 120)}...</p>
              </div>
            )}

            {/* Emotion alert banner */}
            {emotionAlert && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[90%] bg-yellow-900/50 border border-yellow-500/40 text-yellow-300 text-xs px-4 py-3 rounded-xl backdrop-blur-sm text-center animate-bounce z-20">
                {emotionAlert}
              </div>
            )}
          </div>

          {/* Floating camera feed */}
          {isCameraOn && (
            <div className="absolute bottom-6 left-6 w-36 h-28 rounded-xl overflow-hidden border-2 border-blue-500/50 shadow-xl bg-black">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
              <div className="absolute top-2 left-2 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] text-green-300 bg-black/50 px-1 rounded">Tracking</span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT SIDE: Notes + Chat */}
        <div className="w-1/2 flex flex-col bg-[#0f1117]">
          {/* Notes strip at top */}
          {activeSession?.summary_notes && (
            <div className="border-b border-white/10 p-5 max-h-48 overflow-y-auto">
              <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-2">📖 Live Notes · {activeSession.title}</p>
              <div className="prose prose-invert prose-xs max-w-none text-gray-400">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeSession.summary_notes.slice(0, 500) + (activeSession.summary_notes.length > 500 ? '\n\n_Scroll for more..._' : '')}
                </ReactMarkdown>
              </div>
            </div>
          )}

          {/* Chat */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
                {msg.role === 'tutor' && (
                  <img src="/avatar.jpg" className="w-7 h-7 rounded-full object-cover self-end shrink-0 border border-blue-500/30" alt="Techeru" />
                )}
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-white/5 border border-white/10 text-gray-200 rounded-bl-sm prose prose-invert prose-xs'
                }`}>
                  {msg.role === 'user' ? msg.content : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-3">
                <img src="/avatar.jpg" className="w-7 h-7 rounded-full object-cover border border-blue-500/30" alt="Techeru" />
                <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-white/10 bg-[#0f1117]">
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-2 gap-3 focus-within:border-blue-500/50 transition">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Ask Techeru anything about your notes..."
                className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none py-1"
              />
              <button
                onClick={sendMessage}
                className="p-2 bg-blue-600 hover:bg-blue-500 transition rounded-lg"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">Responses are grounded in your uploaded sources</p>
          </div>
        </div>
      </div>
    </div>
  );
}
