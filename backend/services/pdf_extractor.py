import os
import asyncio

async def extract_pdf_text(file_path: str) -> str:
    """
    Quickly extracts text directly from a PDF using pdfplumber (no API needed).
    """
    try:
        import pdfplumber
        text = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text.append(page_text)
        result = "\n\n".join(text)
        if result.strip():
            print(f"[PDF] Extracted {len(result)} characters from {file_path}")
            return result
        else:
            return "Could not extract text from this PDF. It may be a scanned image PDF."
    except Exception as e:
        print(f"[PDF Error] {e}")
        return f"Error extracting PDF: {str(e)}"
