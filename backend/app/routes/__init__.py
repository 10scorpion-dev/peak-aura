"""Route module exports for Peak Aura Lite."""

from app.routes.calendar import router as calendar_router
from app.routes.checklist import router as checklist_router
from app.routes.dashboard import router as dashboard_router
from app.routes.days import router as days_router
from app.routes.journal import router as journal_router
from app.routes.logs import router as logs_router
from app.routes.peak_calendar import router as peak_calendar_router
from app.routes.sprints import router as sprints_router
from app.routes.tasks import router as tasks_router
from app.routes.whoop import router as whoop_router

__all__ = [
    "calendar_router",
    "checklist_router",
    "dashboard_router",
    "days_router",
    "journal_router",
    "logs_router",
    "peak_calendar_router",
    "sprints_router",
    "tasks_router",
    "whoop_router",
]
