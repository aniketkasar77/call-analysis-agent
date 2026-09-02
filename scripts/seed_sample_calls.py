#!/usr/bin/env python3
"""Seed sample call analyses for demo without real audio."""

import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.models.schemas import CallAnalysis, CallCategory, Sentiment
from src.storage import get_storage

SAMPLE_THEMES = [
    {"primary_reason": "Package arrived damaged", "upstream": "Insufficient protective packaging for fragile products", "category": CallCategory.SHIPPING, "severity": 4},
    {"primary_reason": "Wrong item shipped", "upstream": "Warehouse pick-and-pack errors during peak volume", "category": CallCategory.SHIPPING, "severity": 4},
    {"primary_reason": "Delivery delayed", "upstream": "Carrier SLA breaches not flagged proactively", "category": CallCategory.SHIPPING, "severity": 3},
    {"primary_reason": "Charged after cancellation", "upstream": "Billing system not syncing CRM cancellations", "category": CallCategory.BILLING, "severity": 5},
    {"primary_reason": "Refund not received", "upstream": "Refund processing queue backlog", "category": CallCategory.BILLING, "severity": 4},
    {"primary_reason": "Product caused irritation", "upstream": "Ingredient labeling unclear for sensitive skin", "category": CallCategory.PRODUCT, "severity": 4},
]


def seed_analyses(count_per_theme: int = 6):
    storage = get_storage()
    now = datetime.now(timezone.utc)
    created = 0
    for i, theme in enumerate(SAMPLE_THEMES):
        for j in range(count_per_theme):
            call_id = f"seed-{i}-{j}-{uuid.uuid4().hex[:8]}"
            analysis = CallAnalysis(
                call_id=call_id,
                primary_reason=theme["primary_reason"],
                secondary_reasons=["Customer frustrated"],
                category=theme["category"],
                sentiment=Sentiment.FRUSTRATED if theme["severity"] >= 4 else Sentiment.NEGATIVE,
                severity=theme["severity"],
                product_mentions=["Vitamin C Serum"],
                is_repeat_caller_signal=j % 3 == 0,
                upstream_issue_hypothesis=theme["upstream"],
                created_at=now - timedelta(days=j % 5, hours=j),
            )
            storage.save_analysis(call_id, analysis.model_dump(mode="json"))
            storage.save_transcript(call_id, {
                "call_id": call_id,
                "full_text": f"Customer called about {theme['primary_reason'].lower()}.",
                "speaker_turns": [],
                "duration_sec": 180.0,
                "created_at": analysis.created_at.isoformat(),
            })
            created += 1
    print(f"Seeded {created} sample analyses across {len(SAMPLE_THEMES)} themes")


if __name__ == "__main__":
    seed_analyses()
