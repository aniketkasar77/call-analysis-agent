from src.agents.state import PipelineState
from src.config import get_settings
from src.models.schemas import InsightCluster, Trend


def rank_insights_node(state: PipelineState) -> PipelineState:
    settings = get_settings()
    raw_clusters = state.get("candidate_clusters", [])
    max_frequency = max((c.get("frequency", 0) for c in raw_clusters), default=0)
    ranked = []
    for raw in raw_clusters:
        cluster = InsightCluster.model_validate(raw)
        if cluster.frequency < settings.min_cluster_size:
            continue
        if cluster.avg_coherence < settings.cluster_similarity_threshold:
            continue
        if cluster.avg_severity < settings.min_severity and cluster.trend != Trend.UP:
            continue
        ranked.append(cluster.model_dump(mode="json"))
    stats = {
        "clusters_detected": len(raw_clusters),
        "max_cluster_size": max_frequency,
        "clusters_qualified": len(ranked),
        "min_cluster_size": settings.min_cluster_size,
    }
    return {
        **state,
        "candidate_clusters": ranked,
        "aggregation_stats": stats,
        "errors": list(state.get("errors", [])),
    }
