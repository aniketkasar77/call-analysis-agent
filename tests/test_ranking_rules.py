from src.agents.nodes.rank_insights import rank_insights_node
from src.models.schemas import InsightCluster, Trend


def test_rank_rejects_low_severity_flat_trend():
    state = {
        "candidate_clusters": [InsightCluster(
            cluster_id="low", theme="Minor", call_ids=["1", "2", "3", "4", "5"], frequency=5,
            avg_severity=2.0, trend=Trend.FLAT, avg_coherence=0.9,
        ).model_dump(mode="json")],
        "errors": [],
    }
    assert rank_insights_node(state)["candidate_clusters"] == []


def test_rank_accepts_low_severity_with_upward_trend():
    state = {
        "candidate_clusters": [InsightCluster(
            cluster_id="rising", theme="Emerging", call_ids=["1", "2", "3", "4", "5"], frequency=5,
            avg_severity=2.0, trend=Trend.UP, avg_coherence=0.9,
        ).model_dump(mode="json")],
        "errors": [],
    }
    assert len(rank_insights_node(state)["candidate_clusters"]) == 1
