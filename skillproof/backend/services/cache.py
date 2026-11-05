import hashlib
import json
import logging
from typing import Optional, Any
from sqlalchemy.orm import Session
from backend.models import CachedResponse

logger = logging.getLogger("skillproof.cache")

def make_cache_key(*args: Any) -> str:
    """Generate an unambiguous deterministic SHA-256 key from request inputs."""
    payload = json.dumps(args, sort_keys=True, default=str, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def get_cached_response(cache_key: str, db: Session) -> Optional[Any]:
    """Retrieve cached response data if it exists."""
    try:
        record = db.query(CachedResponse).filter(CachedResponse.cache_key == cache_key).first()
        if record:
            logger.info(f"Cache hit for key: {cache_key[:12]}...")
            return record.response_data
    except Exception as e:
        logger.warning(f"Error reading cache for key {cache_key}: {e}")
    return None

def set_cached_response(cache_key: str, prompt_type: str, response_data: Any, db: Session) -> None:
    """Store or update response data in the cache."""
    try:
        existing = db.query(CachedResponse).filter(CachedResponse.cache_key == cache_key).first()
        if existing:
            existing.response_data = response_data
            existing.prompt_type = prompt_type
        else:
            new_entry = CachedResponse(
                cache_key=cache_key,
                prompt_type=prompt_type,
                response_data=response_data
            )
            db.add(new_entry)
        db.commit()
        logger.info(f"Saved response to cache for key: {cache_key[:12]}...")
    except Exception as e:
        db.rollback()
        logger.warning(f"Error saving to cache for key {cache_key}: {e}")

