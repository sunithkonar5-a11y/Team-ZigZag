# SkillProof 🛡️⚡

> **AI-Powered Student Skill Verification & Opportunity Matching Platform**  
> Builds evidence-backed student skill profiles from public GitHub repository metadata and README excerpts, then matches students to internships, research roles, hackathons, & teammates.

---

## 🌟 Key Features

1. **Proof-of-Work Skill Verification**
   - Fetches public repository metadata, primary languages, topics, and README excerpts using `httpx`.
   - Claude LLM can extract structured skills from repository metadata and README excerpts when an API key is configured.
   - Without an API key, a transparent keyword-based fallback only emits skills found in supplied repository or resume text. It does not invent default skills.

2. **Skill Normalization & Caching**
   - Normalizes 100+ common tech aliases (`"reactjs"` &rarr; `"react"`, `"fast-api"` &rarr; `"fastapi"`, `"k8s"` &rarr; `"kubernetes"`).
   - Fast cache layer (`cached_responses` table) avoids redundant LLM token expenditures.

3. **Deterministic Opportunity Matching**
   - Uses `pandas` and the PRD's level/confidence formula for the structured skill score.
   - Applies the PRD's 60/40 hybrid blend. Until a separate semantic LLM fit score is configured, the 40% component safely falls back to the structured score, keeping the prototype deterministic.
   - Shows evidence-backed fit reasons, missing requirements, and concrete gap actions. Preferred skills are context only and do not inflate the score.

4. **Complementary Teammate Finder (P1)**
   - Algorithms evaluate cohort members to find complementary peers for hackathons or project teams who cover your specific skill gaps while sharing common baseline foundations.

5. **Organization & Recruiter Portal**
   - Recruiters can select seeded opportunities or paste role descriptions to rank cohort candidates using the evidence attached to their skill profiles.

---

## 📂 Project Structure

```
skillproof/
├── README.md                   # Complete documentation
├── docker-compose.yml          # MySQL 8 container with persistent volume
├── .env                        # Local secrets (gitignored)
├── .env.example                # Template for teammates
├── .gitignore
│
├── backend/
│   ├── requirements.txt        # Python backend dependencies
│   ├── main.py                 # FastAPI application, CORS, router registration
│   ├── config.py               # Environment configuration (python-dotenv)
│   ├── db.py                   # SQLAlchemy engine + session (with SQLite fallback)
│   ├── models.py               # SQLAlchemy tables (5 tables)
│   ├── schemas.py              # Pydantic schemas (Skill, Profile, Opportunity, Match, Teammate)
│   ├── seed.py                 # Seeds opportunities and student profiles into DB
│   │
│   ├── routers/
│   │   ├── profile.py          # POST /api/analyze-profile, GET /api/demo-profile
│   │   ├── match.py            # POST /api/match
│   │   ├── org.py              # POST /api/org-match, GET /api/opportunities
│   │   └── teammates.py        # POST /api/teammates (P1)
│   │
│   ├── services/
│   │   ├── github.py           # Async repo & README extractor (httpx)
│   │   ├── llm.py              # Claude calls, JSON validation, one-retry logic, heuristic fallback
│   │   ├── matching.py         # Pandas-based weighted scoring, fit reasons, and gaps
│   │   ├── teammates.py        # Complementarity matrix and synergy scoring (P1)
│   │   ├── normalize.py        # Canonical skill name normalization
│   │   └── cache.py            # SHA-256 keyed response caching
│   │
│   ├── prompts/
│   │   ├── skill_extraction.txt# Prompt template for repository evidence analysis
│   │   ├── role_parsing.txt    # Prompt template for opportunity requirement parsing
│   │   └── explanation.txt     # Prompt template for fit explanations and gap actions
│   │
│   ├── data/
│   │   ├── opportunities.json  # 15 realistic seeded opportunities
│   │   ├── students.json       # 8 rich seeded student candidate profiles
│   │   ├── skill_aliases.json  # Normalization dictionary
│   │   └── demo_profile.json   # Pre-cached instant fallback profile
│   │
│   └── tests/
│       ├── test_matching.py    # Determinism, scoring weights, gap verification
│       └── test_llm_schema.py  # Markdown stripping, malformed JSON recovery, heuristics
│
└── frontend/
    ├── package.json            # Vite, React 18, Tailwind CSS, Lucide icons, Axios
    ├── vite.config.js          # Vite config with API proxy
    ├── tailwind.config.js      # Custom theme, typography, and colors
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx            # React root
        ├── App.jsx             # Top navbar, tab routing, layout
        ├── index.css           # Tailwind directives & custom scrollbars
        ├── api/
        │   └── client.js       # Axios client and API methods
        ├── pages/
        │   ├── ProfileBuilder.jsx # Profile creation, GitHub ingest, skills grid
        │   ├── Matches.jsx        # Opportunity filters, search, score rings, cards
        │   └── OrgView.jsx        # Candidate ranking for recruiters & research leads
        ├── components/
        │   ├── SkillCard.jsx       # Level badge, confidence bar, code evidence
        │   ├── MatchCard.jsx       # Why you fit, missing chips, teammate trigger
        │   ├── ScoreRing.jsx       # Animated circular SVG score indicator
        │   ├── GapAction.jsx       # Expandable next steps to bridge skill gaps (P1)
        │   ├── TeammatePanel.jsx   # Complementary peers with synergy scores (P1)
        │   ├── StudentRankCard.jsx # Recruiter candidate result card
        │   ├── LoadingState.jsx    # Step-by-step progress hints
        │   └── ErrorBanner.jsx     # Friendly alert with "Use demo profile" CTA
        └── context/
            └── ProfileContext.jsx  # Shared student profile and matches context
```

---

## 🗄️ Database Architecture (5 Tables)

1. **`students`**: User identity, GitHub username, avatar, bio, and repository metadata.
2. **`student_skills`**: Extracted skills per student with proficiency level (Beginner/Intermediate/Advanced), confidence score (0.0 to 1.0), and verbatim code evidence.
3. **`opportunities`**: Seeded and custom roles (internships, research, hackathons, open source) with required and preferred skills.
4. **`match_results`**: Historical match scores, fit explanations, missing skills, and gap actions.
5. **`cached_responses`**: Deterministic SHA-256 hash-keyed responses for LLM calls and profile extractions.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Docker & Docker Compose (optional; backend auto-falls back to SQLite if MySQL is not running)

### 2. Environment Setup
Copy the template and configure your secrets:
```bash
cp .env.example .env
```
*(Optional)* Add your Anthropic API key in `.env`:
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
```
> If no API key is set, SkillProof uses the evidence-limited heuristic extractor and the demo profile remains available.

### 3. Start Database (MySQL 8)
```bash
docker-compose up -d
```
> **Note**: If Docker is not installed or running, the backend automatically detects this and falls back to a local SQLite database (`skillproof.db`).

### 4. Start the Backend API
From the `skillproof` project root:
```bash
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
# macOS/Linux: source .venv/bin/activate
pip install -r backend/requirements.txt
python -m backend.seed
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```
Backend: `http://localhost:8000` · Swagger: `http://localhost:8000/docs`.

### 5. Start the Frontend
In a new terminal:
```bash
cd frontend

# Install npm dependencies
npm install

# Start Vite dev server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🧪 Running Backend Tests

Run unit tests to verify matching determinism and LLM JSON parsing:
```bash
python -m pytest backend/tests -v
```

---

## 📡 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/demo-profile` | Returns pre-cached rich student profile immediately |
| `POST` | `/api/analyze-profile` | Analyzes GitHub repositories + resume with Claude LLM |
| `POST` | `/api/match` | Calculates weighted fit scores against opportunities |
| `GET` | `/api/opportunities` | Returns all available seeded opportunities |
| `POST` | `/api/org-match` | Ranks student candidates for a specific role/project |
| `POST` | `/api/teammates` | Finds complementary peers covering skill gaps (P1) |
| `GET` | `/api/health` | Healthcheck and environment status |

---

## 🛡️ License
MIT License.



## Prototype notes

- The supplied `.env` file is intentionally not distributed. Copy `.env.example` to `.env` and add your own credentials.
- The seeded student records and demo profile are illustrative demo data, not real verified candidates.
- GitHub analysis uses public repository metadata and README excerpts. It does not inspect private repositories or claim to analyze commit contents.
- Run commands from the `skillproof` project root so Python imports resolve consistently.
