from datetime import datetime, timedelta, timezone

from src.agents.state import PipelineState
from src.config import get_settings
from src.models.schemas import CallAnalysis
from src.services.clustering import cluster_analyses, compute_trends, embed_texts
from src.services.gemini import GeminiService
from src.services.gemini_errors import format_gemini_error
from src.storage import get_storage


def detect_patterns_node(state: PipelineState) -> PipelineState:
    settings = get_settings()
    storage = get_storage()
    errors = list(state.get("errors", []))

    try:
        current_raw = storage.list_analyses_since(settings.analysis_window_days)
        window_start = datetime.now(timezone.utc) - timedelta(days=settings.analysis_window_days)
        prior_raw = []
        for analysis in storage.list_analyses_since(settings.analysis_window_days * 2):
            created = datetime.fromisoformat(str(analysis["created_at"]).replace("Z", "+00:00"))
            if created.tzinfo is None:
                created = created.replace(tzinfo=timezone.utc)
            if created < window_start:
                prior_raw.append(analysis)

        current = [CallAnalysis.model_validate(a) for a in current_raw]
        prior = [CallAnalysis.model_validate(a) for a in prior_raw]
        if not current:
            return {**state, "candidate_clusters": [], "errors": errors}

        gemini = GeminiService()
        all_analyses = current + prior
        embeddings = embed_texts(gemini.embed_texts, all_analyses)
        current_embeddings = {a.call_id: embeddings[a.call_id] for a in current}
        clusters = cluster_analyses(current, current_embeddings, settings.cluster_similarity_threshold)
        trends = compute_trends(
            current,
            prior,
            {**current_embeddings, **{a.call_id: embeddings[a.call_id] for a in prior if a.call_id in embeddings}},
            settings.cluster_similarity_threshold,
        )

        cluster_dicts = []
        for cluster in clusters:
            data = cluster.model_dump(mode="json")
            data["trend"] = trends.get(cluster.cluster_id, cluster.trend).value
            cluster_dicts.append(data)
        return {**state, "candidate_clusters": cluster_dicts, "errors": errors}
    except Exception as exc:
        errors.append(f"detect_patterns: {format_gemini_error(exc)}")
        return {**state, "candidate_clusters": [], "errors": errors}
