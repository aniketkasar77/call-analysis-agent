import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from src.config import Settings, get_settings


class LocalStorageClient:
    """Local filesystem storage for call data and insights."""

    PREFIX_RAW = "calls/raw"
    PREFIX_TRANSCRIPTS = "calls/transcripts"
    PREFIX_ANALYSIS = "calls/analysis"
    PREFIX_INSIGHTS = "insights"

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self.root = Path(self.settings.storage_path)
        self.root.mkdir(parents=True, exist_ok=True)

    def _path(self, key: str) -> Path:
        path = self.root / key
        path.parent.mkdir(parents=True, exist_ok=True)
        return path

    def upload_bytes(self, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
        self._path(key).write_bytes(data)
        return key

    def upload_json(self, key: str, payload: Dict[str, Any]) -> str:
        return self.upload_bytes(key, json.dumps(payload, default=str).encode("utf-8"), "application/json")

    def download_bytes(self, key: str) -> bytes:
        return self._path(key).read_bytes()

    def download_json(self, key: str) -> Dict[str, Any]:
        return json.loads(self.download_bytes(key).decode("utf-8"))

    def exists(self, key: str) -> bool:
        return self._path(key).exists()

    def list_keys(self, prefix: str) -> List[str]:
        base = self.root / prefix
        if not base.exists():
            return []
        keys: List[str] = []
        for path in base.rglob("*"):
            if path.is_file():
                keys.append(str(path.relative_to(self.root)))
        return keys

    def upload_raw_audio(self, call_id: str, data: bytes, extension: str = "wav") -> str:
        key = f"{self.PREFIX_RAW}/{call_id}.{extension}"
        return self.upload_bytes(key, data)

    def save_transcript(self, call_id: str, transcript: Dict[str, Any]) -> str:
        return self.upload_json(f"{self.PREFIX_TRANSCRIPTS}/{call_id}.json", transcript)

    def save_analysis(self, call_id: str, analysis: Dict[str, Any]) -> str:
        return self.upload_json(f"{self.PREFIX_ANALYSIS}/{call_id}.json", analysis)

    def get_transcript(self, call_id: str) -> Optional[Dict[str, Any]]:
        key = f"{self.PREFIX_TRANSCRIPTS}/{call_id}.json"
        return self.download_json(key) if self.exists(key) else None

    def get_analysis(self, call_id: str) -> Optional[Dict[str, Any]]:
        key = f"{self.PREFIX_ANALYSIS}/{call_id}.json"
        return self.download_json(key) if self.exists(key) else None

    def list_raw_calls(self) -> List[str]:
        keys = self.list_keys(f"{self.PREFIX_RAW}/")
        return [k.split("/")[-1].rsplit(".", 1)[0] for k in keys if not k.endswith("/")]

    def get_raw_audio_key(self, call_id: str) -> Optional[str]:
        matches = [k for k in self.list_keys(f"{self.PREFIX_RAW}/") if k.split("/")[-1].startswith(f"{call_id}.")]
        return matches[0] if matches else None

    def list_analyses_since(self, days: int) -> List[Dict[str, Any]]:
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)
        analyses: List[Dict[str, Any]] = []
        for key in self.list_keys(f"{self.PREFIX_ANALYSIS}/"):
            if key.endswith("/"):
                continue
            data = self.download_json(key)
            created = data.get("created_at")
            if created:
                created_dt = datetime.fromisoformat(str(created).replace("Z", "+00:00"))
                if created_dt.tzinfo is None:
                    created_dt = created_dt.replace(tzinfo=timezone.utc)
                if created_dt < cutoff:
                    continue
            analyses.append(data)
        return analyses

    def save_insight(self, insight_id: str, insight: Dict[str, Any]) -> str:
        return self.upload_json(f"{self.PREFIX_INSIGHTS}/{insight_id}.json", insight)

    def get_insight(self, insight_id: str) -> Optional[Dict[str, Any]]:
        key = f"{self.PREFIX_INSIGHTS}/{insight_id}.json"
        return self.download_json(key) if self.exists(key) else None

    def get_insight_index(self) -> Dict[str, Any]:
        key = f"{self.PREFIX_INSIGHTS}/index.json"
        if not self.exists(key):
            return {"insights": [], "updated_at": datetime.now(timezone.utc).isoformat()}
        return self.download_json(key)

    def update_insight_index(self, entries: List[Dict[str, Any]]) -> str:
        return self.upload_json(
            f"{self.PREFIX_INSIGHTS}/index.json",
            {"insights": entries, "updated_at": datetime.now(timezone.utc).isoformat()},
        )

    def list_all_insights(self) -> List[Dict[str, Any]]:
        insights: List[Dict[str, Any]] = []
        for key in self.list_keys(f"{self.PREFIX_INSIGHTS}/"):
            if key.endswith("index.json") or key.endswith("/"):
                continue
            insights.append(self.download_json(key))
        return insights
