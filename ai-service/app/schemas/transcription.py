from pydantic import BaseModel, Field


class TranscriptionResponse(BaseModel):
    transcript: str = Field(..., example="Today we will discuss binary search trees...")
    language: str | None = Field(None, example="en")
    duration_seconds: float | None = Field(None, example=612.4)
