from src.config import get_settings
from src.storage.local_client import LocalStorageClient


def get_storage() -> LocalStorageClient:
    return LocalStorageClient(get_settings())
