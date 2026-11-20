from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import ingestion, sessions, chat, models_3d

app = FastAPI(title="Techeru SI Lecture API", version="0.1.0")

# Enable CORS for all local and tunnel origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingestion.router)
app.include_router(sessions.router)
app.include_router(chat.router)
app.include_router(models_3d.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Techeru SI Lecture API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
