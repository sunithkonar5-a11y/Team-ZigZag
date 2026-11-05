import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.opportunities_db import fetch_opportunities_from_db

client = TestClient(app)

def test_fetch_opportunities_from_opportunities69_db():
    opps = fetch_opportunities_from_db()
    assert len(opps) == 16, f"Expected 16 opportunities from opportunities69.db, found {len(opps)}"
    first = opps[0]
    assert "title" in first
    assert "company_or_lab" in first
    assert "required_skills" in first
    assert "preferred_skills" in first
    assert len(first["required_skills"]) > 0

def test_get_opportunities_api_endpoint():
    res = client.get("/api/opportunities")
    assert res.status_code == 200
    opps = res.json()
    assert len(opps) == 16
    titles = [o["title"] for o in opps]
    assert "Backend Engineering Intern" in titles
    assert "Fullstack Product Engineering Intern" in titles
    assert "Climate Intelligence Hackathon Project" in titles

def test_match_endpoint_with_opportunities69():
    # 1. Get demo profile
    res_prof = client.get("/api/demo-profile")
    assert res_prof.status_code == 200
    profile = res_prof.json()

    # 2. Compute matches
    res_match = client.post("/api/match", json={"student_id": profile["id"], "min_score": 0.0})
    assert res_match.status_code == 200
    matches = res_match.json()
    assert len(matches) == 16
    top_match = matches[0]
    assert top_match["score"] > 70.0
    assert len(top_match["fit_reasons"]) > 0

def test_opportunity_role_type_filtering():
    res_prof = client.get("/api/demo-profile")
    profile = res_prof.json()

    # Filter by hackathon
    res = client.post("/api/match", json={"student_id": profile["id"], "role_type": "hackathon"})
    assert res.status_code == 200
    hack_matches = res.json()
    assert len(hack_matches) == 2
    for m in hack_matches:
        assert m["opportunity"]["role_type"] == "hackathon"

    # Filter by research
    res_res = client.post("/api/match", json={"student_id": profile["id"], "role_type": "research"})
    assert res_res.status_code == 200
    res_matches = res_res.json()
    assert len(res_matches) == 3
    for m in res_matches:
        assert m["opportunity"]["role_type"] == "research"

def test_opportunity_min_score_filtering():
    res_prof = client.get("/api/demo-profile")
    profile = res_prof.json()

    res = client.post("/api/match", json={"student_id": profile["id"], "min_score": 75.0})
    assert res.status_code == 200
    matches = res.json()
    assert len(matches) > 0
    for m in matches:
        assert m["score"] >= 75.0

def test_org_match_with_opportunities69_id():
    res_opps = client.get("/api/opportunities")
    opps = res_opps.json()
    first_opp = opps[0]

    res_org = client.post("/api/org-match", json={"opportunity_id": first_opp["id"], "min_score": 0.0})
    assert res_org.status_code == 200
    ranked = res_org.json()
    assert len(ranked) >= 8
    # Scores should be sorted descending
    scores = [r["score"] for r in ranked]
    assert scores == sorted(scores, reverse=True)

def test_teammate_synergy_with_opportunities69():
    res_prof = client.get("/api/demo-profile")
    profile = res_prof.json()

    res_opps = client.get("/api/opportunities")
    opps = res_opps.json()
    first_opp = opps[0]

    res_tm = client.post("/api/teammates", json={"student_id": profile["id"], "opportunity_id": first_opp["id"]})
    assert res_tm.status_code == 200
    teammates = res_tm.json()
    assert len(teammates) > 0
    top_peer = teammates[0]
    assert "complementarity_score" in top_peer
    assert "synergy_reason" in top_peer

