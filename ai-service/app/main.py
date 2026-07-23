"""
Smart Classroom Management and AI-Assisted Learning Platform
--------------------------------------------------------------
AI / NLP microservice entrypoint.

This service is consumed by a separate Spring Boot backend over REST.
Run with:  uvicorn app.main:app --reload
"""
import logging
import time

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import settings
from app.core.exceptions import AIServiceException, ai_service_exception_handler, generic_exception_handler
from app.core.logging_config import configure_logging

configure_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Dedicated AI/NLP microservice for the Smart Classroom Management and "
        "AI-Assisted Learning Platform. Provides lecture transcription, summarization, "
        "document-based RAG chatbot, and skill extraction capabilities. "
        "Designed to be consumed by a Spring Boot backend over REST."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request logging / timing middleware ---
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000
    logger.info(
        "%s %s -> %d (%.2fms)",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


# --- Exception handlers ---
app.add_exception_handler(AIServiceException, ai_service_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


@app.exception_handler(status.HTTP_422_UNPROCESSABLE_ENTITY)
async def validation_exception_handler(request: Request, exc):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "ValidationError",
            "message": str(exc),
            "path": str(request.url.path),
        },
    )


# --- Routes ---
app.include_router(api_router)


@app.on_event("startup")
async def on_startup() -> None:
    logger.info("%s v%s starting up in '%s' mode...", settings.APP_NAME, settings.APP_VERSION, settings.ENV)


@app.on_event("shutdown")
async def on_shutdown() -> None:
    logger.info("%s shutting down.", settings.APP_NAME)
