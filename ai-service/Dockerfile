FROM python:3.11-slim

# System dependencies: ffmpeg for Whisper, build tools for some wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && python -m spacy download en_core_web_sm

COPY . .

RUN mkdir -p uploads/audio uploads/documents chroma_db

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
