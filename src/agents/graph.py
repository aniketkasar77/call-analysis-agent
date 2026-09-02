from langgraph.graph import END, StateGraph

from src.agents.nodes.analyze_call import analyze_call_node
from src.agents.nodes.detect_patterns import detect_patterns_node
from src.agents.nodes.orchestrator import orchestrator_node
from src.agents.nodes.rank_insights import rank_insights_node
from src.agents.nodes.synthesize_insight import synthesize_insight_node
from src.agents.nodes.transcribe import transcribe_node
from src.agents.state import PipelineState


def _route_after_orchestrator(state: PipelineState) -> str:
    if state.get("errors"):
        return "end"
    if state.get("analysis"):
        return "end"
    return "transcribe"


def _route_after_transcribe(state: PipelineState) -> str:
    if state.get("errors") or not state.get("transcript"):
        return "end"
    return "analyze"


def build_per_call_graph():
    graph = StateGraph(PipelineState)
    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("transcribe", transcribe_node)
    graph.add_node("analyze", analyze_call_node)
    graph.set_entry_point("orchestrator")
    graph.add_conditional_edges("orchestrator", _route_after_orchestrator, {"transcribe": "transcribe", "end": END})
    graph.add_conditional_edges("transcribe", _route_after_transcribe, {"analyze": "analyze", "end": END})
    graph.add_edge("analyze", END)
    return graph.compile()


def build_batch_graph():
    graph = StateGraph(PipelineState)
    graph.add_node("orchestrator", orchestrator_node)
    graph.add_node("detect_patterns", detect_patterns_node)
    graph.add_node("rank_insights", rank_insights_node)
    graph.add_node("synthesize", synthesize_insight_node)
    graph.set_entry_point("orchestrator")
    graph.add_edge("orchestrator", "detect_patterns")
    graph.add_edge("detect_patterns", "rank_insights")
    graph.add_edge("rank_insights", "synthesize")
    graph.add_edge("synthesize", END)
    return graph.compile()


def run_per_call_pipeline(call_id: str, audio_path: str = None) -> dict:
    app = build_per_call_graph()
    return app.invoke({
        "mode": "per_call",
        "call_id": call_id,
        "audio_path": audio_path or "",
        "errors": [],
    })


def run_batch_pipeline() -> dict:
    app = build_batch_graph()
    return app.invoke({"mode": "batch", "errors": []})
