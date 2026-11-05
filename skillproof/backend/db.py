import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from backend.config import DATABASE_URL, FALLBACK_SQLITE, BASE_DIR

logger = logging.getLogger("skillproof.db")

Base = declarative_base()

def get_engine():
    """Create SQLAlchemy engine with automatic SQLite fallback if MySQL is unreachable."""
    try:
        if DATABASE_URL.startswith("mysql"):
            # Try connecting with short pool timeout to verify MySQL reachability
            engine = create_engine(
                DATABASE_URL,
                pool_pre_ping=True,
                pool_recycle=3600,
                connect_args={"connect_timeout": 3}
            )
            # Test connection
            with engine.connect():
                logger.info(f"Connected successfully to MySQL database: {DATABASE_URL}")
                return engine
        elif DATABASE_URL.startswith("sqlite"):
            return create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
        else:
            return create_engine(DATABASE_URL)
    except Exception as e:
        if FALLBACK_SQLITE:
            sqlite_path = BASE_DIR / "skillproof.db"
            sqlite_url = f"sqlite:///{sqlite_path}"
            logger.warning(
                f"Failed to connect to MySQL database ({e}). "
                f"Falling back to local SQLite at {sqlite_url}"
            )
            return create_engine(sqlite_url, connect_args={"check_same_thread": False})
        raise e

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """FastAPI dependency to yield database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize all database tables."""
    import backend.models  # noqa: F401
    Base.metadata.create_all(bind=engine)

