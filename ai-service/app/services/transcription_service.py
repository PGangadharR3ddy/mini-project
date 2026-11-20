"""
Service responsible for converting lecture audio into text using Whisper.
"""
import logging
import os
import shutil
import uuid

from fastapi import UploadFile
from starlette.concurrency import run_in_threadpool

from app.ai.whisper_model import get_whisper_model
from app.core.config import settings
from app.core.exceptions import AudioFileTooLargeError, TranscriptionError, UnsupportedFileTypeError
from ml_service.transcriber import LegalTranscriber, TranscriptionResult

logger = logging.getLogger(__name__)

ALLOWED_AUDIO_EXTENSIONS = {
    ".mp3", ".wav", ".m4a", ".mp4", ".mpeg", ".mpga", ".webm", ".ogg", ".flac",
}
CHUNK_SIZE = 1024 * 1024


class TranscriptionService:
    """Wraps the Whisper model behind a simple, testable interface."""

    def __init__(self) -> None:
        os.makedirs(settings.AUDIO_UPLOAD_DIR, exist_ok=True)

    async def transcribe(
        self,
        audio_file: UploadFile,
        language: str | None = None,
        translate_to_english: bool = False,
    ) -> dict:
        self._validate_file(audio_file)
        if shutil.which("ffmpeg") is None:
            raise TranscriptionError(
                "FFmpeg is required for audio transcription. Install FFmpeg and add it to PATH."
            )
        temp_path = await self._save_temp_file(audio_file)

        try:
            result = await run_in_threadpool(
                self._transcribe_file,
                temp_path,
                audio_file.filename,
                language,
                translate_to_english,
            )

            transcript = result.full_text
            if not transcript:
                raise TranscriptionError("Whisper returned an empty transcript.")

            return {
                "transcript": transcript,
                "language": result.language,
                "duration_seconds": result.duration,
                "file_name": result.file_name,
                "model_used": result.model_used,
                "segments": [
                    {
                        "start": segment.start,
                        "end": segment.end,
                        "text": segment.text,
                        "speaker": segment.speaker,
                    }
                    for segment in result.segments
                ],
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
        ext = os.path.splitext(audio_file.filename or "")[1].lower()
        temp_filename = f"{uuid.uuid4().hex}{ext}"
        temp_path = os.path.join(settings.AUDIO_UPLOAD_DIR, temp_filename)

        max_size = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        total_size = 0
        try:
            with open(temp_path, "wb") as output_file:
                while chunk := await audio_file.read(CHUNK_SIZE):
                    total_size += len(chunk)
                    if total_size > max_size:
                        raise AudioFileTooLargeError(
                            f"Audio file exceeds the {settings.MAX_UPLOAD_SIZE_MB} MB limit."
                        )
                    output_file.write(chunk)
            if total_size == 0:
                raise TranscriptionError("The uploaded audio file is empty.")
            return temp_path
        except Exception:
            self._cleanup(temp_path)
            raise

    @staticmethod
    def _transcribe_file(
        temp_path: str,
        filename: str | None,
        language: str | None = None,
        translate_to_english: bool = False,
    ) -> TranscriptionResult:
        model = get_whisper_model()
        logger.info("Transcribing audio file: %s", filename)
        transcriber = LegalTranscriber(model_size=settings.WHISPER_MODEL_SIZE, model=model)
        result = transcriber.transcribe(
            temp_path,
            language=language,
            translate_to_english=translate_to_english,
        )
        result.file_name = filename or result.file_name
        return result

    @staticmethod
    def _cleanup(path: str) -> None:
        try:
            if os.path.exists(path):
                os.remove(path)
        except OSError:
            logger.warning("Failed to remove temp audio file: %s", path)


transcription_service = TranscriptionService()
