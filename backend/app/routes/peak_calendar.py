"""Internal Peak Aura calendar routes."""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlmodel import Session

from app import crud
from app.database import get_session
from app.schemas import (
    PeakCalendarEventCreate,
    PeakCalendarEventRead,
    PeakCalendarEventUpdate,
)

router = APIRouter(prefix="/peak-calendar", tags=["Peak Calendar"])


@router.get("/events", response_model=list[PeakCalendarEventRead])
def list_peak_calendar_events(
    start_date: date = Query(...),
    end_date: date = Query(...),
    sprint_id: Optional[int] = Query(default=None),
    session: Session = Depends(get_session),
) -> list[PeakCalendarEventRead]:
    """Return internal Peak Aura calendar events in a date range."""
    if end_date < start_date:
        raise HTTPException(status_code=400, detail="end_date must be on or after start_date")

    return crud.get_peak_calendar_events(session, start_date, end_date, sprint_id)


@router.post("/events", response_model=PeakCalendarEventRead, status_code=201)
def create_peak_calendar_event(
    event_data: PeakCalendarEventCreate,
    session: Session = Depends(get_session),
) -> PeakCalendarEventRead:
    """Create an internal Peak Aura calendar event."""
    return crud.create_peak_calendar_event(session, event_data)


@router.patch("/events/{event_id}", response_model=PeakCalendarEventRead)
def update_peak_calendar_event(
    event_id: int,
    event_data: PeakCalendarEventUpdate,
    session: Session = Depends(get_session),
) -> PeakCalendarEventRead:
    """Update an internal Peak Aura calendar event."""
    task = crud.get_task(session, event_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Event not found")

    return crud.update_peak_calendar_event(session, task, event_data)


@router.delete("/events/{event_id}", status_code=204)
def delete_peak_calendar_event(
    event_id: int,
    session: Session = Depends(get_session),
) -> Response:
    """Delete an internal Peak Aura calendar event."""
    task = crud.get_task(session, event_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Event not found")

    crud.delete_peak_calendar_event(session, task)
    return Response(status_code=204)
