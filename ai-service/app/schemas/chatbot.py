from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=3, example="What is a binary search tree?")
    subject_id: str | None = Field(
        None,
        description="Optional filter to restrict retrieval to a specific subject/collection namespace.",
        example="cs201",
    )
    top_k: int | None = Field(None, ge=1, le=20, description="Override the default number of chunks retrieved.")

    @field_validator("query")
    @classmethod
    def query_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("query must not be blank")
        return v


class SourceChunk(BaseModel):
    document_id: str
    filename: str | None = None
    chunk_index: int | None = None
    text: str
    score: float | None = None


class ChatResponse(BaseModel):
    answer: str = Field(..., example="A binary search tree is a hierarchical data structure...")
    sources: list[SourceChunk] = Field(default_factory=list)
