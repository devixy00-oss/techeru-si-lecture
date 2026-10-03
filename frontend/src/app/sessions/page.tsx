"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, FileText } from 'lucide-react';

type Session = {
  id: number;
  title: string;
  raw_transcript: string | null;
  summary_notes: string | null;
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:8000/api/sessions')
      .then(res => res.json())
      .then(data => {
        setSessions(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Study Sessions</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <p className="text-gray-500">No sessions found. Go back and upload a lecture to get started.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {sessions.map(session => (
              <Link 
                key={session.id} 
                href={`/sessions/${session.id}`} 
                className="block bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:border-blue-500 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-full mr-4">
                      <BookOpen className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">{session.title}</h2>
                      <p className="text-sm text-gray-500 mt-1">
                        {session.summary_notes ? "Notes ready" : "Processing in background..."}
                      </p>
                    </div>
                  </div>
                  <div className="text-gray-400">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
