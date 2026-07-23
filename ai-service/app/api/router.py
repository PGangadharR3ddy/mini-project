"""Aggregates all feature routers into a single APIRouter mounted in main.py."""
from fastapi import APIRouter

from app.api import chatbot, documents, health, skills, summarization, transcription

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(transcription.router)
api_router.include_router(summarization.router)
api_router.include_router(documents.router)
api_router.include_router(chatbot.router)
api_router.include_router(skills.router)
