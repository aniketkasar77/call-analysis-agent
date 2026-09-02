import logging
import queue
import threading
from typing import Optional

from src.agents.graph import run_batch_pipeline, run_per_call_pipeline
from src.storage import get_storage

logger = logging.getLogger(__name__)

_pipeline_queue: queue.Queue[tuple[str, Optional[str]]] = queue.Queue()
_worker_lock = threading.Lock()
_worker_started = False


def _persist_pipeline_errors(call_id: str, errors: list[str]) -> None:
    if not errors:
        return
    get_storage().save_pipeline_error(call_id, errors)


def _worker() -> None:
    while True:
        job_type, payload = _pipeline_queue.get()
        try:
            if job_type == "batch":
                result = run_batch_pipeline()
                errors = result.get("errors") or []
                if errors:
                    logger.warning("Batch pipeline errors: %s", errors)
            else:
                call_id, audio_path = job_type, payload
                result = run_per_call_pipeline(call_id, audio_path or "")
                errors = result.get("errors") or []
                if errors:
                    _persist_pipeline_errors(call_id, errors)
                    logger.warning("Call %s pipeline errors: %s", call_id, errors)
                elif get_storage().get_pipeline_error(call_id):
                    get_storage().clear_pipeline_error(call_id)
        except Exception:
            logger.exception("Pipeline job failed: %s", job_type)
            if job_type != "batch" and payload:
                _persist_pipeline_errors(payload, ["Pipeline failed unexpectedly. Check server logs."])
        finally:
            _pipeline_queue.task_done()


def _ensure_worker() -> None:
    global _worker_started
    with _worker_lock:
        if _worker_started:
            return
        thread = threading.Thread(target=_worker, name="pipeline-worker", daemon=True)
        thread.start()
        _worker_started = True


def enqueue_per_call_pipeline(call_id: str, audio_path: str) -> None:
    _ensure_worker()
    _pipeline_queue.put((call_id, audio_path))


def enqueue_batch_pipeline() -> None:
    _ensure_worker()
    _pipeline_queue.put(("batch", None))
