"""
Custom application exceptions and their FastAPI exception handlers.

Services raise these domain-specific exceptions; main.py registers handlers
that translate them into consistent JSON error responses.
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse


class AIServiceException(Exception):
    """Base exception for all custom AI service errors."""

    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


class TranscriptionError(AIServiceException):
    """Raised when audio transcription fails."""

    def __init__(self, message: str = "Failed to transcribe audio"):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)


class SummarizationError(AIServiceException):
    """Raised when text summarization fails."""

    def __init__(self, message: str = "Failed to generate summary"):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)


class DocumentProcessingError(AIServiceException):
    """Raised when a document cannot be parsed, chunked, or embedded."""

    def __init__(self, message: str = "Failed to process document"):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)


class ChatbotError(AIServiceException):
    """Raised when the RAG chatbot pipeline fails."""

    def __init__(self, message: str = "Failed to generate an answer"):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)


class SkillExtractionError(AIServiceException):
    """Raised when skill/keyword extraction fails."""

    def __init__(self, message: str = "Failed to extract skills"):
        super().__init__(message, status.HTTP_422_UNPROCESSABLE_ENTITY)


class UnsupportedFileTypeError(AIServiceException):
    """Raised when an uploaded file type is not supported."""

    def __init__(self, message: str = "Unsupported file type"):
        super().__init__(message, status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)


async def ai_service_exception_handler(request: Request, exc: AIServiceException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.__class__.__name__,
            "message": exc.message,
            "path": str(request.url.path),
        },
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "InternalServerError",
            "message": "An unexpected error occurred. Please try again later.",
            "path": str(request.url.path),
        },
    )
