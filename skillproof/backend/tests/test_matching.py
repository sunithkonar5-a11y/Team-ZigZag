from backend.services.matching import calculate_match_details, match_student_with_opportunities


def test_matching_is_deterministic_and_evidence_backed():
    skills = [
        {"name": "React", "normalized_name": "react", "level": "Advanced", "confidence": 0.95, "evidence": "Custom hooks"},
        {"name": "TypeScript", "normalized_name": "typescript", "level": "Advanced", "confidence": 0.90, "evidence": "Strict types"},
    ]
    opportunity = {"id": 1, "required_skills": [
        {"name": "react", "min_level": "intermediate", "weight": 0.5},
        {"name": "typescript", "min_level": "beginner", "weight": 0.5},
    ], "preferred_skills": []}
    first = calculate_match_details(skills, opportunity)
    second = calculate_match_details(skills, opportunity)
    assert first == second
    assert first["score"] == 92.5  # (0.5*.95 + 0.5*.90) * 100
    assert len(first["fit_reasons"]) == 2


def test_level_gap_is_penalized_and_missing_skill_is_reported():
    skills = [{"name": "Python", "level": "Beginner", "confidence": 0.8, "evidence": "Built a script"}]
    opportunity = {"required_skills": [{"name": "Python", "min_level": "advanced", "weight": 1}], "preferred_skills": []}
    result = calculate_match_details(skills, opportunity)
    assert result["score"] == 0.0
    assert result["missing_skills"] == ["Python"]
    assert result["gap_actions"]


def test_claim_without_evidence_is_not_counted():
    skills = [{"name": "Python", "level": "Advanced", "confidence": 1.0}]
    result = calculate_match_details(skills, {"required_skills": ["python"], "preferred_skills": []})
    assert result["score"] == 0.0
    assert result["missing_skills"] == ["python"]
    assert not result["fit_reasons"]


def test_opportunity_filtering():
    skills = [{"name": "Python", "level": "Advanced", "confidence": 0.9, "evidence": "Python project"}]
    opportunities = [
        {"id": 1, "title": "Research", "role_type": "research", "required_skills": ["python"]},
        {"id": 2, "title": "Hackathon", "role_type": "hackathon", "required_skills": ["python"]},
    ]
    results = match_student_with_opportunities(skills, opportunities, role_type="research")
    assert len(results) == 1
    assert results[0]["opportunity"]["role_type"] == "research"
