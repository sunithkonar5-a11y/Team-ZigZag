import hashlib
import secrets
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session

from backend.db import get_db
from backend.models import User, Student
from backend.schemas import UserRegisterRequest, UserLoginRequest, UserResponse
from backend.services.opportunities_db import find_opportunities_db_path
import sqlite3

router = APIRouter(tags=["auth"])
logger = logging.getLogger("skillproof.auth")

SALT = "skillproof_auth_salt_2026"

def hash_password(password: str) -> str:
    return hashlib.sha256(f"{SALT}:{password}".encode("utf-8")).hexdigest()

def generate_token(user_id: int, email: str) -> str:
    rand = secrets.token_hex(16)
    return f"sp_{user_id}_{rand}"

def seed_default_users(db: Session):
    """Seed default student and recruiter test accounts if app_users is empty."""
    if db.query(User).first():
        return

    defaults = [
        {
            "name": "Alex Chen",
            "email": "alex@berkeley.edu",
            "password": "password123",
            "role": "student",
            "github_username": "alexchen-dev",
            "avatar_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
            "student_id": 1
        },
        {
            "name": "Sarah Jenkins",
            "email": "recruiter@stripe.com",
            "password": "password123",
            "role": "organization",
            "company_name": "Stripe",
            "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
            "student_id": None
        },
        {
            "name": "Priya Sharma",
            "email": "priya@stanford.edu",
            "password": "password123",
            "role": "student",
            "github_username": "priyasharma-ai",
            "avatar_url": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
            "student_id": 2
        }
    ]

    for d in defaults:
        u = User(
            name=d["name"],
            email=d["email"],
            password_hash=hash_password(d["password"]),
            role=d["role"],
            github_username=d.get("github_username"),
            company_name=d.get("company_name"),
            avatar_url=d.get("avatar_url"),
            student_id=d.get("student_id")
        )
        db.add(u)
    db.commit()
    logger.info("Seeded default student and recruiter auth accounts.")

def sync_user_to_opportunities69(email: str):
    """Sync email into opportunities69.db users table."""
    try:
        path = find_opportunities_db_path()
        if path.exists():
            conn = sqlite3.connect(str(path))
            cur = conn.cursor()
            cur.execute("INSERT OR IGNORE INTO users (email) VALUES (?)", (email.strip().lower(),))
            conn.commit()
            conn.close()
    except Exception as e:
        logger.debug(f"Could not sync user to opportunities69: {e}")

@router.post("/auth/register", response_model=UserResponse)
def register(req: UserRegisterRequest, db: Session = Depends(get_db)):
    seed_default_users(db)

    clean_email = req.email.strip().lower()
    existing = db.query(User).filter(User.email == clean_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Check if student already exists or create new student
    student_id = None
    avatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    if req.role == "student":
        st = None
        if req.github_username:
            st = db.query(Student).filter(Student.github_username == req.github_username).first()
        if not st:
            st = Student(
                name=req.name,
                github_username=req.github_username or req.name.lower().replace(" ", "-"),
                email=clean_email,
                avatar_url=avatar,
                bio=f"Student developer interested in verified skill matching."
            )
            db.add(st)
            db.flush()
        student_id = st.id

    new_user = User(
        name=req.name,
        email=clean_email,
        password_hash=hash_password(req.password),
        role=req.role,
        github_username=req.github_username,
        company_name=req.company_name,
        avatar_url=avatar,
        student_id=student_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    sync_user_to_opportunities69(clean_email)

    token = generate_token(new_user.id, new_user.email)
    return UserResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role,
        github_username=new_user.github_username,
        company_name=new_user.company_name,
        avatar_url=new_user.avatar_url,
        student_id=new_user.student_id,
        token=token,
        created_at=new_user.created_at
    )

@router.post("/auth/login", response_model=UserResponse)
def login(req: UserLoginRequest, db: Session = Depends(get_db)):
    seed_default_users(db)

    clean_email = req.email.strip().lower()
    pw_hash = hash_password(req.password)

    user = db.query(User).filter(User.email == clean_email).first()
    if not user or user.password_hash != pw_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. You can also use demo credentials: alex@berkeley.edu / password123"
        )

    token = generate_token(user.id, user.email)
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        github_username=user.github_username,
        company_name=user.company_name,
        avatar_url=user.avatar_url,
        student_id=user.student_id,
        token=token,
        created_at=user.created_at
    )

@router.get("/auth/me", response_model=UserResponse)
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    seed_default_users(db)

    # If no token, return demo user
    user = db.query(User).filter(User.role == "student").first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No user active.")

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        github_username=user.github_username,
        company_name=user.company_name,
        avatar_url=user.avatar_url,
        student_id=user.student_id,
        token="demo_token",
        created_at=user.created_at
    )

