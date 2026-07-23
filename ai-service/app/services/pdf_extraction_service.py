"""
Extracts raw text from uploaded PDF documents using pypdf.
"""
import logging

from pypdf import PdfReader

from app.core.exceptions import DocumentProcessingError

logger = logging.getLogger(__name__)


class PdfExtractionService:
    def extract_text(self, file_path: str) -> str:
        try:
            reader = PdfReader(file_path)
            pages_text = []
            for page_num, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                pages_text.append(text)
            full_text = "\n".join(pages_text).strip()

            if not full_text:
                raise DocumentProcessingError(
                    "No extractable text found in PDF. The file may be a scanned image without OCR."
                )
            return full_text
        except DocumentProcessingError:
            raise
        except Exception as exc:  # noqa: BLE001
            logger.exception("PDF text extraction failed")
            raise DocumentProcessingError(f"Failed to extract text from PDF: {exc}") from exc


pdf_extraction_service = PdfExtractionService()
