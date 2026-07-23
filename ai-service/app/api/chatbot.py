import logging

from fastapi import APIRouter, status

from app.schemas.chatbot import ChatRequest, ChatResponse
from app.services.chatbot_service import chatbot_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chat", tags=["Chatbot"])


@router.post(
    "",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Ask the subject-specific RAG chatbot",
    description=(
        "Accepts a student question, retrieves relevant chunks from previously uploaded "
        "course documents (ChromaDB), and returns a context-grounded answer with sources."
    ),
)
async def chat(payload: ChatRequest):
    logger.info("Received chat query: %s", payload.query)
    result = chatbot_service.answer(payload.query, subject_id=payload.subject_id, top_k=payload.top_k)
    return ChatResponse(**result)
