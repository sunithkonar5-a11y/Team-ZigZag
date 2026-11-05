import re
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import Opportunity, Student, Skill
from backend.schemas import (
    OrgMatchRequest, StudentRankResponse, StudentProfileResponse, 
    SkillResponse, OpportunityResponse
)
from backend.services.matching import rank_students_for_role
from backend.services.llm import parse_role_description
from backend.services.normalize import normalize_skills_list
from backend.services.opportunities_db import fetch_opportunities_from_db, get_opportunity_by_id
from backend.seed import seed_students, seed_opportunities

router = APIRouter(tags=["organization"])
logger = logging.getLogger("skillproof.routers.org")

@router.get("/opportunities", response_model=List[OpportunityResponse])
def get_all_opportunities(db: Session = Depends(get_db)):
    """Fetch all available opportunities from opportunities69.db."""
    db_opps = fetch_opportunities_from_db()
    if db_opps:
        return [OpportunityResponse(**o) for o in db_opps]

    records = db.query(Opportunity).all()
    if not records:
        seed_opportunities(db)
        records = db.query(Opportunity).all()
    return records

@router.post("/org-match", response_model=List[StudentRankResponse])
async def match_organization_role(req: OrgMatchRequest, db: Session = Depends(get_db)):
    """Rank all student profiles against an existing opportunity or custom job requirements."""
    # 1. Resolve role specification
    role_spec = {
        "title": req.role_title or "Custom Role",
        "required_skills": req.required_skills or [],
        "preferred_skills": req.preferred_skills or []
    }

    if req.opportunity_id:
        # Check opportunities69.db first
        opp_dict = get_opportunity_by_id(req.opportunity_id)
        if opp_dict:
            role_spec = {
                "title": opp_dict["title"],
                "required_skills": opp_dict.get("required_skills", []),
                "preferred_skills": opp_dict.get("preferred_skills", [])
            }
        else:
            opp = db.query(Opportunity).filter(Opportunity.id == req.opportunity_id).first()
            if not opp:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Opportunity {req.opportunity_id} not found."
                )
            role_spec = {
                "title": opp.title,
                "required_skills": opp.required_skills or [],
                "preferred_skills": opp.preferred_skills or []
            }
    elif req.role_description and not req.required_skills:
        parsed_role = await parse_role_description(req.role_title or "Custom Role", req.role_description)
        role_spec["title"] = parsed_role["title"]
        role_spec["required_skills"] = parsed_role["required_skills"]
        role_spec["preferred_skills"] = parsed_role["preferred_skills"]

    if not role_spec["required_skills"] and not role_spec["preferred_skills"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide required_skills, an opportunity_id, or a detailed role_description."
        )

    # 2. Fetch all student candidates from database
    students_db = db.query(Student).all()
    if not students_db:
        seed_students(db)
        students_db = db.query(Student).all()

    students_list = []
    for st in students_db:
        st_dict = {
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
                    "category": s.category,
                    "level": s.level,
                    "confidence": s.confidence,
                    "evidence": s.evidence,
                    "source": s.source,
                    "created_at": s.created_at
                }
                for s in st.skills
            ]
        }
        students_list.append(st_dict)

    # 3. Rank candidates
    ranked = rank_students_for_role(
        students=students_list,
        role_spec=role_spec,
        min_score=req.min_score or 0.0
    )

    response = []
    for r in ranked:
        st_data = r["student"]
        st_skills_resp = [
            SkillResponse(**sk) for sk in st_data["skills"]
        ]
        student_obj = StudentProfileResponse(
            id=st_data["id"],
            github_username=st_data["github_username"],
            name=st_data["name"],
            email=st_data["email"],
            avatar_url=st_data["avatar_url"],
            bio=st_data["bio"],
            skills=st_skills_resp,
            repos_analyzed=st_data.get("repos_analyzed", 0),
            created_at=st_data.get("created_at")
        )
        response.append(
            StudentRankResponse(
                student=student_obj,
                score=r["score"],
                matched_skills=r["matched_skills"],
                missing_skills=r["missing_skills"],
                fit_reasons=r["fit_reasons"],
                top_evidence=r["top_evidence"]
            )
        )

    return response

