"use client";

import React, { useState, useEffect } from 'react';
import ActiveLectureView, { NotebookData } from '@/components/ActiveLectureView';
import MyNotebooksView from '@/components/MyNotebooksView';
import LiveClassMode from '@/components/LiveClassMode';
import { Radio } from 'lucide-react';

const INITIAL_NOTEBOOKS: NotebookData[] = [
  {
    id: 'nb-healthcare-ethics',
    title: 'Health Care Ethics',
    sourcesCount: 2,
    date: 'Nov 19, 2026',
    sources: [
      {
        id: 'src-1',
        name: 'Clinical_Bioethics_Principles.pdf',
        size: '2.4 MB',
        type: 'pdf',
        uploadedAt: 'Nov 19, 2026',
      },
      {
        id: 'src-2',
        name: 'Patient_Autonomy_and_Rights_2026.pdf',
        size: '1.8 MB',
        type: 'pdf',
        uploadedAt: 'Nov 19, 2026',
      },
    ],
    topics: [
      {
        id: 'topic-principles',
        title: 'Core Principles of Bioethics',
        keyPoints: [
          { label: 'Autonomy', desc: "Respect the patient's choices." },
          { label: 'Beneficence', desc: 'Do good for the patient.' },
          { label: 'Non-Maleficence', desc: 'Avoid harm.' },
          { label: 'Justice', desc: 'Ensure fair treatment.' },
        ],
        summary:
          'Health care ethics provides a moral framework for clinicians and patients to navigate complex medical decisions. The core cornerstone rests upon four universal pillars: Autonomy, Beneficence, Non-Maleficence, and Justice.',
        quizQuestions: [
          {
            question: 'What is the primary definition of Patient Autonomy in healthcare ethics?',
            options: [
              'Allowing the doctor to make all final clinical calls',
              "Respecting the patient's right to make decisions about their own medical care",
              'Performing emergency treatment without consultation',
              'Treating all patients with identical medication doses',
            ],
            correctIndex: 1,
            explanation:
              'Autonomy upholds that every competent patient has the moral and legal right to self-determination regarding treatment.',
          },
          {
            question: 'Which principle corresponds directly to "Do No Harm" (Primum non nocere)?',
            options: ['Beneficence', 'Non-Maleficence', 'Justice', 'Fidelity'],
            correctIndex: 1,
            explanation:
              'Non-Maleficence obligates practitioners to avoid inflicting intentional harm or unnecessary risks.',
          },
          {
            question: 'How does Beneficence differ from Non-Maleficence?',
            options: [
              'Beneficence is about billing; Non-Maleficence is about surgery',
              'Beneficence requires positive action to help; Non-Maleficence requires avoiding harm',
              'They are completely identical in clinical practice',
              'Beneficence only applies to minors',
            ],
            correctIndex: 1,
            explanation:
              'Beneficence is an active moral duty to produce positive benefits, whereas Non-Maleficence is a restraining duty to avoid doing injury.',
          },
        ],
        flashcards: [
          {
            question: 'What is Autonomy in healthcare ethics?',
            answer:
              "The moral and legal principle that acknowledges a patient's personal right to make decisions regarding their own healthcare without coercion.",
            category: 'Principles',
          },
          {
            question: 'How is Beneficence defined?',
            answer:
              'An ethical duty to act in the best interest of the patient, taking positive steps to prevent or remove harm.',
            category: 'Principles',
          },
          {
            question: 'What does Non-Maleficence require?',
            answer:
              'The obligation not to inflict harm intentionally, derived from the oath "First, do no harm".',
            category: 'Clinical Duty',
          },
          {
            question: 'What is the Justice principle in medical care?',
            answer:
              'Fairness in the distribution of healthcare resources and equal treatment of patients regardless of background.',
            category: 'Systemic Ethics',
          },
        ],
      },
      {
        id: 'topic-consent',
        title: 'Informed Consent & Patient Rights',
        keyPoints: [
          { label: 'Voluntariness', desc: 'Consent given freely without coercion.' },
          { label: 'Disclosure', desc: 'Full transparent explanation of treatment risks and benefits.' },
          { label: 'Competence', desc: 'Patient capacity to understand and decide.' },
          { label: 'Documentation', desc: 'Written and verifiable record of agreed care plan.' },
        ],
        summary:
          'Informed consent is a vital operationalization of autonomy. Patients must receive full disclosure of procedures, alternatives, and anticipated outcomes.',
        quizQuestions: [
          {
            question: 'Which element is mandatory for valid informed consent?',
            options: [
              'Verbal agreement without explanation',
              'Voluntary decision made with full disclosure and cognitive competence',
              'Family signature overriding patient wishes',
              'Hospital administrator approval alone',
            ],
            correctIndex: 1,
            explanation:
              'Informed consent requires cognitive competence, adequate information disclosure, and voluntary decision-making.',
          },
        ],
        flashcards: [
          {
            question: 'What are the three pillars of informed consent?',
            answer: 'Information disclosure, patient competence/capacity, and voluntary choice.',
            category: 'Clinical Legal',
          },
        ],
      },
      {
        id: 'topic-confidentiality',
        title: 'Confidentiality & Medical Records',
        keyPoints: [
          { label: 'HIPAA & Privacy', desc: 'Protecting protected health information (PHI).' },
          { label: 'Duty of Care', desc: 'Maintaining trust between clinician and patient.' },
          { label: 'Exceptions', desc: 'Imminent threat of bodily harm or mandated legal disclosure.' },
        ],
        summary:
          'Confidentiality protects the therapeutic relationship by guaranteeing that private medical facts are safeguarded from unauthorized disclosure.',
        quizQuestions: [
          {
            question: 'When can medical confidentiality be legally broken?',
            options: [
              'When curious relatives ask for updates',
              'When there is an imminent, severe threat to public safety or another individual',
              'Whenever an insurance broker requests files',
              'It can never be breached under any circumstances',
            ],
            correctIndex: 1,
            explanation:
              'Tarasoff rule and public safety laws mandate breach only when there is an imminent, foreseeable threat of violence or legal quarantine.',
          },
        ],
        flashcards: [
          {
            question: 'What does the Tarasoff ruling establish?',
            answer: 'Duty to warn/protect third parties from foreseeable imminent harm.',
            category: 'Jurisprudence',
          },
        ],
      },
    ],
    activeTopicIndex: 0,
    completedLessons: 12,
    completedQuizzes: 8,
    progressPercent: 75,
  },
  {
    id: 'nb-nursing-fundamentals',
    title: 'Nursing Fundamentals & Care Planning',
    sourcesCount: 3,
    date: 'Nov 15, 2026',
    sources: [
      {
        id: 'src-3',
        name: 'ADPIE_Nursing_Process_Handbook.pdf',
        size: '3.1 MB',
        type: 'pdf',
        uploadedAt: 'Nov 15, 2026',
      },
      {
        id: 'src-4',
        name: 'Vital_Signs_Reference_Manual.pdf',
        size: '1.5 MB',
        type: 'pdf',
        uploadedAt: 'Nov 15, 2026',
      },
    ],
    topics: [
      {
        id: 'topic-adpie',
        title: 'The 5 Phases of the Nursing Process (ADPIE)',
        keyPoints: [
          { label: 'Assessment', desc: 'Gathering subjective and objective data.' },
          { label: 'Diagnosis', desc: 'Identifying patient health challenges.' },
          { label: 'Planning', desc: 'Establishing measurable outcomes.' },
          { label: 'Implementation', desc: 'Executing nursing interventions.' },
          { label: 'Evaluation', desc: 'Assessing outcome success.' },
        ],
        summary:
          'ADPIE provides a systematic, critical-thinking model for nursing care delivery across all clinical settings.',
        quizQuestions: [
          {
            question: 'What is the first phase of ADPIE?',
            options: ['Diagnosis', 'Assessment', 'Planning', 'Implementation'],
            correctIndex: 1,
            explanation: 'Assessment is the initial continuous phase where patient data is gathered.',
          },
        ],
        flashcards: [
          {
            question: 'What does ADPIE stand for?',
            answer: 'Assessment, Diagnosis, Planning, Implementation, Evaluation.',
            category: 'Nursing Process',
          },
        ],
      },
    ],
    activeTopicIndex: 0,
    completedLessons: 9,
    completedQuizzes: 6,
    progressPercent: 60,
  },
  {
    id: 'nb-computer-systems',
    title: 'Applied AI & Computer Systems',
    sourcesCount: 1,
    date: 'Nov 10, 2026',
    sources: [
      {
        id: 'src-5',
        name: 'Realtime_3D_WebGL_Architecture.pdf',
        size: '4.2 MB',
        type: 'pdf',
        uploadedAt: 'Nov 10, 2026',
      },
    ],
    topics: [
      {
        id: 'topic-webgl',
        title: 'Three.js & glTF 2.0 Realtime Rendering',
        keyPoints: [
          { label: 'Scene Graph', desc: 'Hierarchical structure of 3D objects and cameras.' },
          { label: 'PBR Shading', desc: 'Physically based rendering with roughness and metalness.' },
          { label: 'Skinned Meshes', desc: 'Bones and vertex weights driving fluid character animation.' },
        ],
        summary:
          'WebGL and Three.js enable GPU-accelerated interactive 3D graphics in modern browser runtimes without external plugins.',
        quizQuestions: [
          {
            question: 'Which component is required in Three.js to view 3D objects?',
            options: ['AudioContext', 'Camera, Scene, and WebGLRenderer', 'WebSocket', 'CSS flexbox'],
            correctIndex: 1,
            explanation: 'The three essential primitives are the Scene, Camera, and WebGLRenderer.',
          },
        ],
        flashcards: [
          {
            question: 'What is glTF often called?',
            answer: 'The JPEG of 3D: an efficient runtime transmission format for 3D scenes.',
            category: 'Graphics',
          },
        ],
      },
    ],
    activeTopicIndex: 0,
    completedLessons: 15,
    completedQuizzes: 11,
    progressPercent: 88,
  },
];

export default function Home() {
  // Navigation Experience: 'lecture' (Active Lecture) | 'notebooks' (My Notebooks) | 'liveClass' (3D Interactive Class)
  const [currentView, setCurrentView] = useState<'lecture' | 'notebooks' | 'liveClass'>('lecture');

  // Notebooks list
  const [notebooks, setNotebooks] = useState<NotebookData[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('techeru_notebooks_v2');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_NOTEBOOKS;
  });

  // Active Notebook
  const [activeNotebookId, setActiveNotebookId] = useState<string>(
    INITIAL_NOTEBOOKS[0].id
  );

  const activeNotebook =
    notebooks.find((n) => n.id === activeNotebookId) || notebooks[0] || INITIAL_NOTEBOOKS[0];

  // Save notebooks on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('techeru_notebooks_v2', JSON.stringify(notebooks));
    }
  }, [notebooks]);

  // Handle Create Notebook
  const handleCreateNotebook = (title: string, sources: File[]) => {
    const newId = `nb-${Date.now()}`;
    const newSources = sources.map((f, i) => ({
      id: `src-${Date.now()}-${i}`,
      name: f.name,
      size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
      type: f.name.split('.').pop() || 'file',
      uploadedAt: 'Today',
    }));

    const newNotebook: NotebookData = {
      id: newId,
      title,
      sourcesCount: newSources.length || 1,
      date: 'Today',
      sources:
        newSources.length > 0
          ? newSources
          : [
              {
                id: `src-${Date.now()}`,
                name: `${title.replace(/\s+/g, '_')}_Source.pdf`,
                size: '1.2 MB',
                type: 'pdf',
                uploadedAt: 'Today',
              },
            ],
      topics: [
        {
          id: `topic-${Date.now()}`,
          title: `Introduction to ${title}`,
          keyPoints: [
            { label: 'Fundamental Principles', desc: `Foundational concepts and methodologies for ${title}.` },
            { label: 'Core Framework', desc: 'Standard operating criteria and critical definitions.' },
            { label: 'Practical Application', desc: 'Real-world problem-solving and analysis.' },
          ],
          summary: `This module covers the core concepts and real-world guidelines for ${title}. Study the principles carefully and test your retention with the quiz.`,
          quizQuestions: [
            {
              question: `What is the primary objective of studying ${title}?`,
              options: [
                'To master fundamental principles and apply them accurately',
                'To bypass foundational theory',
                'To memorize terms without context',
                'None of the above',
              ],
              correctIndex: 0,
              explanation: `Gaining deep conceptual mastery and practical problem-solving skills is the primary goal of studying ${title}.`,
            },
          ],
          flashcards: [
            {
              question: `Define the core principle of ${title}`,
              answer: `The foundational rule governing how concepts in ${title} are structured and implemented.`,
              category: 'Fundamentals',
            },
          ],
        },
      ],
      activeTopicIndex: 0,
      completedLessons: 1,
      completedQuizzes: 0,
      progressPercent: 10,
    };

    setNotebooks((prev) => [newNotebook, ...prev]);
    setActiveNotebookId(newId);
    setCurrentView('lecture');
  };

  // Select Notebook from My Notebooks to Start Lecture
  const handleSelectNotebook = (nb: NotebookData) => {
    setActiveNotebookId(nb.id);
    setCurrentView('lecture');
  };

  // End Class
  const handleEndClass = () => {
    setCurrentView('notebooks');
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0d2131] text-white flex flex-col font-sans select-none">
      {currentView === 'liveClass' ? (
        <LiveClassMode
          sessions={[
            {
              id: activeNotebook.id,
              title: activeNotebook.title,
              notes: activeNotebook.topics[0]?.summary || activeNotebook.title,
              flashcards: activeNotebook.topics[0]?.flashcards || [],
            },
          ]}
          onExit={() => setCurrentView('lecture')}
        />
      ) : currentView === 'lecture' ? (
        <ActiveLectureView
          notebook={activeNotebook}
          onEndClass={handleEndClass}
          onNavigateHome={() => setCurrentView('notebooks')}
          onOpenLiveClass={() => setCurrentView('liveClass')}
        />
      ) : (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#0d2131]">
          {/* My Notebooks Top Header with Palette #EA8833, #EEA23A, #F38940, #132F45, #32667F */}
          <header className="h-16 px-6 bg-[#132F45]/95 border-b border-[#32667F]/40 backdrop-blur-xl flex items-center justify-between shrink-0 z-30">
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setCurrentView('lecture')}
            >
              <div className="w-10 h-10 flex items-center justify-center shrink-0">
                <img
                  src="/techeru_transparent.png"
                  alt="Techeru"
                  className="w-10 h-10 object-contain drop-shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo_cat.png';
                  }}
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-extrabold text-lg text-white tracking-tight">Techeru SI</span>
                  <span className="font-extrabold text-lg text-[#F38940] tracking-tight">Lecture</span>
                </div>
                <span className="text-[10px] text-[#32667F] tracking-wider mt-0.5 font-medium">
                  Learn • Ask • Practice • Excel
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Live Class Button — Home Page */}
              <button
                onClick={() => setCurrentView('liveClass')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-[#F38940] hover:from-red-500 hover:to-[#EA8833] text-white font-bold text-xs shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95"
                title="Join Live Class with Professor Techeru"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse text-white" />
                <span>Live Class</span>
                <span className="w-2 h-2 rounded-full bg-white animate-ping ml-0.5" />
              </button>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0e2538] border border-[#32667F]/50 text-white shadow-sm">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#EA8833] to-[#F38940] flex items-center justify-center text-[11px] font-extrabold text-white shadow-sm">
                  G
                </div>
                <span className="text-xs font-semibold hidden sm:inline">Guest Mode</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <button
                onClick={() => setCurrentView('lecture')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#EA8833] via-[#EEA23A] to-[#F38940] hover:opacity-90 text-white font-bold text-xs shadow-lg shadow-[#EA8833]/30 transition-all hover:scale-102"
              >
                <span>Resume Active Lecture</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            </div>
          </header>

          <MyNotebooksView
            notebooks={notebooks}
            onSelectNotebook={handleSelectNotebook}
            onCreateNotebook={handleCreateNotebook}
          />
        </div>
      )}
    </div>
  );
}
