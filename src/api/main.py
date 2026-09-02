import uuid
from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from src.agents.graph import run_batch_pipeline, run_per_call_pipeline
from src.storage import get_storage

app = FastAPI(title="Call Analysis Agent", version="1.0.0")

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


async def _queue_call_upload(
    background_tasks: BackgroundTasks,
    storage,
    filename: str,
    data: bytes,
) -> dict:
    call_id = str(uuid.uuid4())
    extension = Path(filename or "audio.wav").suffix.lstrip(".") or "wav"
    audio_path = storage.upload_raw_audio(call_id, data, extension)
    background_tasks.add_task(run_per_call_pipeline, call_id, audio_path)
    return {
        "call_id": call_id,
        "filename": filename or f"{call_id}.{extension}",
        "audio_path": audio_path,
        "status": "processing",
    }


@app.post("/calls/upload")
async def upload_call(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")
    storage = get_storage()
    result = await _queue_call_upload(background_tasks, storage, file.filename or "audio.wav", data)
    return result


@app.post("/calls/upload/batch")
async def upload_calls_batch(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
):
    if not files:
        raise HTTPException(status_code=400, detail="At least one file is required")

    storage = get_storage()
    uploads = []
    for file in files:
        data = await file.read()
        if not data:
            continue
        uploads.append(
            await _queue_call_upload(background_tasks, storage, file.filename or "audio.wav", data)
        )

    if not uploads:
        raise HTTPException(status_code=400, detail="No valid files to upload")

    return {"count": len(uploads), "uploads": uploads}


@app.post("/pipeline/run/{call_id}")
def run_pipeline(call_id: str):
    storage = get_storage()
    audio_path = storage.get_raw_audio_key(call_id)
    if not audio_path:
        raise HTTPException(status_code=404, detail=f"No raw audio for call {call_id}")
    return run_per_call_pipeline(call_id, audio_path)


@app.post("/pipeline/aggregate")
def aggregate():
    storage = get_storage()
    result = run_batch_pipeline()
    analyzed_calls = sum(
        1 for call_id in storage.list_raw_calls() if storage.get_analysis(call_id)
    )
    stats = result.get("aggregation_stats") or {}
    surfaced = result.get("surfaced_insights") or []
    surfaced_count = len(surfaced)
    min_size = stats.get("min_cluster_size", 5)
    max_cluster = stats.get("max_cluster_size", 0)

    if surfaced_count > 0:
        message = f"Found {surfaced_count} recurring issue{'s' if surfaced_count != 1 else ''}."
    elif analyzed_calls < min_size:
        message = (
            f"Need at least {min_size} reviewed calls before patterns can be detected. "
            f"You have {analyzed_calls} so far."
        )
    elif max_cluster > 0:
        message = (
            f"No recurring issues surfaced. The closest pattern had {max_cluster} similar call"
            f"{'s' if max_cluster != 1 else ''} — at least {min_size} about the same issue are needed."
        )
    else:
        message = "No recurring issues surfaced. Your calls appear to cover different topics."

    return {
        "surfaced_count": surfaced_count,
        "analyzed_calls": analyzed_calls,
        "clusters_detected": stats.get("clusters_detected", 0),
        "max_cluster_size": max_cluster,
        "min_cluster_size": min_size,
        "message": message,
        "errors": result.get("errors", []),
    }


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
