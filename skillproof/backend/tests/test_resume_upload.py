import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

SAMPLE_RESUME_TEXT = """Devin Zhao
devin.zhao@berkeley.edu | github.com/devin-systems | San Francisco, CA

EDUCATION
UC Berkeley, B.S. in Electrical Engineering & Computer Science

EXPERIENCE
Distributed Systems Engineering Intern
- Implemented high-throughput raft consensus protocol in Rust and C++ with asynchronous tokio runtime.
- Reduced inter-node RPC latency by 38% using custom binary protocol over TCP.
- Deployed Docker containers and managed multi-node Kubernetes clusters for load testing.

PROJECTS
High-Performance Key-Value Store (Rust, Docker)
- Architected LSM-tree persistent storage engine in Rust with memory-mapped files.
- Containerized benchmarking suite using Docker and integrated CI/CD with automated unit tests.
"""

def test_upload_resume_txt():
    response = client.post(
        "/api/resume/upload",
        files={"file": ("devin_resume.txt", SAMPLE_RESUME_TEXT.encode("utf-8"), "text/plain")},
        data={"github_username": "devin-systems"}
    )
    assert response.status_code == 200, response.text
    data = response.json()
    
    assert "profile" in data
    assert "suggestions" in data
    
    profile = data["profile"]
    assert profile["name"] == "Devin Zhao"
    assert profile["github_username"] == "devin-systems"
    
    skills = [s["name"].lower() for s in profile["skills"]]
    assert "rust" in skills
    assert "c++" in skills
    assert "docker" in skills
    
    suggestions = data["suggestions"]
    assert "archetype" in suggestions
    assert any(domain in suggestions["archetype"]["title"] for domain in ["Systems", "Cloud-Native", "Platform"])
    assert len(suggestions["top_strengths"]) > 0
    assert len(suggestions["tailored_blueprints"]) > 0

def test_resume_suggestions_variance():
    # Test that different skill combinations yield completely different archetypes and blueprints
    resp_ai = client.post(
        "/api/resume/suggestions",
        json={
            "name": "Elena Rostova",
            "skills": [
                {"name": "PyTorch", "normalized_name": "pytorch", "level": "Advanced", "confidence": 0.94},
                {"name": "Transformers", "normalized_name": "transformers", "level": "Intermediate", "confidence": 0.88}
            ]
        }
    )
    assert resp_ai.status_code == 200
    data_ai = resp_ai.json()
    assert "AI" in data_ai["archetype"]["title"]
    
    resp_fe = client.post(
        "/api/resume/suggestions",
        json={
            "name": "Marcus Vance",
            "skills": [
                {"name": "React", "normalized_name": "react", "level": "Advanced", "confidence": 0.92},
                {"name": "TypeScript", "normalized_name": "typescript", "level": "Advanced", "confidence": 0.90}
            ]
        }
    )
    assert resp_fe.status_code == 200
    data_fe = resp_fe.json()
    assert "Frontend" in data_fe["archetype"]["title"]
    
    # Assert they are clearly different
    assert data_ai["archetype"]["title"] != data_fe["archetype"]["title"]
    assert data_ai["archetype"]["target_roles"] != data_fe["archetype"]["target_roles"]
