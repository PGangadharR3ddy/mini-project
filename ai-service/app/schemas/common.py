"""Shared response schemas used across multiple modules."""
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(..., example="running")


class ErrorResponse(BaseModel):
    success: bool = False
    error: str
    message: str
    path: str | None = None
