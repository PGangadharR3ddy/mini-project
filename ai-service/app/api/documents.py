import logging

from fastapi import APIRouter, File, Form, UploadFile, status

from app.schemas.document import DocumentUploadResponse
from app.services.document_service import document_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post(
    "/upload",
    response_model=DocumentUploadResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload and process a course document",
    description=(
        "Uploads a PDF document, extracts its text, splits it into chunks, "
        "generates embeddings, and stores them in ChromaDB for later retrieval by the chatbot."
    ),
)
async def upload_document(
    file: UploadFile = File(..., description="PDF document to process"),
    subject_id: str | None = Form(None, description="Optional subject/course identifier to namespace this document"),
):
    logger.info("Received document upload: %s", file.filename)
    result = await document_service.process_document(file, subject_id=subject_id)
    return DocumentUploadResponse(**result)
