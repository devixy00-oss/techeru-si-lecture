from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, StudySession
import os
from google import genai

router = APIRouter(prefix="/api/sessions", tags=["chat"])

class ChatMessage(BaseModel):
    message: str

@router.post("/{session_id}/chat")
async def chat_with_tutor(session_id: int, chat: ChatMessage, db: Session = Depends(get_db)):
    db_session = db.query(StudySession).filter(StudySession.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    
    mock_response = f"*(Mock Mode)* 🎓 I see you want to learn about **{chat.message}**! Since my API key isn't set up yet, I'm using my built-in offline brain. \n\nHere are the key points from your PDF:\n- Mathematics involves patterns and logic.\n- Always remember to check your work!\n\n*(To get real AI answers, please add a valid Gemini API key in the backend .env file!)*"

    if not api_key or api_key == "your_api_key_here":
        return {"reply": mock_response}

    client = genai.Client(api_key=api_key)
    context = f"""
You are Techeru 🐱, a fun, energetic AI teacher.
Study Materials:
{db_session.summary_notes or db_session.raw_transcript or "No notes yet"}

Student asked: {chat.message}
Reply in a warm, friendly, fun tone. Use emojis.
"""
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=context,
        )
        return {"reply": response.text}
    except Exception as e:
        # ALWAYS catch every error and return a safe, friendly response. NO JSON!
        return {"reply": f"*(Fallback Mode)* 🐱 Oops, I tried to use the AI but the API key was rejected! \n\n**Error:** {str(e)[:100]}...\n\nBut don't worry, we can still study! Your PDF is loaded and ready. (Please check your Gemini API key to unlock my full brain!)"}
