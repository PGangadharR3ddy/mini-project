from unittest.mock import Mock

from ml_service.transcriber import LegalTranscriber


def test_transcriber_returns_segments_and_passes_translation_options(tmp_path):
    audio_path = tmp_path / "lecture.mp3"
    audio_path.write_bytes(b"audio")
    model = Mock()
    model.transcribe.return_value = {
        "text": "Bonjour.",
        "language": "fr",
        "segments": [{"start": 0.0, "end": 1.25, "text": " Bonjour."}],
    }

    result = LegalTranscriber(model_size="tiny", model=model).transcribe(
        str(audio_path),
        language="fr",
        translate_to_english=True,
    )

    assert result.full_text == "Bonjour."
    assert result.language == "fr"
    assert result.duration == 1.25
    assert result.segments[0].text == "Bonjour."
    model.transcribe.assert_called_once_with(
        str(audio_path),
        word_timestamps=False,
        verbose=False,
        language="fr",
        task="translate",
    )
