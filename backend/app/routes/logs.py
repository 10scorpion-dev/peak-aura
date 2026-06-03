"""Activity log routes."""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app import crud
from app.database import get_session
from app.schemas import ActivityLogCreate, ActivityLogRead

router = APIRouter(prefix="/logs", tags=["Activity Logs"])


@router.get("/", response_model=list[ActivityLogRead])
def list_logs(
    session: Session = Depends(get_session),
    target_date: Optional[date] = Query(default=None, alias="date"),
) -> list[ActivityLogRead]:
    """Return activity logs, optionally filtered by date."""
    return crud.get_activity_logs(session, target_date)


@router.post("/", response_model=ActivityLogRead, status_code=201)
def create_log(
    log_data: ActivityLogCreate, session: Session = Depends(get_session)
) -> ActivityLogRead:
    """Create an activity log."""
    return crud.create_activity_log(session, log_data)
