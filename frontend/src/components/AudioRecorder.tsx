"use client";

import { useState, useRef } from 'react';
import { Mic, Square, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

type Props = { compact?: boolean; onUploadComplete?: () => void };

export default function AudioRecorder({ compact, onUploadComplete }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setStatus('idle');
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const uploadAudio = async (blob: Blob) => {
    setStatus('uploading');
    const formData = new FormData();
    formData.append('file', blob, 'live_lecture.webm');

    try {
      const response = await fetch('http://localhost:8000/api/ingestion/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setStatus('success');
        onUploadComplete?.();
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-lg bg-white shadow-sm hover:border-blue-500 transition-colors">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isRecording ? 'bg-red-100' : 'bg-blue-100'}`}>
        <Mic className={`w-8 h-8 ${isRecording ? 'animate-pulse text-red-600' : 'text-blue-600'}`} />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Live Lecture Capture</h3>
      <p className="text-sm text-gray-500 mb-6 text-center">Record your class or meeting directly.</p>
      
      {!isRecording ? (
        <button 
          onClick={startRecording}
          disabled={status === 'uploading'}
          className="bg-red-500 text-white py-2 px-8 rounded-full font-medium hover:bg-red-600 transition flex items-center disabled:opacity-50"
        >
          <Mic className="w-4 h-4 mr-2" /> Start Recording
        </button>
      ) : (
        <button 
          onClick={stopRecording}
          className="bg-gray-800 text-white py-2 px-8 rounded-full font-medium hover:bg-gray-900 transition flex items-center animate-pulse"
        >
          <Square className="w-4 h-4 mr-2 fill-current" /> Stop & Process
        </button>
      )}

      {status === 'uploading' && (
        <div className="mt-4 flex items-center text-blue-600 text-sm">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing audio...
        </div>
      )}
      {status === 'success' && (
        <div className="mt-4 flex items-center text-green-600 text-sm">
          <CheckCircle className="w-4 h-4 mr-2" /> Audio uploaded successfully!
        </div>
      )}
      {status === 'error' && (
        <div className="mt-4 flex items-center text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mr-2" /> Upload failed.
        </div>
      )}
    </div>
  );
}
