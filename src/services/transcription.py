import tempfile
from pathlib import Path

from faster_whisper import WhisperModel

from src.config import Settings, get_settings
from src.models.schemas import SpeakerTurn, Transcript


class TranscriptionService:
    def __init__(self, settings: Settings = None):
        self.settings = settings or get_settings()
        self._model = None

    @property
    def model(self) -> WhisperModel:
        if self._model is None:
            self._model = WhisperModel(self.settings.whisper_model, device="cpu", compute_type="int8")
        return self._model

    def transcribe(self, audio_bytes: bytes, call_id: str, extension: str = "wav") -> Transcript:
        with tempfile.NamedTemporaryFile(suffix=f".{extension}", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = Path(tmp.name)

        try:
            segments, info = self.model.transcribe(str(tmp_path), vad_filter=True)
            turns = []
            parts = []
            for segment in segments:
                text = segment.text.strip()
                if not text:
                    continue
                turns.append(SpeakerTurn(speaker="unknown", text=text, start_sec=segment.start, end_sec=segment.end))
                parts.append(text)
            return Transcript(
                call_id=call_id,
                full_text=" ".join(parts),
                speaker_turns=turns,
                duration_sec=info.duration,
            )
        finally:
            tmp_path.unlink(missing_ok=True)
