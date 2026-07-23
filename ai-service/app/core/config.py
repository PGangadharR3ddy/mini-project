"""
Application configuration.

Loads settings from environment variables / .env file using Pydantic.
Centralizing configuration here means every other module imports `settings`
instead of calling os.getenv() directly, which keeps config consistent
and easy to override in tests or other deployments.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # --- General ---
    APP_NAME: str = "Smart Classroom AI Service"
    APP_VERSION: str = "1.0.0"
    ENV: str = "development"
    DEBUG: bool = True

    # --- Server ---
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # --- CORS (Spring Boot backend + frontend origins) ---
    ALLOWED_ORIGINS: list[str] = ["*"]

    # --- File storage ---
    UPLOAD_DIR: str = "uploads"
    AUDIO_UPLOAD_DIR: str = "uploads/audio"
    DOCUMENT_UPLOAD_DIR: str = "uploads/documents"
    MAX_UPLOAD_SIZE_MB: int = 200

    # --- Whisper (Speech-to-Text) ---
    WHISPER_MODEL_SIZE: str = "base"  # tiny | base | small | medium | large
    WHISPER_DEVICE: str = "cpu"  # "cuda" if a GPU is available

    # --- Summarization (FLAN-T5) ---
    SUMMARIZATION_MODEL: str = "google/flan-t5-base"
    SUMMARY_MAX_LENGTH: int = 220
    SUMMARY_MIN_LENGTH: int = 40

    # --- Embeddings ---
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"

    # --- ChromaDB ---
    CHROMA_PERSIST_DIR: str = "chroma_db"
    CHROMA_COLLECTION_NAME: str = "classroom_documents"

    # --- RAG / Chat ---
    RAG_TOP_K: int = 4
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50

    # --- spaCy ---
    SPACY_MODEL: str = "en_core_web_sm"

    # --- Spring Boot backend integration ---
    SPRING_BOOT_BASE_URL: str = "http://localhost:8080"
    INTERNAL_SERVICE_API_KEY: str = "change-me-in-production"

    # --- Logging ---
    LOG_LEVEL: str = "INFO"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    """Cached settings accessor so the .env file is parsed only once."""
    return Settings()


settings = get_settings()
