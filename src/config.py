from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    google_api_key: str = ""
    storage_path: str = "data"

    gemini_model: str = "gemini-2.0-flash"
    embedding_model: str = "gemini-embedding-2"
    whisper_model: str = "base"

    min_cluster_size: int = 5
    analysis_window_days: int = 7
    cluster_similarity_threshold: float = 0.82
    min_severity: int = 3

    gemini_max_retries: int = 5
    gemini_retry_base_delay_seconds: float = 5.0
    gemini_min_request_interval_seconds: float = 13.0

    api_host: str = "0.0.0.0"
    api_port: int = 8000


@lru_cache
def get_settings() -> Settings:
    return Settings()
