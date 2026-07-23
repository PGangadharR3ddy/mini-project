"""
Extracts skills / keywords from free text (e.g. a student's self-description
or resume snippet) using a spaCy NLP pipeline plus a curated skill vocabulary.

Approach:
- Use a phrase matcher against a known skills vocabulary (fast, high precision).
- Fall back to noun-chunk / proper-noun extraction for terms not in the vocabulary,
  so the module still generalizes to unseen skills.
"""
import logging

from spacy.matcher import PhraseMatcher

from app.ai.spacy_model import get_spacy_model
from app.core.exceptions import SkillExtractionError

logger = logging.getLogger(__name__)

# A representative vocabulary for a Smart Classroom platform. In production this
# would likely be loaded from a database table maintained by the Spring Boot backend.
SKILL_VOCABULARY = [
    "Python", "Java", "JavaScript", "TypeScript", "C++", "C#", "React", "Angular",
    "Vue", "Node.js", "Spring Boot", "FastAPI", "Django", "Flask", "Machine Learning",
    "Deep Learning", "Data Science", "Natural Language Processing", "Computer Vision",
    "UI Design", "UX Design", "Figma", "SQL", "MongoDB", "PostgreSQL", "MySQL",
    "Docker", "Kubernetes", "AWS", "Azure", "Google Cloud", "Git", "Linux",
    "REST API", "GraphQL", "TensorFlow", "PyTorch", "HTML", "CSS", "Tailwind CSS",
    "Project Management", "Communication", "Public Speaking", "Leadership",
    "Data Structures", "Algorithms", "DevOps", "CI/CD",
]


class SkillService:
    def __init__(self) -> None:
        self._matcher: PhraseMatcher | None = None

    def _get_matcher(self) -> PhraseMatcher:
        if self._matcher is None:
            nlp = get_spacy_model()
            matcher = PhraseMatcher(nlp.vocab, attr="LOWER")
            patterns = [nlp.make_doc(skill) for skill in SKILL_VOCABULARY]
            matcher.add("SKILLS", patterns)
            self._matcher = matcher
        return self._matcher

    def extract_skills(self, text: str) -> list[str]:
        try:
            nlp = get_spacy_model()
            doc = nlp(text)
            matcher = self._get_matcher()

            found: set[str] = set()

            # 1. Vocabulary-based phrase matching (canonical casing from SKILL_VOCABULARY)
            for match_id, start, end in matcher(doc):
                span_text = doc[start:end].text
                canonical = self._canonicalize(span_text)
                found.add(canonical)

            # 2. Fallback: proper nouns / short noun chunks not already captured,
            #    to catch skills outside the curated vocabulary.
            for chunk in doc.noun_chunks:
                cleaned = chunk.text.strip()
                if 1 <= len(cleaned.split()) <= 3 and cleaned.lower() not in {f.lower() for f in found}:
                    if any(tok.pos_ in ("PROPN", "NOUN") for tok in chunk):
                        # Avoid generic/common words with a simple length heuristic
                        if cleaned[0].isupper() or cleaned.lower() in [s.lower() for s in SKILL_VOCABULARY]:
                            found.add(cleaned)

            return sorted(found)

        except Exception as exc:  # noqa: BLE001
            logger.exception("Skill extraction failed")
            raise SkillExtractionError(f"Skill extraction failed: {exc}") from exc

    @staticmethod
    def _canonicalize(matched_text: str) -> str:
        for skill in SKILL_VOCABULARY:
            if skill.lower() == matched_text.lower():
                return skill
        return matched_text


skill_service = SkillService()
