"""Evidence-first, deterministic matching used by both student and org flows.

The PRD defines a 60/40 hybrid score. The structured 60% component follows
its level/confidence formula. Until an LLM fit score is available, the semantic
40% component deliberately falls back to the structured score so results stay
reproducible and the UI never invents an AI score.
"""
from typing import Any, Dict, List, Optional
import pandas as pd
from backend.services.normalize import normalize_skill_name, normalize_skills_list

LEVELS = {"beginner": 1, "intermediate": 2, "advanced": 3}


def _requirements(items: List[Any]) -> List[Dict[str, Any]]:
    """Accept PRD objects ({name, min_level, weight}) and legacy string seeds."""
    output = []
    for item in items or []:
        if isinstance(item, str):
            name, min_level, weight = item, "beginner", 1.0
        elif isinstance(item, dict):
            name = item.get("name") or item.get("skill")
            min_level = str(item.get("min_level", "beginner")).lower()
            weight = item.get("weight", 1.0)
        else:
            continue
        if name:
            try:
                weight = max(0.0, float(weight))
            except (TypeError, ValueError):
                weight = 1.0
            output.append({"name": str(name), "normalized": normalize_skill_name(str(name)),
                           "min_level": LEVELS.get(min_level, 1), "weight": weight})
    return output


def calculate_match_details(student_skills: List[Dict[str, Any]], opportunity: Dict[str, Any]) -> Dict[str, Any]:
    # A claim without evidence is not counted as verified, per PRD section 11.2.
    skill_map: Dict[str, Dict[str, Any]] = {}
    for skill in student_skills or []:
        evidence = skill.get("evidence")
        if not evidence or not str(evidence).strip():
            continue
        key = normalize_skill_name(skill.get("normalized_name") or skill.get("name", ""))
        if key:
            skill_map[key] = skill

    requirements = _requirements(opportunity.get("required_skills", []))
    preferred = _requirements(opportunity.get("preferred_skills", []))
    total_weight = sum(r["weight"] for r in requirements)
    contributions = 0.0
    matched, missing, fit_reasons, gap_actions = [], [], [], []

    for req in requirements:
        skill = skill_map.get(req["normalized"])
        level = LEVELS.get(str((skill or {}).get("level", "")).lower(), 0)
        if skill:
            gap = req["min_level"] - level
            level_factor = 1.0 if gap <= 0 else (0.5 if gap == 1 else 0.0)
            confidence = min(1.0, max(0.0, float(skill.get("confidence", 0.0))))
            contributions += req["weight"] * level_factor * confidence
            if level_factor > 0:
                matched.append(req["normalized"])
                fit_reasons.append(
                    f"{skill.get('name', req['name'])}: {skill.get('level', 'Unknown')} level. Evidence: {str(skill['evidence'])[:180]}"
                )
            else:
                missing.append(req["name"])
                gap_actions.append(f"Build a small project demonstrating {req['name']} at {['', 'beginner', 'intermediate', 'advanced'][req['min_level']]} level.")
        else:
            missing.append(req["name"])
            gap_actions.append(f"Build a small project demonstrating {req['name']}.")

    # No required skills means there is no defensible basis for a match.
    structured_score = (contributions / total_weight) if total_weight > 0 else 0.0
    structured_score = min(1.0, max(0.0, structured_score))
    llm_fit_score = structured_score  # explicit deterministic fallback when no LLM fit score exists
    final_score = round((0.6 * structured_score + 0.4 * llm_fit_score) * 100, 1)

    # Preferred skills are shown as bonus context, not allowed to inflate PRD score.
    preferred_matched = [r["normalized"] for r in preferred if r["normalized"] in skill_map]
    for key in preferred_matched:
        sk = skill_map[key]
        fit_reasons.append(f"Preferred skill {sk.get('name', key)} is also supported by evidence.")

    return {
        "score": final_score,
        "structured_score": round(structured_score * 100, 1),
        "matched_skills": matched + preferred_matched,
        "missing_skills": missing,
        "fit_reasons": fit_reasons[:4],
        "gap_actions": gap_actions[:3],
    }


def match_student_with_opportunities(student_skills: List[Dict[str, Any]], opportunities: List[Dict[str, Any]],
                                     role_type: Optional[str] = None, min_score: float = 0.0) -> List[Dict[str, Any]]:
    if not opportunities:
        return []
    frame = pd.DataFrame(opportunities)
    if role_type and role_type.lower() != "all":
        frame = frame[frame["role_type"].fillna("").str.lower() == role_type.lower()]
    results = []
    for _, row in frame.iterrows():
        opportunity = row.to_dict()
        details = calculate_match_details(student_skills, opportunity)
        if details["score"] >= min_score:
            results.append({"opportunity": opportunity, **details})
    results.sort(key=lambda result: (-result["score"], result["opportunity"].get("id", 0)))
    return results


def rank_students_for_role(students: List[Dict[str, Any]], role_spec: Dict[str, Any], min_score: float = 0.0) -> List[Dict[str, Any]]:
    results = []
    for student in students:
        details = calculate_match_details(student.get("skills", []), role_spec)
        if details["score"] >= min_score:
            evidence = [s.get("evidence") for s in student.get("skills", []) if s.get("evidence")][:3]
            results.append({"student": student, **details, "top_evidence": evidence})
    results.sort(key=lambda result: (-result["score"], result["student"].get("id", 0)))
    return results
