"""
Lazy-loaded singleton wrapper around the FLAN-T5 summarization pipeline
(Hugging Face Transformers).
"""
import logging
import threading

import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer

from app.core.config import settings

logger = logging.getLogger(__name__)

_tokenizer = None
_model = None
_lock = threading.Lock()


def get_summarization_model():
    """Return a cached (tokenizer, model) tuple, loading them on first call."""
    global _tokenizer, _model
    if _model is None or _tokenizer is None:
        with _lock:
            if _model is None or _tokenizer is None:
                logger.info("Loading summarization model '%s'...", settings.SUMMARIZATION_MODEL)
                _tokenizer = AutoTokenizer.from_pretrained(settings.SUMMARIZATION_MODEL)
                _model = AutoModelForSeq2SeqLM.from_pretrained(settings.SUMMARIZATION_MODEL)
                device = "cuda" if torch.cuda.is_available() else "cpu"
                _model.to(device)
                _model.eval()
                logger.info("Summarization model loaded successfully on %s.", device)
    return _tokenizer, _model
