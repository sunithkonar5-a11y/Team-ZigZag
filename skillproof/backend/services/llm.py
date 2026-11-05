import json
import logging
import re
from typing import Dict, Any, List, Optional
from backend.config import ANTHROPIC_API_KEY, CLAUDE_MODEL, PROMPTS_DIR
from backend.services.normalize import normalize_skill_name

logger = logging.getLogger("skillproof.llm")

def _load_prompt_template(filename: str) -> str:
    path = PROMPTS_DIR / filename
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return ""

def clean_json_text(text: str) -> str:
    """Strip markdown code block fences and trailing text to isolate JSON."""
    cleaned = text.strip()
    # Match ```json ... ``` or ``` ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned, re.IGNORECASE)
    if match:
        cleaned = match.group(1).strip()
    else:
        # If no fences, find first [ or { and last ] or }
        first_bracket = min([i for i in [cleaned.find('{'), cleaned.find('[')] if i != -1], default=-1)
        last_bracket = max([cleaned.rfind('}'), cleaned.rfind(']')], default=-1)
        if first_bracket != -1 and last_bracket != -1 and last_bracket > first_bracket:
            cleaned = cleaned[first_bracket:last_bracket+1].strip()
    return cleaned

def parse_and_validate_json(raw_text: str) -> Any:
    """Parse JSON and raise ValueError if invalid."""
    cleaned = clean_json_text(raw_text)
    return json.loads(cleaned)

async def _call_claude(prompt: str, system: str = "You are an expert AI technical evaluator.") -> str:
    """Invoke Claude via Anthropic API."""
    if not ANTHROPIC_API_KEY:
        raise ValueError("ANTHROPIC_API_KEY is not configured.")

    try:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
        response = await client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=2048,
            temperature=0.2,
            system=system,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text
    except Exception as e:
        logger.error(f"Anthropic API call failed: {e}")
        raise e

async def call_llm_with_retry(prompt: str, system: str = "") -> Any:
    """Call Claude with JSON validation and automatic single retry on malformed JSON."""
    raw_response = await _call_claude(prompt, system=system)
    try:
        return parse_and_validate_json(raw_response)
    except Exception as first_err:
        logger.warning(f"Initial JSON parse failed ({first_err}). Executing one retry with repair prompt...")
        repair_prompt = (
            f"Your previous response produced an invalid JSON error: '{str(first_err)}'.\n\n"
            f"Here was your previous response:\n{raw_response}\n\n"
            f"Please output ONLY valid, RFC 8259 compliant JSON conforming to the original schema. "
            f"Do not include explanation, greetings, or markdown code fences."
        )
        retry_response = await _call_claude(repair_prompt, system="You fix and output strictly valid JSON.")
        return parse_and_validate_json(retry_response)



async def parse_role_description(role_title: str, role_description: str) -> Dict[str, Any]:
    """Extract role requirements with Claude when configured, otherwise use explicit keyword evidence."""
    if ANTHROPIC_API_KEY:
        template = _load_prompt_template("role_parsing.txt")
        prompt = template.format(role_title=role_title or "Custom Role", role_description=role_description)
        try:
            parsed = await call_llm_with_retry(prompt, system="Extract only skills explicitly supported by the role description.")
            if isinstance(parsed, dict):
                return {
                    "title": parsed.get("role_title") or role_title or "Custom Role",
                    "required_skills": parsed.get("required_skills") or [],
                    "preferred_skills": parsed.get("preferred_skills") or [],
                }
        except Exception as exc:
            logger.warning("Role parsing failed; using keyword fallback: %s", exc)

    catalog = [
        "python", "react", "typescript", "javascript", "fastapi", "docker",
        "kubernetes", "postgresql", "mysql", "redis", "rust", "c++", "go",
        "pytorch", "transformers", "large language models", "langchain", "aws",
        "tailwind css", "ci/cd", "node.js", "next.js", "git", "linux",
    ]
    text = role_description.lower()
    found = [skill for skill in catalog if re.search(r"(?<![a-z0-9])" + re.escape(skill) + r"(?![a-z0-9])", text)]
    return {
        "title": role_title or "Custom Role",
        "required_skills": found[:6],
        "preferred_skills": found[6:],
    }


# --- Heuristic Rule-based Fallback for Offline / Zero-key usage ---
def heuristic_skill_extraction(github_info: Dict[str, Any], resume_text: Optional[str] = None) -> List[Dict[str, Any]]:
    """Robust heuristic skill extractor when LLM key is not provided."""
    repos = github_info.get("repos", [])
    skill_map: Dict[str, Dict[str, Any]] = {}

    tech_catalog = {
        "python": {"name": "Python", "level": "Advanced", "confidence": 0.90},
        "javascript": {"name": "JavaScript", "level": "Intermediate", "confidence": 0.85},
        "typescript": {"name": "TypeScript", "level": "Intermediate", "confidence": 0.88},
        "react": {"name": "React", "level": "Intermediate", "confidence": 0.87},
        "fastapi": {"name": "FastAPI", "level": "Intermediate", "confidence": 0.84},
        "docker": {"name": "Docker", "level": "Intermediate", "confidence": 0.80},
        "postgresql": {"name": "PostgreSQL", "level": "Intermediate", "confidence": 0.82},
        "rust": {"name": "Rust", "level": "Intermediate", "confidence": 0.85},
        "c++": {"name": "C++", "level": "Intermediate", "confidence": 0.83},
        "go": {"name": "Go", "level": "Intermediate", "confidence": 0.81},
        "pytorch": {"name": "PyTorch", "level": "Intermediate", "confidence": 0.86},
        "tailwind": {"name": "Tailwind CSS", "level": "Intermediate", "confidence": 0.88},
        "kubernetes": {"name": "Kubernetes", "level": "Intermediate", "confidence": 0.79},
        "ci/cd": {"name": "CI/CD", "level": "Intermediate", "confidence": 0.82},
        "rest apis": {"name": "REST APIs", "level": "Intermediate", "confidence": 0.86}
    }

    # Inspect repo languages and text
    for r in repos:
        lang = (r.get("language") or "").lower()
        desc = (r.get("description") or "").lower()
        readme = (r.get("readme_snippet") or "").lower()
        repo_name = (r.get("name") or "").lower()
        full_text = f"{repo_name} {desc} {readme}"

        if lang in tech_catalog:
            norm = normalize_skill_name(lang)
            skill_map[norm] = {
                "name": tech_catalog[lang]["name"],
                "category": "language",
                "normalized_name": norm,
                "level": "Advanced" if r.get("stars", 0) > 5 else "Intermediate",
                "confidence": min(0.95, 0.75 + (r.get("stars", 0) * 0.02)),
                "evidence": f"Primary language in repository '{r['name']}' with {r.get('stars', 0)} stars.",
                "source": "github"
            }

        for kw, meta in tech_catalog.items():
            if kw in full_text and kw not in skill_map:
                norm = normalize_skill_name(kw)
                skill_map[norm] = {
                    "name": meta["name"],
                    "category": "framework" if kw in {"react", "fastapi", "pytorch", "tailwind", "kubernetes"} else "tool",
                    "normalized_name": norm,
                    "level": meta["level"],
                    "confidence": meta["confidence"],
                    "evidence": f"Implemented in repository '{r['name']}' ({r.get('description', '')[:60]}...).",
                    "source": "github"
                }

    # Resume/project text is evidence only when it explicitly mentions a technology.
    if resume_text:
        text = resume_text.lower()
        for keyword, meta in tech_catalog.items():
            if re.search(r"(?<![a-z0-9])" + re.escape(keyword) + r"(?![a-z0-9])", text):
                norm = normalize_skill_name(keyword)
                if norm not in skill_map:
                    start = text.find(keyword)
                    excerpt = resume_text[max(0, start - 70):min(len(resume_text), start + len(keyword) + 110)].strip()
                    skill_map[norm] = {
                        "name": meta["name"], "category": "tool", "normalized_name": norm,
                        "level": "Beginner", "confidence": 0.55,
                        "evidence": f"Candidate-provided project/resume text: {excerpt}",
                        "source": "resume"
                    }

    # Never fabricate default skills. An empty evidence set is a valid outcome.
    return list(skill_map.values())

async def extract_skills_from_profile(github_info: Dict[str, Any], resume_text: Optional[str] = None) -> List[Dict[str, Any]]:
    """Extract structured skills with evidence using Claude or heuristic fallback."""
    if not ANTHROPIC_API_KEY:
        logger.info("No ANTHROPIC_API_KEY detected. Using intelligent heuristic skill extraction.")
        return heuristic_skill_extraction(github_info, resume_text)

    prompt_tmpl = _load_prompt_template("skill_extraction.txt")
    repos_summary = []
    for r in github_info.get("repos", []):
        repos_summary.append(
            f"Repo: {r['name']} | Language: {r.get('language')} | Stars: {r.get('stars')}\n"
            f"Description: {r.get('description')}\n"
            f"README: {r.get('readme_snippet', '')[:500]}\n---"
        )
    repos_context = "\n".join(repos_summary)

    prompt = prompt_tmpl.format(
        username=github_info.get("username", "developer"),
        bio=github_info.get("bio", ""),
        repos_count=github_info.get("repos_analyzed", 0),
        repos_context=repos_context,
        additional_context=resume_text or "None provided"
    )

    try:
        parsed = await call_llm_with_retry(prompt, system="You are an expert technical evaluator.")
        if isinstance(parsed, list):
            validated = []
            allowed_levels = {"beginner", "intermediate", "advanced"}
            allowed_categories = {"language", "framework", "domain", "tool", "soft skill"}
            for item in parsed:
                if not isinstance(item, dict) or not item.get("name") or not item.get("evidence"):
                    continue
                try:
                    confidence = float(item.get("confidence", 0.5))
                except (TypeError, ValueError):
                    confidence = 0.5
                level = str(item.get("level", "beginner")).lower()
                category = str(item.get("category", "tool")).lower()
                validated.append({
                    "name": str(item["name"]).strip(),
                    "normalized_name": normalize_skill_name(str(item["name"])),
                    "category": category if category in allowed_categories else "tool",
                    "level": level.title() if level in allowed_levels else "Beginner",
                    "confidence": min(1.0, max(0.0, confidence)),
                    "evidence": str(item["evidence"]).strip(),
                    "source": item.get("source") if item.get("source") in {"github", "resume"} else "github",
                })
            return validated or heuristic_skill_extraction(github_info, resume_text)
        return heuristic_skill_extraction(github_info, resume_text)
    except Exception as e:
        logger.error(f"Claude skill extraction failed ({e}). Falling back to heuristic extractor.")
        return heuristic_skill_extraction(github_info, resume_text)

