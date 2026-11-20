from app.services.summarization_service import SummarizationService
from app.core.config import settings


class FakeInputs(dict):
    def to(self, device):
        return self


class FakeTokenizer:
    def __call__(self, prompt, **kwargs):
        return FakeInputs(input_ids=[[1, 2, 3]])

    def encode(self, text, add_special_tokens=False):
        return text.split()

    def decode(self, output, skip_special_tokens=False):
        return "A short summary."


class FakeModel:
    def generate(self, **kwargs):
        self.generation_options = kwargs
        return [[1, 2, 3]]


def test_short_transcript_is_not_forced_to_default_minimum_length(monkeypatch):
    monkeypatch.setattr(settings, "SUMMARY_MIN_LENGTH", 40)
    monkeypatch.setattr(settings, "SUMMARY_MAX_LENGTH", 220)
    service = SummarizationService()
    tokenizer = FakeTokenizer()
    short_model = FakeModel()

    summary = service._summarize_chunk(
        "A short lecture about binary trees.",
        tokenizer,
        short_model,
        "cpu",
    )

    assert summary == "A short summary."
    short_min_length = short_model.generation_options["min_length"]
    assert short_min_length < 40
    assert short_model.generation_options["no_repeat_ngram_size"] == 3
    assert short_model.generation_options["repetition_penalty"] == 1.2

    longer_model = FakeModel()
    service._summarize_chunk(
        " ".join(["concept"] * 90),
        tokenizer,
        longer_model,
        "cpu",
    )
    assert longer_model.generation_options["min_length"] > short_min_length
