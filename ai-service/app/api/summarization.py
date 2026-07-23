import logging

from fastapi import APIRouter, status

from app.schemas.summarization import SummarizeRequest, SummarizeResponse
from app.services.summarization_service import summarization_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/summarize", tags=["Summarization"])


@router.post(
    "",
    response_model=SummarizeResponse,
    status_code=status.HTTP_200_OK,
    summary="Summarize a lecture transcript",
    description="Generates a concise summary of a lecture transcript using FLAN-T5.",
)
async def summarize_transcript(payload: SummarizeRequest):
    logger.info("Received summarization request (%d chars).", len(payload.transcript))
    summary = summarization_service.summarize(payload.transcript)
    return SummarizeResponse(summary=summary)
