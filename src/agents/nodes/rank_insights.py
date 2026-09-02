from src.agents.state import PipelineState
from src.config import get_settings
from src.models.schemas import InsightCluster, Trend


def rank_insights_node(state: PipelineState) -> PipelineState:
    settings = get_settings()
    ranked = []
    for raw in state.get("candidate_clusters", []):
        cluster = InsightCluster.model_validate(raw)
        if cluster.frequency < settings.min_cluster_size:
            continue
        if cluster.avg_coherence < settings.cluster_similarity_threshold:
            continue
        if cluster.avg_severity < settings.min_severity and cluster.trend != Trend.UP:
            continue
        ranked.append(cluster.model_dump(mode="json"))
    return {**state, "candidate_clusters": ranked, "errors": list(state.get("errors", []))}
