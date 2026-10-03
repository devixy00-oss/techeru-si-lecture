"use client";

import { useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, CheckCircle, XCircle } from 'lucide-react';

type Flashcard = {
  front: string;
  back: string;
};

function parseFlashcards(summaryNotes: string): Flashcard[] {
  const lines = summaryNotes.split('\n');
  const cards: Flashcard[] = [];

  // Extract Q&A pairs from quiz sections in the generated notes
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    // Match numbered questions like "1. What is..."
    const questionMatch = line.match(/^\d+\.\s+(.+\?)$/);
    if (questionMatch) {
      const question = questionMatch[1];
      // Look for the answer in nearby lines (A, B, C options — pick correct one or use next bold line)
      const answerLines = [];
      let j = i + 1;
      while (j < lines.length && j < i + 6) {
        const aLine = lines[j].trim();
        if (aLine.startsWith('-') || aLine.match(/^[A-C]\)/)) {
          answerLines.push(aLine.replace(/^[-*]\s*/, '').replace(/^[A-C]\)\s*/, ''));
        }
        j++;
      }
      if (answerLines.length > 0) {
        cards.push({ front: question, back: answerLines[0] });
      }
    }
    // Also extract key definitions (bold terms)
    const boldMatch = line.match(/\*\*(.+?):\*\*\s*(.+)/);
    if (boldMatch) {
      cards.push({ front: `What is "${boldMatch[1]}"?`, back: boldMatch[2] });
    }
    i++;
  }

  // Fallback cards if none were parsed
  if (cards.length === 0) {
    cards.push({ front: "What are the key topics in your notes?", back: summaryNotes.slice(0, 200) });
  }

  return cards;
}

type Props = {
  summaryNotes: string;
  title: string;
};

export default function FlashcardDeck({ summaryNotes, title }: Props) {
  const cards = parseFlashcards(summaryNotes);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [results, setResults] = useState<('correct' | 'wrong')[]>([]);
  const [isDone, setIsDone] = useState(false);

  const current = cards[currentIdx];
  const progress = Math.round((currentIdx / cards.length) * 100);

  const handleFlip = () => setIsFlipped(!isFlipped);

  const handleResult = (result: 'correct' | 'wrong') => {
    const newResults = [...results, result];
    setResults(newResults);
    if (currentIdx + 1 >= cards.length) {
      setIsDone(true);
    } else {
      setCurrentIdx(currentIdx + 1);
      setIsFlipped(false);
    }
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setIsFlipped(false);
    setResults([]);
    setIsDone(false);
  };

  if (isDone) {
    const correct = results.filter(r => r === 'correct').length;
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 text-center p-8">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold text-white">Quiz Complete!</h2>
        <p className="text-gray-400">You got <span className="text-green-400 font-bold">{correct}</span> out of <span className="text-white font-bold">{cards.length}</span> correct.</p>
        <div className="w-full max-w-xs bg-white/5 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all"
            style={{ width: `${(correct / cards.length) * 100}%` }}
          />
        </div>
        <button onClick={handleReset} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold transition">
          <RotateCcw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Flashcards</h2>
          <p className="text-xs text-gray-500">{title}</p>
        </div>
        <span className="text-sm text-gray-400">{currentIdx + 1} / {cards.length}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-white/5 rounded-full h-1.5">
        <div className="h-1.5 bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Flashcard */}
      <div
        className="flex-1 cursor-pointer select-none"
        onClick={handleFlip}
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
          {/* Front */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-900/40 to-purple-900/30 border border-white/10 rounded-2xl"
            style={{ backfaceVisibility: 'hidden' }}>
            <p className="text-xs text-blue-400 uppercase tracking-wider mb-4">Question</p>
            <p className="text-lg font-semibold text-white text-center leading-relaxed">{current.front}</p>
            <p className="text-xs text-gray-600 mt-6">Tap to reveal answer</p>
          </div>
          {/* Back */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-green-900/30 to-blue-900/40 border border-green-500/20 rounded-2xl"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <p className="text-xs text-green-400 uppercase tracking-wider mb-4">Answer</p>
            <p className="text-base text-white text-center leading-relaxed">{current.back}</p>
          </div>
        </div>
      </div>

      {/* Action buttons (show after flip) */}
      {isFlipped && (
        <div className="flex gap-3">
          <button onClick={() => handleResult('wrong')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl font-medium hover:bg-red-500/30 transition">
            <XCircle className="w-4 h-4" /> Missed It
          </button>
          <button onClick={() => handleResult('correct')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500/20 border border-green-500/30 text-green-400 rounded-xl font-medium hover:bg-green-500/30 transition">
            <CheckCircle className="w-4 h-4" /> Got It!
          </button>
        </div>
      )}
    </div>
  );
}
