"""
Retrieval-Augmented Generation (RAG) chatbot service.

Pipeline:
1. Embed the student's query.
2. Retrieve the most relevant chunks from ChromaDB.
3. Build a grounded prompt from the retrieved context.
4. Generate an answer with FLAN-T5 (reusing the summarization model/tokenizer,
   since FLAN-T5 is a general instruction-following seq2seq model).
"""
import logging

import torch

from app.ai.summarization_model import get_summarization_model
from app.core.config import settings
from app.core.exceptions import ChatbotError
from app.services.embedding_service import embedding_service
from app.services.vector_store_service import vector_store_service

logger = logging.getLogger(__name__)

RAG_PROMPT_TEMPLATE = (
    "Answer the question using only the context below. "
    "If the answer is not contained in the context, say you don't have enough information.\n\n"
    "Context:\n{context}\n\nQuestion: {question}\nAnswer:"
)

NO_CONTEXT_MESSAGE = (
    "I couldn't find any relevant material in the uploaded course documents to answer that question. "
    "Try rephrasing, or ask your instructor to upload related notes."
)


class ChatbotService:
    def answer(self, query: str, subject_id: str | None = None, top_k: int | None = None) -> dict:
        try:
            top_k = top_k or settings.RAG_TOP_K

            query_embedding = embedding_service.embed_query(query)
            matches = vector_store_service.query(query_embedding, top_k=top_k, subject_id=subject_id)

            if not matches:
                return {"answer": NO_CONTEXT_MESSAGE, "sources": []}

            context = "\n---\n".join(m["text"] for m in matches)
            answer = self._generate_answer(query, context)

            sources = [
                {
                    "document_id": m["document_id"],
                    "filename": m["filename"],
                    "chunk_index": m["chunk_index"],
                    "text": m["text"],
                    "score": m["score"],
                }
                for m in matches
            ]
            return {"answer": answer, "sources": sources}

        except Exception as exc:  # noqa: BLE001
            logger.exception("Chatbot pipeline failed")
            raise ChatbotError(f"Failed to generate an answer: {exc}") from exc

    def _generate_answer(self, question: str, context: str) -> str:
        tokenizer, model = get_summarization_model()
        device = next(model.parameters()).device

        prompt = RAG_PROMPT_TEMPLATE.format(context=context, question=question)
        inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=1024).to(device)

        with torch.no_grad():
            output_ids = model.generate(
                **inputs,
                max_length=200,
                min_length=10,
                num_beams=4,
                early_stopping=True,
            )

        answer = tokenizer.decode(output_ids[0], skip_special_tokens=True).strip()
        return answer or "I don't have enough information to answer that confidently."


chatbot_service = ChatbotService()
