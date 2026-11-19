'use client';

import React from 'react';
import { Volume2 } from 'lucide-react';

interface TeacherSubtitlesProps {
  text: string;
  isSpeaking: boolean;
  speakerName?: string;
}

export default function TeacherSubtitles({
  text,
  isSpeaking,
  speakerName = 'Techeru AI',
}: TeacherSubtitlesProps) {
  if (!text && !isSpeaking) return null;

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-xl z-30 transition-all duration-300">
      <div className="bg-[#0b101d]/90 border border-blue-500/30 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
          <Volume2 className="w-4 h-4 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold text-blue-400 tracking-wider uppercase">
              {speakerName}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <p className="text-sm font-medium text-gray-100 leading-relaxed break-words">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
