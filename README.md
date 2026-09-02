# Call Analyse Agent

Multi-agent customer support call analysis using **LangGraph** and **Gemini**. Ingests audio, transcribes with Whisper, analyzes calls, clusters recurring issues, and surfaces actionable insights.

All data is stored locally under `./data/`.

## Quick Start

```bash
cp .env.example .env
# Set GOOGLE_API_KEY

pip3 install -r requirements.txt

# Terminal 1 — API
uvicorn src.api.main:app --reload --port 8000

# Terminal 2 — Dashboard
cd dashboard && npm install && npm run dev

# Seed demo data and run aggregation
python3 scripts/seed_sample_calls.py
python3 scripts/run_batch.py --aggregate
```

Open **http://localhost:3000** for the dashboard.

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/calls/upload` | Upload audio, trigger pipeline |
| POST | `/pipeline/run/{call_id}` | Process single call |
| POST | `/pipeline/aggregate` | Run pattern detection |
| GET | `/insights` | List surfaced insights |
| GET | `/insights/{id}` | Insight detail |
| GET | `/calls` | List processed calls |
| GET | `/health` | Health check |

## Dashboard

Next.js + shadcn/ui + Tailwind dashboard in `dashboard/`:

- **Insights** — surfaced upstream issues with severity, trend, confidence
- **Calls** — per-call status, search, retry analysis
- **Upload** — drag-and-drop audio upload
- **Insight Detail** — summary, recommended fix, supporting calls

Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in `dashboard/.env.local` if needed.

## Local Storage Layout

```
data/
├── calls/raw/          # uploaded audio
├── calls/transcripts/  # transcript JSON
├── calls/analysis/     # per-call analysis
└── insights/           # surfaced insights + index.json
```

See [DESIGN.md](DESIGN.md) for architecture details.

## Testing

```bash
pytest
```
