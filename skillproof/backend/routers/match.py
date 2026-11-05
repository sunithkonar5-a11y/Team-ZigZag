import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import Opportunity, Student, Skill
from backend.schemas import MatchRequest, MatchResponse, OpportunityResponse
from backend.services.matching import match_student_with_opportunities
from backend.services.opportunities_db import fetch_opportunities_from_db
from backend.seed import seed_opportunities

router = APIRouter(tags=["match"])
logger = logging.getLogger("skillproof.routers.match")

@router.post("/match", response_model=List[MatchResponse])
def get_opportunity_matches(req: MatchRequest, db: Session = Depends(get_db)):
    """Compute deterministic weighted match scores against all opportunities."""
    # 1. Resolve student skills
    skills_data = []
    if req.student_id:
        student = db.query(Student).filter(Student.id == req.student_id).first()
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Student with ID {req.student_id} not found."
            )
        for s in student.skills:
            skills_data.append({
                "name": s.name,
                "normalized_name": s.normalized_name,
                "level": s.level,
                "confidence": s.confidence,
                "evidence": s.evidence,
                "source": s.source
            })
    elif req.skills:
        for s in req.skills:
            skills_data.append(s.model_dump())
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either student_id or a list of skills must be provided."
        )

    # 2. Fetch opportunities directly from opportunities69.db
    opportunities_list = fetch_opportunities_from_db()
    if not opportunities_list:
        # Fallback to local table if opportunities69.db query was empty
        opp_records = db.query(Opportunity).all()
        if not opp_records:
            seed_opportunities(db)
            opp_records = db.query(Opportunity).all()

        for o in opp_records:
            opportunities_list.append({
                "id": o.id,
                "title": o.title,
                "company_or_lab": o.company_or_lab,
                "role_type": o.role_type,
                "description": o.description,
                "required_skills": o.required_skills or [],
                "preferred_skills": o.preferred_skills or [],
                "min_experience": o.min_experience,
                "location": o.location,
                "link": o.link,
                "created_at": o.created_at
            })

    # 3. Perform matching
    ranked_results = match_student_with_opportunities(
        student_skills=skills_data,
        opportunities=opportunities_list,
        role_type=req.role_type,
        min_score=req.min_score or 0.0
    )

    matches_response = []
    for r in ranked_results:
        opp_obj = OpportunityResponse(**r["opportunity"])
        matches_response.append(
            MatchResponse(
                opportunity=opp_obj,
                score=r["score"],
                fit_reasons=r["fit_reasons"],
                missing_skills=r["missing_skills"],
                gap_actions=r["gap_actions"]
            )
        )

    return matches_response

