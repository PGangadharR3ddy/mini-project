"""
Service responsible for generating concise lecture summaries using FLAN-T5.
"""
import logging

import torch

from app.ai.summarization_model import get_summarization_model
from app.core.config import settings
from app.core.exceptions import SummarizationError

logger = logging.getLogger(__name__)

SUMMARY_PROMPT_TEMPLATE = (
    "Write a moderately detailed summary for a student as a natural paragraph "
    "of 3 to 5 complete sentences. Include the main topic and its important "
    "supporting details, and explain how the ideas relate. Use a neutral, "
    "declarative voice. Start with 'The lecture explains' and continue with "
    "factual statements such as 'It also describes'. Do not address or "
    "instruct the reader, and do not begin sentences with commands such as "
    "'Learn' or 'Understand'. Avoid repetition and include only facts from "
    "the transcript.\n\n"
    "Lecture transcript:\n{text}\n\n"
    "Summary:"
)

# Very long transcripts are chunked and summarized in parts, then combined,
# to stay within the model's token limit.
MAX_INPUT_TOKENS = 900


class SummarizationService:
    def __init__(self) -> None:
        pass

    def summarize(self, transcript: str) -> str:
        try:
            tokenizer, model = get_summarization_model()
            device = next(model.parameters()).device

            chunks = self._chunk_text(transcript, tokenizer, MAX_INPUT_TOKENS)
            logger.info("Summarizing transcript in %d chunk(s).", len(chunks))

            partial_summaries = [self._summarize_chunk(chunk, tokenizer, model, device) for chunk in chunks]

            if len(partial_summaries) == 1:
                return partial_summaries[0]

            # Summarize the concatenation of partial summaries for a final, cohesive summary.
            combined = " ".join(partial_summaries)
            return self._summarize_chunk(combined, tokenizer, model, device)

        except Exception as exc:  # noqa: BLE001
            logger.exception("Summarization failed")
            raise SummarizationError(f"Summarization failed: {exc}") from exc

    def _summarize_chunk(self, text: str, tokenizer, model, device) -> str:
        prompt = SUMMARY_PROMPT_TEMPLATE.format(text=text)
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024).to(device)
        source_token_count = len(tokenizer.encode(text, add_special_tokens=False))
        min_length = min(
            settings.SUMMARY_MIN_LENGTH,
            max(5, source_token_count // 3),
            settings.SUMMARY_MAX_LENGTH,
        )

        with torch.no_grad():
            output_ids = model.generate(
                **inputs,
                max_length=settings.SUMMARY_MAX_LENGTH,
                min_length=min_length,
                num_beams=4,
                length_penalty=1.0,
                early_stopping=True,
                no_repeat_ngram_size=3,
                repetition_penalty=1.2,
            )

        summary = tokenizer.decode(output_ids[0], skip_special_tokens=True).strip()
        if not summary:
            raise SummarizationError("Model returned an empty summary.")
        return summary

    @staticmethod
    def _chunk_text(text: str, tokenizer, max_tokens: int) -> list[str]:
        words = text.split()
        chunks: list[str] = []
        current: list[str] = []

        for word in words:
            current.append(word)
            token_count = len(tokenizer.encode(" ".join(current)))
            if token_count >= max_tokens:
                chunks.append(" ".join(current))
                current = []

        if current:
            chunks.append(" ".join(current))

        return chunks or [text]


summarization_service = SummarizationService()
