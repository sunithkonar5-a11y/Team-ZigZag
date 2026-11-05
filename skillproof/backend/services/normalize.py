import json
import re
from pathlib import Path
from typing import List, Dict, Optional
from backend.config import DATA_DIR

_ALIASES_MAP: Optional[Dict[str, str]] = None

def _load_aliases() -> Dict[str, str]:
    global _ALIASES_MAP
    if _ALIASES_MAP is not None:
        return _ALIASES_MAP
    
    alias_path = DATA_DIR / "skill_aliases.json"
    if alias_path.exists():
        try:
            with open(alias_path, "r", encoding="utf-8") as f:
                _ALIASES_MAP = json.load(f)
        except Exception:
            _ALIASES_MAP = {}
    else:
        _ALIASES_MAP = {}
    return _ALIASES_MAP

def clean_skill_string(raw: str) -> str:
    """Clean string punctuation and whitespace."""
    s = raw.strip().lower()
    # Remove leading/trailing bullet points or quotes
    s = re.sub(r"^[\s\-\*\•\"']+|[\s\"']+$", "", s)
    return s

def normalize_skill_name(raw_name: str) -> str:
    """Map a skill string to its normalized canonical name."""
    if not raw_name:
        return ""
    cleaned = clean_skill_string(raw_name)
    aliases = _load_aliases()
    return aliases.get(cleaned, cleaned)

def normalize_skills_list(skills: List[str]) -> List[str]:
    """Normalize a list of skill strings and remove duplicates while preserving order."""
    normalized_list = []
    seen = set()
    for s in skills:
        norm = normalize_skill_name(s)
        if norm and norm not in seen:
            seen.add(norm)
            normalized_list.append(norm)
    return normalized_list

