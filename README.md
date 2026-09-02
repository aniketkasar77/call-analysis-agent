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
```

Open **http://localhost:3000** for the dashboard.

## Workflow

1. Click **Add Recordings** on the dashboard to upload one or many call audio files
2. Wait for calls to show status **Ready** on the Recordings page
3. Click **Find Recurring Issues** once you have at least 5 similar reviewed calls
4. View recurring issues, trends, and recommended actions on the dashboard

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/calls/upload` | Upload single audio file |
| POST | `/calls/upload/batch` | Upload multiple audio files |
| POST | `/pipeline/run/{call_id}` | Re-process single call |
| POST | `/pipeline/aggregate` | Find recurring issues across calls |
| GET | `/insights` | List surfaced issues |
| GET | `/insights/{id}` | Issue detail |
| GET | `/calls` | List processed calls |
| GET | `/health` | Health check |

## Dashboard

Next.js + shadcn/ui + Tailwind dashboard in `dashboard/`:

- **Dashboard** — KPI cards, trend charts, top issues, recent activity
- **Your Recordings** — upload status per call (plain-language labels)
- **Recurring Issues** — detected patterns with priority and match strength

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
