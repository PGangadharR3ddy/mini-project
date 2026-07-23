import logging

from fastapi import APIRouter, status

from app.schemas.skill import SkillExtractionRequest, SkillExtractionResponse
from app.services.skill_service import skill_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/skills", tags=["Skills"])


@router.post(
    "/extract",
    response_model=SkillExtractionResponse,
    status_code=status.HTTP_200_OK,
    summary="Extract skills and keywords from text",
    description="Uses a spaCy NLP pipeline to extract skills/keywords from free-form text (e.g. a student bio).",
)
async def extract_skills(payload: SkillExtractionRequest):
    logger.info("Received skill extraction request (%d chars).", len(payload.text))
    skills = skill_service.extract_skills(payload.text)
    return SkillExtractionResponse(skills=skills)
