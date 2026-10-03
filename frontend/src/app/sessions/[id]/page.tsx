"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Send, Video, VideoOff, BookOpen, Layers } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FlashcardDeck from '@/components/FlashcardDeck';

type Session = {
  id: number;
  title: string;
  raw_transcript: string | null;
  summary_notes: string | null;
};

export default function SessionWorkspace() {
  const { id } = useParams();
  const [session, setSession] = useState<Session | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'tutor', content: string}[]>([
    { role: 'tutor', content: 'Hello! I am Techeru. I have reviewed your notes. What questions do you have?' }
  ]);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [leftTab, setLeftTab] = useState<'notes' | 'flashcards'>('notes');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [emotionAlert, setEmotionAlert] = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://localhost:8000/api/sessions/${id}`)
      .then(res => res.json())
      .then(data => setSession(data))
      .catch(console.error);
  }, [id]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const messageText = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageText }]);
    
    try {
      const response = await fetch(`http://localhost:8000/api/sessions/${id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'tutor', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'tutor', content: "Sorry, I encountered an error. Please try again." }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'tutor', content: "Failed to connect to the tutor. Ensure backend is running." }]);
    }
  };

  const toggleCamera = async () => {
    if (isCameraOn) {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCameraOn(false);
      setEmotionAlert(null);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setIsCameraOn(true);
        
        // Mocking Emotion Detection after 10 seconds
        setTimeout(() => {
          setEmotionAlert("Techeru noticed you're looking a bit confused... let me try a simpler explanation!");
          setMessages(prev => [...prev, { role: 'tutor', content: "You seem a little confused by that last part! Let me try explaining it in a simpler way: think of the mitochondria like the battery pack of your phone!"}]);
        }, 10000);

        // Mocking Sleep detection after 25 seconds
        setTimeout(() => {
          setEmotionAlert("Techeru noticed you're falling asleep! Time for a break.");
          setMessages(prev => [...prev, { role: 'tutor', content: "Hey there! I've noticed you're looking really tired. It's late and you've been studying hard. I recommend taking a 15-minute screen break or getting some rest. I'll save your progress here!"}]);
        }, 25000);
      } catch (err) {
        console.error("Camera access denied", err);
        alert("Could not access camera.");
      }
    }
  };

  if (!session) return <div className="p-8 text-center text-gray-500">Loading workspace...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/sessions" className="text-gray-500 hover:text-gray-900 mr-4">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">{session.title}</h1>
        </div>
        <button 
          onClick={toggleCamera} 
          className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition ${isCameraOn ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
        >
          {isCameraOn ? <VideoOff className="w-4 h-4 mr-2" /> : <Video className="w-4 h-4 mr-2" />}
          {isCameraOn ? 'Turn Off Tracking' : 'Enable Emotion Tracking'}
        </button>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Panel: Study Notes / Flashcards */}
        <div className="w-1/2 flex flex-col border-r bg-white overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b px-6 pt-4">
            <button
              onClick={() => setLeftTab('notes')}
              className={`flex items-center gap-2 pb-3 mr-6 text-sm font-medium border-b-2 transition-colors ${leftTab === 'notes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
            >
              <BookOpen className="w-4 h-4" /> Study Notes
            </button>
            <button
              onClick={() => setLeftTab('flashcards')}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${leftTab === 'flashcards' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
            >
              <Layers className="w-4 h-4" /> Flashcards
            </button>
          </div>

          {leftTab === 'notes' ? (
            <div className="flex-1 p-6 overflow-y-auto">
              {session.summary_notes ? (
                <div className="prose prose-blue prose-sm max-w-none bg-gray-50 p-6 rounded-lg">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {session.summary_notes}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-gray-500 italic">Notes are still being generated. Please check back in a few seconds and refresh.</p>
              )}
            </div>
          ) : (
            <div className="flex-1 bg-[#0f1117] overflow-hidden">
              {session.summary_notes ? (
                <FlashcardDeck summaryNotes={session.summary_notes} title={session.title} />
              ) : (
                <div className="p-6 text-gray-500 italic text-sm">Notes needed to generate flashcards. Please wait for processing.</div>
              )}
            </div>
          )}
        </div>

        {/* Floating Webcam Tracker */}
        {isCameraOn && (
          <div className="absolute bottom-6 left-6 w-48 h-36 bg-black rounded-lg overflow-hidden border-4 border-blue-500 shadow-xl z-50 transition-all">
            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
            <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              Tracking Focus...
            </div>
          </div>
        )}

        {/* Floating Emotion Alert */}
        {emotionAlert && (
          <div className="absolute top-6 left-1/4 transform -translate-x-1/2 bg-yellow-100 border border-yellow-300 text-yellow-800 px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
            {emotionAlert}
          </div>
        )}

        {/* Right Panel: AI Tutor Chat */}
        <div className="w-1/2 flex flex-col bg-gray-50">
          
          {/* Avatar Header */}
          <div className="bg-white border-b p-4 flex flex-col items-center justify-center shadow-sm z-10">
            <img src="/avatar.jpg" alt="Techeru Avatar" className="w-24 h-24 rounded-full border-4 border-blue-100 object-cover mb-2 shadow-sm" />
            <h3 className="font-bold text-gray-800 text-lg">Techeru AI</h3>
            <p className="text-sm text-gray-500">Your Personal Tutor</p>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'tutor' && (
                  <img src="/avatar.jpg" alt="Techeru" className="w-8 h-8 rounded-full mr-2 self-end shadow-sm" />
                )}
                <div className={`max-w-[80%] p-4 rounded-xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none shadow-sm prose prose-sm'}`}>
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
          </div>
          
          <div className="p-4 bg-white border-t">
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask Techeru to explain a concept..."
                className="flex-1 bg-transparent outline-none p-2 text-gray-800"
              />
              <button onClick={handleSendMessage} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
