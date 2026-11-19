'use client';

import React from 'react';
import { TeacherState } from '@/teacher/TeacherStateMachine';

interface TeacherStatusProps {
  state: TeacherState;
}

const STATE_CONFIG: Record<
  TeacherState,
  { label: string; sub: string; dotColor: string; badgeBorder: string; badgeBg: string }
> = {
  IDLE: {
    label: '✨ Ready to Teach',
    sub: 'Ask me a question or start a lesson',
    dotColor: 'bg-emerald-400',
    badgeBorder: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/10',
  },
  LISTENING: {
    label: '👂 Listening to You...',
    sub: 'Speak into your microphone',
    dotColor: 'bg-blue-400 animate-ping',
    badgeBorder: 'border-blue-500/40',
    badgeBg: 'bg-blue-500/15',
  },
  THINKING: {
    label: '🤔 Thinking...',
    sub: 'Formulating step-by-step answer',
    dotColor: 'bg-purple-400 animate-pulse',
    badgeBorder: 'border-purple-500/40',
    badgeBg: 'bg-purple-500/15',
  },
  SPEAKING: {
    label: '🗣️ Explaining...',
    sub: 'Techeru is teaching the concept',
    dotColor: 'bg-cyan-400 animate-bounce',
    badgeBorder: 'border-cyan-500/40',
    badgeBg: 'bg-cyan-500/15',
  },
  EXPLAINING: {
    label: '📖 Teaching Lesson',
    sub: 'Walking through key definitions',
    dotColor: 'bg-indigo-400',
    badgeBorder: 'border-indigo-500/30',
    badgeBg: 'bg-indigo-500/10',
  },
  WAITING_FOR_ANSWER: {
    label: '⏳ Your Turn',
    sub: 'Waiting for your answer',
    dotColor: 'bg-amber-400 animate-pulse',
    badgeBorder: 'border-amber-500/40',
    badgeBg: 'bg-amber-500/15',
  },
  HAPPY: {
    label: '😄 Brilliant Work!',
    sub: 'Spot-on answer!',
    dotColor: 'bg-emerald-400',
    badgeBorder: 'border-emerald-500/40',
    badgeBg: 'bg-emerald-500/20',
  },
  CONFUSED: {
    label: '🤨 Checking Source...',
    sub: 'Reviewing textbook material',
    dotColor: 'bg-yellow-400',
    badgeBorder: 'border-yellow-500/40',
    badgeBg: 'bg-yellow-500/15',
  },
  ENCOURAGING: {
    label: '💪 You Can Do It!',
    sub: "Let's review the steps together",
    dotColor: 'bg-orange-400',
    badgeBorder: 'border-orange-500/40',
    badgeBg: 'bg-orange-500/15',
  },
  INTERRUPTED: {
    label: "✋ Paused — I'm Listening!",
    sub: 'Ask your new question',
    dotColor: 'bg-rose-400',
    badgeBorder: 'border-rose-500/40',
    badgeBg: 'bg-rose-500/15',
  },
};

export default function TeacherStatus({ state }: TeacherStatusProps) {
  const config = STATE_CONFIG[state] || STATE_CONFIG.IDLE;

  return (
    <div
      className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border ${config.badgeBorder} ${config.badgeBg} backdrop-blur-sm transition-all duration-300 shadow-sm`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
      <div className="flex flex-col text-left">
        <span className="text-xs font-semibold text-gray-100 leading-tight">
          {config.label}
        </span>
      </div>
    </div>
  );
}
