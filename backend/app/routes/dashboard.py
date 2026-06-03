"""Dashboard routes."""

from datetime import date

from fastapi import APIRouter, Depends
from sqlmodel import Session

from app import crud
from app.database import get_session
from app.models import DailyChecklist
from app.schemas import DashboardRead

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

SCORE_WEIGHTS = {
    "wake_0530": 10,
    "gym_cardio_mobility": 15,
    "office_serious": 10,
    "golf_done": 10,
    "dbe_block_done": 25,
    "error_log_updated": 15,
    "tomorrow_top3_done": 5,
    "sleep_2245": 10,
}


def calculate_daily_score(checklist: DailyChecklist | None) -> int:
    """Calculate the daily score from checklist booleans."""
    if checklist is None:
        return 0

    return sum(
        weight for field_name, weight in SCORE_WEIGHTS.items() if getattr(checklist, field_name)
    )


@router.get("/{entry_date}", response_model=DashboardRead)
def get_dashboard(
    entry_date: date, session: Session = Depends(get_session)
) -> DashboardRead:
    """Return all dashboard data for one date."""
    day_plan = crud.get_day_plan_by_date(session, entry_date)
    tasks = crud.get_tasks(session, entry_date)
    activity_logs = crud.get_activity_logs(session, entry_date)
    checklist = crud.get_daily_checklist_by_date(session, entry_date)
    whoop_manual = crud.get_whoop_manual_by_date(session, entry_date)

    return DashboardRead(
        date=entry_date,
        day_plan=day_plan,
        tasks=tasks,
        activity_logs=activity_logs,
        checklist=checklist,
        whoop_manual=whoop_manual,
        daily_score=calculate_daily_score(checklist),
    )
