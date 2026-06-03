"""Database models for Peak Aura Lite."""

from datetime import date as date_type
from datetime import datetime
from typing import Optional

from sqlalchemy import UniqueConstraint
from sqlmodel import Field, SQLModel

JOURNAL_OPTION_CATEGORIES = (
    "Sleep Environment",
    "Nutrition",
    "Supplements",
    "Recovery",
    "Symptoms",
    "Mental State",
    "Substances",
    "Training Body",
    "Lifestyle",
    "Travel & Work",
    "Screen & Stimulation",
    "Sexual Health",
    "Other",
)


class Sprint(SQLModel, table=True):
    """A sprint groups work across a defined date range."""

    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    start_date: date_type
    end_date: date_type
    main_mission: str
    secondary_tracks: Optional[str] = None
    maintenance_tracks: Optional[str] = None
    definition_of_done: Optional[str] = None


class DayPlan(SQLModel, table=True):
    """A planned structure for a single day."""

    id: Optional[int] = Field(default=None, primary_key=True)
    sprint_id: Optional[int] = Field(default=None, foreign_key="sprint.id")
    date: date_type
    title: str
    day_type: str
    today_priority: Optional[str] = None
    planned_wake_time: Optional[str] = None
    planned_sleep_time: Optional[str] = None
    notes: Optional[str] = None


class Task(SQLModel, table=True):
    """A task planned at sprint or day level."""

    id: Optional[int] = Field(default=None, primary_key=True)
    sprint_id: Optional[int] = Field(default=None, foreign_key="sprint.id")
    day_plan_id: Optional[int] = Field(default=None, foreign_key="dayplan.id")
    date: Optional[date_type] = Field(default=None)
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


class ActivityLog(SQLModel, table=True):
    """A manual activity or reflection log entry."""

    id: Optional[int] = Field(default=None, primary_key=True)
    date: date_type
    category: str
    title: str
    value: Optional[str] = None
    numeric_value: Optional[float] = None
    unit: Optional[str] = None
    sensitivity: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)


class DailyChecklist(SQLModel, table=True):
    """Daily habit and execution checklist."""

    id: Optional[int] = Field(default=None, primary_key=True)
    date: date_type
    wake_0530: bool = False
    gym_cardio_mobility: bool = False
    office_serious: bool = False
    golf_done: bool = False
    dbe_block_done: bool = False
    error_log_updated: bool = False
    tomorrow_top3_done: bool = False
    sleep_2245: bool = False
    notes: Optional[str] = None


class WhoopManualEntry(SQLModel, table=True):
    """A manual daily Whoop metrics entry."""

    id: Optional[int] = Field(default=None, primary_key=True)
    date: date_type
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


class GoogleCalendarConnection(SQLModel, table=True):
    """Stores the local Google Calendar OAuth connection for the MVP.

    Production note: access and refresh tokens should be encrypted at rest.
    """

    id: Optional[int] = Field(default=None, primary_key=True)
    provider: str = "google"
    access_token: str
    refresh_token: Optional[str] = None
    token_uri: Optional[str] = None
    client_id: Optional[str] = None
    client_secret: Optional[str] = None
    scopes: Optional[str] = None
    expiry: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


class JournalOption(SQLModel, table=True):
    """Defines a reusable journal prompt or structured tracking option."""

    __table_args__ = (UniqueConstraint("key", name="uq_journaloption_key"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    key: str
    label: str
    category: str
    input_type: str
    default_unit: Optional[str] = None
    description: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class DailyJournalEntry(SQLModel, table=True):
    """Stores one structured journal value per date and option key."""

    __table_args__ = (
        UniqueConstraint("date", "option_key", name="uq_dailyjournalentry_date_option_key"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    date: date_type
    option_key: str
    boolean_value: Optional[bool] = None
    number_value: Optional[float] = None
    text_value: Optional[str] = None
    unit: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
