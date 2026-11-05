import sqlite3
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional

logger = logging.getLogger("skillproof.opportunities_db")

def find_opportunities_db_path() -> Path:
    """Find the opportunities69.db SQLite file in workspace or project directories."""
    candidates = [
        Path("opportunities69.db"),
        Path("../opportunities69.db"),
        Path("../../opportunities69.db"),
        Path(__file__).resolve().parent.parent.parent.parent / "opportunities69.db",
        Path(__file__).resolve().parent.parent / "data" / "opportunities69.db",
        Path(__file__).resolve().parent.parent.parent / "opportunities69.db",
    ]
    for c in candidates:
        if c.exists() and c.is_file():
            return c.resolve()
    # Default fallback
    return Path("opportunities69.db").resolve()

def fetch_opportunities_from_db(db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    """Query all published opportunities from opportunities69.db with types and skills."""
    target_path = Path(db_path).resolve() if db_path else find_opportunities_db_path()
    
    if not target_path.exists():
        logger.warning(f"opportunities69.db not found at {target_path}")
        return []

    try:
        conn = sqlite3.connect(str(target_path))
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()

        query = """
            SELECT 
                o.id,
                o.title,
                o.source_name,
                ot.name AS type_name,
                ot.slug AS type_slug,
                jf.name AS job_field_name,
                rc.name AS role_category_name,
                o.description,
                o.responsibilities,
                o.work_mode,
                o.employment_type,
                o.experience_level,
                o.country,
                o.state,
                o.city,
                o.location_text,
                o.is_paid,
                o.compensation_min,
                o.compensation_max,
                o.compensation_currency,
                o.compensation_period,
                o.application_url,
                o.status,
                o.is_featured,
                o.is_verified,
                o.created_at
            FROM opportunities o
            JOIN opportunity_types ot ON o.opportunity_type_id = ot.id
            LEFT JOIN job_fields jf ON o.job_field_id = jf.id
            LEFT JOIN role_categories rc ON o.role_category_id = rc.id
            WHERE o.status = 'published'
            ORDER BY o.is_featured DESC, o.id ASC
        """
        rows = cur.execute(query).fetchall()

        # Query all skill mappings in one efficient query
        skills_query = """
            SELECT 
                os.opportunity_id,
                s.name AS skill_name,
                os.is_required
            FROM opportunity_skills os
            JOIN skills s ON os.skill_id = s.id
            ORDER BY s.name ASC
        """
        skill_rows = cur.execute(skills_query).fetchall()
        conn.close()

        # Group skills by opportunity_id
        skills_by_opp: Dict[int, Dict[str, List[str]]] = {}
        for sr in skill_rows:
            opp_id = sr["opportunity_id"]
            if opp_id not in skills_by_opp:
                skills_by_opp[opp_id] = {"required": [], "preferred": []}
            if sr["is_required"] == 1:
                skills_by_opp[opp_id]["required"].append(sr["skill_name"])
            else:
                skills_by_opp[opp_id]["preferred"].append(sr["skill_name"])

        opportunities = []
        for r in rows:
            opp_id = r["id"]
            opp_skills = skills_by_opp.get(opp_id, {"required": [], "preferred": []})
            
            # Location label
            loc = r["location_text"]
            if not loc:
                loc_parts = [p for p in [r["city"], r["state"], r["country"]] if p]
                loc = ", ".join(loc_parts) if loc_parts else "Remote"

            # Normalize role type for frontend filter compatibility
            raw_slug = (r["type_slug"] or "internship").lower()
            if "intern" in raw_slug:
                role_type = "internship"
            elif "research" in raw_slug:
                role_type = "research"
            elif "hackathon" in raw_slug:
                role_type = "hackathon"
            elif "fellow" in raw_slug or "open" in raw_slug or "free" in raw_slug:
                role_type = "open_source"
            elif "full" in raw_slug:
                role_type = "full_time"
            else:
                role_type = raw_slug

            opportunities.append({
                "id": opp_id,
                "title": r["title"],
                "company_or_lab": r["source_name"] or "Industry Partner",
                "role_type": role_type,
                "role_type_name": r["type_name"],
                "job_field": r["job_field_name"],
                "role_category": r["role_category_name"],
                "description": r["description"] or "",
                "responsibilities": r["responsibilities"] or "",
                "work_mode": r["work_mode"] or "remote",
                "employment_type": r["employment_type"] or "full_time",
                "min_experience": r["experience_level"] or "Any",
                "location": loc,
                "is_paid": bool(r["is_paid"]),
                "compensation_min": r["compensation_min"],
                "compensation_max": r["compensation_max"],
                "compensation_currency": r["compensation_currency"],
                "compensation_period": r["compensation_period"],
                "link": r["application_url"],
                "required_skills": opp_skills["required"],
                "preferred_skills": opp_skills["preferred"],
                "created_at": r["created_at"]
            })

        logger.info(f"Loaded {len(opportunities)} opportunities from {target_path.name}")
        return opportunities
    except Exception as e:
        logger.error(f"Error fetching opportunities from {target_path}: {e}")
        return []

def get_opportunity_by_id(opp_id: int, db_path: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """Retrieve single opportunity by ID."""
    all_opps = fetch_opportunities_from_db(db_path)
    for o in all_opps:
        if o["id"] == opp_id:
            return o
    return None

