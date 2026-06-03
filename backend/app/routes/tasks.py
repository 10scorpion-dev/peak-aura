"""Task routes."""

from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session

from app import crud
from app.database import get_session
from app.schemas import TaskRead, TaskStatusUpdate

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("/", response_model=list[TaskRead])
def list_tasks(
    session: Session = Depends(get_session),
    target_date: Optional[date] = Query(default=None, alias="date"),
) -> list[TaskRead]:
    """Return tasks, optionally filtered by date."""
    return crud.get_tasks(session, target_date)


@router.patch("/{task_id}/status", response_model=TaskRead)
def update_task_status(
    task_id: int,
    task_update: TaskStatusUpdate,
    session: Session = Depends(get_session),
) -> TaskRead:
    """Update the status of one task."""
    task = crud.get_task(session, task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return crud.update_task_status(session, task, task_update.status)
