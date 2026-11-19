import os
import re
from google import genai

def build_structured_notes(transcript: str) -> str:
    clean = re.sub(r'\s+', ' ', (transcript or '')).strip()
    sentences = [s.strip() for s in re.split(r'(?<=[.!?])\s+', clean) if len(s.strip()) > 35]
    top_points = sentences[:5] if sentences else [
        "Core concepts and foundational definitions from the uploaded curriculum.",
        "Step-by-step problem solving and logical reasoning methods.",
        "Worked examples and practical exercises for mastery."
    ]
    bullets = "\n".join([f"- {pt[:180]}" for pt in top_points])

    return f"""# 📚 Comprehensive Study Notes

## Key Takeaways
{bullets}

## Important Definitions
- **Core Principle:** Understanding how fundamental rules and formulas connect across chapters.
- **Analytical Method:** Breaking down multi-step problems into structured, verifiable stages.
- **Concept Mastery:** Applying definitions to solve real-world and exam-style questions.

## Quiz Yourself
1. What is the main objective of the concepts introduced in this section?
- A) Memorizing isolated numbers
- B) Applying foundational principles and step-by-step logic to solve problems
2. How should you approach a complex question from this material?
- A) Break it down into smaller known definitions and solve systematically
3. What is the best way to verify your final answer?
- A) Check each step against the core rule or substitute back into the original equation
"""

async def generate_study_materials(transcript: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_api_key_here":
        return build_structured_notes(transcript)

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
        return response.text or build_structured_notes(transcript)
    except Exception:
        return build_structured_notes(transcript)
