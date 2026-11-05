import logging
from typing import List, Dict, Any, Optional
from backend.services.normalize import normalize_skill_name

logger = logging.getLogger("skillproof.teammates")

def compute_complementarity(
    student_a: Dict[str, Any],
    candidate_b: Dict[str, Any],
    target_skills: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Calculate complementarity between Student A and Candidate B."""
    skills_a = {
        normalize_skill_name(s.get("normalized_name") or s.get("name", "")): s
        for s in student_a.get("skills", [])
    }
    skills_b = {
        normalize_skill_name(s.get("normalized_name") or s.get("name", "")): s
        for s in candidate_b.get("skills", [])
    }

    # If target skills specified (e.g. from an opportunity), focus on those
    if target_skills:
        norm_targets = [normalize_skill_name(ts) for ts in target_skills]
        gaps_a = [ts for ts in norm_targets if ts not in skills_a]
    else:
        # Default gaps are skills B has that A doesn't
        gaps_a = [s for s in skills_b if s not in skills_a]

    # Which of A's gaps does B cover?
    covered_gaps = []
    coverage_score_sum = 0.0
    for gap in gaps_a:
        if gap in skills_b:
            b_skill = skills_b[gap]
            conf = float(b_skill.get("confidence", 0.8))
            covered_gaps.append(b_skill.get("name", gap.title()))
            coverage_score_sum += conf

    # Shared skills for communication friction reduction
    shared_skills = []
    for s_name in skills_a:
        if s_name in skills_b:
            shared_skills.append(skills_a[s_name].get("name", s_name.title()))

    gap_count = len(gaps_a) if gaps_a else 1
    gap_coverage_ratio = min(1.0, coverage_score_sum / gap_count) if gaps_a else 0.5
    shared_ratio = min(1.0, len(shared_skills) / 3.0)

    # 70% gap coverage + 30% common foundation
    total_score = round((gap_coverage_ratio * 0.70 + shared_ratio * 0.30) * 100.0, 1)

    # Synergy explanation
    b_name = candidate_b.get("name", "Candidate")
    if covered_gaps:
        gaps_str = ", ".join(covered_gaps[:3])
        synergy = f"{b_name} provides strong verified coverage in {gaps_str}, bridging your team's capability gaps."
    else:
        synergy = f"{b_name} offers strong general engineering overlap to parallelize feature development."

    return {
        "teammate": candidate_b,
        "complementarity_score": total_score,
        "shared_skills": shared_skills[:5],
        "skills_they_cover": covered_gaps,
        "synergy_reason": synergy
    }

def find_complementary_teammates(
    student_a: Dict[str, Any],
    cohort: List[Dict[str, Any]],
    target_skills: Optional[List[str]] = None,
    limit: int = 5
) -> List[Dict[str, Any]]:
    """Rank cohort candidates by complementarity to student_a."""
    a_id = student_a.get("id")
    results = []

    for candidate in cohort:
        # Don't match the student with themselves
        if a_id and candidate.get("id") == a_id:
            continue
        if candidate.get("github_username") and candidate.get("github_username") == student_a.get("github_username"):
            continue

        comp = compute_complementarity(student_a, candidate, target_skills)
        results.append(comp)

    # Sort descending by complementarity_score
    results.sort(key=lambda x: x["complementarity_score"], reverse=True)
    return results[:limit]

