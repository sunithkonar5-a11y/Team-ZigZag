import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import CORS_ORIGINS, HOST, PORT, ENVIRONMENT
from backend.db import init_db, SessionLocal
from backend.models import Opportunity
from backend.seed import run_seed
from backend.routers import profile, match, org, teammates, auth, resume

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s"
)
logger = logging.getLogger("skillproof.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize schema and seed the demo dataset before accepting requests."""
    logger.info("Initializing SkillProof database and tables...")
    init_db()
    with SessionLocal() as db:
        has_opportunities = db.query(Opportunity).first() is not None
    if not has_opportunities:
        logger.info("Seeding initial dataset into database...")
        run_seed()
    yield
    logger.info("SkillProof service shutdown.")

app = FastAPI(
    title="SkillProof API",
    description="Skill verification & opportunity matching platform for students, developers, and organizations.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers under both /api and root paths for maximum compatibility
for r in (profile.router, match.router, org.router, teammates.router, auth.router, resume.router):
    app.include_router(r, prefix="/api")
    app.include_router(r)

@app.get("/")
def root():
    return {
        "service": "SkillProof API",
        "status": "online",
        "version": "1.0.0",
        "environment": ENVIRONMENT,
        "docs_url": "/docs"
    }

@app.get("/api/health")
@app.get("/health")
def health_check():
    return {"status": "ok", "environment": ENVIRONMENT}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)

