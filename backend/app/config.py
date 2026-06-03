"""Environment-backed settings for local backend integrations."""

import os
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - keeps local boot working before deps are installed
    def load_dotenv(*_: object, **__: object) -> bool:
        return False

BACKEND_ENV_PATH = Path(__file__).resolve().parents[1] / ".env"

load_dotenv(BACKEND_ENV_PATH)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
