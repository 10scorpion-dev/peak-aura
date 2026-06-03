"""Day routes."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import crud
from app.database import get_session
from app.schemas import DayPlanRead, DayPriorityUpdate

router = APIRouter(prefix="/days", tags=["Days"])


@router.get("/", response_model=list[DayPlanRead])
def list_days(session: Session = Depends(get_session)) -> list[DayPlanRead]:
    """Return all day plans."""
    return crud.get_day_plans(session)


@router.get("/today", response_model=DayPlanRead)
def get_today(session: Session = Depends(get_session)) -> DayPlanRead:
    """Return today's day plan."""
    day_plan = crud.get_day_plan_by_date(session, date.today())
    if day_plan is None:
        raise HTTPException(status_code=404, detail="Day plan not found")
    return day_plan


@router.get("/{day_date}", response_model=DayPlanRead)
def get_day(day_date: date, session: Session = Depends(get_session)) -> DayPlanRead:
    """Return one day plan by date."""
    day_plan = crud.get_day_plan_by_date(session, day_date)
    if day_plan is None:
        raise HTTPException(status_code=404, detail="Day plan not found")
    return day_plan


@router.patch("/{day_date}/priority", response_model=DayPlanRead)
def update_day_priority(
    day_date: date,
    priority_update: DayPriorityUpdate,
    session: Session = Depends(get_session),
) -> DayPlanRead:
    """Update the priority for a specific day plan."""
    day_plan = crud.get_day_plan_by_date(session, day_date)
    if day_plan is None:
        raise HTTPException(status_code=404, detail="Day plan not found")

    cleaned_priority = (
        priority_update.today_priority.strip()
        if isinstance(priority_update.today_priority, str)
        else None
    )
    return crud.update_day_priority(
        session,
        day_plan,
        DayPriorityUpdate(today_priority=cleaned_priority or None),
    )
