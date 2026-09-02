from src.agents.state import PipelineState
from src.storage import get_storage


def orchestrator_node(state: PipelineState) -> PipelineState:
    storage = get_storage()
    errors = list(state.get("errors", []))

    if state.get("mode") == "batch":
        return {**state, "batch_analyses": storage.list_analyses_since(days=7), "errors": errors}

    call_id = state.get("call_id", "")
    if not call_id:
        errors.append("orchestrator: call_id required")
        return {**state, "errors": errors}

    if storage.get_analysis(call_id):
        return {**state, "analysis": storage.get_analysis(call_id), "errors": errors}

    audio_path = state.get("audio_path") or storage.get_raw_audio_key(call_id)
    if not audio_path:
        errors.append(f"orchestrator: no audio for {call_id}")
        return {**state, "errors": errors}

    return {**state, "audio_path": audio_path, "errors": errors}
