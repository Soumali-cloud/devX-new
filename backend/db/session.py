"""SQLite session and route audit persistence."""

from pathlib import Path

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

PROJECT_ROOT = Path(__file__).resolve().parents[2]
engine = create_engine(f"sqlite:///{PROJECT_ROOT / 'data' / 'navigation.db'}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    from backend.db.models import IcebergSimulation, RouteAudit
    (PROJECT_ROOT / "data").mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)
    # ``create_all`` does not alter an existing SQLite table.  Keep local audit
    # databases from older releases usable as mission metadata is introduced.
    with engine.begin() as connection:
        existing_columns = {
            row[1] for row in connection.execute(text("PRAGMA table_info(route_audits)"))
        }
        if "mission_id" not in existing_columns:
            connection.execute(text(
                "ALTER TABLE route_audits ADD COLUMN mission_id VARCHAR(128) NOT NULL DEFAULT 'default'"
            ))
        if "route_data" not in existing_columns:
            connection.execute(text(
                "ALTER TABLE route_audits ADD COLUMN route_data TEXT NOT NULL DEFAULT '{}'"
            ))


def get_db():
    """Yield a SQLite session for request-scoped database access.

    SQLite is the supported local fallback.  PostGIS and Redis are optional
    Compose services and are deliberately not required for API startup.
    """
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
