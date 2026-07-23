# Smart Classroom AI Service

Dedicated **AI / NLP microservice** for the *Smart Classroom Management and
AI-Assisted Learning Platform*. Built with **FastAPI** and **Python 3.11**,
consumed by a separate **Spring Boot** backend over REST.

## Features

| Module | Endpoint | Description |
|---|---|---|
| Health Check | `GET /health` | Liveness probe |
| Transcription | `POST /transcribe` | Audio → text via Whisper |
| Summarization | `POST /summarize` | Transcript → summary via FLAN-T5 |
| Document Processing | `POST /documents/upload` | PDF → chunks → embeddings → ChromaDB |
| Chatbot (RAG) | `POST /chat` | Subject-specific Q&A grounded in uploaded documents |
| Skill Extraction | `POST /skills/extract` | spaCy-based skill/keyword extraction |

## Project Structure

```
ai-service/
├── app/
│   ├── api/            # FastAPI routers (one file per feature)
│   ├── core/           # config, logging, custom exceptions
│   ├── services/       # business logic (one class per responsibility)
│   ├── ai/             # lazy-loaded singleton ML model wrappers
│   ├── models/         # internal domain models (non-Pydantic-API)
│   ├── schemas/        # Pydantic request/response schemas
│   └── main.py         # FastAPI app entrypoint
├── uploads/
│   ├── audio/
│   └── documents/
├── chroma_db/           # ChromaDB persistent storage (created at runtime)
├── requirements.txt
├── .env.example
└── .env
```

## Setup

### 1. Create a virtual environment (Python 3.11)

```bash
python3.11 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

> **Note on Whisper**: `openai-whisper` requires `ffmpeg` to be installed on
> the system (not just pip). On Ubuntu/Debian: `sudo apt install ffmpeg`. On
> macOS: `brew install ffmpeg`. On Windows, install ffmpeg and add it to PATH.

### 3. Configure environment

```bash
cp .env.example .env
# edit .env as needed (model sizes, ports, Spring Boot base URL, etc.)
```

### 4. Run the service

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Docker (optional)

```bash
docker build -t smart-classroom-ai-service .
docker run -p 8000:8000 --env-file .env smart-classroom-ai-service
```

## Notes on Model Loading

All ML models (Whisper, FLAN-T5, Sentence-Transformers, spaCy) are loaded
**lazily** via singleton wrappers in `app/ai/`. The first request to each
endpoint will be slower (model download/load); subsequent requests reuse the
already-loaded model in memory. For production, consider a startup warm-up
step or a dedicated model-serving process if cold-start latency matters.

## Example API Requests & Responses

### Health Check

```bash
curl -X GET http://localhost:8000/health
```
```json
{ "status": "running" }
```

### Transcribe Lecture Audio

```bash
curl -X POST http://localhost:8000/transcribe \
  -F "audio_file=@lecture_recording.mp3"
```
```json
{
  "transcript": "Today we will discuss binary search trees and their properties...",
  "language": "en",
  "duration_seconds": 612.4
}
```

### Summarize Transcript

```bash
curl -X POST http://localhost:8000/summarize \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Today we discussed binary search trees, their time complexity..."}'
```
```json
{
  "summary": "The lecture covered binary search trees, including insertion, deletion, and time complexity analysis."
}
```

### Upload & Process a Document

```bash
curl -X POST http://localhost:8000/documents/upload \
  -F "file=@data_structures_notes.pdf" \
  -F "subject_id=cs201"
```
```json
{
  "message": "document processed successfully",
  "document_id": "a1b2c3d4e5f6",
  "chunks_created": 18,
  "filename": "data_structures_notes.pdf"
}
```

### Chat with the RAG Chatbot

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"query": "What is a binary search tree?", "subject_id": "cs201"}'
```
```json
{
  "answer": "A binary search tree is a hierarchical data structure in which each node has at most two children, and the left child's value is less than the parent while the right child's value is greater.",
  "sources": [
    {
      "document_id": "a1b2c3d4e5f6",
      "filename": "data_structures_notes.pdf",
      "chunk_index": 3,
      "text": "A binary search tree (BST) is a node-based binary tree data structure...",
      "score": 0.87
    }
  ]
}
```

### Extract Skills

```bash
curl -X POST http://localhost:8000/skills/extract \
  -H "Content-Type: application/json" \
  -d '{"text": "I know Python, React, Machine Learning and UI Design"}'
```
```json
{
  "skills": ["Machine Learning", "Python", "React", "UI Design"]
}
```

## Integration with Spring Boot Backend

- This service is stateless aside from `uploads/` and `chroma_db/`, both of
  which should be mounted as persistent volumes in production.
- The Spring Boot backend should call these endpoints as a downstream REST
  client (e.g. via `RestTemplate` / `WebClient`), typically passing the
  original filenames, subject/course IDs, and user context in request bodies
  or as multipart form fields.
- `SPRING_BOOT_BASE_URL` and `INTERNAL_SERVICE_API_KEY` are reserved in
  `app/core/config.py` for future outbound calls (e.g. this service pushing
  processed transcripts back to Spring Boot) and for securing this service
  behind an internal API key/header if it's not otherwise network-isolated.
- All error responses follow a consistent shape:
  ```json
  { "success": false, "error": "ErrorType", "message": "...", "path": "/endpoint" }
  ```

## Implementation Guidelines / Design Notes

1. **Clean architecture**: routers (`api/`) contain no business logic — they
   validate input via Pydantic schemas and delegate to `services/`.
2. **Singletons for ML models** (`app/ai/`): avoids reloading multi-hundred-MB
   models on every request; thread-safe double-checked locking used for lazy init.
3. **Custom exceptions** (`core/exceptions.py`) map domain failures to proper
   HTTP status codes with consistent JSON error bodies.
4. **Async endpoints**: I/O-bound work (file uploads/reads) is `async`; CPU/GPU-bound
   inference calls run synchronously inside the request (consider offloading to
   a background worker / task queue such as Celery or FastAPI `BackgroundTasks`
   plus a job-status endpoint if inference latency becomes a bottleneck at scale).
5. **RAG grounding**: the chatbot always cites retrieved chunks as `sources`
   so the frontend can display provenance and reduce hallucination risk.
6. **Extensibility**: `nlp/training` style workflows (e.g. fine-tuning FLAN-T5
   on lecture-specific data) can be added under a future `app/ai/training/`
   module without touching the API layer.

## Testing

Basic smoke test with `pytest` + `httpx` (add to `requirements-dev.txt` if desired):

```bash
pip install pytest httpx
pytest
```

Example test skeleton (`tests/test_health.py`):

```python
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "running"}
```
