"""
Lazy-loaded singleton wrapper around the Sentence Transformers embedding model
(all-MiniLM-L6-v2 by default).
"""
import logging
import threading

from sentence_transformers import SentenceTransformer

from app.core.config import settings

logger = logging.getLogger(__name__)

_model = None
_lock = threading.Lock()


def get_embedding_model() -> SentenceTransformer:
    global _model
    if _model is None:
        with _lock:
            if _model is None:
                logger.info("Loading embedding model '%s'...", settings.EMBEDDING_MODEL)
                _model = SentenceTransformer(settings.EMBEDDING_MODEL)
                logger.info("Embedding model loaded successfully.")
    return _model
