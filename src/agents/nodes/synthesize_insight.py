import uuid
from datetime import datetime, timedelta, timezone

from src.agents.state import PipelineState
from src.models.schemas import Insight, InsightCluster, InsightIndexEntry
from src.services.gemini import GeminiService
from src.storage import get_storage


def _is_novel(cluster: InsightCluster, existing_insights: list) -> bool:
    cutoff = datetime.now(timezone.utc) - timedelta(days=14)
    for existing in existing_insights:
        created = datetime.fromisoformat(str(existing["created_at"]).replace("Z", "+00:00"))
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        if created < cutoff:
            continue
        if existing.get("theme") == cluster.theme:
            if cluster.frequency < existing.get("frequency", 0) * 1.5:
                return False
    return True


def synthesize_insight_node(state: PipelineState) -> PipelineState:
    storage = get_storage()
    errors = list(state.get("errors", []))
    surfaced = []

    try:
        gemini = GeminiService()
        existing = storage.list_all_insights()
        index_entries = storage.get_insight_index().get("insights", [])

        for raw in state.get("candidate_clusters", []):
            cluster = InsightCluster.model_validate(raw)
            if not _is_novel(cluster, existing):
                continue

            summaries = []
            for call_id in cluster.call_ids[:10]:
                analysis = storage.get_analysis(call_id)
                if analysis:
                    summaries.append(
                        f"{analysis['primary_reason']} (severity {analysis['severity']}): "
                        f"{analysis['upstream_issue_hypothesis']}"
                    )

            synthesis = gemini.synthesize_insight(cluster.theme, summaries)
            insight = Insight(
                insight_id=str(uuid.uuid4()),
                title=synthesis.title,
                summary=synthesis.summary,
                recommended_fix=synthesis.recommended_fix,
                confidence=synthesis.confidence,
                theme=cluster.theme,
                call_ids=cluster.call_ids,
                frequency=cluster.frequency,
                avg_severity=cluster.avg_severity,
                trend=cluster.trend,
            )
            insight_dict = insight.model_dump(mode="json")
            storage.save_insight(insight.insight_id, insight_dict)
            surfaced.append(insight_dict)
            index_entries.append(
                InsightIndexEntry(
                    insight_id=insight.insight_id,
                    title=insight.title,
                    frequency=insight.frequency,
                    avg_severity=insight.avg_severity,
                    trend=insight.trend,
                    confidence=insight.confidence,
                    created_at=insight.created_at,
                ).model_dump(mode="json")
            )

        storage.update_insight_index(index_entries)
        return {**state, "surfaced_insights": surfaced, "errors": errors}
    except Exception as exc:
        errors.append(f"synthesize: {exc}")
        return {**state, "surfaced_insights": surfaced, "errors": errors}
