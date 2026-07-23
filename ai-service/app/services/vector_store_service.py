"""
Wraps ChromaDB persistence and querying behind a simple interface used by
the document processing and chatbot services.
"""
import logging

import chromadb

from app.core.config import settings
from app.models.chunk import DocumentChunk

logger = logging.getLogger(__name__)


class VectorStoreService:
    def __init__(self) -> None:
        self._client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        self._collection = self._client.get_or_create_collection(
            name=settings.CHROMA_COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(
            "Connected to ChromaDB collection '%s' at '%s'.",
            settings.CHROMA_COLLECTION_NAME,
            settings.CHROMA_PERSIST_DIR,
        )

    def add_chunks(self, chunks: list[DocumentChunk], embeddings: list[list[float]]) -> None:
        if not chunks:
            return

        self._collection.add(
            ids=[c.chunk_id for c in chunks],
            embeddings=embeddings,
            documents=[c.text for c in chunks],
            metadatas=[
                {
                    "document_id": c.document_id,
                    "chunk_index": c.chunk_index,
                    "filename": c.filename or "",
                    **c.metadata,
                }
                for c in chunks
            ],
        )
        logger.info("Added %d chunk(s) to ChromaDB.", len(chunks))

    def query(self, query_embedding: list[float], top_k: int, subject_id: str | None = None) -> list[dict]:
        where_filter = {"subject_id": subject_id} if subject_id else None

        results = self._collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_filter,
        )

        matches = []
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]
        ids = results.get("ids", [[]])[0]

        for i in range(len(documents)):
            metadata = metadatas[i] or {}
            matches.append(
                {
                    "chunk_id": ids[i],
                    "text": documents[i],
                    "document_id": metadata.get("document_id"),
                    "filename": metadata.get("filename"),
                    "chunk_index": metadata.get("chunk_index"),
                    "score": 1 - distances[i] if distances[i] is not None else None,  # cosine similarity
                }
            )
        return matches


vector_store_service = VectorStoreService()
