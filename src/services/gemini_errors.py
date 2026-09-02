import re
from typing import Optional


class GeminiServiceError(Exception):
    """User-facing Gemini API failure."""

    def __init__(self, message: str, *, retryable: bool = False, status_code: Optional[int] = None):
        super().__init__(message)
        self.retryable = retryable
        self.status_code = status_code


def _error_text(exc: Exception) -> str:
    return str(exc).lower()


def is_retryable_gemini_error(exc: Exception) -> bool:
    text = _error_text(exc)
    if isinstance(exc, GeminiServiceError):
        return exc.retryable
    if "resourceexhausted" in text or "429" in text:
        return True
    if "quota" in text and ("exceeded" in text or "limit" in text):
        return True
    if "rate limit" in text or "too many requests" in text:
        return True
    if "503" in text or "unavailable" in text or "deadline exceeded" in text:
        return True
    return False


def parse_retry_delay_seconds(exc: Exception) -> Optional[float]:
    text = str(exc)
    for pattern in (
        r"retry in ([\d.]+)s",
        r"retry_delay\s*\{\s*seconds:\s*(\d+)",
        r'"seconds":\s*(\d+)',
    ):
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return float(match.group(1))
    return None


def format_gemini_error(exc: Exception) -> str:
    if isinstance(exc, GeminiServiceError):
        return str(exc)

    text = _error_text(exc)
    raw = str(exc).strip()

    if "invalid api key" in text or "api key not valid" in text or "permission denied" in text:
        return "Gemini API key is invalid or missing. Check GOOGLE_API_KEY in your .env file."

    if "resourceexhausted" in text or "429" in text:
        if (
            "per minute" in text
            or "perminute" in text.replace(" ", "").replace("_", "")
            or "generate requestsperminute" in text.replace(" ", "").replace("_", "")
        ):
            return (
                "Gemini rate limit reached (too many requests per minute). "
                "Calls are processed one at a time — wait about a minute, then use Retry review."
            )
        return (
            "Gemini API quota exceeded for your current plan. "
            "Wait for the quota to reset, reduce batch uploads, or upgrade billing at ai.google.dev."
        )

    if "quota" in text and ("exceeded" in text or "limit" in text):
        return (
            "Gemini API quota exhausted. "
            "Free tier allows limited requests per minute — wait and retry, or upgrade your plan."
        )

    if "503" in text or "unavailable" in text:
        return "Gemini API is temporarily unavailable. Please try again in a few minutes."

    if len(raw) > 240:
        return "Gemini API request failed. Check server logs for details."
    return f"Gemini API error: {raw}"
