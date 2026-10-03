# Techeru AI

> Your personal, conversational AI tutor. Record lectures, upload notes, and learn actively.

## 🚀 Features

- **Live Lecture Capture** — Record audio directly from your browser
- **File Upload** — Upload audio files (MP3, WAV, WebM) or PDFs
- **AI Transcription** — Powered by Gemini for accurate speech-to-text
- **Smart Note Generation** — Instantly creates structured Markdown summaries, key takeaways & quizzes
- **Flashcard Mode** — Auto-generated interactive flashcards with scoring
- **NotebookLM-style Dashboard** — 3-panel layout: Sources | Studio | Avatar
- **Live Class Mode** — Immersive split-screen with the 3D Techeru cat avatar
- **Emotion Tracking** — Webcam-powered focus & fatigue detection
- **Context-Aware AI Tutor** — Ask Techeru anything, grounded in your uploaded sources

---

## 🗂 Project Structure

```
project/
├── backend/                  # FastAPI Python backend
│   ├── main.py               # App entry point
│   ├── database.py           # SQLite + SQLAlchemy models
│   ├── routers/
│   │   ├── ingestion.py      # File upload & background processing
│   │   ├── sessions.py       # CRUD for study sessions
│   │   └── chat.py           # AI Tutor chat endpoint
│   ├── services/
│   │   ├── transcription.py  # Gemini STT
│   │   └── generation.py     # Gemini note generation
│   └── .env                  # API keys (not committed)
│
├── frontend/                 # Next.js 16 + Tailwind CSS
│   └── src/
│       ├── app/
│       │   ├── page.tsx              # Studio Dashboard (3-panel)
│       │   └── sessions/[id]/page.tsx # Session Workspace
│       └── components/
│           ├── LiveClassMode.tsx     # Immersive Live Class UI
│           ├── AudioRecorder.tsx     # Mic capture component
│           ├── FileUploader.tsx      # File upload component
│           └── FlashcardDeck.tsx     # Interactive flashcards
│
├── start_backend.bat         # One-click backend launcher
└── start_frontend.bat        # One-click frontend launcher
```

---

## ⚙️ Setup & Running

### 1. Configure API Key

Open `backend/.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_key_here
```
Get a free key at: https://aistudio.google.com/

### 2. Start the Backend
Double-click `start_backend.bat` **or** run in a terminal:
```cmd
cd backend
venv\Scripts\python.exe -m uvicorn main:app --port 8000
```

### 3. Start the Frontend
Double-click `start_frontend.bat` **or** run in a terminal:
```cmd
cd frontend
npm run dev
```

### 4. Open the App
Navigate to **http://localhost:3000**

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | Python 3.14, FastAPI, Uvicorn |
| Database | SQLite via SQLAlchemy |
| AI Engine | Google Gemini 2.5 Flash |
| Speech-to-Text | Gemini native audio |
| Markdown | `react-markdown` + Tailwind Typography |
