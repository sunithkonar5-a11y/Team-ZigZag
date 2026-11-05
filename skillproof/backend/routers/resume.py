import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import Student, Skill
from backend.schemas import StudentProfileResponse, SkillResponse
from backend.services.normalize import normalize_skill_name
from backend.services.opportunities_db import fetch_opportunities_from_db
from backend.services.resume_advisor import (
    extract_text_from_file,
    extract_profile_from_resume_text,
    generate_personalized_suggestions
)

router = APIRouter(tags=["resume"])
logger = logging.getLogger("skillproof.routers.resume")

@router.post("/resume/upload")
async def upload_and_analyze_resume(
    file: UploadFile = File(...),
    github_username: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload a resume file (.pdf, .docx, .txt) and generate deeply personalized career suggestions."""
    filename = file.filename or "resume.txt"
    if not any(filename.lower().endswith(ext) for ext in [".pdf", ".docx", ".txt", ".md"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF (.pdf), Word (.docx), or plain text (.txt) file."
        )

    try:
        content_bytes = await file.read()
        raw_text = extract_text_from_file(content_bytes, filename)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read file: {str(e)}"
        )

    if not raw_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file appears to be empty or unreadable."
        )

    # Extract structured candidate data from resume text
    parsed_data = extract_profile_from_resume_text(raw_text)
    if github_username and github_username.strip():
        parsed_data["github_username"] = github_username.strip().lstrip("@")

    # Persist or update Student in DB
    student = None
    if parsed_data.get("github_username"):
        student = db.query(Student).filter(Student.github_username == parsed_data["github_username"]).first()

    if not student:
        student = Student(
            name=parsed_data["name"],
            github_username=parsed_data.get("github_username"),
            email=parsed_data.get("email"),
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            bio=parsed_data.get("bio", ""),
            raw_data={"source": "resume_upload", "filename": filename}
        )
        db.add(student)
        db.flush()
    else:
        student.name = parsed_data["name"] or student.name
        student.bio = parsed_data.get("bio") or student.bio
        # Clear existing skills to refresh with resume evidence
        db.query(Skill).filter(Skill.student_id == student.id).delete()
        db.flush()

    # Save extracted verified skills
    for sk in parsed_data.get("skills", []):
        norm = normalize_skill_name(sk.get("normalized_name") or sk.get("name", ""))
        skill_rec = Skill(
            student_id=student.id,
            name=sk["name"],
            normalized_name=norm,
            category=sk.get("category", "tool"),
            level=sk.get("level", "Intermediate"),
            confidence=float(sk.get("confidence", 0.8)),
            evidence=sk.get("evidence"),
            source="resume"
        )
        db.add(skill_rec)

    db.commit()
    db.refresh(student)

    # Format response profile
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

    profile_resp = StudentProfileResponse(
        id=student.id,
        github_username=student.github_username,
        name=student.name,
        email=student.email,
        avatar_url=student.avatar_url,
        bio=student.bio,
        skills=skills_resp,
        repos_analyzed=len(skills_resp),
        created_at=student.created_at
    )

    # Load opportunities from opportunities69.db
    opportunities = fetch_opportunities_from_db()

    # Generate personalized career suggestions
    suggestions = generate_personalized_suggestions(
        student_profile={
            "id": student.id,
            "name": student.name,
            "skills": [s.model_dump() for s in skills_resp]
        },
        opportunities=opportunities
    )

    return {
        "profile": profile_resp,
        "suggestions": suggestions
    }

@router.post("/resume/suggestions")
def get_personalized_suggestions_for_student(
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Generate personalized career trajectory and tailored blueprints based on student's current skills."""
    student_id = payload.get("student_id")
    student_data = None

    if student_id:
        st = db.query(Student).filter(Student.id == student_id).first()
        if st:
            student_data = {
                "id": st.id,
                "name": st.name,
                "skills": [
                    {
                        "name": s.name,
                        "normalized_name": s.normalized_name,
                        "level": s.level,
                        "confidence": s.confidence,
                        "evidence": s.evidence,
                        "category": s.category,
                        "source": s.source
                    }
                    for s in st.skills
                ]
            }

    if not student_data:
        # Check if skills provided directly in payload
        skills_raw = payload.get("skills", [])
        student_data = {
            "name": payload.get("name", "Candidate"),
            "skills": skills_raw
        }

    opportunities = fetch_opportunities_from_db()
    suggestions = generate_personalized_suggestions(student_data, opportunities)
    return suggestions
