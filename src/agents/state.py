from typing import Dict, List, Optional, TypedDict


class PipelineState(TypedDict, total=False):
    mode: str
    call_id: str
    audio_path: str
    transcript: Optional[dict]
    analysis: Optional[dict]
    batch_analyses: List[dict]
    candidate_clusters: List[dict]
    surfaced_insights: List[dict]
    aggregation_stats: dict
    errors: List[str]
