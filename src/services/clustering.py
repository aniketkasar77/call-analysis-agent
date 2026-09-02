import uuid
from typing import Dict, List

import numpy as np

from src.models.schemas import CallAnalysis, InsightCluster, Trend


def cosine_similarity(a: List[float], b: List[float]) -> float:
    va = np.array(a, dtype=float)
    vb = np.array(b, dtype=float)
    denom = np.linalg.norm(va) * np.linalg.norm(vb)
    return float(np.dot(va, vb) / denom) if denom else 0.0


def embed_texts(embed_fn, analyses: List[CallAnalysis]) -> Dict[str, List[float]]:
    texts = [f"{a.primary_reason}. {a.upstream_issue_hypothesis}" for a in analyses]
    vectors = embed_fn(texts)
    return {a.call_id: vec for a, vec in zip(analyses, vectors)}


def _avg_intra_cluster_similarity(call_ids: List[str], embeddings: Dict[str, List[float]]) -> float:
    if len(call_ids) < 2:
        return 1.0
    sims = []
    for i, cid_a in enumerate(call_ids):
        for cid_b in call_ids[i + 1 :]:
            sims.append(cosine_similarity(embeddings[cid_a], embeddings[cid_b]))
    return float(np.mean(sims)) if sims else 1.0


def cluster_analyses(
    analyses: List[CallAnalysis],
    embeddings: Dict[str, List[float]],
    similarity_threshold: float = 0.82,
) -> List[InsightCluster]:
    if not analyses:
        return []

    unassigned = {a.call_id for a in analyses}
    analysis_map = {a.call_id: a for a in analyses}
    clusters: List[InsightCluster] = []

    while unassigned:
        seed_id = next(iter(unassigned))
        seed_vec = embeddings[seed_id]
        members = [cid for cid in list(unassigned) if cosine_similarity(seed_vec, embeddings[cid]) >= similarity_threshold]
        for cid in members:
            unassigned.discard(cid)

        clusters.append(
            InsightCluster(
                cluster_id=str(uuid.uuid4()),
                theme=analysis_map[seed_id].upstream_issue_hypothesis,
                call_ids=members,
                frequency=len(members),
                avg_severity=float(np.mean([analysis_map[c].severity for c in members])),
                trend=Trend.FLAT,
                avg_coherence=_avg_intra_cluster_similarity(members, embeddings),
            )
        )
    return clusters


def compute_trends(
    current: List[CallAnalysis],
    prior: List[CallAnalysis],
    embeddings: Dict[str, List[float]],
    similarity_threshold: float = 0.82,
) -> Dict[str, Trend]:
    if not current:
        return {}

    current_clusters = cluster_analyses(current, embeddings, similarity_threshold)
    prior_embeddings = {a.call_id: embeddings[a.call_id] for a in prior if a.call_id in embeddings}
    prior_clusters = cluster_analyses(prior, prior_embeddings, similarity_threshold) if prior else []
    trends: Dict[str, Trend] = {}

    for cluster in current_clusters:
        best_prior_freq = 0
        for prior_cluster in prior_clusters:
            sim = cosine_similarity(embeddings[cluster.call_ids[0]], embeddings[prior_cluster.call_ids[0]])
            if sim >= similarity_threshold:
                best_prior_freq = max(best_prior_freq, prior_cluster.frequency)

        if cluster.frequency > best_prior_freq * 1.2:
            trends[cluster.cluster_id] = Trend.UP
        elif cluster.frequency < best_prior_freq * 0.8:
            trends[cluster.cluster_id] = Trend.DOWN
        else:
            trends[cluster.cluster_id] = Trend.FLAT
    return trends
