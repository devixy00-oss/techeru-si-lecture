import asyncio
import os
from google import genai

async def generate_study_materials(transcript: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    
    mock_notes = f"""# 📄 Study Notes (Offline Mode)

> ⚠️ **Gemini API key missing or invalid** — showing raw content preview. 

## Key Points
- The document was successfully loaded.
- Please add your API key to `backend/.env` for real AI notes.

## Raw Content Preview
{transcript[:1000]}...
"""

    if not api_key or api_key == "your_api_key_here":
        return mock_notes

    client = genai.Client(api_key=api_key)
    prompt = f"""
You are an expert tutor. Generate beautiful, structured study materials in Markdown.
Include: Title, Summary, Key Takeaways, Important Definitions, Quiz Yourself (3 questions).
Content:
{transcript[:8000]}
"""
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
        )
        return response.text
    except Exception as e:
        return mock_notes
