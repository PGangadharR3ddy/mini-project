"""
Splits raw document text into overlapping chunks suitable for embedding.

A sliding-window word-based chunker is simple, dependency-free, and works
well enough for lecture notes / PDFs at FYP scale. Overlap preserves context
across chunk boundaries so semantic search doesn't lose meaning at the edges.
"""
from app.core.config import settings
from app.models.chunk import DocumentChunk


class ChunkingService:
    def chunk_text(
        self,
        text: str,
        document_id: str,
        filename: str | None = None,
        chunk_size: int | None = None,
        overlap: int | None = None,
    ) -> list[DocumentChunk]:
        chunk_size = chunk_size or settings.CHUNK_SIZE
        overlap = overlap or settings.CHUNK_OVERLAP

        words = text.split()
        if not words:
            return []

        chunks: list[DocumentChunk] = []
        start = 0
        index = 0

        while start < len(words):
            end = min(start + chunk_size, len(words))
            chunk_text_value = " ".join(words[start:end])

            chunks.append(
                DocumentChunk(
                    document_id=document_id,
                    chunk_index=index,
                    text=chunk_text_value,
                    filename=filename,
                )
            )

            index += 1
            if end == len(words):
                break
            start = end - overlap  # slide window back by `overlap` words

        return chunks


chunking_service = ChunkingService()
