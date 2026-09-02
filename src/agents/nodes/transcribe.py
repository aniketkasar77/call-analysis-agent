from src.agents.state import PipelineState
from src.services.transcription import TranscriptionService
from src.storage import get_storage


def transcribe_node(state: PipelineState) -> PipelineState:
    storage = get_storage()
    errors = list(state.get("errors", []))
    call_id = state.get("call_id", "")

    existing = storage.get_transcript(call_id)
    if existing:
        return {**state, "transcript": existing, "errors": errors}

    audio_path = state.get("audio_path")
    if not audio_path:
        errors.append("transcribe: missing audio path")
        return {**state, "errors": errors}

    try:
        audio_bytes = storage.download_bytes(audio_path)
        extension = audio_path.rsplit(".", 1)[-1]
        transcript = TranscriptionService().transcribe(audio_bytes, call_id, extension)
        transcript_dict = transcript.model_dump(mode="json")
        storage.save_transcript(call_id, transcript_dict)
        return {**state, "transcript": transcript_dict, "errors": errors}
    except Exception as exc:
        errors.append(f"transcribe: {exc}")
        return {**state, "errors": errors}
