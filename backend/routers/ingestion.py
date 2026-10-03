from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks
import shutil
import os
from sqlalchemy.orm import Session
from database import get_db, StudySession
from services.transcription import transcribe_audio
from services.pdf_extractor import extract_pdf_text

router = APIRouter(prefix="/api/ingestion", tags=["ingestion"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def process_file(file_path: str, session_id: int, db: Session, is_pdf: bool):
    # 1. Extract text — instant for PDF, Gemini STT for audio
    if is_pdf:
        transcript = await extract_pdf_text(file_path)
    else:
        transcript = await transcribe_audio(file_path)

    # 2. Save transcript to DB
    db_session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if db_session:
        db_session.raw_transcript = transcript
        db.commit()

    # 3. Generate study notes with Gemini
    from services.generation import generate_study_materials
    summary = await generate_study_materials(transcript)
    if db_session:
        db_session.summary_notes = summary
        db.commit()

@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    is_pdf = file.filename.lower().endswith(".pdf")

    # Create a new study session in the DB
    new_session = StudySession(title=file.filename)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    # Process in background
    background_tasks.add_task(process_file, file_path, new_session.id, db, is_pdf)

    return {
        "session_id": new_session.id,
        "filename": file.filename,
        "message": "File uploaded and processing started",
        "status": "processing",
        "type": "pdf" if is_pdf else "audio"
    }
