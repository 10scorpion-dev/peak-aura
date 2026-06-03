"""Manual WHOOP routes."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import crud
from app.database import get_session
from app.schemas import WhoopManualEntryRead, WhoopManualUpdate, WhoopManualWrite

router = APIRouter(prefix="/whoop", tags=["WHOOP Manual"])


@router.get("/{entry_date}", response_model=WhoopManualEntryRead)
def get_whoop_entry(
    entry_date: date, session: Session = Depends(get_session)
) -> WhoopManualEntryRead:
    """Return the manual WHOOP entry for a date."""
    whoop_entry = crud.get_whoop_manual_by_date(session, entry_date)
    if whoop_entry is None:
        raise HTTPException(status_code=404, detail="WHOOP entry not found")
    return whoop_entry


@router.post("/{entry_date}", response_model=WhoopManualEntryRead, status_code=201)
def create_whoop_entry(
    entry_date: date,
    whoop_data: WhoopManualWrite,
    session: Session = Depends(get_session),
) -> WhoopManualEntryRead:
    """Create the manual WHOOP entry for a date."""
    existing_entry = crud.get_whoop_manual_by_date(session, entry_date)
    if existing_entry is not None:
        raise HTTPException(status_code=400, detail="WHOOP entry already exists")
    return crud.create_whoop_manual_entry(session, entry_date, whoop_data)


@router.patch("/{entry_date}", response_model=WhoopManualEntryRead)
def update_whoop_entry(
    entry_date: date,
    whoop_data: WhoopManualUpdate,
    session: Session = Depends(get_session),
) -> WhoopManualEntryRead:
    """Partially update the manual WHOOP entry for a date."""
    whoop_entry = crud.get_whoop_manual_by_date(session, entry_date)
    if whoop_entry is None:
        raise HTTPException(status_code=404, detail="WHOOP entry not found")
    return crud.update_whoop_manual_entry(session, whoop_entry, whoop_data)
