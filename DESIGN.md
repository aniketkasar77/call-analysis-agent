# Call Analysis Multi-Agent System — Design Note

## 1. Overall Approach

A D2C brand handling thousands of support calls per week needs to identify **recurring upstream issues** — product defects, packaging failures, billing bugs — rather than treating each call in isolation. This system implements a batch analysis pipeline that:

1. Ingests call audio into local storage (`./data/`)
2. Transcribes calls via Whisper (zero STT API cost)
3. Analyzes each call with Gemini for structured extraction
4. Clusters similar issues across a rolling time window
5. Surfaces only high-confidence, actionable insights

**Why this approach:** Batch processing over local files is simple to run and debug. LangGraph provides explicit orchestration with clear agent boundaries. Gemini handles reasoning; Whisper handles transcription cheaply.

## 2. Agent Design

| Agent | Responsibility | Why Separate |
|-------|---------------|--------------|
| **Orchestrator** | Route work, check idempotency | Central coordination |
| **Transcription** | Audio → text via Whisper | Compute-heavy, swappable STT |
| **Call Analysis** | Structured per-call extraction | Highest-value LLM step |
| **Pattern Detection** | Embed + cluster + trend | Algorithmic, tunable thresholds |
| **Insight Synthesis** | Rank + synthesize recommendations | Rules + LLM judgment |

## 3. Data Flow

**Per-call:** Upload → `data/calls/raw/` → orchestrator → transcribe → analyze

**Batch:** Load 7-day analyses → embed → cluster → rank → synthesize → `data/insights/`

## 4. Insight Surfacing Criteria

- Min frequency: ≥ 5 calls
- Cluster coherence: similarity ≥ 0.82
- Severity gate: avg ≥ 3 OR trend increasing
- Novelty: not surfaced in 14 days unless frequency grew 50%+

## 5. Assumptions & Open Questions

**Assumptions:** English calls, WAV/MP3 input, local filesystem storage, no PII redaction in v1.

**Open questions:** Real-time alerting? Human feedback loop? CRM metadata integration?

## 6. Tech Stack

LangGraph · Gemini · faster-whisper · Local filesystem · FastAPI · Next.js

## 7. Dashboard UX

The dashboard uses plain business language (e.g. "Find Recurring Issues" instead of "Run Aggregation", priority labels instead of raw severity scores). Users upload multiple recordings from the main dashboard and view trend charts for calls reviewed and issues found over time.
