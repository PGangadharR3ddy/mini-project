"""
Orchestrates the full document ingestion pipeline:
upload -> save -> extract text -> chunk -> embed -> store in ChromaDB.
"""
import logging
import os
import uuid

from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import DocumentProcessingError, UnsupportedFileTypeError
from app.services.chunking_service import chunking_service
from app.services.embedding_service import embedding_service
from app.services.pdf_extraction_service import pdf_extraction_service
from app.services.vector_store_service import vector_store_service

logger = logging.getLogger(__name__)

ALLOWED_DOCUMENT_EXTENSIONS = {".pdf"}


class DocumentService:
    def __init__(self) -> None:
        os.makedirs(settings.DOCUMENT_UPLOAD_DIR, exist_ok=True)

    async def process_document(self, file: UploadFile, subject_id: str | None = None) -> dict:
        self._validate_file(file)
        document_id = uuid.uuid4().hex
        saved_path = await self._save_file(file, document_id)

        try:
            logger.info("Extracting text from document: %s", file.filename)
            text = pdf_extraction_service.extract_text(saved_path)

            chunks = chunking_service.chunk_text(text, document_id=document_id, filename=file.filename)
            if not chunks:
                raise DocumentProcessingError("Document produced no usable text chunks.")

            if subject_id:
                for chunk in chunks:
                    chunk.metadata["subject_id"] = subject_id

            logger.info("Generating embeddings for %d chunk(s).", len(chunks))
            embeddings = embedding_service.embed_texts([c.text for c in chunks])

            vector_store_service.add_chunks(chunks, embeddings)

            return {
                "message": "document processed successfully",
                "document_id": document_id,
                "chunks_created": len(chunks),
                "filename": file.filename,
            }
        except DocumentProcessingError:
            raise
        except Exception as exc:  # noqa: BLE001
            logger.exception("Document processing failed")
            raise DocumentProcessingError(f"Document processing failed: {exc}") from exc

    def _validate_file(self, file: UploadFile) -> None:
        ext = os.path.splitext(file.filename or "")[1].lower()
        if ext not in ALLOWED_DOCUMENT_EXTENSIONS:
            raise UnsupportedFileTypeError(
                f"Unsupported document format '{ext}'. Allowed: {', '.join(sorted(ALLOWED_DOCUMENT_EXTENSIONS))}"
            )

    async def _save_file(self, file: UploadFile, document_id: str) -> str:
        ext = os.path.splitext(file.filename)[1].lower()
        path = os.path.join(settings.DOCUMENT_UPLOAD_DIR, f"{document_id}{ext}")
        content = await file.read()
        with open(path, "wb") as f:
            f.write(content)
        return path


document_service = DocumentService()
