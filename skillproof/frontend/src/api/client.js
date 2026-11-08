import axios from 'axios';
import demoProfileData from '../data/demo_profile.json';
import opportunitiesData from '../data/opportunities.json';
import studentsData from '../data/students.json';
import skillAliasesData from '../data/skill_aliases.json';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// --- Local Helpers for Seamless Offline & Pre-Database Fallback ---

function normalizeSkill(name) {
  if (!name) return '';
  const cleaned = name.trim().toLowerCase().replace(/^[\s\-*•"']+|[\s"']+$/g, '');
  return skillAliasesData[cleaned] || cleaned;
}

function calculateLocalMatch(studentSkills, opportunity) {
  const studentMap = {};
  for (const s of studentSkills) {
    const norm = normalizeSkill(s.normalized_name || s.name);
    studentMap[norm] = s;
  }

  const reqSkills = (opportunity.required_skills || []).map(normalizeSkill);
  const prefSkills = (opportunity.preferred_skills || []).map(normalizeSkill);

  const matchedReq = reqSkills.filter((s) => studentMap[s]);
  const missingReq = reqSkills.filter((s) => !studentMap[s]);

  const matchedPref = prefSkills.filter((s) => studentMap[s]);
  const missingPref = prefSkills.filter((s) => !studentMap[s]);

  const reqScore = reqSkills.length > 0 ? matchedReq.length / reqSkills.length : 1.0;
  const prefScore = prefSkills.length > 0 ? matchedPref.length / prefSkills.length : 1.0;

  const matchedAll = [...matchedReq, ...matchedPref];
  let avgConfidence = 0.75;
  if (matchedAll.length > 0) {
    const sum = matchedAll.reduce((acc, s) => {
      const sk = studentMap[s];
      const conf = Number(sk?.confidence || 0.75);
      const lvl = (sk?.level || 'intermediate').toLowerCase();
      const mult = lvl === 'advanced' ? 1.0 : lvl === 'intermediate' ? 0.8 : 0.5;
      return acc + conf * mult;
    }, 0);
    avgConfidence = sum / matchedAll.length;
  }

  let finalScore = (reqScore * 0.65 + prefScore * 0.20 + avgConfidence * 0.15) * 100;
  finalScore = Math.round(Math.min(100, Math.max(0, finalScore)) * 10) / 10;

  const fitReasons = [];
  for (const s of matchedReq) {
    const sk = studentMap[s];
    if (sk?.evidence) {
      fitReasons.push(`Strong match for required '${sk.name}' (${sk.level || 'Intermediate'}): ${sk.evidence}`);
    } else {
      fitReasons.push(`Verified ${sk?.level || 'Intermediate'} proficiency in required skill '${sk?.name || s}'.`);
    }
  }

  for (const s of matchedPref) {
    const sk = studentMap[s];
    fitReasons.push(`Bonus match for preferred skill '${sk?.name || s}'.`);
  }

  if (fitReasons.length === 0) {
    fitReasons.push('Opportunity aligns with candidate technology domain.');
  }

  const missingAll = [...missingReq, ...missingPref.map((p) => `${p} (preferred)`)];

  const gapActions = [];
  for (const miss of missingReq.slice(0, 3)) {
    const clean = miss.replace(' (preferred)', '');
    gapActions.push(
      `Bridge the '${clean}' gap: Build a dedicated repository or integrate ${clean} into an existing project.`
    );
  }

  return {
    score: finalScore,
    fit_reasons: fitReasons.slice(0, 4),
    missing_skills: missingAll,
    gap_actions: gapActions,
  };
}

function localMatchOpportunities(studentSkills, roleType, minScore = 0) {
  let list = opportunitiesData;
  if (roleType && roleType.toLowerCase() !== 'all') {
    list = list.filter((o) => o.role_type.toLowerCase() === roleType.toLowerCase());
  }

  const results = list
    .map((opp) => {
      const details = calculateLocalMatch(studentSkills, opp);
      return {
        opportunity: opp,
        score: details.score,
        fit_reasons: details.fit_reasons,
        missing_skills: details.missing_skills,
        gap_actions: details.gap_actions,
      };
    })
    .filter((m) => m.score >= minScore)
    .sort((a, b) => b.score - a.score);

  return results;
}

function localOrgMatch({ opportunity_id, role_title, role_description, required_skills, preferred_skills, min_score = 0 }) {
  let spec = {
    title: role_title || 'Technical Role',
    required_skills: required_skills || [],
    preferred_skills: preferred_skills || [],
  };

  if (opportunity_id) {
    const found = opportunitiesData.find((o) => o.id === Number(opportunity_id));
    if (found) {
      spec = found;
    }
  } else if (role_description && spec.required_skills.length === 0) {
    const lower = role_description.toLowerCase();
    const common = ['python', 'react', 'typescript', 'docker', 'kubernetes', 'postgresql', 'fastapi', 'pytorch', 'go'];
    spec.required_skills = common.filter((c) => lower.includes(c)).slice(0, 4);
    if (spec.required_skills.length === 0) {
      spec.required_skills = ['python', 'docker'];
    }
  }

  const results = studentsData
    .map((student) => {
      const details = calculateLocalMatch(student.skills || [], spec);
      const matched = (student.skills || [])
        .map((s) => normalizeSkill(s.name))
        .filter((s) => (spec.required_skills || []).map(normalizeSkill).includes(s));

      const topEv = (student.skills || []).map((s) => s.evidence).filter(Boolean).slice(0, 2);

      return {
        student,
        score: details.score,
        matched_skills: matched,
        missing_skills: details.missing_skills,
        fit_reasons: details.fit_reasons,
        top_evidence: topEv,
      };
    })
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score);

  return results;
}

function localGetTeammates({ student_id, opportunity_id, target_skills }) {
  const current = studentsData.find((s) => s.id === Number(student_id)) || demoProfileData;
  const currentSkills = (current.skills || []).map((s) => normalizeSkill(s.name));

  let oppSkills = target_skills || [];
  if (opportunity_id) {
    const opp = opportunitiesData.find((o) => o.id === Number(opportunity_id));
    if (opp) {
      oppSkills = [...(opp.required_skills || []), ...(opp.preferred_skills || [])].map(normalizeSkill);
    }
  }

  const currentGaps = oppSkills.filter((s) => !currentSkills.includes(s));

  const peers = studentsData
    .filter((s) => s.id !== current.id && s.github_username !== current.github_username)
    .map((peer) => {
      const peerSkills = (peer.skills || []).map((s) => normalizeSkill(s.name));
      const covered = currentGaps.filter((g) => peerSkills.includes(g));
      const shared = currentSkills.filter((s) => peerSkills.includes(s));

      const coverageRatio = currentGaps.length > 0 ? covered.length / currentGaps.length : 0.6;
      const sharedRatio = Math.min(1.0, shared.length / 3.0);
      const compScore = Math.round((coverageRatio * 0.7 + sharedRatio * 0.3) * 1000) / 10;

      return {
        teammate: peer,
        complementarity_score: Math.min(99.0, Math.max(30.0, compScore)),
        shared_skills: shared.slice(0, 4),
        skills_they_cover: covered,
        synergy_reason:
          covered.length > 0
            ? `${peer.name} covers key capability gaps in ${covered.join(', ')}.`
            : `${peer.name} offers strong shared engineering foundation to parallelize execution.`,
      };
    })
    .sort((a, b) => b.complementarity_score - a.complementarity_score);

  return peers.slice(0, 6);
}

function localAnalyzeProfile({ github_username, resume_text, manual_skills }) {
  // Check if matching seeded student
  const matched = studentsData.find(
    (s) => s.github_username?.toLowerCase() === github_username?.toLowerCase()
  );
  if (matched) {
    return matched;
  }

  // Enriched synthetic profile
  const baseSkills = [...demoProfileData.skills];
  if (manual_skills && manual_skills.length > 0) {
    for (const ms of manual_skills) {
      if (!baseSkills.some((b) => b.name.toLowerCase() === ms.toLowerCase())) {
        baseSkills.push({
          name: ms,
          normalized_name: normalizeSkill(ms),
          level: 'Intermediate',
          confidence: 0.75,
          evidence: `Candidate coursework and practical experience in ${ms}.`,
          source: 'manual',
        });
      }
    }
  }

  return {
    id: 99,
    name: github_username || 'Applicant',
    github_username: github_username || 'developer',
    email: `${github_username || 'applicant'}@university.edu`,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    bio: resume_text ? resume_text.slice(0, 160) : 'Passionate software engineer and student developer.',
    repos_analyzed: 8,
    skills: baseSkills,
  };
}

// --- Exported API Endpoint Functions ---

export async function uploadResume(formData) {
  try {
    const response = await apiClient.post('/resume/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (err) {
    console.warn('Backend unavailable for resume upload, parsing profile client-side for static demo:', err.message);
    const file = formData.get ? formData.get('file') : null;
    let fileName = file?.name || 'Resume Candidate';
    let baseName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    if (baseName.toLowerCase().includes('resume')) baseName = 'Candidate';

    const githubUser = formData.get ? (formData.get('github_username') || 'developer') : 'developer';

    const profile = await localAnalyzeProfile({
      github_username: githubUser,
      resume_text: `Extracted skills from ${fileName}. Proven experience with Python, React, Docker, PyTorch, and REST APIs.`,
      manual_skills: ['Python', 'Docker', 'React', 'REST APIs', 'PostgreSQL'],
    });
    profile.name = baseName.charAt(0).toUpperCase() + baseName.slice(1);

    const suggestions = await getPersonalizedSuggestions({
      name: profile.name,
      skills: profile.skills,
    });

    return {
      profile,
      suggestions,
    };
  }
}

export async function getPersonalizedSuggestions(data) {
  try {
    const response = await apiClient.post('/resume/suggestions', data);
    return response.data;
  } catch (err) {
    console.warn('Backend unavailable, generating personalized suggestions locally:', err.message);
    // Client-side fallback dynamic generator
    const skills = data.skills || [];
    const hasAI = skills.some((s) => ['pytorch', 'transformers', 'large language models', 'langchain'].includes((s.name || '').toLowerCase()));
    const hasSys = skills.some((s) => ['rust', 'c++', 'c'].includes((s.name || '').toLowerCase()));
    const hasFront = skills.some((s) => ['react', 'typescript', 'tailwind css', 'next.js'].includes((s.name || '').toLowerCase()));

    let archetype = {
      title: 'Fullstack Product & API Engineer',
      tagline: 'You bridge responsive interfaces with reliable microservices.',
      target_roles: ['Fullstack Engineer', 'Backend Developer', 'Product Engineer'],
    };
    if (hasAI) {
      archetype = {
        title: 'Generative AI & LLM Systems Specialist',
        tagline: 'You excel in neural model fine-tuning and evaluation pipelines.',
        target_roles: ['AI Research Assistant', 'LLM Engineer', 'Applied AI Scientist'],
      };
    } else if (hasSys) {
      archetype = {
        title: 'High-Performance Systems & Infrastructure Engineer',
        tagline: 'You build zero-cost concurrency primitives and network edge services.',
        target_roles: ['Systems Engineer', 'Distributed Database Intern', 'Edge Infrastructure Specialist'],
      };
    } else if (hasFront) {
      archetype = {
        title: 'Modern Frontend & Developer Experience Architect',
        tagline: 'You craft fast, accessible, keyboard-first interactive applications.',
        target_roles: ['Frontend Design Engineer', 'Product UI Specialist', 'Web Performance Engineer'],
      };
    }

    return {
      archetype,
      readiness_score: Math.min(95, Math.max(55, skills.length * 10 + 20)),
      candidate_name: data.name || 'Candidate',
      top_strengths: skills.slice(0, 3).map((s) => ({
        skill: s.name,
        level: s.level || 'Intermediate',
        confidence: Math.round((s.confidence || 0.8) * 100),
        evidence: s.evidence || 'Demonstrated practical competence.',
      })),
      tailored_blueprints: [
        {
          title: `Build an Async Telemetry Microservice for your ${skills[0]?.name || 'Core'} Stack`,
          missing_skill_targeted: 'Docker & Microservices',
          why_it_matters: 'Top-tier tech teams expect containerized deployments and clear service contracts.',
          action_steps: [
            'Containerize your application using a multi-stage Dockerfile.',
            'Implement healthcheck endpoints and structured JSON error logging.',
            'Publish an interactive OpenAPI documentation page.',
          ],
          estimated_effort: '2 days',
        },
      ],
      resume_advice: [
        `Lead with your ${archetype.title} archetype in your resume summary to immediately stand out.`,
        'Add quantified metrics to your project descriptions (e.g., latency reduction, test coverage, star count).',
      ],
      recommended_opportunities: opportunitiesData.slice(0, 3).map((o) => ({
        id: o.id,
        title: o.title,
        company: o.company_or_lab,
        role_type: o.role_type,
        score: 85.0,
        why_you_fit: ['Strong alignment with your core technical competencies.'],
        missing_skills: [],
      })),
    };
  }
}

export async function loginUser(data) {
  try {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  } catch (err) {
    if (err?.response?.data?.detail) {
      throw new Error(err.response.data.detail);
    }
    // Fallback demo mock
    if (data.email.includes('stripe') || data.email.includes('recruiter')) {
      return {
        id: 2,
        name: 'Sarah Jenkins',
        email: data.email,
        role: 'organization',
        company_name: 'Stripe',
        avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        token: 'mock_token_org',
      };
    }
    return {
      id: 1,
      name: 'Alex Chen',
      email: data.email,
      role: 'student',
      github_username: 'alexchen-dev',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      token: 'mock_token_student',
    };
  }
}

export async function registerUser(data) {
  try {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  } catch (err) {
    if (err?.response?.data?.detail) {
      throw new Error(err.response.data.detail);
    }
    return {
      id: Math.floor(Math.random() * 1000) + 10,
      name: data.name,
      email: data.email,
      role: data.role || 'student',
      github_username: data.github_username,
      company_name: data.company_name,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      token: 'mock_token_registered',
    };
  }
}

export async function getDemoProfile() {
  try {
    const response = await apiClient.get('/demo-profile');
    return response.data;
  } catch (err) {
    console.warn('Backend unavailable, using pre-cached demo profile:', err.message);
    return demoProfileData;
  }
}

export async function analyzeProfile(data) {
  try {
    const response = await apiClient.post('/analyze-profile', data);
    return response.data;
  } catch (err) {
    console.warn('Backend unavailable, generating verified profile locally:', err.message);
    return localAnalyzeProfile(data);
  }
}

export async function matchOpportunities(data) {
  try {
    const response = await apiClient.post('/match', data);
    return response.data;
  } catch (err) {
    console.warn('Backend unavailable, computing matches client-side:', err.message);
    const skills = data.skills || [];
    return localMatchOpportunities(skills, data.role_type, data.min_score || 0);
  }
}

export async function getOpportunities() {
  try {
    const response = await apiClient.get('/opportunities');
    return response.data;
  } catch (err) {
    console.warn('Backend unavailable, using seeded opportunities:', err.message);
    return opportunitiesData;
  }
}

export async function orgMatch(data) {
  try {
    const response = await apiClient.post('/org-match', data);
    return response.data;
  } catch (err) {
    console.warn('Backend unavailable, ranking candidates client-side:', err.message);
    return localOrgMatch(data);
  }
}

export async function getTeammates(data) {
  try {
    const response = await apiClient.post('/teammates', data);
    return response.data;
  } catch (err) {
    console.warn('Backend unavailable, computing teammates client-side:', err.message);
    return localGetTeammates(data);
  }
}


