# SkillProof prototype review and fixes

This package is a revised prototype based on the supplied PRD.

## What was corrected

- Aligned the main screens and API flow around Profile Builder, Matches, and Organization View.
- Added the PRD's skill category field and renamed the skill table to `student_skills`.
- Reworked matching to use evidence-backed skills, required-skill weights, proficiency levels, and confidence. A skill claim without evidence is not counted as a verified match.
- Kept the PRD's 60/40 hybrid score shape. The structured score is computed with pandas. The semantic 40% currently falls back to the structured score so the score remains deterministic; a separate LLM fit-score blend is still a follow-up item.
- Added optional Claude role parsing for pasted organization descriptions, with a deterministic keyword fallback when no API key is configured.
- Removed fabricated default skills from offline extraction. If no evidence is found, the API now returns a useful error rather than inventing Python/React/Docker skills.
- Clearly distinguishes self-reported skills from GitHub evidence and gives self-reported skills a lower confidence.
- Improved GitHub username validation and fetched README excerpts concurrently to reduce profile-analysis time.
- Fixed cache-key ambiguity and included manually supplied skills in profile cache keys.
- Fixed resume-only profile creation so repeated requests do not collide on a fake shared GitHub username.
- Updated the default Claude model ID to `claude-sonnet-5-5`.
- Removed the uploaded local `.env` file from the distributable archive. Copy `.env.example` to `.env` and add your own credentials.

## Prototype limitations to explain to judges

- GitHub ingestion currently reads public profile/repository metadata and README excerpts. It does not clone repositories or inspect complete source trees or commit diffs.
- The 40% semantic LLM fit-score component is not independently implemented yet. It safely falls back to the structured score.
- Seeded opportunity and student profiles are illustrative demo records, not live vacancies or real verified applicants.
- The database is intended for a local demo. MySQL is supported, with SQLite fallback for quick setup.
- Authentication, real notifications, opportunity scraping, certificate verification, and production security are outside the prototype scope.

## Verification performed

- Python compilation: passed.
- Backend tests: 11 passed.
- FastAPI smoke test with a fresh SQLite database: demo profile, profile analysis (mocked GitHub response), matching, teammate lookup, and organization matching returned successfully.
- Frontend dependency installation timed out in the execution environment, so a Vite production build could not be verified here. Run `npm install` and `npm run build` locally before presenting.
