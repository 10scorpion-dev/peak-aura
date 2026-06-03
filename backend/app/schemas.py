"""Request and response schemas for Peak Aura Lite."""

from datetime import date as date_type
from datetime import datetime
from typing import Literal, Optional

from sqlmodel import SQLModel


class SprintCreate(SQLModel):
    """Schema for creating a sprint."""

    name: str
    start_date: date_type
    end_date: date_type
    main_mission: str
    secondary_tracks: Optional[str] = None
    maintenance_tracks: Optional[str] = None
    definition_of_done: Optional[str] = None


class SprintRead(SprintCreate):
    """Schema for reading sprint data."""

    id: int


class DayPlanCreate(SQLModel):
    """Schema for creating a day plan."""

    sprint_id: Optional[int] = None
    date: date_type
    title: str
    day_type: str
    today_priority: Optional[str] = None
    planned_wake_time: Optional[str] = None
    planned_sleep_time: Optional[str] = None
    notes: Optional[str] = None


class DayPlanRead(DayPlanCreate):
    """Schema for reading day plan data."""

    id: int


class DayPriorityUpdate(SQLModel):
    """Schema for updating a day's priority."""

    today_priority: Optional[str] = None


class TaskCreate(SQLModel):
    """Schema for creating a task."""

    sprint_id: Optional[int] = None
    day_plan_id: Optional[int] = None
    date: Optional[date_type] = None
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    category: str
    source: str = "peak_aura"
    is_routine: bool = False
    recurrence_rule: Optional[str] = None
    planned_start: Optional[str] = None
    planned_end: Optional[str] = None
    status: str = "planned"
    evidence_required: bool = False
    evidence_note: Optional[str] = None


class TaskRead(TaskCreate):
    """Schema for reading task data."""

    id: int


class TaskStatusUpdate(SQLModel):
    """Schema for updating a task status."""

    status: Literal["planned", "done", "missed", "failed"]


class PeakCalendarEventCreate(SQLModel):
    """Schema for creating an internal Peak Aura calendar event."""

    date: date_type
    title: str
    category: str
    planned_start: Optional[str] = None
    planned_end: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    sprint_id: Optional[int] = None
    evidence_required: bool = False
    is_routine: bool = False


class PeakCalendarEventUpdate(SQLModel):
    """Schema for updating an internal Peak Aura calendar event."""

    date: Optional[date_type] = None
    title: Optional[str] = None
    category: Optional[str] = None
    planned_start: Optional[str] = None
    planned_end: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    status: Optional[Literal["planned", "done", "missed", "failed"]] = None
    evidence_required: Optional[bool] = None
    is_routine: Optional[bool] = None


class PeakCalendarEventRead(SQLModel):
    """Schema for reading internal Peak Aura calendar events."""

    id: int
    title: str
    date: Optional[date_type] = None
    category: str
    planned_start: Optional[str] = None
    planned_end: Optional[str] = None
    status: str
    description: Optional[str] = None
    location: Optional[str] = None
    source: str
    is_routine: bool
    evidence_required: bool


class ActivityLogCreate(SQLModel):
    """Schema for creating an activity log."""

    date: date_type
    category: str
    title: str
    value: Optional[str] = None
    numeric_value: Optional[float] = None
    unit: Optional[str] = None
    sensitivity: Optional[str] = None
    notes: Optional[str] = None


class ActivityLogRead(ActivityLogCreate):
    """Schema for reading activity log data."""

    id: int
    created_at: datetime


class DailyChecklistWrite(SQLModel):
    """Schema for creating a daily checklist entry."""

    wake_0530: bool = False
    gym_cardio_mobility: bool = False
    office_serious: bool = False
    golf_done: bool = False
    dbe_block_done: bool = False
    error_log_updated: bool = False
    tomorrow_top3_done: bool = False
    sleep_2245: bool = False
    notes: Optional[str] = None


class DailyChecklistUpdate(SQLModel):
    """Schema for partially updating a daily checklist entry."""

    wake_0530: Optional[bool] = None
    gym_cardio_mobility: Optional[bool] = None
    office_serious: Optional[bool] = None
    golf_done: Optional[bool] = None
    dbe_block_done: Optional[bool] = None
    error_log_updated: Optional[bool] = None
    tomorrow_top3_done: Optional[bool] = None
    sleep_2245: Optional[bool] = None
    notes: Optional[str] = None


class DailyChecklistRead(DailyChecklistWrite):
    """Schema for reading daily checklist data."""

    id: int
    date: date_type


class WhoopManualWrite(SQLModel):
    """Schema for creating a manual WHOOP entry."""

    recovery_score: Optional[int] = None
    sleep_hours: Optional[float] = None
    strain: Optional[float] = None
    spo2: Optional[float] = None
    resting_heart_rate: Optional[int] = None
    hrv: Optional[float] = None
    calories_burned: Optional[int] = None
    calorie_intake: Optional[int] = None
    sleep_debt: Optional[float] = None
    notes: Optional[str] = None


class WhoopManualUpdate(SQLModel):
    """Schema for partially updating a manual WHOOP entry."""

    recovery_score: Optional[int] = None
    sleep_hours: Optional[float] = None
    strain: Optional[float] = None
    spo2: Optional[float] = None
    resting_heart_rate: Optional[int] = None
    hrv: Optional[float] = None
    calories_burned: Optional[int] = None
    calorie_intake: Optional[int] = None
    sleep_debt: Optional[float] = None
    notes: Optional[str] = None


class WhoopManualEntryRead(WhoopManualWrite):
    """Schema for reading manual WHOOP data."""

    id: int
    date: date_type


class DashboardRead(SQLModel):
    """Combined dashboard payload for a single day."""

    date: date_type
    day_plan: Optional[DayPlanRead] = None
    tasks: list[TaskRead]
    activity_logs: list[ActivityLogRead]
    checklist: Optional[DailyChecklistRead] = None
    whoop_manual: Optional[WhoopManualEntryRead] = None
    daily_score: int


class GoogleCalendarStatusRead(SQLModel):
    """Simple local connection status for the Google Calendar integration."""

    connected: bool


class JournalOptionRead(SQLModel):
    """Schema for reading journal option definitions."""

    id: int
    key: str
    label: str
    category: str
    input_type: str
    default_unit: Optional[str] = None
    description: Optional[str] = None
    is_active: bool
    sort_order: int


class DailyJournalEntryWrite(SQLModel):
    """Schema for one journal value submitted for a date."""

    option_key: str
    boolean_value: Optional[bool] = None
    number_value: Optional[float] = None
    text_value: Optional[str] = None
    unit: Optional[str] = None
    notes: Optional[str] = None


class DailyJournalPatch(SQLModel):
    """Schema for patching a day's journal entries."""

    entries: list[DailyJournalEntryWrite]


class JournalItemRead(SQLModel):
    """Structured journal item merged with its saved value for a date."""

    option_key: str
    label: str
    input_type: str
    default_unit: Optional[str] = None
    value: Optional[bool | float | str] = None
    unit: Optional[str] = None
    notes: Optional[str] = None


class JournalCategoryRead(SQLModel):
    """Journal items grouped under one category."""

    category: str
    items: list[JournalItemRead]


class DailyJournalRead(SQLModel):
    """Structured journal response for one day."""

    date: date_type
    categories: list[JournalCategoryRead]


class DailyJournalSummaryRead(SQLModel):
    """Compact summary of logged journal data for one day."""

    total_logged: int
    positives_logged: int
    negatives_logged: int
    symptoms_logged: int
    substances_logged: int
    recovery_actions_logged: int
    nutrition_inputs_logged: int
