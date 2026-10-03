from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ingestion, sessions, chat

app = FastAPI(title="Techeru AI API", version="0.1.0")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingestion.router)
app.include_router(sessions.router)
app.include_router(chat.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Techeru AI API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
