import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import Student, Opportunity
from backend.schemas import (
    TeammateRequest, TeammateResponse, StudentProfileResponse, SkillResponse
)
from backend.services.teammates import find_complementary_teammates
from backend.services.opportunities_db import get_opportunity_by_id
from backend.seed import seed_students

router = APIRouter(tags=["teammates"])
logger = logging.getLogger("skillproof.routers.teammates")

@router.post("/teammates", response_model=List[TeammateResponse])
def get_complementary_teammates(req: TeammateRequest, db: Session = Depends(get_db)):
    """Find complementary peers who cover skill gaps for hackathons or project teams."""
    # 1. Fetch primary student
    student_a_record = db.query(Student).filter(Student.id == req.student_id).first()
    if not student_a_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student {req.student_id} not found."
        )

    # 2. Determine target skills
    target_skills = req.target_skills or []
    if req.opportunity_id:
        opp_dict = get_opportunity_by_id(req.opportunity_id)
        if opp_dict:
            target_skills = list(set((opp_dict.get("required_skills") or []) + (opp_dict.get("preferred_skills") or [])))
        else:
            opp = db.query(Opportunity).filter(Opportunity.id == req.opportunity_id).first()
            if opp:
                target_skills = list(set((opp.required_skills or []) + (opp.preferred_skills or [])))

    # 3. Fetch cohort from database
    cohort_records = db.query(Student).all()
    if len(cohort_records) <= 1:
        seed_students(db)
        cohort_records = db.query(Student).all()

    def serialize_student(st: Student):
        return {
            "id": st.id,
            "name": st.name,
            "github_username": st.github_username,
            "email": st.email,
            "avatar_url": st.avatar_url,
            "bio": st.bio,
            "repos_analyzed": st.raw_data.get("repos_analyzed", 0) if st.raw_data else 0,
            "created_at": st.created_at,
            "skills": [
                {
                    "id": s.id,
                    "student_id": s.student_id,
                    "name": s.name,
                    "normalized_name": s.normalized_name,
                    "level": s.level,
                    "confidence": s.confidence,
                    "evidence": s.evidence,
                    "source": s.source,
                    "created_at": s.created_at
                }
                for s in st.skills
            ]
        }

    student_a_dict = serialize_student(student_a_record)
    cohort_list = [serialize_student(st) for st in cohort_records]

    # 4. Find complementary peers
    complementary_peers = find_complementary_teammates(
        student_a=student_a_dict,
        cohort=cohort_list,
        target_skills=target_skills,
        limit=6
    )

    response = []
    for peer in complementary_peers:
        tm_dict = peer["teammate"]
        tm_skills_resp = [
            SkillResponse(**sk) for sk in tm_dict["skills"]
        ]
        tm_obj = StudentProfileResponse(
            id=tm_dict["id"],
            github_username=tm_dict["github_username"],
            name=tm_dict["name"],
            email=tm_dict["email"],
            avatar_url=tm_dict["avatar_url"],
            bio=tm_dict["bio"],
            skills=tm_skills_resp,
            repos_analyzed=tm_dict.get("repos_analyzed", 0),
            created_at=tm_dict.get("created_at")
        )
        response.append(
            TeammateResponse(
                teammate=tm_obj,
                complementarity_score=peer["complementarity_score"],
                shared_skills=peer["shared_skills"],
                skills_they_cover=peer["skills_they_cover"],
                synergy_reason=peer["synergy_reason"]
            )
        )

    return response

