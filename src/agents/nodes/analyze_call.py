from src.agents.state import PipelineState
from src.services.gemini import GeminiService
from src.services.gemini_errors import format_gemini_error
from src.storage import get_storage


def analyze_call_node(state: PipelineState) -> PipelineState:
    storage = get_storage()
    errors = list(state.get("errors", []))
    call_id = state.get("call_id", "")

    existing = storage.get_analysis(call_id)
    if existing:
        return {**state, "analysis": existing, "errors": errors}

    transcript = state.get("transcript")
    if not transcript:
        errors.append("analyze: missing transcript")
        return {**state, "errors": errors}

    try:
        analysis = GeminiService().analyze_call(transcript.get("full_text", ""), call_id)
        analysis_dict = analysis.model_dump(mode="json")
        storage.save_analysis(call_id, analysis_dict)
        storage.clear_pipeline_error(call_id)
        return {**state, "analysis": analysis_dict, "errors": errors}
    except Exception as exc:
        message = format_gemini_error(exc)
        errors.append(f"analyze: {message}")
        storage.save_pipeline_error(call_id, errors)
        return {**state, "errors": errors}
