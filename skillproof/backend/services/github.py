import logging
import asyncio
import re
from typing import Dict, Any, List, Optional
import httpx
from backend.config import GITHUB_TOKEN

logger = logging.getLogger("skillproof.github")

def get_headers() -> Dict[str, str]:
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "SkillProof-App/1.0"
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    return headers

async def fetch_readme(client: httpx.AsyncClient, owner: str, repo: str, default_branch: str = "main") -> str:
    """Fetch raw README content truncated to ~1800 characters."""
    headers = get_headers()
    headers["Accept"] = "application/vnd.github.raw"
    url = f"https://api.github.com/repos/{owner}/{repo}/readme"
    try:
        res = await client.get(url, headers=headers, timeout=8.0)
        if res.status_code == 200:
            text = res.text
            return text[:1800] if len(text) > 1800 else text
    except Exception as e:
        logger.debug(f"Could not fetch README for {owner}/{repo}: {e}")
    return ""

async def fetch_github_profile(username: str) -> Dict[str, Any]:
    """Fetch GitHub user profile, top repositories, and README excerpts."""
    clean_username = username.strip().lstrip("@")
    if not clean_username:
        raise ValueError("GitHub username cannot be empty")
    if not re.fullmatch(r"(?!-)[A-Za-z0-9-]{1,39}(?<!-)", clean_username) or "--" in clean_username:
        raise ValueError("Please enter a valid GitHub username (letters, numbers, and single hyphens only).")

    async with httpx.AsyncClient() as client:
        headers = get_headers()
        
        # 1. Fetch User Info
        user_url = f"https://api.github.com/users/{clean_username}"
        user_res = await client.get(user_url, headers=headers, timeout=10.0)
        
        if user_res.status_code == 404:
            raise ValueError(f"GitHub user '{clean_username}' not found")
        elif user_res.status_code == 403:
            raise PermissionError("GitHub API rate limit exceeded. Please configure GITHUB_TOKEN in .env or try again later.")
        elif user_res.status_code != 200:
            raise RuntimeError(f"GitHub API error: status {user_res.status_code}")

        user_data = user_res.json()

        # 2. Fetch Repositories (sorted by updated, top 10)
        repos_url = f"https://api.github.com/users/{clean_username}/repos?sort=updated&per_page=10&type=owner"
        repos_res = await client.get(repos_url, headers=headers, timeout=10.0)
        repos_list = repos_res.json() if repos_res.status_code == 200 else []

        async def build_repo(repo: Dict[str, Any]) -> Dict[str, Any]:
            repo_name = repo.get("name") or "Unnamed repository"
            readme = await fetch_readme(client, clean_username, repo_name, repo.get("default_branch", "main"))
            return {
                "name": repo_name,
                "description": repo.get("description") or "",
                "language": repo.get("language") or "Unknown",
                "stars": repo.get("stargazers_count", 0),
                "forks": repo.get("forks_count", 0),
                "topics": repo.get("topics", []),
                "readme_snippet": readme,
            }

        # Concurrent README requests keep the live demo within its time budget.
        structured_repos = await asyncio.gather(*(build_repo(repo) for repo in repos_list[:6]))

        return {
            "username": clean_username,
            "name": user_data.get("name") or clean_username,
            "bio": user_data.get("bio") or "",
            "avatar_url": user_data.get("avatar_url") or "",
            "email": user_data.get("email"),
            "location": user_data.get("location"),
            "public_repos_count": user_data.get("public_repos", len(structured_repos)),
            "repos_analyzed": len(structured_repos),
            "repos": structured_repos
        }

