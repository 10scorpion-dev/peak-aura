"""Seed helpers for Peak Aura Lite."""

import re
from datetime import date

from sqlmodel import Session, select

from app.database import create_db_and_tables, engine
from app.models import DayPlan, JournalOption, Sprint, Task

SPRINT_NAME = "Project Peak Aura - May 2026 DBE Exam Sprint"

SPRINT_DAY_TYPES = {
    date(2026, 5, 13): "UFC",
    date(2026, 5, 14): "US Club",
    date(2026, 5, 15): "US Club",
    date(2026, 5, 16): "Weekend",
    date(2026, 5, 17): "Weekend",
    date(2026, 5, 18): "UFC",
    date(2026, 5, 19): "US Club",
    date(2026, 5, 20): "UFC",
    date(2026, 5, 21): "US Club",
    date(2026, 5, 22): "US Club Light",
    date(2026, 5, 23): "Exam 1",
    date(2026, 5, 24): "Exam 2",
    date(2026, 5, 25): "UFC",
    date(2026, 5, 26): "US Club",
    date(2026, 5, 27): "UFC",
    date(2026, 5, 28): "US Club",
    date(2026, 5, 29): "US Club Light",
    date(2026, 5, 30): "Exam 3",
    date(2026, 5, 31): "Exam 4",
}

DEFAULT_PRIORITY_BY_DAY_TYPE = {
    "weekday": "DBE night block + training continuity",
    "weekend": "DBE deep work + weekly review",
    "exam": "Exam execution + calm recovery",
}

JOURNAL_OPTION_DEFINITIONS: list[dict[str, str | int | bool | None]] = [
    {"label": "Alcohol", "category": "Substances", "input_type": "number", "default_unit": "drinks"},
    {"label": "Caffeine", "category": "Substances", "input_type": "number", "default_unit": "servings"},
    {"label": "Nicotine", "category": "Substances", "input_type": "number", "default_unit": "times"},
    {"label": "Tobacco", "category": "Substances", "input_type": "number", "default_unit": "times"},
    {"label": "Marijuana", "category": "Substances", "input_type": "boolean", "default_unit": None},
    {"label": "Pre-workout", "category": "Substances", "input_type": "boolean", "default_unit": None},
    {"label": "Artificial Sugar", "category": "Substances", "input_type": "boolean", "default_unit": None},
    {"label": "Clean Eating", "category": "Nutrition", "input_type": "boolean", "default_unit": None},
    {"label": "Dairy", "category": "Nutrition", "input_type": "boolean", "default_unit": None},
    {"label": "Fruits & Vegetables", "category": "Nutrition", "input_type": "boolean", "default_unit": None},
    {"label": "Hydration", "category": "Nutrition", "input_type": "number", "default_unit": "liters"},
    {"label": "Meat", "category": "Nutrition", "input_type": "boolean", "default_unit": None},
    {"label": "Protein", "category": "Nutrition", "input_type": "number", "default_unit": "grams"},
    {"label": "Snacking", "category": "Nutrition", "input_type": "boolean", "default_unit": None},
    {"label": "Consumed Chicken", "category": "Nutrition", "input_type": "boolean", "default_unit": None},
    {"label": "Dark Chocolate", "category": "Nutrition", "input_type": "boolean", "default_unit": None},
    {"label": "Dinner", "category": "Nutrition", "input_type": "boolean", "default_unit": None},
    {"label": "Lunch", "category": "Nutrition", "input_type": "boolean", "default_unit": None},
    {"label": "Fiber", "category": "Nutrition", "input_type": "boolean", "default_unit": None},
    {"label": "Nuts", "category": "Nutrition", "input_type": "boolean", "default_unit": None},
    {"label": "Calorie Intake", "category": "Nutrition", "input_type": "number", "default_unit": "kcal"},
    {"label": "Fish Oil", "category": "Supplements", "input_type": "boolean", "default_unit": None},
    {"label": "Vitamin B12", "category": "Supplements", "input_type": "boolean", "default_unit": None},
    {"label": "Vitamin C", "category": "Supplements", "input_type": "boolean", "default_unit": None},
    {"label": "Vitamin D", "category": "Supplements", "input_type": "boolean", "default_unit": None},
    {"label": "Ashwagandha", "category": "Supplements", "input_type": "boolean", "default_unit": None},
    {"label": "Calcium Supplement", "category": "Supplements", "input_type": "boolean", "default_unit": None},
    {"label": "Creatine", "category": "Supplements", "input_type": "boolean", "default_unit": None},
    {"label": "Electrolytes / ORS", "category": "Supplements", "input_type": "boolean", "default_unit": None},
    {"label": "Magnesium Supplement", "category": "Supplements", "input_type": "boolean", "default_unit": None},
    {"label": "Melatonin", "category": "Supplements", "input_type": "boolean", "default_unit": None},
    {"label": "Multivitamins", "category": "Supplements", "input_type": "boolean", "default_unit": None},
    {"label": "Omega-3 Supplement", "category": "Supplements", "input_type": "boolean", "default_unit": None},
    {"label": "Zinc Supplement", "category": "Supplements", "input_type": "boolean", "default_unit": None},
    {"label": "Cat in Bedroom", "category": "Sleep Environment", "input_type": "boolean", "default_unit": None},
    {"label": "Dog in Bedroom", "category": "Sleep Environment", "input_type": "boolean", "default_unit": None},
    {"label": "Shared Bed", "category": "Sleep Environment", "input_type": "boolean", "default_unit": None},
    {"label": "Sleep in Dark Room", "category": "Sleep Environment", "input_type": "boolean", "default_unit": None},
    {"label": "Sleep in Own Bed", "category": "Sleep Environment", "input_type": "boolean", "default_unit": None},
    {"label": "Sleep at High Altitude", "category": "Sleep Environment", "input_type": "boolean", "default_unit": None},
    {"label": "Sleep Disruption", "category": "Sleep Environment", "input_type": "boolean", "default_unit": None},
    {"label": "Sleep Mask", "category": "Sleep Environment", "input_type": "boolean", "default_unit": None},
    {"label": "Mouthguard", "category": "Sleep Environment", "input_type": "boolean", "default_unit": None},
    {"label": "Mouth Tape", "category": "Sleep Environment", "input_type": "boolean", "default_unit": None},
    {"label": "Nasal Strip", "category": "Sleep Environment", "input_type": "boolean", "default_unit": None},
    {"label": "Read in Bed", "category": "Sleep Environment", "input_type": "boolean", "default_unit": None},
    {"label": "Phone in Bed", "category": "Sleep Environment", "input_type": "boolean", "default_unit": None},
    {"label": "Hot Shower Before Bed", "category": "Sleep Environment", "input_type": "boolean", "default_unit": None},
    {"label": "Blue Light Blocking Glasses", "category": "Sleep Environment", "input_type": "boolean", "default_unit": None},
    {"label": "Breathwork", "category": "Recovery", "input_type": "boolean", "default_unit": None},
    {"label": "Meditation", "category": "Recovery", "input_type": "boolean", "default_unit": None},
    {"label": "Morning Sunlight", "category": "Recovery", "input_type": "boolean", "default_unit": None},
    {"label": "Sauna", "category": "Recovery", "input_type": "boolean", "default_unit": None},
    {"label": "Steam Room", "category": "Recovery", "input_type": "boolean", "default_unit": None},
    {"label": "Stretching", "category": "Recovery", "input_type": "boolean", "default_unit": None},
    {"label": "Cold Shower", "category": "Recovery", "input_type": "boolean", "default_unit": None},
    {"label": "Foam Roller", "category": "Recovery", "input_type": "boolean", "default_unit": None},
    {"label": "Massage Therapy", "category": "Recovery", "input_type": "boolean", "default_unit": None},
    {"label": "Post Meal Walk", "category": "Recovery", "input_type": "boolean", "default_unit": None},
    {"label": "Journaling", "category": "Recovery", "input_type": "boolean", "default_unit": None},
    {"label": "Solo Time", "category": "Recovery", "input_type": "boolean", "default_unit": None},
    {"label": "Bloating", "category": "Symptoms", "input_type": "boolean", "default_unit": None},
    {"label": "Fatigue", "category": "Symptoms", "input_type": "boolean", "default_unit": None},
    {"label": "Muscle/Body Ache", "category": "Symptoms", "input_type": "boolean", "default_unit": None},
    {"label": "Sickness", "category": "Symptoms", "input_type": "boolean", "default_unit": None},
    {"label": "Back Pain", "category": "Symptoms", "input_type": "boolean", "default_unit": None},
    {"label": "Brain Fog", "category": "Symptoms", "input_type": "boolean", "default_unit": None},
    {"label": "Congestion", "category": "Symptoms", "input_type": "boolean", "default_unit": None},
    {"label": "Diarrhea", "category": "Symptoms", "input_type": "boolean", "default_unit": None},
    {"label": "Fever", "category": "Symptoms", "input_type": "boolean", "default_unit": None},
    {"label": "Headache", "category": "Symptoms", "input_type": "boolean", "default_unit": None},
    {"label": "Heartburn", "category": "Symptoms", "input_type": "boolean", "default_unit": None},
    {"label": "Indigestion", "category": "Symptoms", "input_type": "boolean", "default_unit": None},
    {"label": "Nausea", "category": "Symptoms", "input_type": "boolean", "default_unit": None},
    {"label": "Seasonal Allergies", "category": "Symptoms", "input_type": "boolean", "default_unit": None},
    {"label": "Soreness", "category": "Symptoms", "input_type": "boolean", "default_unit": None},
    {"label": "Depression", "category": "Mental State", "input_type": "boolean", "default_unit": None},
    {"label": "Reduced Motivation", "category": "Mental State", "input_type": "boolean", "default_unit": None},
    {"label": "Relationship Stress", "category": "Mental State", "input_type": "boolean", "default_unit": None},
    {"label": "Masturbation", "category": "Sexual Health", "input_type": "boolean", "default_unit": None},
    {"label": "Sexual Activity", "category": "Sexual Health", "input_type": "boolean", "default_unit": None},
    {"label": "Work Commute", "category": "Travel & Work", "input_type": "number", "default_unit": "minutes"},
    {"label": "Air Travel", "category": "Travel & Work", "input_type": "boolean", "default_unit": None},
    {"label": "Work From Home", "category": "Travel & Work", "input_type": "boolean", "default_unit": None},
    {"label": "Vacation", "category": "Travel & Work", "input_type": "boolean", "default_unit": None},
    {"label": "Social Media Usage", "category": "Screen & Stimulation", "input_type": "number", "default_unit": "minutes"},
    {"label": "Video Games", "category": "Screen & Stimulation", "input_type": "number", "default_unit": "minutes"},
]


def _journal_option_key(label: str) -> str:
    """Build a stable journal option key from a human label."""
    key = re.sub(r"[^a-z0-9]+", "_", label.lower()).strip("_")
    return key


def _weekday_tasks() -> list[dict[str, str | None]]:
    """Return the weekday non-exam task template."""
    return [
        {"title": "Wake, hydrate, freshen up", "category": "Recovery", "planned_start": "05:30", "planned_end": None},
        {"title": "Gym/Cardio", "category": "Fitness", "planned_start": "06:15", "planned_end": "08:00"},
        {"title": "Get ready + breakfast", "category": "Recovery", "planned_start": "08:00", "planned_end": "08:45"},
        {"title": "Office / IHCL work", "category": "Office", "planned_start": "09:00", "planned_end": "15:00"},
        {"title": "Golf practice", "category": "Golf", "planned_start": "15:30", "planned_end": "18:30"},
        {"title": "Rest + dinner", "category": "Recovery", "planned_start": "18:30", "planned_end": "19:45"},
        {"title": "Study setup", "category": "Admin", "planned_start": "19:45", "planned_end": "20:00"},
        {"title": "DBE study block", "category": "DBE", "planned_start": "20:00", "planned_end": "22:30"},
        {"title": "Daily log + tomorrow top 3", "category": "Admin", "planned_start": "22:30", "planned_end": "22:45"},
        {"title": "Sleep", "category": "Sleep", "planned_start": "22:45", "planned_end": None},
    ]


def _weekend_tasks() -> list[dict[str, str | None]]:
    """Return the weekend non-exam task template."""
    return [
        {"title": "Wake + hydrate", "category": "Recovery", "planned_start": "05:30", "planned_end": None},
        {"title": "Cardio / mobility", "category": "Fitness", "planned_start": "06:00", "planned_end": "07:00"},
        {"title": "Bath + breakfast", "category": "Recovery", "planned_start": "07:00", "planned_end": "08:00"},
        {"title": "DBE Deep Work 1", "category": "DBE", "planned_start": "08:00", "planned_end": "10:30"},
        {"title": "DBE Questions / notes", "category": "DBE", "planned_start": "10:45", "planned_end": "13:00"},
        {"title": "Lunch + rest", "category": "Recovery", "planned_start": "13:00", "planned_end": "14:30"},
        {"title": "Light golf / recovery", "category": "Golf", "planned_start": "14:30", "planned_end": "16:00"},
        {"title": "DBE deep work / questions / weak areas", "category": "DBE", "planned_start": "16:00", "planned_end": "18:00"},
        {"title": "Active recall / error log", "category": "DBE", "planned_start": "19:30", "planned_end": "21:00"},
        {"title": "Scrum review", "category": "Admin", "planned_start": "21:00", "planned_end": "21:30"},
        {"title": "Sleep", "category": "Sleep", "planned_start": "22:45", "planned_end": None},
    ]


def _exam_tasks() -> list[dict[str, str | None]]:
    """Return the exam day task template."""
    return [
        {"title": "Wake, hydrate, calm start", "category": "Recovery", "planned_start": "05:30", "planned_end": None},
        {"title": "Light mobility / walk", "category": "Fitness", "planned_start": "06:00", "planned_end": "06:30"},
        {"title": "Breakfast", "category": "Recovery", "planned_start": "06:30", "planned_end": "07:15"},
        {"title": "Final light revision", "category": "DBE", "planned_start": "07:15", "planned_end": "08:00"},
        {"title": "DBE Exam Block", "category": "DBE", "planned_start": None, "planned_end": None},
        {"title": "Post-exam food + rest", "category": "Recovery", "planned_start": None, "planned_end": None},
        {"title": "Afternoon recovery / nap / walk", "category": "Recovery", "planned_start": None, "planned_end": None},
        {"title": "Evening revision/reflection", "category": "DBE", "planned_start": "19:30", "planned_end": "21:30"},
        {"title": "Reflection + prep", "category": "Admin", "planned_start": "21:30", "planned_end": "22:00"},
        {"title": "Sleep", "category": "Sleep", "planned_start": "22:45", "planned_end": None},
    ]


def _task_template_for_day_type(day_type: str) -> list[dict[str, str | None]]:
    """Return the appropriate task template for a day type."""
    if day_type == "Weekend":
        return _weekend_tasks()
    if day_type.startswith("Exam"):
        return _exam_tasks()
    return _weekday_tasks()


def _day_title(day_type: str, day_date: date) -> str:
    """Build a simple title for a day plan."""
    return f"{day_type} - {day_date.isoformat()}"


def _day_priority(day_type: str) -> str:
    """Return the default priority copy for a given day type."""
    if day_type == "Weekend":
        return DEFAULT_PRIORITY_BY_DAY_TYPE["weekend"]
    if day_type.startswith("Exam"):
        return DEFAULT_PRIORITY_BY_DAY_TYPE["exam"]
    return DEFAULT_PRIORITY_BY_DAY_TYPE["weekday"]


def seed_journal_options(session: Session) -> dict[str, int | str]:
    """Seed the full structured Peak Aura journal option catalog."""
    created_count = 0
    updated_count = 0

    existing_options = {
        option.key: option for option in session.exec(select(JournalOption)).all()
    }

    for sort_order, option_definition in enumerate(JOURNAL_OPTION_DEFINITIONS, start=1):
        label = str(option_definition["label"])
        key = _journal_option_key(label)
        category = str(option_definition["category"])
        input_type = str(option_definition["input_type"])
        default_unit = (
            str(option_definition["default_unit"])
            if option_definition["default_unit"] is not None
            else None
        )

        existing_option = existing_options.get(key)
        if existing_option is None:
            session.add(
                JournalOption(
                    key=key,
                    label=label,
                    category=category,
                    input_type=input_type,
                    default_unit=default_unit,
                    description=None,
                    is_active=True,
                    sort_order=sort_order,
                )
            )
            created_count += 1
            continue

        changed = False
        if existing_option.label != label:
            existing_option.label = label
            changed = True
        if existing_option.category != category:
            existing_option.category = category
            changed = True
        if existing_option.input_type != input_type:
            existing_option.input_type = input_type
            changed = True
        if existing_option.default_unit != default_unit:
            existing_option.default_unit = default_unit
            changed = True
        if existing_option.sort_order != sort_order:
            existing_option.sort_order = sort_order
            changed = True
        if existing_option.is_active is not True:
            existing_option.is_active = True
            changed = True

        if changed:
            session.add(existing_option)
            updated_count += 1

    if created_count or updated_count:
        session.commit()

    return {
        "status": "ok",
        "message": "Journal options seeded.",
        "options_total": len(JOURNAL_OPTION_DEFINITIONS),
        "options_created": created_count,
        "options_updated": updated_count,
    }


def seed_peak_aura_lite(session: Session) -> dict[str, int | str]:
    """Seed the initial May 2026 DBE sprint and related plans."""
    existing_sprint = session.exec(
        select(Sprint).where(Sprint.name == SPRINT_NAME)
    ).first()

    if existing_sprint is not None:
        updated_day_plans = 0
        updated_tasks = 0
        existing_day_plans = session.exec(
            select(DayPlan).where(DayPlan.sprint_id == existing_sprint.id)
        ).all()

        for day_plan in existing_day_plans:
            if day_plan.today_priority:
                continue

            day_plan.today_priority = _day_priority(day_plan.day_type)
            session.add(day_plan)
            updated_day_plans += 1

        for day_plan in existing_day_plans:
            if day_plan.id is None:
                continue

            existing_tasks = session.exec(
                select(Task).where(Task.day_plan_id == day_plan.id)
            ).all()

            for task in existing_tasks:
                changed = False

                if task.date is None:
                    task.date = day_plan.date
                    changed = True

                if not task.source:
                    task.source = "peak_aura"
                    changed = True

                if changed:
                    session.add(task)
                    updated_tasks += 1

        if updated_day_plans or updated_tasks:
            session.commit()

        return {
            "status": "skipped",
            "message": "Seed data already exists.",
            "sprint_id": existing_sprint.id or 0,
            "day_plans_updated": updated_day_plans,
            "tasks_updated": updated_tasks,
        }

    sprint = Sprint(
        name=SPRINT_NAME,
        start_date=date(2026, 5, 13),
        end_date=date(2026, 5, 31),
        main_mission="DBE exams",
        secondary_tracks="Fitness + golf continuity",
        maintenance_tracks="AI / venture / portfolio",
        definition_of_done=(
            "4/4 exams attempted seriously; 12+ night DBE blocks; "
            "3+ timed practices; 4+ error-log updates; 3 reviews; "
            "June sprint drafted."
        ),
    )
    session.add(sprint)
    session.flush()

    created_day_plans = 0
    created_tasks = 0

    for day_date in sorted(SPRINT_DAY_TYPES):
        day_type = SPRINT_DAY_TYPES[day_date]
        day_plan = DayPlan(
            sprint_id=sprint.id,
            date=day_date,
            title=_day_title(day_type, day_date),
            day_type=day_type,
            today_priority=_day_priority(day_type),
            planned_wake_time="05:30",
            planned_sleep_time="22:45",
            notes=None,
        )
        session.add(day_plan)
        session.flush()
        created_day_plans += 1

        for task_template in _task_template_for_day_type(day_type):
            task = Task(
                sprint_id=sprint.id,
                day_plan_id=day_plan.id,
                date=day_plan.date,
                title=task_template["title"] or "",
                description=None,
                location=None,
                category=task_template["category"] or "",
                source="peak_aura",
                is_routine=False,
                recurrence_rule=None,
                planned_start=task_template["planned_start"],
                planned_end=task_template["planned_end"],
                status="planned",
                evidence_required=False,
                evidence_note=None,
            )
            session.add(task)
            created_tasks += 1

    session.commit()
    session.refresh(sprint)

    return {
        "status": "created",
        "message": "Peak Aura Lite seed data created.",
        "sprint_id": sprint.id or 0,
        "day_plans_created": created_day_plans,
        "tasks_created": created_tasks,
    }


def main() -> None:
    """Run the seed script directly from the command line."""
    create_db_and_tables()
    with Session(engine) as session:
        result = seed_peak_aura_lite(session)
        print(result)


if __name__ == "__main__":
    main()
