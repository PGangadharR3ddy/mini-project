from pydantic import BaseModel, Field, field_validator


class SkillExtractionRequest(BaseModel):
    text: str = Field(..., min_length=3, example="I know Python, React, Machine Learning and UI Design")

    @field_validator("text")
    @classmethod
    def text_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("text must not be blank")
        return v


class SkillExtractionResponse(BaseModel):
    skills: list[str] = Field(default_factory=list, example=["Python", "React", "Machine Learning", "UI Design"])
