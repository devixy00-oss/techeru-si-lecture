'use client';

import React, { useState, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Folder,
  Play,
  UploadCloud,
  FileText,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  Trash2,
  ChevronRight,
  TrendingUp,
  Star,
  GraduationCap,
} from 'lucide-react';
import { NotebookData } from './ActiveLectureView';

interface MyNotebooksViewProps {
  notebooks: NotebookData[];
  onSelectNotebook: (nb: NotebookData) => void;
  onCreateNotebook: (title: string, sources: File[]) => void;
  onDeleteNotebook?: (id: string) => void;
}

export default function MyNotebooksView({
  notebooks,
  onSelectNotebook,
  onCreateNotebook,
  onDeleteNotebook,
}: MyNotebooksViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredNotebooks = notebooks.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      setStagedFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setStagedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleCreateSubmit = () => {
    if (!newTitle.trim()) return;
    setIsUploading(true);
    onCreateNotebook(newTitle.trim(), stagedFiles);
    setNewTitle('');
    setStagedFiles([]);
    setIsUploading(false);
    setShowCreateModal(false);
  };

  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-[#070b15] select-none scrollbar-thin scrollbar-thumb-white/10">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">My Notebooks & Lectures</h1>
            <span className="bg-blue-600/30 text-blue-300 border border-blue-400/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
              {notebooks.length} Active
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Select an existing notebook to enter the active 3D classroom, or upload new study materials.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter notebooks..."
              className="bg-[#10172d] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 w-60"
            />
          </div>

          {/* New Notebook Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all hover:scale-102"
          >
            <Plus className="w-4 h-4" />
            <span>New Notebook</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        <div className="bg-[#0e162c] border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold text-white block leading-none">
              {notebooks.reduce((acc, n) => acc + n.sourcesCount, 0)}
            </span>
            <span className="text-xs text-gray-400">Uploaded Study Sources</span>
          </div>
        </div>

        <div className="bg-[#0e162c] border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold text-white block leading-none">
              {notebooks.reduce((acc, n) => acc + (n.completedLessons || 0), 0)}
            </span>
            <span className="text-xs text-gray-400">Lessons Completed</span>
          </div>
        </div>

        <div className="bg-[#0e162c] border border-white/10 rounded-2xl p-4 flex items-center gap-4 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-400/30 flex items-center justify-center text-purple-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold text-white block leading-none">
              {Math.round(
                notebooks.reduce((acc, n) => acc + (n.progressPercent || 0), 0) /
                  (notebooks.length || 1)
              )}
              %
            </span>
            <span className="text-xs text-gray-400">Average Mastery Score</span>
          </div>
        </div>
      </div>

      {/* Notebook Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNotebooks.map((nb) => (
          <div
            key={nb.id}
            onClick={() => onSelectNotebook(nb)}
            className="group bg-[#0e1529]/90 hover:bg-[#121c38] border border-white/10 hover:border-blue-500/40 rounded-3xl p-5 shadow-2xl transition-all duration-300 flex flex-col justify-between cursor-pointer relative overflow-hidden"
          >
            {/* Top Accent Gradient Flare */}
            <div className="absolute -top-12 -right-12 w-28 h-28 bg-blue-600/10 group-hover:bg-blue-600/20 rounded-full blur-2xl transition-all" />

            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-[10px] bg-white/5 border border-white/10 text-gray-300 px-2.5 py-1 rounded-full font-mono">
                  {nb.date}
                </span>
              </div>

              <h2 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors leading-snug">
                {nb.title}
              </h2>

              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-purple-400" />
                <span>{nb.sourcesCount} Document Sources</span>
              </p>

              {/* Source badges */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {nb.sources.slice(0, 2).map((s) => (
                  <span
                    key={s.id}
                    className="text-[10px] bg-[#16203c] border border-white/5 text-gray-300 px-2 py-0.5 rounded-lg truncate max-w-[140px]"
                  >
                    📄 {s.name}
                  </span>
                ))}
                {nb.sources.length > 2 && (
                  <span className="text-[10px] bg-[#16203c] border border-white/5 text-gray-400 px-1.5 py-0.5 rounded-lg">
                    +{nb.sources.length - 2} more
                  </span>
                )}
              </div>
            </div>

            {/* Bottom Progress & Start Button */}
            <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1 text-[11px] text-gray-400 mb-1">
                  <span>Progress:</span>
                  <strong className="text-white font-semibold">{nb.progressPercent || 75}%</strong>
                </div>
                {/* Mini progress bar */}
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                    style={{ width: `${nb.progressPercent || 75}%` }}
                  />
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNotebook(nb);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/30 group-hover:scale-105 transition-all"
              >
                <span>Start Lecture</span>
                <Play className="w-3 h-3 fill-current" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ─────────────────── CREATE NOTEBOOK MODAL ─────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg bg-[#0e162c] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Create New Study Notebook</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Notebook Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Pharmacology Basics, Data Structures, Constitutional Law..."
                  className="w-full bg-[#131b32] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Drag & Drop Upload Zone */}
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                  Attach Documents (PDF, PPT, DOC, TXT)
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/15 hover:border-blue-500/50 bg-[#12192e]/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
                >
                  <UploadCloud className="w-8 h-8 text-blue-400 mb-2 animate-bounce" />
                  <p className="text-xs font-semibold text-white">
                    Click to select files or drag and drop
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">PDF, DOCX, PPTX or Audio files</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.mp3,.wav,.webm"
                  />
                </div>
              </div>

              {/* Staged files */}
              {stagedFiles.length > 0 && (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {stagedFiles.map((file, i) => (
                    <div
                      key={i}
                      className="bg-[#151e38] border border-white/5 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs"
                    >
                      <span className="text-gray-200 truncate max-w-[280px]">📄 {file.name}</span>
                      <span className="text-[10px] text-gray-400">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-transparent hover:bg-white/5 text-gray-300 font-semibold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                disabled={!newTitle.trim() || isUploading}
                onClick={handleCreateSubmit}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all"
              >
                {isUploading ? 'Indexing Sources...' : 'Create Notebook'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
