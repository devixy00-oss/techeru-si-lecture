from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db, StudySession
import os
import re
from google import genai

router = APIRouter(prefix="/api/sessions", tags=["chat"])

class ChatMessage(BaseModel):
    message: str
    language: Optional[str] = "en"
    subject: Optional[str] = "general"

SUBJECT_LABELS = {
    "general": ("General Learning", "አጠቃላይ ትምህርት"),
    "nursing": ("Nursing & Health Sciences", "የነርሲንግ እና የጤና ሳይንስ"),
    "english": ("English Language Learning", "የእንግሊዝኛ ቋንቋ ትምህርት"),
    "science": ("Natural Sciences & Biology", "የተፈጥሮ ሳይንስ እና ባዮሎጂ"),
    "tech": ("Technology & Computing", "ቴክኖሎጂ እና ኮምፒውቲንግ"),
    "programming": ("Programming & Software Engineering", "ፕሮግራሚንግ እና ሶፍትዌር ምህንድስና"),
    "knowledge": ("General Knowledge & World History", "አጠቃላይ እውቀት እና ታሪክ"),
}

def generate_amharic_tutor_reply(user_msg: str, subject: str = "general", title: str = "") -> str:
    clean_q = user_msg.strip()
    lower_q = clean_q.lower()

    # Specific nursing topic handling in Amharic (e.g. autonomy, triage, vital signs)
    if "autonomy" in lower_q or "ራስን" in clean_q or "ነርሲንግ" in clean_q:
        return (
            f"🎓 **በነርሲንግ ውስጥ ራስን በራስ የማስተዳደር መርህ (Patient Autonomy)** 🐱✨\n\n"
            f"በጣም አስፈላጊ የሆነ የነርሲንግ ስነ-ምግባር ጥያቄ ነው! የሚከተሉትን ዋና ዋና ነጥቦች እንመልከት፡\n\n"
            f"1. **ትርጉም (Definition):** ታካሚው ስለሚሰጠው የሕክምና እና የእንክብካቤ ዓይነት በቂ መረጃ አግኝቶ በነፃነት የመወሰን ሙሉ መብት አለው።\n"
            f"2. **የነርስ ሚና (Nurse's Role):** ነርሶች የታካሚውን ውሳኔ ማክበር፣ በቂ መረጃ መስጠት (Informed Consent) እና የታካሚውን ጥቅም ማስጠበቅ (Advocacy) አለባቸው።\n"
            f"3. **የተግባር ምሳሌ (Clinical Example):** አንድ ታካሚ የቀዶ ጥገና ሕክምናን ለመቀበል ወይም ላለመቀበል ሲመርጥ ውሳኔውን ማክበር።\n\n"
            f"💡 **የአስተማሪ ምክር:** ታካሚው ውሳኔ መስጠት በማይችልበት ጊዜ ምን መደረግ እንዳለበት ማወቅ ትፈልጋለህ? 😊"
        )

    if subject == "nursing":
        return (
            f"🩺 **የነርሲንግ ትምህርት — {clean_q}** 🐱📖\n\n"
            f"በነርሲንግ ሙያ ውስጥ እያንዳንዱ ጽንሰ-ሀሳብ በታካሚ ደህንነት እና በክሊኒካል እንክብካቤ ላይ የተመሰረተ ነው፡\n\n"
            f"1. **ዋና መርህ (Core Principle):** የነርሲንግ ሂደቱን (Assessment, Diagnosis, Planning, Implementation, Evaluation) መከተል።\n"
            f"2. **ክሊኒካል አተገባበር (Clinical Application):** በማስረጃ ላይ የተመሰረተ እንክብካቤ (Evidence-Based Practice) ማቅረብ።\n"
            f"3. **የስነ-ምግባር ደንቦች (Ethics):** የታካሚውን ክብርና ሚስጥር መጠበቅ (Confidentiality)።\n\n"
            f"ስለዚህ ርዕስ ተጨማሪ ዝርዝር ማብራሪያ ወይም የፈተና ጥያቄ እንድሰጥህ ትፈልጋለህ? ✨"
        )

    if subject == "programming":
        return (
            f"💻 **የፕሮግራሚንግ ትምህርት — {clean_q}** 🐱⚡\n\n"
            f"ኮዲንግን በቀላሉ በደረጃ ለመረዳት እንዲህ እንከፋፍለው፡\n\n"
            f"1. **ሎጂክ እና መዋቅር (Logic & Structure):** ችግሩን ወደ ትናንሽ ደረጃዎች መከፋፈል (Decomposition)።\n"
            f"2. **ኮድ አጻጻፍ (Syntax):** ትክክለኛውን የኮድ አገባብ መከተል እና ተለዋዋጮችን (Variables) በትክክል መጠቀም።\n"
            f"3. **ማረም (Debugging):** ኮዱን ደረጃ በደረጃ በመፈተሽ ስህተቶችን ማረም።\n\n"
            f"የኮድ ምሳሌ ማየት ትፈልጋለህ? የትኛውን የፕሮግራሚንግ ቋንቋ (Python ወይስ JavaScript) እንጠቀም? 🚀"
        )

    # General Amharic educational response
    return (
        f"ሰላም ተማሪዬ! ስለ **{clean_q}** ያነሳኸው ጥያቄ በጣም ድንቅ ነው! 🐱🎓\n\n"
        f"1. **ዋና ጽንሰ-ሀሳብ (Core Concept):** በመጀመሪያ ርዕሱ ምን እንደሆነ እና ዋና ዓላማውን በግልጽ መረዳት ያስፈልጋል።\n"
        f"2. **ደረጃ በደረጃ ትንተና (Step-by-Step Analysis):** እያንዳንዱን ዝርዝር ነጥብ ከዕለት ተዕለት ምሳሌዎች ጋር ማገናኘት።\n"
        f"3. **የተግባር ማጠቃለያ (Summary):** የተማርከውን በራስህ አባባል መለማመድ።\n\n"
        f"በዚህ ርዕስ ላይ ጥያቄ እንድጠይቅህ ትፈልጋለህ ወይስ ተጨማሪ ምሳሌ ላሳይህ? በርታ! ✨"
    )

def generate_smart_tutor_reply(user_msg: str, title: str, transcript: str, summary: str, language: str = "en", subject: str = "general") -> str:
    clean_q = re.sub(r'\[Answer as Pip.*?\]:\s*', '', user_msg, flags=re.IGNORECASE).strip()

    if language == "am":
        return generate_amharic_tutor_reply(clean_q, subject, title)

    lower_q = clean_q.lower()

    # Extract relevant sentences from the document transcript if available
    source_text = (transcript or summary or "").strip()
    source_text = re.sub(r'> ⚠️.*$', '', source_text, flags=re.MULTILINE)
    sentences = [
        re.sub(r'\s+', ' ', s).strip()
        for s in re.split(r'(?<=[.!?])\s+', source_text)
        if len(s.strip()) > 30 and "Offline Mode" not in s and "INVALID_ARGUMENT" not in s
    ]

    keywords = [w for w in re.findall(r'[a-zA-Z]{4,}', lower_q) if w not in {'start', 'class', 'teach', 'content', 'beginning', 'clear', 'what', 'explain', 'about', 'tell', 'this', 'from'}]
    matched = []
    if keywords and sentences:
        for s in sentences:
            score = sum(1 for k in keywords if k in s.lower())
            if score > 0:
                matched.append((score, s))
        matched.sort(key=lambda x: x[0], reverse=True)

    excerpts = [m[1][:200] for m in matched[:3]] if matched else [s[:200] for s in sentences[:3]]

    # Nursing Domain handling
    if subject == "nursing" or "nursing" in lower_q or "autonomy" in lower_q or "patient" in lower_q:
        if "autonomy" in lower_q:
            return (
                f"🎓 **Autonomy in Nursing Practice** 🐱🩺\n\n"
                f"Autonomy is one of the foundational ethical pillars in healthcare and patient advocacy:\n\n"
                f"1. **Definition:** Patient autonomy is the ethical principle that competent individuals have the moral right to make decisions about their own medical treatment and care plan.\n"
                f"2. **Nurse's Role:** As nurses, our professional duty includes ensuring **informed consent**, educating patients on treatment alternatives, and respecting their choices—even when they refuse a suggested intervention.\n"
                f"3. **Clinical Example:** A patient deciding between surgical intervention versus palliative care. The healthcare team respects the patient's voluntary choice after full disclosure.\n"
                f"4. **Key Balance:** Autonomy must be balanced alongside **beneficence** (doing good), **non-maleficence** (doing no harm), and **justice**.\n\n"
                f"💡 **Next Step:** Would you like to review a clinical scenario question on patient autonomy for your exam preparation?"
            )
        return (
            f"🩺 **Nursing Lesson: {clean_q}** 🐱✨\n\n"
            f"Let's analyze this using the **Nursing Process** framework:\n\n"
            f"1. **Assessment:** Collect subjective and objective data relevant to **{clean_q}**.\n"
            f"2. **Diagnosis & Planning:** Identify patient health needs and formulate realistic outcome goals.\n"
            f"3. **Implementation & Evaluation:** Execute evidence-based interventions and measure effectiveness.\n\n"
            f"Would you like me to walk you through a practical patient case study on this topic?"
        )

    # Programming Domain handling
    if subject == "programming" or "code" in lower_q or "python" in lower_q or "javascript" in lower_q or "function" in lower_q:
        return (
            f"💻 **Programming Concept: {clean_q}** 🐱⚡\n\n"
            f"Let's break down the logic step by step:\n\n"
            f"1. **Problem Decomposition:** Break **{clean_q}** into clear input, processing, and output steps.\n"
            f"2. **Core Mechanics:** Understand the algorithmic flow and time/space efficiency.\n"
            f"3. **Implementation:** Write clean, readable code with descriptive naming and error handling.\n\n"
            f"Shall we look at a quick code snippet in Python or JavaScript to see it in action?"
        )

    if excerpts:
        points = "\n".join([f"- 📌 {ex}" for ex in excerpts])
        return (
            f"Great question regarding **{clean_q}**! 🐱📖\n\n"
            f"Here are key points from **{title or 'your study materials'}**:\n\n"
            f"{points}\n\n"
            f"💡 **Teacher Tip:** Try summarizing this in your own words—would you like a quick practice quiz question on this?"
        )

    return (
        f"Let's master **{clean_q}** step by step! 🐱🎓\n\n"
        f"1. **Core Concept:** First, clearly define the fundamental principle and its primary purpose.\n"
        f"2. **Key Application:** Connect this rule to practical examples and real-world scenarios.\n"
        f"3. **Verification:** Check your understanding by testing edge cases and related definitions.\n\n"
        f"Which specific part would you like me to clarify further? 😊"
    )

@router.post("/general/chat")
async def chat_general(chat: ChatMessage, db: Session = Depends(get_db)):
    latest = db.query(StudySession).order_by(StudySession.id.desc()).first()
    title = latest.title if latest else "General Study"
    transcript = latest.raw_transcript if latest else ""
    summary = latest.summary_notes if latest else ""

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_api_key_here":
        return {
            "reply": generate_smart_tutor_reply(
                chat.message,
                title,
                transcript,
                summary,
                chat.language or "en",
                chat.subject or "general",
            )
        }

    lang_inst = "Respond in clear, natural, grammatically correct Amharic (አማርኛ) using proper Ge'ez script." if chat.language == "am" else "Respond in engaging, encouraging English."
    subj_label = SUBJECT_LABELS.get(chat.subject or "general", ("General Learning", "አጠቃላይ"))[0]

    context = f"""You are Techeru 🐱, an intelligent, patient, professional anthropomorphic cat teacher.
Subject: {subj_label}
Instruction Language: {lang_inst}
Study Context:
{summary or transcript or "No specific notes provided."}

Student Question: {chat.message}
Requirements:
1. Explain step-by-step with clear structure.
2. Define technical terms simply.
3. Be friendly, patient, and encouraging.
4. Conclude with a helpful follow-up question or quick check.
"""
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=context,
        )
        return {"reply": response.text}
    except Exception:
        return {
            "reply": generate_smart_tutor_reply(
                chat.message,
                title,
                transcript,
                summary,
                chat.language or "en",
                chat.subject or "general",
            )
        }

@router.post("/{session_id}/chat")
async def chat_with_tutor(session_id: int, chat: ChatMessage, db: Session = Depends(get_db)):
    db_session = db.query(StudySession).filter(StudySession.id == session_id).first()
    title = db_session.title if db_session else "Study Session"
    transcript = (db_session.raw_transcript or "") if db_session else ""
    summary = (db_session.summary_notes or "") if db_session else ""

    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key or api_key == "your_api_key_here":
        return {
            "reply": generate_smart_tutor_reply(
                chat.message,
                title,
                transcript,
                summary,
                chat.language or "en",
                chat.subject or "general",
            )
        }

    lang_inst = "Respond in clear, natural, grammatically correct Amharic (አማርኛ) using proper Ge'ez script." if chat.language == "am" else "Respond in engaging, encouraging English."
    subj_label = SUBJECT_LABELS.get(chat.subject or "general", ("General Learning", "አጠቃላይ"))[0]

    context = f"""You are Techeru 🐱, an intelligent, patient, professional anthropomorphic cat teacher.
Subject: {subj_label}
Instruction Language: {lang_inst}
Study Material Title: {title}
Notes:
{summary or transcript or "No notes yet"}

Student asked: {chat.message}
Provide an educational, warm, structured explanation.
"""
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=context,
        )
        return {"reply": response.text}
    except Exception:
        return {
            "reply": generate_smart_tutor_reply(
                chat.message,
                title,
                transcript,
                summary,
                chat.language or "en",
                chat.subject or "general",
            )
        }
