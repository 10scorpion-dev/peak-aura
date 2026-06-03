"""Simple CRUD helpers for Peak Aura Lite."""

from datetime import date, datetime
from typing import Optional

from sqlmodel import Session, select

from app.models import (
    ActivityLog,
    DailyChecklist,
    DailyJournalEntry,
    DayPlan,
    GoogleCalendarConnection,
    JOURNAL_OPTION_CATEGORIES,
    JournalOption,
    Sprint,
    Task,
    WhoopManualEntry,
)
from app.schemas import (
    ActivityLogCreate,
    DailyChecklistUpdate,
    DailyChecklistWrite,
    DailyJournalEntryWrite,
    DayPlanCreate,
    DayPriorityUpdate,
    PeakCalendarEventCreate,
    PeakCalendarEventUpdate,
    SprintCreate,
    TaskCreate,
    WhoopManualUpdate,
    WhoopManualWrite,
)

JOURNAL_CATEGORY_ORDER = {
    category: index for index, category in enumerate(JOURNAL_OPTION_CATEGORIES)
}


def get_sprints(session: Session) -> list[Sprint]:
    """Return all sprints."""
    statement = select(Sprint).order_by(Sprint.id)
    return list(session.exec(statement))


def get_sprint(session: Session, sprint_id: int) -> Optional[Sprint]:
    """Return one sprint by id."""
    return session.get(Sprint, sprint_id)


def create_sprint(session: Session, sprint_data: SprintCreate) -> Sprint:
    """Create a sprint."""
    sprint = Sprint.model_validate(sprint_data)
    session.add(sprint)
    session.commit()
    session.refresh(sprint)
    return sprint


def get_day_plans(session: Session) -> list[DayPlan]:
    """Return all day plans."""
    statement = select(DayPlan).order_by(DayPlan.date)
    return list(session.exec(statement))


def get_day_plans_by_sprint(session: Session, sprint_id: int) -> list[DayPlan]:
    """Return all day plans for one sprint."""
    statement = (
        select(DayPlan)
        .where(DayPlan.sprint_id == sprint_id)
        .order_by(DayPlan.date)
    )
    return list(session.exec(statement))


def get_day_plan_by_date(session: Session, target_date: date) -> Optional[DayPlan]:
    """Return one day plan by date."""
    statement = select(DayPlan).where(DayPlan.date == target_date)
    return session.exec(statement).first()


def get_or_create_day_plan(
    session: Session, target_date: date, sprint_id: Optional[int] = None
) -> DayPlan:
    """Return an existing day plan for a date or create a simple one."""
    existing_day_plan = get_day_plan_by_date(session, target_date)
    if existing_day_plan is not None:
        if existing_day_plan.sprint_id is None and sprint_id is not None:
            existing_day_plan.sprint_id = sprint_id
            session.add(existing_day_plan)
            session.commit()
            session.refresh(existing_day_plan)
        return existing_day_plan

    day_plan = DayPlan(
        sprint_id=sprint_id,
        date=target_date,
        title=f"Peak Aura - {target_date.isoformat()}",
        day_type="Custom",
        today_priority=None,
        planned_wake_time=None,
        planned_sleep_time=None,
        notes=None,
    )
    session.add(day_plan)
    session.commit()
    session.refresh(day_plan)
    return day_plan


def create_day_plan(session: Session, day_plan_data: DayPlanCreate) -> DayPlan:
    """Create a day plan."""
    day_plan = DayPlan.model_validate(day_plan_data)
    session.add(day_plan)
    session.commit()
    session.refresh(day_plan)
    return day_plan


def update_day_priority(
    session: Session, day_plan: DayPlan, priority_data: DayPriorityUpdate
) -> DayPlan:
    """Update the priority text for a day plan."""
    day_plan.today_priority = priority_data.today_priority
    session.add(day_plan)
    session.commit()
    session.refresh(day_plan)
    return day_plan


def get_tasks(session: Session, target_date: Optional[date] = None) -> list[Task]:
    """Return tasks, optionally filtered by day plan date."""
    if target_date is None:
        statement = select(Task).order_by(Task.id)
        return list(session.exec(statement))

    day_plan = get_day_plan_by_date(session, target_date)
    if day_plan is None or day_plan.id is None:
        return []

    statement = select(Task).where(Task.day_plan_id == day_plan.id).order_by(Task.id)
    return list(session.exec(statement))


def get_peak_calendar_events(
    session: Session,
    start_date: date,
    end_date: date,
    sprint_id: Optional[int] = None,
) -> list[Task]:
    """Return internal Peak Aura tasks in a date range."""
    statement = (
        select(Task)
        .where(Task.date.is_not(None))
        .where(Task.date >= start_date)
        .where(Task.date <= end_date)
        .order_by(Task.date, Task.planned_start, Task.id)
    )

    if sprint_id is not None:
        statement = statement.where(Task.sprint_id == sprint_id)

    return list(session.exec(statement))


def get_task(session: Session, task_id: int) -> Optional[Task]:
    """Return one task by id."""
    return session.get(Task, task_id)


def create_task(session: Session, task_data: TaskCreate) -> Task:
    """Create a task."""
    task_payload = task_data.model_dump()

    if task_payload.get("date") is None and task_payload.get("day_plan_id") is not None:
        day_plan = session.get(DayPlan, task_payload["day_plan_id"])
        if day_plan is not None:
            task_payload["date"] = day_plan.date

    task = Task.model_validate(task_payload)
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def update_task_status(session: Session, task: Task, status: str) -> Task:
    """Update the status of a task."""
    task.status = status
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def create_peak_calendar_event(
    session: Session, event_data: PeakCalendarEventCreate
) -> Task:
    """Create an internal Peak Aura calendar event as a task."""
    day_plan = get_or_create_day_plan(session, event_data.date, event_data.sprint_id)

    task = Task(
        sprint_id=event_data.sprint_id if event_data.sprint_id is not None else day_plan.sprint_id,
        day_plan_id=day_plan.id,
        date=event_data.date,
        title=event_data.title,
        description=(event_data.description or "").strip() or None,
        location=(event_data.location or "").strip() or None,
        category=event_data.category,
        source="peak_aura",
        is_routine=event_data.is_routine,
        recurrence_rule=None,
        planned_start=event_data.planned_start,
        planned_end=event_data.planned_end,
        status="planned",
        evidence_required=event_data.evidence_required,
        evidence_note=None,
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def update_peak_calendar_event(
    session: Session, task: Task, event_data: PeakCalendarEventUpdate
) -> Task:
    """Update an internal Peak Aura calendar event."""
    updates = event_data.model_dump(exclude_unset=True)

    next_date = updates.pop("date", None)
    if next_date is not None:
        day_plan = get_or_create_day_plan(session, next_date, task.sprint_id)
        task.date = next_date
        task.day_plan_id = day_plan.id
        if task.sprint_id is None:
            task.sprint_id = day_plan.sprint_id

    for field_name, value in updates.items():
        if field_name in {"description", "location"} and isinstance(value, str):
            setattr(task, field_name, value.strip() or None)
        else:
            setattr(task, field_name, value)

    session.add(task)
    session.commit()
    session.refresh(task)
    return task


def delete_peak_calendar_event(session: Session, task: Task) -> None:
    """Delete an internal Peak Aura calendar event."""
    session.delete(task)
    session.commit()


def get_activity_logs(session: Session, target_date: Optional[date] = None) -> list[ActivityLog]:
    """Return activity logs, optionally filtered by date."""
    statement = select(ActivityLog).order_by(ActivityLog.created_at)
    if target_date is not None:
        statement = statement.where(ActivityLog.date == target_date)
    return list(session.exec(statement))


def create_activity_log(
    session: Session, activity_log_data: ActivityLogCreate
) -> ActivityLog:
    """Create an activity log."""
    activity_log = ActivityLog.model_validate(activity_log_data)
    session.add(activity_log)
    session.commit()
    session.refresh(activity_log)
    return activity_log


def get_google_calendar_connection(
    session: Session, provider: str = "google"
) -> Optional[GoogleCalendarConnection]:
    """Return the stored local Google Calendar connection if it exists."""
    statement = select(GoogleCalendarConnection).where(
        GoogleCalendarConnection.provider == provider
    )
    return session.exec(statement).first()


def get_active_journal_options(session: Session) -> list[JournalOption]:
    """Return active journal options sorted by category and sort order."""
    options = list(
        session.exec(select(JournalOption).where(JournalOption.is_active == True))  # noqa: E712
    )
    return sorted(
        options,
        key=lambda option: (
            JOURNAL_CATEGORY_ORDER.get(option.category, len(JOURNAL_CATEGORY_ORDER)),
            option.sort_order,
            option.label,
        ),
    )


def get_journal_entries_by_date(
    session: Session, target_date: date
) -> list[DailyJournalEntry]:
    """Return all journal entries saved for one date."""
    statement = (
        select(DailyJournalEntry)
        .where(DailyJournalEntry.date == target_date)
        .order_by(DailyJournalEntry.option_key)
    )
    return list(session.exec(statement))


def upsert_journal_entries(
    session: Session,
    target_date: date,
    entries: list[DailyJournalEntryWrite],
) -> list[DailyJournalEntry]:
    """Upsert journal entries by date and option key."""
    existing_entries = {
        entry.option_key: entry for entry in get_journal_entries_by_date(session, target_date)
    }

    for entry_data in entries:
        option_key = entry_data.option_key.strip().lower()
        existing_entry = existing_entries.get(option_key)

        if existing_entry is None:
            session.add(
                DailyJournalEntry(
                    date=target_date,
                    option_key=option_key,
                    boolean_value=entry_data.boolean_value,
                    number_value=entry_data.number_value,
                    text_value=entry_data.text_value.strip() or None
                    if isinstance(entry_data.text_value, str)
                    else entry_data.text_value,
                    unit=entry_data.unit.strip() or None
                    if isinstance(entry_data.unit, str)
                    else entry_data.unit,
                    notes=entry_data.notes.strip() or None
                    if isinstance(entry_data.notes, str)
                    else entry_data.notes,
                )
            )
            continue

        existing_entry.boolean_value = entry_data.boolean_value
        existing_entry.number_value = entry_data.number_value
        existing_entry.text_value = (
            entry_data.text_value.strip() or None
            if isinstance(entry_data.text_value, str)
            else entry_data.text_value
        )
        existing_entry.unit = (
            entry_data.unit.strip() or None
            if isinstance(entry_data.unit, str)
            else entry_data.unit
        )
        existing_entry.notes = (
            entry_data.notes.strip() or None
            if isinstance(entry_data.notes, str)
            else entry_data.notes
        )
        existing_entry.updated_at = datetime.now()
        session.add(existing_entry)

    session.commit()
    return get_journal_entries_by_date(session, target_date)


def get_daily_checklist_by_date(
    session: Session, target_date: date
) -> Optional[DailyChecklist]:
    """Return the daily checklist for a specific date."""
    statement = select(DailyChecklist).where(DailyChecklist.date == target_date)
    return session.exec(statement).first()


def create_daily_checklist(
    session: Session, target_date: date, checklist_data: DailyChecklistWrite
) -> DailyChecklist:
    """Create a daily checklist entry."""
    checklist = DailyChecklist(date=target_date, **checklist_data.model_dump())
    session.add(checklist)
    session.commit()
    session.refresh(checklist)
    return checklist


def update_daily_checklist(
    session: Session, checklist: DailyChecklist, checklist_data: DailyChecklistUpdate
) -> DailyChecklist:
    """Update a daily checklist entry."""
    for field_name, value in checklist_data.model_dump(exclude_unset=True).items():
        setattr(checklist, field_name, value)

    session.add(checklist)
    session.commit()
    session.refresh(checklist)
    return checklist


def get_whoop_manual_by_date(
    session: Session, target_date: date
) -> Optional[WhoopManualEntry]:
    """Return a manual WHOOP entry for a specific date."""
    statement = select(WhoopManualEntry).where(WhoopManualEntry.date == target_date)
    return session.exec(statement).first()


def create_whoop_manual_entry(
    session: Session, target_date: date, whoop_data: WhoopManualWrite
) -> WhoopManualEntry:
    """Create a manual WHOOP entry."""
    whoop_entry = WhoopManualEntry(date=target_date, **whoop_data.model_dump())
    session.add(whoop_entry)
    session.commit()
    session.refresh(whoop_entry)
    return whoop_entry


def update_whoop_manual_entry(
    session: Session, whoop_entry: WhoopManualEntry, whoop_data: WhoopManualUpdate
) -> WhoopManualEntry:
    """Update a manual WHOOP entry."""
    for field_name, value in whoop_data.model_dump(exclude_unset=True).items():
        setattr(whoop_entry, field_name, value)

    session.add(whoop_entry)
    session.commit()
    session.refresh(whoop_entry)
    return whoop_entry
