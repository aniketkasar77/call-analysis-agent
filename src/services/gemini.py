import logging
import threading
import time
from contextlib import contextmanager
from typing import Callable, List, TypeVar

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings

from src.config import Settings, get_settings
from src.models.schemas import CallAnalysis, InsightSynthesisOutput
from src.services.gemini_errors import (
    GeminiServiceError,
    format_gemini_error,
    is_retryable_gemini_error,
    parse_retry_delay_seconds,
)

logger = logging.getLogger(__name__)

T = TypeVar("T")

_gemini_lock = threading.Lock()
_last_gemini_request = 0.0


@contextmanager
def _gemini_throttle(settings: Settings):
    global _last_gemini_request
    with _gemini_lock:
        elapsed = time.monotonic() - _last_gemini_request
        wait = settings.gemini_min_request_interval_seconds - elapsed
        if wait > 0:
            logger.info("Throttling Gemini request for %.1fs", wait)
            time.sleep(wait)
        yield
        _last_gemini_request = time.monotonic()


def _call_with_retry(settings: Settings, operation: str, fn: Callable[[], T]) -> T:
    last_exc: Exception | None = None
    attempts = settings.gemini_max_retries + 1

    for attempt in range(attempts):
        try:
            with _gemini_throttle(settings):
                return fn()
        except Exception as exc:
            last_exc = exc
            retryable = is_retryable_gemini_error(exc)
            if not retryable or attempt >= settings.gemini_max_retries:
                message = format_gemini_error(exc)
                raise GeminiServiceError(message, retryable=retryable) from exc

            api_delay = parse_retry_delay_seconds(exc)
            backoff = settings.gemini_retry_base_delay_seconds * (2**attempt)
            delay = max(api_delay or 0, backoff)
            logger.warning(
                "Gemini %s rate limited (attempt %s/%s), retrying in %.1fs",
                operation,
                attempt + 1,
                attempts,
                delay,
            )
            time.sleep(delay)

    message = format_gemini_error(last_exc) if last_exc else "Gemini API request failed."
    raise GeminiServiceError(message, retryable=True)


class GeminiService:
    def __init__(self, settings: Settings = None):
        self.settings = settings or get_settings()
        self.llm = ChatGoogleGenerativeAI(
            model=self.settings.gemini_model,
            google_api_key=self.settings.google_api_key,
            temperature=0.2,
            max_retries=0,
        )
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model=self.settings.embedding_model,
            google_api_key=self.settings.google_api_key,
        )

    def analyze_call(self, transcript_text: str, call_id: str) -> CallAnalysis:
        def _invoke() -> CallAnalysis:
            structured = self.llm.with_structured_output(CallAnalysis)
            prompt = (
                f"Analyze this customer support call transcript.\n\n"
                f"Call ID: {call_id}\n\nTranscript:\n{transcript_text}\n\n"
                "Identify the primary reason and any upstream operational/product issue."
            )
            return structured.invoke(prompt)

        result = _call_with_retry(self.settings, "analyze_call", _invoke)
        result.call_id = call_id
        return result

    def synthesize_insight(self, cluster_theme: str, call_summaries: List[str]) -> InsightSynthesisOutput:
        def _invoke() -> InsightSynthesisOutput:
            structured = self.llm.with_structured_output(InsightSynthesisOutput)
            summaries = "\n".join(f"- {s}" for s in call_summaries)
            prompt = (
                f"Synthesize an actionable insight from these related support calls.\n\n"
                f"Theme: {cluster_theme}\n\nSummaries:\n{summaries}"
            )
            return structured.invoke(prompt)

        return _call_with_retry(self.settings, "synthesize_insight", _invoke)

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        return _call_with_retry(
            self.settings,
            "embed_texts",
            lambda: self.embeddings.embed_documents(texts),
        )
