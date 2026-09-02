import pytest

from src.agents.nodes.rank_insights import rank_insights_node
from src.models.schemas import CallAnalysis, CallCategory, InsightCluster, Sentiment, Trend
from src.services.clustering import cluster_analyses, cosine_similarity


def _analysis(call_id, reason, hypothesis, severity=4):
    return CallAnalysis(
        call_id=call_id,
        primary_reason=reason,
        category=CallCategory.SHIPPING,
        sentiment=Sentiment.NEGATIVE,
        severity=severity,
        upstream_issue_hypothesis=hypothesis,
    )


def test_cosine_similarity_identical():
    assert cosine_similarity([1.0, 0.0], [1.0, 0.0]) == pytest.approx(1.0)


def test_cluster_groups_similar_analyses():
    analyses = [
        _analysis("c1", "Damaged package", "Packaging insufficient"),
        _analysis("c2", "Box crushed", "Packaging insufficient"),
        _analysis("c3", "Billing error", "CRM sync broken"),
    ]
    embeddings = {"c1": [1.0, 0.0], "c2": [0.99, 0.01], "c3": [0.0, 1.0]}
    clusters = cluster_analyses(analyses, embeddings, similarity_threshold=0.9)
    assert len(clusters) == 2


def test_rank_rejects_small_clusters():
    state = {
        "candidate_clusters": [InsightCluster(
            cluster_id="a", theme="Small", call_ids=["1", "2"], frequency=2,
            avg_severity=5.0, trend=Trend.UP, avg_coherence=0.9,
        ).model_dump(mode="json")],
        "errors": [],
    }
    assert rank_insights_node(state)["candidate_clusters"] == []


def test_rank_accepts_large_cluster():
    state = {
        "candidate_clusters": [InsightCluster(
            cluster_id="b", theme="Large", call_ids=["1", "2", "3", "4", "5"], frequency=5,
            avg_severity=4.0, trend=Trend.FLAT, avg_coherence=0.9,
        ).model_dump(mode="json")],
        "errors": [],
    }
    assert len(rank_insights_node(state)["candidate_clusters"]) == 1
