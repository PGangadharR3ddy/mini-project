"""
Generates vector embeddings for text using Sentence Transformers (all-MiniLM-L6-v2).
"""
import logging

from app.ai.embedding_model import get_embedding_model

logger = logging.getLogger(__name__)


class EmbeddingService:
    def embed_texts(self, texts: list[str]) -> list[list[float]]:
        model = get_embedding_model()
        embeddings = model.encode(texts, show_progress_bar=False, convert_to_numpy=True)
        return embeddings.tolist()

    def embed_query(self, query: str) -> list[float]:
        return self.embed_texts([query])[0]


embedding_service = EmbeddingService()
