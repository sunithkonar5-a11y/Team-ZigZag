import json
import logging
from sqlalchemy.orm import Session
from backend.config import DATA_DIR
from backend.db import SessionLocal, init_db
from backend.models import Opportunity, Student, Skill
from backend.services.normalize import normalize_skill_name

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("skillproof.seed")

def seed_opportunities(db: Session) -> int:
    path = DATA_DIR / "opportunities.json"
    if not path.exists():
        logger.warning(f"Opportunities seed file not found at {path}")
        return 0

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    count = 0
    for item in data:
        existing = db.query(Opportunity).filter(
            Opportunity.title == item["title"],
            Opportunity.company_or_lab == item["company_or_lab"]
        ).first()

        if not existing:
            opp = Opportunity(
                title=item["title"],
                company_or_lab=item["company_or_lab"],
                role_type=item["role_type"],
                description=item["description"],
                required_skills=item.get("required_skills", []),
                preferred_skills=item.get("preferred_skills", []),
                min_experience=item.get("min_experience", "Any"),
                location=item.get("location", "Remote"),
                link=item.get("link")
            )
            db.add(opp)
            count += 1
    db.commit()
    logger.info(f"Seeded {count} opportunities into database.")
    return count

def seed_students(db: Session) -> int:
    path = DATA_DIR / "students.json"
    if not path.exists():
        logger.warning(f"Students seed file not found at {path}")
        return 0

    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    count = 0
    for item in data:
        existing = None
        if item.get("github_username"):
            existing = db.query(Student).filter(
                Student.github_username == item["github_username"]
            ).first()

        if not existing:
            student = Student(
                name=item["name"],
                github_username=item.get("github_username"),
                email=item.get("email"),
                avatar_url=item.get("avatar_url"),
                bio=item.get("bio"),
                raw_data={"repos_analyzed": item.get("repos_analyzed", 0)}
            )
            db.add(student)
            db.flush()

            for sk in item.get("skills", []):
                norm = normalize_skill_name(sk.get("normalized_name") or sk.get("name", ""))
                skill = Skill(
                    student_id=student.id,
                    name=sk["name"],
                    normalized_name=norm,
                    category=sk.get("category", "tool"),
                    level=sk.get("level", "Intermediate"),
                    confidence=float(sk.get("confidence", 0.75)),
                    evidence=sk.get("evidence"),
                    source=sk.get("source", "github")
                )
                db.add(skill)
            count += 1
    db.commit()
    logger.info(f"Seeded {count} student profiles and their verified skills into database.")
    return count

def run_seed():
    """Initializes tables and seeds data."""
    init_db()
    db = SessionLocal()
    try:
        seed_opportunities(db)
        seed_students(db)
        logger.info("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Seeding failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()

