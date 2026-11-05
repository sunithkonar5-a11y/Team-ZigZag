import sqlite3
import re
from pathlib import Path

def slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r'[\s\.\-\/\+]+', '-', s)
    return re.sub(r'[^a-z0-9\-]', '', s).strip('-')

SEEDED_OPPORTUNITIES = [
    {
        "title": "Backend Engineering Intern",
        "company": "Stripe",
        "type_slug": "internship",
        "field_slug": "software-development",
        "role_cat_slug": "backend-developer",
        "description": "Join our Core Payments API team to design resilient distributed transaction pipelines and developer-facing REST endpoints with high uptime SLAs.",
        "responsibilities": "Build high-throughput Python API services, design PostgreSQL schema migrations, containerize microservices with Docker, optimize database queries.",
        "work_mode": "hybrid",
        "employment_type": "full_time",
        "experience_level": "student",
        "country": "United States",
        "state": "CA",
        "city": "San Francisco",
        "location_text": "San Francisco, CA (Hybrid)",
        "is_paid": 1,
        "comp_min": 6000,
        "comp_max": 9000,
        "comp_curr": "USD",
        "comp_period": "month",
        "url": "https://stripe.com/jobs",
        "required_skills": ["Python", "PostgreSQL", "Docker", "REST APIs"],
        "preferred_skills": ["FastAPI", "Redis", "CI/CD", "AWS"]
    },
    {
        "title": "Fullstack Product Engineering Intern",
        "company": "Vercel",
        "type_slug": "internship",
        "field_slug": "software-development",
        "role_cat_slug": "full-stack-developer",
        "description": "Build high-performance developer tools and dashboard workflows powering modern web deployments using Next.js, React, and TypeScript.",
        "responsibilities": "Develop responsive React interfaces, build type-safe TypeScript backends, implement modern Tailwind CSS design systems.",
        "work_mode": "remote",
        "employment_type": "full_time",
        "experience_level": "student",
        "country": "Global",
        "state": None,
        "city": "Remote",
        "location_text": "Global Remote",
        "is_paid": 1,
        "comp_min": 5500,
        "comp_max": 8500,
        "comp_curr": "USD",
        "comp_period": "month",
        "url": "https://vercel.com/careers",
        "required_skills": ["React", "TypeScript", "Tailwind CSS", "Node.js"],
        "preferred_skills": ["Next.js", "GraphQL", "Docker"]
    },
    {
        "title": "AI Alignment & Evaluation Research Assistant",
        "company": "Stanford AI Lab (SAIL)",
        "type_slug": "research",
        "field_slug": "ai-machine-learning",
        "role_cat_slug": "software-engineer",
        "description": "Investigate prompt sensitivity, mechanistic interpretability, and reward model benchmark consistency for instruction-tuned open weights models.",
        "responsibilities": "Run PyTorch distributed evaluation scripts, fine-tune Hugging Face transformer models, analyze attention patterns.",
        "work_mode": "onsite",
        "employment_type": "part_time",
        "experience_level": "student",
        "country": "United States",
        "state": "CA",
        "city": "Stanford",
        "location_text": "Stanford, CA (On-site)",
        "is_paid": 1,
        "comp_min": 4000,
        "comp_max": 6000,
        "comp_curr": "USD",
        "comp_period": "month",
        "url": "https://ai.stanford.edu",
        "required_skills": ["Python", "PyTorch", "Transformers", "Large Language Models"],
        "preferred_skills": ["Hugging Face", "Scikit-Learn", "Git"]
    },
    {
        "title": "Open Source Contributor Fellow",
        "company": "Apache Software Foundation",
        "type_slug": "fellowship",
        "field_slug": "software-development",
        "role_cat_slug": "full-stack-developer",
        "description": "Contribute to query caching, interactive charting adapters, and SQL dialect parsers for Apache Superset with global maintainers.",
        "responsibilities": "Submit PRs to Apache Superset, write unit tests in Python, implement React interactive charting dashboards.",
        "work_mode": "remote",
        "employment_type": "contract",
        "experience_level": "student",
        "country": "Global",
        "state": None,
        "city": "Remote",
        "location_text": "Global Remote",
        "is_paid": 1,
        "comp_min": 3000,
        "comp_max": 5000,
        "comp_curr": "USD",
        "comp_period": "month",
        "url": "https://superset.apache.org",
        "required_skills": ["Python", "React", "TypeScript", "PostgreSQL"],
        "preferred_skills": ["Docker", "CI/CD", "Git"]
    },
    {
        "title": "DevOps & Cloud Infrastructure Intern",
        "company": "Datadog",
        "type_slug": "internship",
        "field_slug": "cloud-devops",
        "role_cat_slug": "software-engineer",
        "description": "Work with container orchestration, Prometheus telemetry ingest, and infrastructure-as-code automation across multi-region Kubernetes clusters.",
        "responsibilities": "Automate Kubernetes cluster provisioning, write Go diagnostic utilities, construct GitHub Actions CI/CD matrix builds.",
        "work_mode": "hybrid",
        "employment_type": "full_time",
        "experience_level": "student",
        "country": "United States",
        "state": "NY",
        "city": "New York",
        "location_text": "New York, NY (Hybrid)",
        "is_paid": 1,
        "comp_min": 6500,
        "comp_max": 9500,
        "comp_curr": "USD",
        "comp_period": "month",
        "url": "https://datadoghq.com/careers",
        "required_skills": ["Docker", "Kubernetes", "Go", "CI/CD"],
        "preferred_skills": ["AWS", "Python", "Terraform"]
    },
    {
        "title": "Systems Software Intern",
        "company": "Cloudflare",
        "type_slug": "internship",
        "field_slug": "software-development",
        "role_cat_slug": "software-engineer",
        "description": "Implement zero-overhead memory-safe network packet filters and high-throughput proxy workers at edge points of presence.",
        "responsibilities": "Develop async Rust services, optimize C++ socket bindings, profile low-level Linux network throughput.",
        "work_mode": "hybrid",
        "employment_type": "full_time",
        "experience_level": "student",
        "country": "United States",
        "state": "TX",
        "city": "Austin",
        "location_text": "Austin, TX (Hybrid)",
        "is_paid": 1,
        "comp_min": 6200,
        "comp_max": 9200,
        "comp_curr": "USD",
        "comp_period": "month",
        "url": "https://cloudflare.com/careers",
        "required_skills": ["Rust", "C++", "Docker"],
        "preferred_skills": ["Go", "Linux", "CI/CD"]
    },
    {
        "title": "Climate Intelligence Hackathon Project",
        "company": "PennApps Hackathon",
        "type_slug": "hackathon",
        "field_slug": "software-development",
        "role_cat_slug": "full-stack-developer",
        "description": "Collaborate on a 36-hour sprint to build a geospatial flood risk visualizer combining satellite imagery models with an interactive map dashboard.",
        "responsibilities": "FastAPI REST service development, interactive React deck.gl visualization, data pipeline integration.",
        "work_mode": "remote",
        "employment_type": "temporary",
        "experience_level": "student",
        "country": "United States",
        "state": "PA",
        "city": "Philadelphia",
        "location_text": "Philadelphia, PA / Virtual",
        "is_paid": 1,
        "comp_min": 1000,
        "comp_max": 5000,
        "comp_curr": "USD",
        "comp_period": "one_time",
        "url": "https://pennapps.com",
        "required_skills": ["React", "Python", "FastAPI"],
        "preferred_skills": ["Tailwind CSS", "PyTorch", "Docker"]
    },
    {
        "title": "LLM Autonomous Agents Researcher",
        "company": "Berkeley AI Research (BAIR)",
        "type_slug": "research",
        "field_slug": "ai-machine-learning",
        "role_cat_slug": "software-engineer",
        "description": "Explore agent tool usage, function calling reliability, and tree-of-thought verification across multi-agent coding benchmarks.",
        "responsibilities": "Benchmark LangChain and DSPy multi-agent workflows, build evaluation metrics for LLM code reasoning.",
        "work_mode": "hybrid",
        "employment_type": "part_time",
        "experience_level": "student",
        "country": "United States",
        "state": "CA",
        "city": "Berkeley",
        "location_text": "Berkeley, CA (Hybrid)",
        "is_paid": 1,
        "comp_min": 4500,
        "comp_max": 6500,
        "comp_curr": "USD",
        "comp_period": "month",
        "url": "https://bair.berkeley.edu",
        "required_skills": ["Python", "LangChain", "Large Language Models", "PyTorch"],
        "preferred_skills": ["FastAPI", "Docker", "LlamaIndex"]
    },
    {
        "title": "Frontend Design Engineer Intern",
        "company": "Linear",
        "type_slug": "internship",
        "field_slug": "software-development",
        "role_cat_slug": "frontend-developer",
        "description": "Craft keyboard-first interactive desktop-grade web applications with smooth 60fps micro-interactions, optimistic updates, and offline sync.",
        "responsibilities": "Build accessible React components, optimize DOM rendering, refine Tailwind CSS UI interactions.",
        "work_mode": "remote",
        "employment_type": "full_time",
        "experience_level": "student",
        "country": "United States",
        "state": "CA",
        "city": "San Francisco",
        "location_text": "Remote (US/EU)",
        "is_paid": 1,
        "comp_min": 6000,
        "comp_max": 9000,
        "comp_curr": "USD",
        "comp_period": "month",
        "url": "https://linear.app/careers",
        "required_skills": ["React", "TypeScript", "Tailwind CSS", "JavaScript"],
        "preferred_skills": ["Next.js", "GraphQL", "REST APIs"]
    },
    {
        "title": "Distributed Database Intern",
        "company": "Cockroach Labs",
        "type_slug": "internship",
        "field_slug": "software-development",
        "role_cat_slug": "backend-developer",
        "description": "Design transaction isolation verification harnesses and consensus protocols for multi-cloud scale SQL databases.",
        "responsibilities": "Implement Go consensus verification tools, profile PostgreSQL SQL dialect compliance, run Docker integration tests.",
        "work_mode": "hybrid",
        "employment_type": "full_time",
        "experience_level": "student",
        "country": "United States",
        "state": "NY",
        "city": "New York",
        "location_text": "New York, NY",
        "is_paid": 1,
        "comp_min": 6500,
        "comp_max": 9500,
        "comp_curr": "USD",
        "comp_period": "month",
        "url": "https://cockroachlabs.com/careers",
        "required_skills": ["Go", "PostgreSQL", "Docker"],
        "preferred_skills": ["Kubernetes", "C++", "CI/CD"]
    },
    {
        "title": "HealthTech AI Clinical Summarizer",
        "company": "MIT Hacking Medicine",
        "type_slug": "hackathon",
        "field_slug": "ai-machine-learning",
        "role_cat_slug": "full-stack-developer",
        "description": "Prototype a HIPAA-compliant voice-to-structured-EHR summary engine for ER physicians under tight time constraints.",
        "responsibilities": "Build FastAPI audio-to-text inference pipeline, React clinician summary interface, prompt evaluation.",
        "work_mode": "hybrid",
        "employment_type": "temporary",
        "experience_level": "student",
        "country": "United States",
        "state": "MA",
        "city": "Cambridge",
        "location_text": "Cambridge, MA / Hybrid",
        "is_paid": 1,
        "comp_min": 2000,
        "comp_max": 6000,
        "comp_curr": "USD",
        "comp_period": "one_time",
        "url": "https://hackingmedicine.mit.edu",
        "required_skills": ["Python", "FastAPI", "React"],
        "preferred_skills": ["Large Language Models", "Tailwind CSS", "Docker"]
    },
    {
        "title": "Mobile App Engineering Intern",
        "company": "Duolingo",
        "type_slug": "internship",
        "field_slug": "software-development",
        "role_cat_slug": "mobile-app-developer",
        "description": "Build gamified learning experiences and interactive speech assessment screens for millions of language learners worldwide.",
        "responsibilities": "Develop React-Native cross-platform screens, write typed TypeScript viewmodels, connect to REST backend.",
        "work_mode": "hybrid",
        "employment_type": "full_time",
        "experience_level": "student",
        "country": "United States",
        "state": "PA",
        "city": "Pittsburgh",
        "location_text": "Pittsburgh, PA (Hybrid)",
        "is_paid": 1,
        "comp_min": 5500,
        "comp_max": 8500,
        "comp_curr": "USD",
        "comp_period": "month",
        "url": "https://careers.duolingo.com",
        "required_skills": ["React-Native", "TypeScript", "JavaScript"],
        "preferred_skills": ["Python", "REST APIs", "CI/CD"]
    },
    {
        "title": "Data Platform & Analytics Intern",
        "company": "Snowflake",
        "type_slug": "internship",
        "field_slug": "data-analytics",
        "role_cat_slug": "data-analyst",
        "description": "Build high-throughput parquet data pipelines, query monitoring metrics, and metadata governance tools.",
        "responsibilities": "Write Python SQL ETL pipelines, design PostgreSQL aggregation queries, test containerized pipelines with Docker.",
        "work_mode": "hybrid",
        "employment_type": "full_time",
        "experience_level": "student",
        "country": "United States",
        "state": "CA",
        "city": "San Mateo",
        "location_text": "San Mateo, CA",
        "is_paid": 1,
        "comp_min": 6000,
        "comp_max": 9000,
        "comp_curr": "USD",
        "comp_period": "month",
        "url": "https://snowflake.com/careers",
        "required_skills": ["Python", "PostgreSQL", "Docker"],
        "preferred_skills": ["AWS", "Kubernetes", "Go"]
    },
    {
        "title": "Open Source LangChain Ecosystem Contributor",
        "company": "LangChain Core",
        "type_slug": "freelance",
        "field_slug": "ai-machine-learning",
        "role_cat_slug": "software-engineer",
        "description": "Build integration connectors, community document loaders, vector store benchmarks, and robust evaluation suites.",
        "responsibilities": "Implement Python LangChain document loaders, build vector store benchmarks, test LLM prompt integrations.",
        "work_mode": "remote",
        "employment_type": "contract",
        "experience_level": "student",
        "country": "Global",
        "state": None,
        "city": "Remote",
        "location_text": "Global Remote",
        "is_paid": 1,
        "comp_min": 3500,
        "comp_max": 6000,
        "comp_curr": "USD",
        "comp_period": "month",
        "url": "https://github.com/langchain-ai/langchain",
        "required_skills": ["Python", "LangChain", "Large Language Models"],
        "preferred_skills": ["FastAPI", "PyTorch", "Docker"]
    },
    {
        "title": "Security & Cryptography Research Assistant",
        "company": "MIT CSAIL",
        "type_slug": "research",
        "field_slug": "cybersecurity",
        "role_cat_slug": "software-engineer",
        "description": "Benchmark zero-knowledge proof verification circuits and privacy-preserving data structures for decentralized consensus networks.",
        "responsibilities": "Write Rust cryptographic primitives, analyze C++ verification routines, benchmark memory consumption on Linux.",
        "work_mode": "onsite",
        "employment_type": "part_time",
        "experience_level": "student",
        "country": "United States",
        "state": "MA",
        "city": "Cambridge",
        "location_text": "Cambridge, MA",
        "is_paid": 1,
        "comp_min": 4200,
        "comp_max": 6200,
        "comp_curr": "USD",
        "comp_period": "month",
        "url": "https://csail.mit.edu",
        "required_skills": ["Rust", "C++", "Python"],
        "preferred_skills": ["Docker", "Git", "Linux"]
    },
    {
        "title": "Junior Full Stack Engineer",
        "company": "Razorpay",
        "type_slug": "full-time-job",
        "field_slug": "software-development",
        "role_cat_slug": "full-stack-developer",
        "description": "Develop merchant onboarding portals and merchant checkout analytics dashboards with high reliability and security.",
        "responsibilities": "Build React merchant interfaces, develop Python transaction microservices, manage PostgreSQL queries.",
        "work_mode": "hybrid",
        "employment_type": "full_time",
        "experience_level": "entry_level",
        "country": "India",
        "state": "Karnataka",
        "city": "Bengaluru",
        "location_text": "Bengaluru, India (Hybrid)",
        "is_paid": 1,
        "comp_min": 1200000,
        "comp_max": 1800000,
        "comp_curr": "INR",
        "comp_period": "year",
        "url": "https://razorpay.com/jobs",
        "required_skills": ["React", "Python", "PostgreSQL", "REST APIs"],
        "preferred_skills": ["Docker", "Go", "CI/CD"]
    }
]

def seed_opportunities69_db(db_path: str = "opportunities69.db") -> int:
    path = Path(db_path).resolve()
    if not path.exists():
        print(f"Database file {path} not found.")
        return 0

    conn = sqlite3.connect(str(path))
    cur = conn.cursor()

    # Read lookup tables
    type_map = {row[2]: row[0] for row in cur.execute("SELECT id, name, slug FROM opportunity_types").fetchall()}
    field_map = {row[2]: row[0] for row in cur.execute("SELECT id, name, slug FROM job_fields").fetchall()}
    role_cat_map = {row[3]: row[0] for row in cur.execute("SELECT id, job_field_id, name, slug FROM role_categories").fetchall()}

    # Clear existing opportunities and skills if needed or check count
    cur.execute("DELETE FROM opportunity_skills")
    cur.execute("DELETE FROM opportunities")
    cur.execute("DELETE FROM skills")

    skill_cache = {}

    def get_or_create_skill(skill_name: str) -> int:
        clean = skill_name.strip()
        slug = slugify(clean)
        if slug in skill_cache:
            return skill_cache[slug]
        cur.execute("SELECT id FROM skills WHERE slug = ?", (slug,))
        row = cur.fetchone()
        if row:
            skill_cache[slug] = row[0]
            return row[0]
        cur.execute("INSERT INTO skills (name, slug) VALUES (?, ?)", (clean, slug))
        new_id = cur.lastrowid
        skill_cache[slug] = new_id
        return new_id

    count = 0
    for item in SEEDED_OPPORTUNITIES:
        opp_type_id = type_map.get(item["type_slug"], 3)
        job_field_id = field_map.get(item["field_slug"], 1)
        role_cat_id = role_cat_map.get(item["role_cat_slug"], 1)

        cur.execute("""
            INSERT INTO opportunities (
                opportunity_type_id, job_field_id, role_category_id,
                title, description, responsibilities,
                work_mode, employment_type, experience_level,
                country, state, city, location_text,
                is_paid, compensation_min, compensation_max, compensation_currency, compensation_period,
                application_url, source_name,
                status, is_featured, is_verified, views_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            opp_type_id, job_field_id, role_cat_id,
            item["title"], item["description"], item["responsibilities"],
            item["work_mode"], item["employment_type"], item["experience_level"],
            item["country"], item["state"], item["city"], item["location_text"],
            item["is_paid"], item["comp_min"], item["comp_max"], item["comp_curr"], item["comp_period"],
            item["url"], item["company"],
            'published', 1, 1, 42
        ))
        opp_id = cur.lastrowid

        # Insert required skills
        for sk in item["required_skills"]:
            sk_id = get_or_create_skill(sk)
            cur.execute("""
                INSERT OR IGNORE INTO opportunity_skills (opportunity_id, skill_id, is_required)
                VALUES (?, ?, 1)
            """, (opp_id, sk_id))

        # Insert preferred skills
        for sk in item["preferred_skills"]:
            sk_id = get_or_create_skill(sk)
            cur.execute("""
                INSERT OR IGNORE INTO opportunity_skills (opportunity_id, skill_id, is_required)
                VALUES (?, ?, 0)
            """, (opp_id, sk_id))

        count += 1

    conn.commit()
    conn.close()
    print(f"Successfully populated {count} opportunities into {path.name}!")
    return count

if __name__ == "__main__":
    seed_opportunities69_db()

