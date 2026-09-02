from datetime import datetime
from enum import Enum
from typing import List, Literal, Optional

from pydantic import BaseModel, Field


class CallCategory(str, Enum):
    PRODUCT = "product"
    SHIPPING = "shipping"
    BILLING = "billing"
    RETURNS = "returns"
    ACCOUNT = "account"
    TECHNICAL = "technical"
    OTHER = "other"


class Sentiment(str, Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    FRUSTRATED = "frustrated"


class Trend(str, Enum):
    UP = "up"
    FLAT = "flat"
    DOWN = "down"


class SpeakerTurn(BaseModel):
    speaker: str
    text: str
    start_sec: Optional[float] = None
    end_sec: Optional[float] = None


class Transcript(BaseModel):
    call_id: str
    full_text: str
    speaker_turns: List[SpeakerTurn] = Field(default_factory=list)
    duration_sec: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class CallAnalysis(BaseModel):
    call_id: str
    primary_reason: str
    secondary_reasons: List[str] = Field(default_factory=list)
    category: CallCategory
    sentiment: Sentiment
    severity: int = Field(ge=1, le=5)
    product_mentions: List[str] = Field(default_factory=list)
    is_repeat_caller_signal: bool = False
    upstream_issue_hypothesis: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class InsightCluster(BaseModel):
    cluster_id: str
    theme: str
    call_ids: List[str]
    frequency: int
    avg_severity: float
    trend: Trend
    avg_coherence: float


class Insight(BaseModel):
    insight_id: str
    title: str
    summary: str
    recommended_fix: str
    confidence: float = Field(ge=0.0, le=1.0)
    theme: str
    call_ids: List[str]
    frequency: int
    avg_severity: float
    trend: Trend
    created_at: datetime = Field(default_factory=datetime.utcnow)


class InsightIndexEntry(BaseModel):
    insight_id: str
    title: str
    frequency: int
    avg_severity: float
    trend: Trend
    confidence: float
    created_at: datetime


class InsightSynthesisOutput(BaseModel):
    title: str
    summary: str
    recommended_fix: str
    confidence: float = Field(ge=0.0, le=1.0)


class CallRecord(BaseModel):
    call_id: str
    audio_s3_key: str
    transcript: Optional[Transcript] = None
    analysis: Optional[CallAnalysis] = None
    status: Literal["pending", "transcribed", "analyzed", "error"] = "pending"
    error: Optional[str] = None
