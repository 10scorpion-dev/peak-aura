"""Journal routes."""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app import crud
from app.database import get_session
from app.schemas import (
    DailyJournalPatch,
    DailyJournalRead,
    DailyJournalSummaryRead,
    JournalCategoryRead,
    JournalItemRead,
    JournalOptionRead,
)
from app.seed import seed_journal_options

router = APIRouter(prefix="/journal", tags=["Journal"])

POSITIVE_JOURNAL_CATEGORIES = {
    "Nutrition",
    "Supplements",
    "Recovery",
    "Sleep Environment",
    "Lifestyle",
    "Training Body",
    "Travel & Work",
}

NEGATIVE_JOURNAL_CATEGORIES = {
    "Symptoms",
    "Substances",
    "Mental State",
    "Screen & Stimulation",
}


def _resolve_item_value(
    boolean_value: bool | None,
    number_value: float | None,
    text_value: str | None,
):
    if boolean_value is not None:
        return boolean_value
    if number_value is not None:
        return number_value
    return text_value


def _has_logged_value(item: JournalItemRead) -> bool:
    return item.value is not None or item.notes is not None


def _build_daily_journal_response(
    session: Session, entry_date: date
) -> DailyJournalRead:
    options = crud.get_active_journal_options(session)
    entries = {
        entry.option_key: entry for entry in crud.get_journal_entries_by_date(session, entry_date)
    }

    grouped_categories: dict[str, list[JournalItemRead]] = {}

    for option in options:
        saved_entry = entries.get(option.key)
        grouped_categories.setdefault(option.category, []).append(
            JournalItemRead(
                option_key=option.key,
                label=option.label,
                input_type=option.input_type,
                default_unit=option.default_unit,
                value=_resolve_item_value(
                    saved_entry.boolean_value if saved_entry else None,
                    saved_entry.number_value if saved_entry else None,
                    saved_entry.text_value if saved_entry else None,
                ),
                unit=(
                    saved_entry.unit
                    if saved_entry and saved_entry.unit is not None
                    else option.default_unit
                ),
                notes=saved_entry.notes if saved_entry else None,
            )
        )

    return DailyJournalRead(
        date=entry_date,
        categories=[
            JournalCategoryRead(category=category, items=items)
            for category, items in grouped_categories.items()
        ],
    )


def _build_daily_journal_summary(
    journal_data: DailyJournalRead,
) -> DailyJournalSummaryRead:
    total_logged = 0
    positives_logged = 0
    negatives_logged = 0
    symptoms_logged = 0
    substances_logged = 0
    recovery_actions_logged = 0
    nutrition_inputs_logged = 0

    for category_block in journal_data.categories:
        for item in category_block.items:
            if not _has_logged_value(item):
                continue

            total_logged += 1

            if category_block.category in POSITIVE_JOURNAL_CATEGORIES:
                positives_logged += 1

            if category_block.category in NEGATIVE_JOURNAL_CATEGORIES:
                negatives_logged += 1

            if category_block.category == "Symptoms":
                symptoms_logged += 1

            if category_block.category == "Substances":
                substances_logged += 1

            if category_block.category == "Recovery":
                recovery_actions_logged += 1

            if category_block.category == "Nutrition":
                nutrition_inputs_logged += 1

    return DailyJournalSummaryRead(
        total_logged=total_logged,
        positives_logged=positives_logged,
        negatives_logged=negatives_logged,
        symptoms_logged=symptoms_logged,
        substances_logged=substances_logged,
        recovery_actions_logged=recovery_actions_logged,
        nutrition_inputs_logged=nutrition_inputs_logged,
    )


@router.post("/seed-options")
def run_journal_option_seed(
    session: Session = Depends(get_session),
) -> dict[str, int | str]:
    """Seed or refresh the structured journal option catalog."""
    return seed_journal_options(session)


@router.get("/options", response_model=list[JournalOptionRead])
def list_journal_options(session: Session = Depends(get_session)) -> list[JournalOptionRead]:
    """Return all active journal options sorted by category and sort order."""
    return crud.get_active_journal_options(session)


@router.get("/{entry_date}/summary", response_model=DailyJournalSummaryRead)
def get_daily_journal_summary(
    entry_date: date,
    session: Session = Depends(get_session),
) -> DailyJournalSummaryRead:
    """Return a compact summary of one day's journal activity."""
    journal_data = _build_daily_journal_response(session, entry_date)
    return _build_daily_journal_summary(journal_data)


@router.get("/{entry_date}", response_model=DailyJournalRead)
def get_daily_journal(
    entry_date: date,
    session: Session = Depends(get_session),
) -> DailyJournalRead:
    """Return all active journal options merged with saved values for one date."""
    return _build_daily_journal_response(session, entry_date)


@router.patch("/{entry_date}", response_model=DailyJournalRead)
def update_daily_journal(
    entry_date: date,
    payload: DailyJournalPatch,
    session: Session = Depends(get_session),
) -> DailyJournalRead:
    """Upsert journal entries for one date and return the updated structured journal."""
    valid_option_keys = {option.key for option in crud.get_active_journal_options(session)}
    invalid_keys = [
        entry.option_key for entry in payload.entries if entry.option_key.strip().lower() not in valid_option_keys
    ]

    if invalid_keys:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown journal option key(s): {', '.join(sorted(set(invalid_keys)))}",
        )

    crud.upsert_journal_entries(session, entry_date, payload.entries)
    return _build_daily_journal_response(session, entry_date)
