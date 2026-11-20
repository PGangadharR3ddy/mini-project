from pydantic import BaseModel, Field


class TranscriptSegmentResponse(BaseModel):
    start: float
    end: float
    text: str
    speaker: str | None = None


class TranscriptionResponse(BaseModel):
    transcript: str = Field(..., example="Today we will discuss binary search trees...")
    language: str | None = Field(None, example="en")
    duration_seconds: float | None = Field(None, example=612.4)
    file_name: str
    model_used: str
    segments: list[TranscriptSegmentResponse]
