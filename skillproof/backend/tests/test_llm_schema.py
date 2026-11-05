import pytest
from backend.services.llm import clean_json_text, parse_and_validate_json, heuristic_skill_extraction

def test_clean_json_markdown_fences():
    """Verify that markdown code fences are stripped cleanly."""
    raw_markdown = """```json
[
  {
    "name": "React",
    "level": "Advanced",
    "confidence": 0.92,
    "evidence": "Built components",
    "source": "github"
  }
]
```"""
    cleaned = clean_json_text(raw_markdown)
    parsed = parse_and_validate_json(cleaned)
    assert isinstance(parsed, list)
    assert len(parsed) == 1
    assert parsed[0]["name"] == "React"

def test_clean_json_with_preamble_and_postamble():
    """Verify extraction when LLM adds introductory text."""
    raw_response = """Certainly! Here is your requested JSON evaluation:

[
  {
    "name": "Python",
    "level": "Intermediate",
    "confidence": 0.85,
    "evidence": "Coursework algorithms",
    "source": "github"
  }
]

I hope this helps your evaluation!"""

    cleaned = clean_json_text(raw_response)
    parsed = parse_and_validate_json(cleaned)
    assert isinstance(parsed, list)
    assert parsed[0]["name"] == "Python"

def test_malformed_json_raises_error():
    """Verify that genuinely invalid JSON raises an error to trigger retry."""
    malformed = """[ { "name": "Python", "level": "Advanced", confidence: 0.9 """  # missing closing brace and quote
    with pytest.raises(Exception):
        parse_and_validate_json(malformed)

def test_heuristic_skill_extraction_fallback():
    """Verify that heuristic fallback produces valid skills from repository metadata."""
    github_mock = {
        "username": "testdev",
        "name": "Test Developer",
        "repos": [
            {
                "name": "fastapi-store",
                "description": "An async e-commerce backend built with FastAPI and PostgreSQL",
                "language": "Python",
                "stars": 12,
                "readme_snippet": "Uses Docker Compose for PostgreSQL"
            }
        ]
    }
    skills = heuristic_skill_extraction(github_mock)
    assert len(skills) >= 2
    skill_names = [s["normalized_name"] for s in skills]
    assert "python" in skill_names
    assert "fastapi" in skill_names



def test_heuristic_does_not_invent_skills_without_evidence():
    assert heuristic_skill_extraction({"repos": []}) == []


def test_heuristic_does_not_detect_go_inside_another_word():
    skills = heuristic_skill_extraction({"repos": []}, "I am ongoing with general projects.")
    assert "go" not in [item["normalized_name"] for item in skills]
