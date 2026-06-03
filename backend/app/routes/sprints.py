"""Sprint routes."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import crud
from app.database import get_session
from app.schemas import DayPlanRead, SprintRead

router = APIRouter(prefix="/sprints", tags=["Sprints"])


@router.get("/", response_model=list[SprintRead])
def list_sprints(session: Session = Depends(get_session)) -> list[SprintRead]:
    """Return all sprints."""
    return crud.get_sprints(session)


@router.get("/{sprint_id}", response_model=SprintRead)
def get_sprint(sprint_id: int, session: Session = Depends(get_session)) -> SprintRead:
    """Return one sprint by id."""
    sprint = crud.get_sprint(session, sprint_id)
    if sprint is None:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return sprint


@router.get("/{sprint_id}/days", response_model=list[DayPlanRead])
def list_sprint_days(sprint_id: int, session: Session = Depends(get_session)) -> list[DayPlanRead]:
    """Return all day plans for one sprint."""
    sprint = crud.get_sprint(session, sprint_id)
    if sprint is None:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return crud.get_day_plans_by_sprint(session, sprint_id)
