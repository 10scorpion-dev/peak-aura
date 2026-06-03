"""Database configuration for the Peak Aura Lite backend."""

from collections.abc import Generator

from sqlalchemy import inspect, text
from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = "sqlite:///./peak_aura.db"

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)


def create_db_and_tables() -> None:
    """Create database tables for all registered SQLModel models."""
    from app import models  # noqa: F401

    SQLModel.metadata.create_all(engine)
    _run_sqlite_migrations()


def _run_sqlite_migrations() -> None:
    """Apply tiny schema updates needed for local SQLite development."""
    inspector = inspect(engine)
    table_names = inspector.get_table_names()

    with engine.begin() as connection:
        if "dayplan" in table_names:
            dayplan_columns = {column["name"] for column in inspector.get_columns("dayplan")}

            if "today_priority" not in dayplan_columns:
                connection.execute(text("ALTER TABLE dayplan ADD COLUMN today_priority TEXT"))

        if "task" in table_names:
            task_columns = {column["name"] for column in inspector.get_columns("task")}

            if "date" not in task_columns:
                connection.execute(text("ALTER TABLE task ADD COLUMN date DATE"))

            if "description" not in task_columns:
                connection.execute(text("ALTER TABLE task ADD COLUMN description TEXT"))

            if "location" not in task_columns:
                connection.execute(text("ALTER TABLE task ADD COLUMN location TEXT"))

            if "source" not in task_columns:
                connection.execute(
                    text("ALTER TABLE task ADD COLUMN source TEXT DEFAULT 'peak_aura'")
                )

            if "is_routine" not in task_columns:
                connection.execute(
                    text("ALTER TABLE task ADD COLUMN is_routine BOOLEAN DEFAULT 0")
                )

            if "recurrence_rule" not in task_columns:
                connection.execute(text("ALTER TABLE task ADD COLUMN recurrence_rule TEXT"))

            connection.execute(
                text("UPDATE task SET source = 'peak_aura' WHERE source IS NULL")
            )
            connection.execute(text("UPDATE task SET is_routine = 0 WHERE is_routine IS NULL"))

            if "dayplan" in table_names:
                connection.execute(
                    text(
                        """
                        UPDATE task
                        SET date = (
                            SELECT dayplan.date
                            FROM dayplan
                            WHERE dayplan.id = task.day_plan_id
                        )
                        WHERE date IS NULL
                          AND day_plan_id IS NOT NULL
                        """
                    )
                )

        if "activitylog" in table_names:
            activitylog_columns = {
                column["name"] for column in inspector.get_columns("activitylog")
            }

            if "numeric_value" not in activitylog_columns:
                connection.execute(
                    text("ALTER TABLE activitylog ADD COLUMN numeric_value FLOAT")
                )

            if "unit" not in activitylog_columns:
                connection.execute(text("ALTER TABLE activitylog ADD COLUMN unit TEXT"))

            if "sensitivity" not in activitylog_columns:
                connection.execute(
                    text("ALTER TABLE activitylog ADD COLUMN sensitivity TEXT")
                )

        if "whoopmanualentry" in table_names:
            whoop_columns = {
                column["name"] for column in inspector.get_columns("whoopmanualentry")
            }

            if "spo2" not in whoop_columns:
                connection.execute(text("ALTER TABLE whoopmanualentry ADD COLUMN spo2 FLOAT"))

            if "calories_burned" not in whoop_columns:
                connection.execute(
                    text("ALTER TABLE whoopmanualentry ADD COLUMN calories_burned INTEGER")
                )

            if "calorie_intake" not in whoop_columns:
                connection.execute(
                    text("ALTER TABLE whoopmanualentry ADD COLUMN calorie_intake INTEGER")
                )

            if "sleep_debt" not in whoop_columns:
                connection.execute(
                    text("ALTER TABLE whoopmanualentry ADD COLUMN sleep_debt FLOAT")
                )

        if "googlecalendarconnection" in table_names:
            google_columns = {
                column["name"]
                for column in inspector.get_columns("googlecalendarconnection")
            }

            if "provider" not in google_columns:
                connection.execute(
                    text("ALTER TABLE googlecalendarconnection ADD COLUMN provider TEXT DEFAULT 'google'")
                )

            if "access_token" not in google_columns:
                connection.execute(
                    text("ALTER TABLE googlecalendarconnection ADD COLUMN access_token TEXT")
                )

            if "refresh_token" not in google_columns:
                connection.execute(
                    text("ALTER TABLE googlecalendarconnection ADD COLUMN refresh_token TEXT")
                )

            if "token_uri" not in google_columns:
                connection.execute(
                    text("ALTER TABLE googlecalendarconnection ADD COLUMN token_uri TEXT")
                )

            if "client_id" not in google_columns:
                connection.execute(
                    text("ALTER TABLE googlecalendarconnection ADD COLUMN client_id TEXT")
                )

            if "client_secret" not in google_columns:
                connection.execute(
                    text("ALTER TABLE googlecalendarconnection ADD COLUMN client_secret TEXT")
                )

            if "scopes" not in google_columns:
                connection.execute(
                    text("ALTER TABLE googlecalendarconnection ADD COLUMN scopes TEXT")
                )

            if "expiry" not in google_columns:
                connection.execute(
                    text("ALTER TABLE googlecalendarconnection ADD COLUMN expiry DATETIME")
                )

            if "created_at" not in google_columns:
                connection.execute(
                    text("ALTER TABLE googlecalendarconnection ADD COLUMN created_at DATETIME")
                )

            if "updated_at" not in google_columns:
                connection.execute(
                    text("ALTER TABLE googlecalendarconnection ADD COLUMN updated_at DATETIME")
                )


def get_session() -> Generator[Session, None, None]:
    """Provide a database session to route handlers."""
    with Session(engine) as session:
        yield session
