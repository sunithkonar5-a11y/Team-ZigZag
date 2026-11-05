import json
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.config import DATA_DIR
from backend.db import get_db
from backend.models import Student, Skill
from backend.schemas import ProfileAnalyzeRequest, StudentProfileResponse, SkillResponse
from backend.services.github import fetch_github_profile
from backend.services.llm import extract_skills_from_profile
from backend.services.normalize import normalize_skill_name
from backend.services.cache import make_cache_key, get_cached_response, set_cached_response

router = APIRouter(tags=["profile"])
logger = logging.getLogger("skillproof.routers.profile")

@router.get("/demo-profile", response_model=StudentProfileResponse)
def get_demo_profile(db: Session = Depends(get_db)):
    """Return pre-cached rich demo student profile immediately."""
    demo_path = DATA_DIR / "demo_profile.json"
    if not demo_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Demo profile data file not found."
        )

    with open(demo_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Check if demo student exists in DB, or persist it
    student = db.query(Student).filter(Student.github_username == data.get("github_username")).first()
    if not student:
        student = Student(
            name=data["name"],
            github_username=data.get("github_username"),
            email=data.get("email"),
            avatar_url=data.get("avatar_url"),
            bio=data.get("bio"),
            raw_data={"repos_analyzed": data.get("repos_analyzed", 14)}
        )
        db.add(student)
        db.flush()

        for sk in data.get("skills", []):
            norm = normalize_skill_name(sk.get("normalized_name") or sk.get("name", ""))
            skill = Skill(
                student_id=student.id,
                name=sk["name"],
                normalized_name=norm,
                category=sk.get("category", "tool"),
                level=sk.get("level", "Intermediate"),
                confidence=float(sk.get("confidence", 0.85)),
                evidence=sk.get("evidence"),
                source=sk.get("source", "github")
            )
            db.add(skill)
        db.commit()
        db.refresh(student)

    # Build response
    skills_resp = [
        SkillResponse(
            id=s.id,
            student_id=s.student_id,
            name=s.name,
            normalized_name=s.normalized_name,
            category=s.category,
            level=s.level,
            confidence=s.confidence,
            evidence=s.evidence,
            source=s.source,
            created_at=s.created_at
        )
        for s in student.skills
    ]

    return StudentProfileResponse(
        id=student.id,
        github_username=student.github_username,
        name=student.name,
        email=student.email,
        avatar_url=student.avatar_url,
        bio=student.bio,
        skills=skills_resp,
        repos_analyzed=student.raw_data.get("repos_analyzed", 14) if student.raw_data else 14,
        created_at=student.created_at
    )

@router.post("/analyze-profile", response_model=StudentProfileResponse)
async def analyze_profile(req: ProfileAnalyzeRequest, db: Session = Depends(get_db)):
    """Fetch GitHub repositories, analyze code evidence with LLM, and persist verified skills."""
    if not req.github_username and not req.resume_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a GitHub username or resume context."
        )

    username = req.github_username.strip() if req.github_username else "anonymous"
    cache_key = make_cache_key("analyze_profile", username, req.resume_text or "", ",".join(req.manual_skills or []))
    
    # 1. Check cached responses
    cached_data = get_cached_response(cache_key, db)
    if cached_data:
        try:
            return StudentProfileResponse(**cached_data)
        except Exception:
            pass

    # 2. Fetch GitHub data if username provided
    github_data = {}
    if req.github_username:
        try:
            github_data = await fetch_github_profile(req.github_username)
        except ValueError as ve:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(ve))
        except PermissionError as pe:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(pe))
        except Exception as e:
            logger.warning(f"GitHub fetch failed ({e}); proceeding with resume/manual info.")
            github_data = {
                "username": req.github_username,
                "name": req.github_username,
                "repos_analyzed": 0,
                "repos": []
            }
    else:
        github_data = {
            "username": "candidate",
            "name": "Applicant",
            "repos_analyzed": 0,
            "repos": []
        }

    # 3. Extract skills with LLM or fallback
    extracted_skills = await extract_skills_from_profile(github_data, req.resume_text)

    # Incorporate manual skills if supplied
    if req.manual_skills:
        existing_names = {s["name"].lower() for s in extracted_skills}
        for ms in req.manual_skills:
            if ms.strip().lower() not in existing_names:
                extracted_skills.append({
                    "name": ms.strip(),
                    "normalized_name": normalize_skill_name(ms),
                    "level": "Beginner",
                    "confidence": 0.35,
                    "evidence": f"Candidate self-reported this skill: {ms.strip()}. Not independently verified.",
                    "source": "self-reported"
                })

    # Do not create a misleading empty profile when GitHub and pasted text contain no evidence.
    if not extracted_skills:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No skill evidence found. Add public repositories with descriptions/README files or paste project details. You can also use the demo profile."
        )

    # 4. Save or update Student in DB
    student = None
    if req.github_username:
        student = db.query(Student).filter(Student.github_username == github_data["username"]).first()

    if not student:
        student = Student(
            github_username=github_data.get("username") if req.github_username else None,
            name=github_data.get("name") or "Applicant",
            email=github_data.get("email"),
            avatar_url=github_data.get("avatar_url") or "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            bio=github_data.get("bio") or (req.resume_text[:200] if req.resume_text else ""),
            raw_data={"repos_analyzed": github_data.get("repos_analyzed", 0)}
        )
        db.add(student)
        db.flush()
    else:
        # Update existing student
        student.name = github_data.get("name") or student.name
        student.bio = github_data.get("bio") or student.bio
        student.avatar_url = github_data.get("avatar_url") or student.avatar_url
        student.raw_data = {"repos_analyzed": github_data.get("repos_analyzed", 0)}
        # Clear previous skills to refresh with new analysis
        db.query(Skill).filter(Skill.student_id == student.id).delete()
        db.flush()

    # 5. Persist skills
    saved_skills = []
    for sk in extracted_skills:
        norm = normalize_skill_name(sk.get("normalized_name") or sk.get("name", ""))
        skill_record = Skill(
            student_id=student.id,
            name=sk["name"],
            normalized_name=norm,
            category=sk.get("category", "tool"),
            level=sk.get("level", "Intermediate"),
            confidence=float(sk.get("confidence", 0.75)),
            evidence=sk.get("evidence"),
            source=sk.get("source", "github")
        )
        db.add(skill_record)
        saved_skills.append(skill_record)

    db.commit()
    db.refresh(student)

    # Format response
    skills_resp = [
        SkillResponse(
            id=s.id,
            student_id=s.student_id,
            name=s.name,
            normalized_name=s.normalized_name,
            category=s.category,
            level=s.level,
            confidence=s.confidence,
            evidence=s.evidence,
            source=s.source,
            created_at=s.created_at
        )
        for s in student.skills
    ]

    response_payload = StudentProfileResponse(
        id=student.id,
        github_username=student.github_username,
        name=student.name,
        email=student.email,
        avatar_url=student.avatar_url,
        bio=student.bio,
        skills=skills_resp,
        repos_analyzed=github_data.get("repos_analyzed", len(github_data.get("repos", []))),
        created_at=student.created_at
    )

    # Cache response
    set_cached_response(cache_key, "analyze_profile", response_payload.model_dump(mode="json"), db)

    return response_payload

