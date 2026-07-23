from pydantic import BaseModel, Field, field_validator


class SummarizeRequest(BaseModel):
    transcript: str = Field(
        ...,
        min_length=20,
        example="Today we discussed binary search trees, their time complexity, "
        "and how insertion and deletion operations work...",
    )

    @field_validator("transcript")
    @classmethod
    def transcript_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("transcript must not be blank")
        return v


class SummarizeResponse(BaseModel):
    summary: str = Field(..., example="The lecture covered binary search trees, including insertion, "
                                        "deletion, and time complexity analysis.")
