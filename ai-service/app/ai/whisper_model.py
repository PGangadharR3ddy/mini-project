"""
Lazy-loaded singleton wrapper around the OpenAI Whisper model.

Loading Whisper is expensive (model weights must be read from disk into memory/GPU),
so we load it once on first use and reuse the same instance for every request.
"""
import logging
import threading

import whisper

from app.core.config import settings

logger = logging.getLogger(__name__)

_model = None
_model_lock = threading.Lock()


def get_whisper_model():
    """Return a cached Whisper model instance, loading it on first call."""
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:  # double-checked locking
                logger.info(
                    "Loading Whisper model '%s' on device '%s'...",
                    settings.WHISPER_MODEL_SIZE,
                    settings.WHISPER_DEVICE,
                )
                _model = whisper.load_model(settings.WHISPER_MODEL_SIZE, device=settings.WHISPER_DEVICE)
                logger.info("Whisper model loaded successfully.")
    return _model
