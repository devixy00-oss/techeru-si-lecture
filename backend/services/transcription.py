import asyncio
import os
from google import genai

async def transcribe_audio(file_path: str) -> str:
    """
    Uses Gemini to transcribe an audio file into text.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        print("[Warning] No valid GEMINI_API_KEY found, falling back to mock.")
        await asyncio.sleep(2)
        return """
    Welcome to Intro to Biology. Today we are going to discuss the mitochondria.
    As many of you know, the mitochondria is the powerhouse of the cell.
    It generates most of the chemical energy needed to power the cell's biochemical reactions.
    Energy produced by the mitochondria is stored in a small molecule called ATP.
    """.strip()

    print(f"[STT] Transcribing {file_path} via Gemini...")
    client = genai.Client(api_key=api_key)
    
    try:
        # Upload the audio file to Gemini
        audio_file = client.files.upload(file=file_path)
        
        # Ask Gemini to transcribe it
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[audio_file, "Please transcribe this audio file exactly as spoken. Return only the raw transcript text with no extra commentary, introductory text, or formatting."]
        )
        return response.text
    except Exception as e:
        print(f"Error calling Gemini STT: {e}")
        return f"Error transcribing audio: {str(e)}"
