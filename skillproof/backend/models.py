import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Text, DateTime, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
from backend.db import Base

class User(Base):
    __tablename__ = "app_users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="student")  # "student" or "organization"
    github_username = Column(String(100), nullable=True)
    company_name = Column(String(150), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    student_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    github_username = Column(String(100), unique=True, index=True, nullable=True)
    name = Column(String(150), nullable=False)
    email = Column(String(255), nullable=True)
    avatar_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    raw_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    skills = relationship("Skill", back_populates="student", cascade="all, delete-orphan")
    matches = relationship("MatchResult", back_populates="student", cascade="all, delete-orphan")


class Skill(Base):
    __tablename__ = "student_skills"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    normalized_name = Column(String(100), index=True, nullable=False)
    category = Column(String(50), nullable=False, default="tool")
    level = Column(String(50), nullable=False, default="Intermediate")  # Beginner, Intermediate, Advanced
    confidence = Column(Float, nullable=False, default=0.75)             # 0.0 to 1.0
    evidence = Column(Text, nullable=True)                              # Repository metadata, README excerpts, or candidate-provided text
    source = Column(String(50), default="github")                       # github, resume, manual
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="skills")


class Opportunity(Base):
    __tablename__ = "opportunities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    company_or_lab = Column(String(200), nullable=False)
    role_type = Column(String(50), nullable=False)  # internship, research, hackathon, open_source
    description = Column(Text, nullable=False)
    required_skills = Column(JSON, nullable=False, default=list)
    preferred_skills = Column(JSON, nullable=False, default=list)
    min_experience = Column(String(50), default="Any")
    location = Column(String(150), default="Remote")
    link = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    matches = relationship("MatchResult", back_populates="opportunity", cascade="all, delete-orphan")


class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    opportunity_id = Column(Integer, ForeignKey("opportunities.id", ondelete="CASCADE"), nullable=False, index=True)
    score = Column(Float, nullable=False)  # 0.0 to 100.0
    fit_reasons = Column(JSON, nullable=True, default=list)
    missing_skills = Column(JSON, nullable=True, default=list)
    gap_actions = Column(JSON, nullable=True, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    student = relationship("Student", back_populates="matches")
    opportunity = relationship("Opportunity", back_populates="matches")


class CachedResponse(Base):
    __tablename__ = "cached_responses"

    id = Column(Integer, primary_key=True, index=True)
    cache_key = Column(String(255), unique=True, index=True, nullable=False)
    prompt_type = Column(String(100), index=True, nullable=False)
    response_data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

