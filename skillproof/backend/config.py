import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Base backend directory
BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent

# Load .env file from skillproof root or backend
env_path = ROOT_DIR / ".env"
if not env_path.exists():
    env_path = BASE_DIR / ".env"
load_dotenv(dotenv_path=env_path)

ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
PORT: int = int(os.getenv("PORT", "8000"))
HOST: str = os.getenv("HOST", "0.0.0.0")

# Database URL (Defaults to SQLite for local development)
DATABASE_URL: str = os.getenv(
    "DATABASE_URL", 
    f"sqlite:///{BASE_DIR / 'skillproof.db'}"
)
FALLBACK_SQLITE: bool = os.getenv("FALLBACK_SQLITE", "true").lower() in ("true", "1", "yes")

# Anthropic Claude Configuration
ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL: str = os.getenv("CLAUDE_MODEL", "claude-sonnet-5-5")

# GitHub Token (Optional, for higher rate limits)
GITHUB_TOKEN: str = os.getenv("GITHUB_TOKEN", "")

# CORS
cors_raw: str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000")
CORS_ORIGINS: List[str] = [origin.strip() for origin in cors_raw.split(",") if origin.strip()]

# Data directories
DATA_DIR = BASE_DIR / "data"
PROMPTS_DIR = BASE_DIR / "prompts"

