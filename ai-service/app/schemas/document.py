from pydantic import BaseModel, Field


class DocumentUploadResponse(BaseModel):
    message: str = Field(..., example="document processed successfully")
    document_id: str | None = Field(None, example="a1b2c3d4")
    chunks_created: int | None = Field(None, example=18)
    filename: str | None = Field(None, example="data_structures_notes.pdf")
