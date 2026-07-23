"""
Lazy-loaded singleton wrapper around the spaCy NLP pipeline used for
skill / keyword extraction.
"""
import logging
import threading

import spacy

from app.core.config import settings

logger = logging.getLogger(__name__)

_nlp = None
_lock = threading.Lock()


def get_spacy_model():
    global _nlp
    if _nlp is None:
        with _lock:
            if _nlp is None:
                logger.info("Loading spaCy model '%s'...", settings.SPACY_MODEL)
                try:
                    _nlp = spacy.load(settings.SPACY_MODEL)
                except OSError:
                    logger.warning(
                        "spaCy model '%s' not found. Run: python -m spacy download %s",
                        settings.SPACY_MODEL,
                        settings.SPACY_MODEL,
                    )
                    raise
                logger.info("spaCy model loaded successfully.")
    return _nlp
