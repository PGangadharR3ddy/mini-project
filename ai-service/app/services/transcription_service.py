"""
Service responsible for converting lecture audio into text using Whisper.
"""
import logging
import os
import uuid

from fastapi import UploadFile

from app.ai.whisper_model import get_whisper_model
from app.core.config import settings
from app.core.exceptions import TranscriptionError, UnsupportedFileTypeError

logger = logging.getLogger(__name__)

ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".m4a", ".mp4", ".mpeg", ".mpga", ".webm", ".ogg"}


class TranscriptionService:
    """Wraps the Whisper model behind a simple, testable interface."""

    def __init__(self) -> None:
        os.makedirs(settings.AUDIO_UPLOAD_DIR, exist_ok=True)

    async def transcribe(self, audio_file: UploadFile) -> dict:
        self._validate_file(audio_file)
        temp_path = await self._save_temp_file(audio_file)

        try:
            model = get_whisper_model()
            logger.info("Transcribing audio file: %s", audio_file.filename)
            result = model.transcribe(temp_path)

            transcript = result.get("text", "").strip()
            if not transcript:
                raise TranscriptionError("Whisper returned an empty transcript.")

            return {
                "transcript": transcript,
                "language": result.get("language"),
                "duration_seconds": self._estimate_duration(result),
            }
        except TranscriptionError:
            raise
        except Exception as exc:  # noqa: BLE001
            logger.exception("Whisper transcription failed")
            raise TranscriptionError(f"Transcription failed: {exc}") from exc
        finally:
            self._cleanup(temp_path)

    def _validate_file(self, audio_file: UploadFile) -> None:
        ext = os.path.splitext(audio_file.filename or "")[1].lower()
        if ext not in ALLOWED_AUDIO_EXTENSIONS:
            raise UnsupportedFileTypeError(
                f"Unsupported audio format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_AUDIO_EXTENSIONS))}"
            )

    async def _save_temp_file(self, audio_file: UploadFile) -> str:
        ext = os.path.splitext(audio_file.filename)[1].lower()
        temp_filename = f"{uuid.uuid4().hex}{ext}"
        temp_path = os.path.join(settings.AUDIO_UPLOAD_DIR, temp_filename)

        content = await audio_file.read()
        with open(temp_path, "wb") as f:
            f.write(content)
        return temp_path

    @staticmethod
    def _estimate_duration(whisper_result: dict) -> float | None:
        segments = whisper_result.get("segments") or []
        if segments:
            return round(segments[-1].get("end", 0.0), 2)
        return None

    @staticmethod
    def _cleanup(path: str) -> None:
        try:
            if os.path.exists(path):
                os.remove(path)
        except OSError:
            logger.warning("Failed to remove temp audio file: %s", path)


transcription_service = TranscriptionService()
