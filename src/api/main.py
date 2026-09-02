import uuid
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from src.agents.graph import run_batch_pipeline, run_per_call_pipeline
from src.storage import get_storage

app = FastAPI(title="Call Analysis Agent", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/calls/upload")
async def upload_call(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    call_id = str(uuid.uuid4())
    extension = Path(file.filename or "audio.wav").suffix.lstrip(".") or "wav"
    data = await file.read()
    storage = get_storage()
    audio_path = storage.upload_raw_audio(call_id, data, extension)
    background_tasks.add_task(run_per_call_pipeline, call_id, audio_path)
    return {"call_id": call_id, "audio_path": audio_path, "status": "processing"}


@app.post("/pipeline/run/{call_id}")
def run_pipeline(call_id: str):
    storage = get_storage()
    audio_path = storage.get_raw_audio_key(call_id)
    if not audio_path:
        raise HTTPException(status_code=404, detail=f"No raw audio for call {call_id}")
    return run_per_call_pipeline(call_id, audio_path)


@app.post("/pipeline/aggregate")
def aggregate():
    return run_batch_pipeline()


@app.get("/insights")
def list_insights():
    return get_storage().get_insight_index().get("insights", [])


@app.get("/insights/{insight_id}")
def get_insight(insight_id: str):
    storage = get_storage()
    insight = storage.get_insight(insight_id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    supporting_calls = []
    for call_id in insight.get("call_ids", []):
        supporting_calls.append({
            "call_id": call_id,
            "transcript": storage.get_transcript(call_id),
            "analysis": storage.get_analysis(call_id),
        })
    return {**insight, "supporting_calls": supporting_calls}


@app.get("/calls")
def list_calls():
    storage = get_storage()
    records = []
    for call_id in storage.list_raw_calls():
        transcript = storage.get_transcript(call_id)
        analysis = storage.get_analysis(call_id)
        if analysis:
            status = "analyzed"
        elif transcript:
            status = "transcribed"
        else:
            status = "pending"
        records.append({
            "call_id": call_id,
            "transcript": transcript,
            "analysis": analysis,
            "status": status,
        })
    return records


@app.get("/calls/{call_id}")
def get_call(call_id: str):
    storage = get_storage()
    audio_path = storage.get_raw_audio_key(call_id)
    if not audio_path:
        raise HTTPException(status_code=404, detail="Call not found")
    return {
        "call_id": call_id,
        "audio_path": audio_path,
        "transcript": storage.get_transcript(call_id),
        "analysis": storage.get_analysis(call_id),
    }
