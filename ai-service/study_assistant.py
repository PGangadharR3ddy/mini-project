
import json
import os

import httpx
import fitz
from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter(prefix="/study", tags=["Study Assistant"])

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

# Keep chunks small enough for a lightweight local model.
MAX_CHARS = 4500


async def ask_ollama(prompt: str, json_mode: bool = False):
    payload = {
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1,
            "num_ctx": 4096
        }
    }

    if json_mode:
        payload["format"] = "json"

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json=payload
            )
            response.raise_for_status()
            return response.json()["response"]

    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=503,
            detail=(
                "Could not contact Ollama. Check that Ollama is running "
                "and that the configured model is downloaded."
            )
        ) from exc


def extract_pdf_pages(pdf_bytes: bytes):
    pages = []

    try:
        with fitz.open(stream=pdf_bytes, filetype="pdf") as document:
            if document.is_encrypted:
                raise HTTPException(
                    status_code=400,
                    detail="Password-protected PDFs are not supported yet."
                )

            if len(document) == 0:
                raise HTTPException(
                    status_code=400,
                    detail="The PDF contains no pages."
                )

            for page_number, page in enumerate(document, start=1):
                text = page.get_text("text").strip()

                if text:
                    pages.append({
                        "page": page_number,
                        "text": text
                    })

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail="Could not read this PDF."
        ) from exc

    if not pages:
        raise HTTPException(
            status_code=422,
            detail="No selectable text found. OCR may be needed."
        )

    return pages


def make_chunks(pages):
    chunks = []
    current_text = []
    current_pages = []
    current_length = 0

    for page in pages:
        page_text = page["text"]
        page_number = page["page"]

        # Split unusually long pages without losing their page number.
        pieces = [
            page_text[i:i + MAX_CHARS]
            for i in range(0, len(page_text), MAX_CHARS)
        ]

        for piece in pieces:
            if current_length + len(piece) > MAX_CHARS and current_text:
                chunks.append({
                    "text": "\n".join(current_text),
                    "pages": sorted(set(current_pages))
                })
                current_text = []
                current_pages = []
                current_length = 0

            current_text.append(piece)
            current_pages.append(page_number)
            current_length += len(piece)

    if current_text:
        chunks.append({
            "text": "\n".join(current_text),
            "pages": sorted(set(current_pages))
        })

    return chunks


@router.get("/health")
async def study_health():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OLLAMA_URL}/api/tags")
            response.raise_for_status()
            models = response.json().get("models", [])

        available = [
            model["name"]
            for model in models
        ]

        return {
            "ollama_connected": True,
            "configured_model": MODEL,
            "model_available": any(
                name == MODEL or name.startswith(MODEL + ":")
                for name in available
            ),
            "available_models": available
        }

    except httpx.HTTPError:
        raise HTTPException(
            status_code=503,
            detail="Ollama is not reachable."
        )


@router.post("/upload")
async def summarize_pdf(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF file."
        )

    pdf_bytes = await file.read()

    # Basic upload limit for the initial prototype.
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="The file is empty.")

    if len(pdf_bytes) > 15 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="PDF too large. Maximum size is 15 MB."
        )

    pages = extract_pdf_pages(pdf_bytes)
    chunks = make_chunks(pages)

    # Summarize every chunk using only its extracted PDF text.
    section_summaries = []

    for index, chunk in enumerate(chunks, start=1):
        prompt = f"""
You are a study assistant.
Use ONLY the source text below. Do not add outside facts.
If the text is unclear, do not guess.

Create concise revision notes with:
- Main ideas
- Important definitions
- Key facts and relationships

SOURCE PAGES: {chunk["pages"]}
SOURCE TEXT:
<source>
{chunk["text"]}
</source>

Return only the revision notes.
"""
        summary = await ask_ollama(prompt)

        section_summaries.append({
            "section": index,
            "pages": chunk["pages"],
            "summary": summary
        })

    # Combine section notes rather than sending the entire PDF at once.
    combined_notes = "\n\n".join(
        f'Pages {item["pages"]}:\n{item["summary"]}'
        for item in section_summaries
    )

    final_summary = await ask_ollama(f"""
Create an exam revision summary using ONLY the notes below.
Do not introduce new facts or external knowledge.
Preserve important definitions, concepts and distinctions.
Organize the result with clear headings and bullet points.

SOURCE NOTES:
<source>
{combined_notes}
</source>
""")

    # Generate quiz questions independently from each source chunk.
    quiz = []

    for chunk in chunks:
        prompt = f"""
Create up to 2 useful exam revision MCQs using ONLY the source text.
Every question must be answerable from the source text.
Do not use outside knowledge. Do not infer missing facts.
Use four options and exactly one correct answer.
Keep the correct answer and explanation grounded in the source.
If the source does not support a good question, return fewer questions.

Source pages: {chunk["pages"]}
Source text:
<source>
{chunk["text"]}
</source>

Return valid JSON in this exact structure:
{{
  "questions": [
    {{
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "answer": "Exact correct option text",
      "explanation": "Why this answer follows from the source"
    }}
  ]
}}
"""
        raw = await ask_ollama(prompt, json_mode=True)

        try:
            result = json.loads(raw)

            for item in result.get("questions", []):
                options = item.get("options", [])
                answer = item.get("answer", "")

                # Basic structural checks; semantic verification comes later.
                if (
                    isinstance(item.get("question"), str)
                    and len(options) == 4
                    and all(isinstance(option, str) for option in options)
                    and options.count(answer) == 1
                    and isinstance(item.get("explanation"), str)
                ):
                    quiz.append({
                        "question": item["question"],
                        "options": options,
                        "answer": answer,
                        "explanation": item["explanation"],
                        "source_pages": chunk["pages"]
                    })

        except (json.JSONDecodeError, AttributeError, TypeError):
            # Skip malformed model output instead of returning invalid quiz data.
            continue

    return {
        "filename": file.filename,
        "pages_processed": len(pages),
        "sections_processed": len(chunks),
        "summary": final_summary,
        "section_summaries": section_summaries,
        "quiz": quiz,
        "source_policy": (
            "Prompts restrict generation to extracted PDF text; "
            "semantic answer verification is not yet implemented."
        )
    }
