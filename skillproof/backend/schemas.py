import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field

# --- Auth Schemas ---
class UserRegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "student"  # "student" or "organization"
    github_username: Optional[str] = None
    company_name: Optional[str] = None

class UserLoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    github_username: Optional[str] = None
    company_name: Optional[str] = None
    avatar_url: Optional[str] = None
    student_id: Optional[int] = None
    token: Optional[str] = None
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True

# --- Skill Schemas ---
class SkillBase(BaseModel):
    name: str
    normalized_name: Optional[str] = None
    category: str = "tool"
    level: str = "Intermediate"  # Beginner, Intermediate, Advanced
    confidence: float = Field(default=0.75, ge=0.0, le=1.0)
    evidence: Optional[str] = None
    source: str = "github"

class SkillCreate(SkillBase):
    pass

class SkillResponse(SkillBase):
    id: Optional[int] = None
    student_id: Optional[int] = None
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# --- Profile / Student Schemas ---
class ProfileAnalyzeRequest(BaseModel):
    github_username: Optional[str] = None
    resume_text: Optional[str] = None
    manual_skills: Optional[List[str]] = None

class StudentProfileResponse(BaseModel):
    id: Optional[int] = None
    github_username: Optional[str] = None
    name: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    skills: List[SkillResponse] = Field(default_factory=list)
    repos_analyzed: Optional[int] = 0
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# --- Opportunity Schemas ---
class OpportunityBase(BaseModel):
    title: str
    company_or_lab: str
    role_type: str  # internship, research, hackathon, open_source
    description: str
    required_skills: List[Any] = Field(default_factory=list)
    preferred_skills: List[Any] = Field(default_factory=list)
    min_experience: Optional[str] = "Any"
    location: Optional[str] = "Remote"
    link: Optional[str] = None

class OpportunityCreate(OpportunityBase):
    pass

class OpportunityResponse(OpportunityBase):
    id: int
    created_at: Optional[Any] = None

    class Config:
        from_attributes = True

# --- Match Schemas ---
class MatchRequest(BaseModel):
    student_id: Optional[int] = None
    skills: Optional[List[SkillResponse]] = None
    role_type: Optional[str] = None  # None for all
    min_score: Optional[float] = 0.0

class MatchResponse(BaseModel):
    opportunity: OpportunityResponse
    score: float
    fit_reasons: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    gap_actions: List[str] = Field(default_factory=list)

    class Config:
        from_attributes = True

# --- Org Matching Schemas ---
class OrgMatchRequest(BaseModel):
    opportunity_id: Optional[int] = None
    role_title: Optional[str] = None
    role_description: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_skills: Optional[List[str]] = None
    min_score: Optional[float] = 0.0

class StudentRankResponse(BaseModel):
    student: StudentProfileResponse
    score: float
    matched_skills: List[str] = []
    missing_skills: List[str] = Field(default_factory=list)
    fit_reasons: List[str] = Field(default_factory=list)
    top_evidence: List[str] = []

# --- Teammates Schemas ---
class TeammateRequest(BaseModel):
    student_id: int
    opportunity_id: Optional[int] = None
    target_skills: Optional[List[str]] = None

class TeammateResponse(BaseModel):
    teammate: StudentProfileResponse
    complementarity_score: float
    shared_skills: List[str] = Field(default_factory=list)
    skills_they_cover: List[str] = Field(default_factory=list)
    synergy_reason: str

