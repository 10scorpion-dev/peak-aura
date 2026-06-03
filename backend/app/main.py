"""FastAPI entry point for Peak Aura Lite."""

from contextlib import asynccontextmanager
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:  # pragma: no cover - keeps boot working before optional deps install
    def load_dotenv(*_: object, **__: object) -> bool:
        return False

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.database import create_db_and_tables, get_session
from app.routes import (
    calendar_router,
    checklist_router,
    dashboard_router,
    days_router,
    journal_router,
    logs_router,
    peak_calendar_router,
    sprints_router,
    tasks_router,
    whoop_router,
)
from app.seed import seed_peak_aura_lite


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Create database tables when the application starts."""
    create_db_and_tables()
    yield


app = FastAPI(title="Peak Aura Lite", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sprints_router)
app.include_router(days_router)
app.include_router(journal_router)
app.include_router(tasks_router)
app.include_router(logs_router)
app.include_router(peak_calendar_router)
app.include_router(checklist_router)
app.include_router(whoop_router)
app.include_router(dashboard_router)
app.include_router(calendar_router)


@app.get("/")
def read_root() -> dict[str, str]:
    """Simple root endpoint for quick local checks."""
    return {"message": "Peak Aura Lite backend is running."}


@app.get("/health")
def health_check() -> dict[str, str]:
    """Health check endpoint for local development."""
    return {"status": "ok", "app": "Peak Aura Lite"}


@app.post("/seed")
def run_seed(session: Session = Depends(get_session)) -> dict[str, int | str]:
    """Seed the initial local MVP data."""
    return seed_peak_aura_lite(session)
