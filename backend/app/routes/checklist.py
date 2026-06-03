"""Daily checklist routes."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import crud
from app.database import get_session
from app.schemas import DailyChecklistRead, DailyChecklistUpdate, DailyChecklistWrite

router = APIRouter(prefix="/checklist", tags=["Daily Checklist"])


@router.get("/{entry_date}", response_model=DailyChecklistRead)
def get_checklist(entry_date: date, session: Session = Depends(get_session)) -> DailyChecklistRead:
    """Return the daily checklist for a date."""
    checklist = crud.get_daily_checklist_by_date(session, entry_date)
    if checklist is None:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return checklist


@router.post("/{entry_date}", response_model=DailyChecklistRead, status_code=201)
def create_checklist(
    entry_date: date,
    checklist_data: DailyChecklistWrite,
    session: Session = Depends(get_session),
) -> DailyChecklistRead:
    """Create a daily checklist for a date."""
    existing_checklist = crud.get_daily_checklist_by_date(session, entry_date)
    if existing_checklist is not None:
        raise HTTPException(status_code=400, detail="Checklist already exists")
    return crud.create_daily_checklist(session, entry_date, checklist_data)


@router.patch("/{entry_date}", response_model=DailyChecklistRead)
def update_checklist(
    entry_date: date,
    checklist_data: DailyChecklistUpdate,
    session: Session = Depends(get_session),
) -> DailyChecklistRead:
    """Partially update a daily checklist for a date."""
    checklist = crud.get_daily_checklist_by_date(session, entry_date)
    if checklist is None:
        raise HTTPException(status_code=404, detail="Checklist not found")
    return crud.update_daily_checklist(session, checklist, checklist_data)
