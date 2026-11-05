/* ==========================================================================
   MAIN JAVASCRIPT - Shared State, Seed Data, Storage & Match Calculation
   ========================================================================== */

const STORAGE_KEYS = {
  USERS: 'tb_users',
  CURRENT_USER: 'tb_current_user',
  OPPORTUNITIES: 'tb_opportunities',
  STUDENTS: 'tb_students',
  APPLICATIONS: 'tb_applications'
};

// Realistic initial opportunities
const DEFAULT_OPPORTUNITIES = [
  {
    id: 'opp-1',
    title: 'Frontend Engineering Intern',
    organization: 'TechNova Labs',
    logo: 'TN',
    type: 'Internship',
    location: 'Remote',
    deadline: 'Dec 15, 2026',
    stipend: '$1,200 / month',
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'UI/UX'],
    description: 'Join TechNova Labs to build high-performance design systems and interactive student analytics dashboards. You will collaborate directly with senior product designers and frontend architects on production web applications.',
    responsibilities: [
      'Build responsive, accessible user interfaces using modern HTML5, CSS3, and modular JavaScript.',
      'Translate Figma product mockups into reusable UI components with smooth micro-interactions.',
      'Optimize web page performance and collaborate in weekly sprint code reviews.'
    ]
  },
  {
    id: 'opp-2',
    title: 'Global AI & Data Innovation Hackathon',
    organization: 'QuantEdge AI',
    logo: 'QE',
    type: 'Hackathon',
    location: 'Hybrid',
    deadline: 'Nov 28, 2026',
    stipend: '$10,000 Prize Pool',
    requiredSkills: ['Python', 'Machine Learning', 'Data Analysis', 'SQL'],
    description: 'A 48-hour flagship hackathon bringing together top student builders to solve real-world predictive analytics and climate modeling challenges using structured datasets.',
    responsibilities: [
      'Form a team of up to 4 students and build a working prototype within 48 hours.',
      'Present technical architecture and model evaluation metrics to industry judges.',
      'Deploy an interactive demo accessible for live testing.'
    ]
  },
  {
    id: 'opp-3',
    title: 'Product Design & UI Systems Fellowship',
    organization: 'FigmaCraft Studio',
    logo: 'FC',
    type: 'Workshop',
    location: 'Remote',
    deadline: 'Dec 05, 2026',
    stipend: 'Fully Funded Fellowship',
    requiredSkills: ['UI/UX', 'HTML', 'CSS'],
    description: 'An intensive 6-week hands-on mentorship program focused on scalable design tokens, user research workflows, and interactive prototyping for SaaS platforms.',
    responsibilities: [
      'Complete weekly design critiques with leads from top product companies.',
      'Build and publish a comprehensive multi-page SaaS design system.',
      'Conduct usability tests with real student users.'
    ]
  },
  {
    id: 'opp-4',
    title: 'Full-Stack Open Source Research Project',
    organization: 'Apex Cloud Systems',
    logo: 'AC',
    type: 'Project',
    location: 'Remote',
    deadline: 'Jan 10, 2027',
    stipend: '$800 Grant',
    requiredSkills: ['JavaScript', 'Python', 'SQL', 'HTML'],
    description: 'Collaborate with distributed student developers to build an open-source developer telemetry tool for university coding clubs and engineering teams.',
    responsibilities: [
      'Architect clean REST APIs and lightweight vanilla JS visualization widgets.',
      'Write unit tests and developer documentation for community contributors.',
      'Participate in bi-weekly architecture syncs.'
    ]
  },
  {
    id: 'opp-5',
    title: 'National Algorithmic Coding Championship',
    organization: 'CodeMatrix Org',
    logo: 'CM',
    type: 'Competition',
    location: 'On-site',
    deadline: 'Dec 20, 2026',
    stipend: 'Direct Final Round Interviews + Prizes',
    requiredSkills: ['C++', 'Java', 'Python'],
    description: 'Test your algorithmic problem-solving speed in graph theory, dynamic programming, and system optimization against top university programmers.',
    responsibilities: [
      'Solve 6 algorithmic challenges in a 3-hour timed environment.',
      'Optimize time and memory complexity for large-scale edge cases.',
      'Top 25 finalists receive direct fast-track interviews with partner tech firms.'
    ]
  },
  {
    id: 'opp-6',
    title: 'Data Analytics & BI Summer Intern',
    organization: 'FinPulse Analytics',
    logo: 'FP',
    type: 'Internship',
    location: 'On-site',
    deadline: 'Jan 18, 2027',
    stipend: '$1,400 / month',
    requiredSkills: ['SQL', 'Python', 'Data Analysis'],
    description: 'Work with the FinPulse growth intelligence team to analyze user retention cohorts, automate SQL reporting pipelines, and uncover product insights.',
    responsibilities: [
      'Write optimized SQL queries across millions of anonymized transaction records.',
      'Build automated Python data cleaning scripts and executive dashboards.',
      'Present weekly hypothesis-driven findings to product managers.'
    ]
  }
];

// Realistic sample students for Explore Talent
const DEFAULT_STUDENTS = [
  {
    id: 'stu-1',
    name: 'Aarav Mehta',
    headline: 'Frontend Developer & UI Systems Enthusiast',
    domain: 'Frontend & UI/UX',
    level: 'Advanced',
    college: 'IIT Bombay',
    year: '3rd Year',
    location: 'Mumbai, India',
    bio: 'Passionate about crafting accessible web interfaces and design systems. Winner of 2 national web hackathons.',
    skills: ['HTML', 'CSS', 'JavaScript', 'UI/UX'],
    github: 'https://github.com/aarav-dev',
    linkedin: 'https://linkedin.com/in/aarav-mehta',
    projects: [
      {
        title: 'PulseUI Component Library',
        description: 'Zero-dependency accessible CSS and vanilla JS component framework built for fast student projects.',
        tech: ['HTML', 'CSS', 'JavaScript'],
        github: 'https://github.com',
        demo: 'https://example.com'
      },
      {
        title: 'CampusFlow Event Scheduler',
        description: 'Interactive drag-and-drop timetable builder for university clubs and hackathon organizers.',
        tech: ['JavaScript', 'UI/UX', 'CSS'],
        github: 'https://github.com',
        demo: 'https://example.com'
      },
      {
        title: 'DevMetrics Portfolio Tracker',
        description: 'Real-time GitHub contribution and skill visualization dashboard.',
        tech: ['HTML', 'JavaScript'],
        github: 'https://github.com',
        demo: 'https://example.com'
      }
    ],
    achievements: [
      { title: '1st Place — HackIndia Web Track 2026', issuer: 'HackIndia Foundation', date: 'Aug 2026', badge: 'Winner' },
      { title: 'Google UX Design Professional Certificate', issuer: 'Coursera', date: 'May 2026', badge: 'Certificate' }
    ]
  },
  {
    id: 'stu-2',
    name: 'Riya Sharma',
    headline: 'Machine Learning & Data Science Researcher',
    domain: 'AI & Data Science',
    level: 'Advanced',
    college: 'BITS Pilani',
    year: '4th Year',
    location: 'Bengaluru, India',
    bio: 'Exploring applied machine learning in healthcare diagnostics and predictive analytics.',
    skills: ['Python', 'Machine Learning', 'Data Analysis', 'SQL'],
    github: 'https://github.com/riya-ml',
    linkedin: 'https://linkedin.com/in/riya-sharma',
    projects: [
      {
        title: 'MediScan Anomaly Detector',
        description: 'Supervised learning pipeline for early detection of retinal scan irregularities with 94% validation accuracy.',
        tech: ['Python', 'Machine Learning', 'Data Analysis'],
        github: 'https://github.com',
        demo: 'https://example.com'
      },
      {
        title: 'RetailDemand Forecaster',
        description: 'Time-series SQL and Python forecasting tool for seasonal inventory optimization.',
        tech: ['Python', 'SQL', 'Data Analysis'],
        github: 'https://github.com',
        demo: 'https://example.com'
      }
    ],
    achievements: [
      { title: 'Best Research Paper — Undergraduate AI Symposium', issuer: 'IEEE Student Chapter', date: 'Sep 2026', badge: 'Research Award' }
    ]
  },
  {
    id: 'stu-3',
    name: 'Kabir Verma',
    headline: 'Systems Programmer & Competitive Coder',
    domain: 'Software Engineering',
    level: 'Intermediate',
    college: 'NIT Trichy',
    year: '2nd Year',
    location: 'Chennai, India',
    bio: 'Focused on high-performance C++ engines, algorithmic optimization, and distributed backend systems.',
    skills: ['C++', 'Java', 'Python', 'SQL'],
    github: 'https://github.com/kabir-codes',
    linkedin: 'https://linkedin.com/in/kabir-verma',
    projects: [
      {
        title: 'MiniKV In-Memory Store',
        description: 'Lightweight multithreaded key-value storage engine written in modern C++20.',
        tech: ['C++'],
        github: 'https://github.com',
        demo: 'https://example.com'
      },
      {
        title: 'AlgoVisualizer Pro',
        description: 'Step-by-step interactive pathfinding and sorting benchmark tool.',
        tech: ['JavaScript', 'C++', 'HTML'],
        github: 'https://github.com',
        demo: 'https://example.com'
      }
    ],
    achievements: [
      { title: 'Top 50 Finalist — National CodeMatrix Championship', issuer: 'CodeMatrix', date: 'Jul 2026', badge: 'Finalist' }
    ]
  },
  {
    id: 'stu-4',
    name: 'Ananya Nair',
    headline: 'Product Designer & Frontend Creative',
    domain: 'Frontend & UI/UX',
    level: 'Intermediate',
    college: 'IIIT Hyderabad',
    year: '3rd Year',
    location: 'Hyderabad, India',
    bio: 'Bridging human-centered design and clean frontend code to create intuitive digital products.',
    skills: ['UI/UX', 'HTML', 'CSS', 'JavaScript'],
    github: 'https://github.com/ananya-ux',
    linkedin: 'https://linkedin.com/in/ananya-nair',
    projects: [
      {
        title: 'FinBuddy Student Budgeting App',
        description: 'Complete UI/UX case study and responsive frontend prototype for peer-to-peer campus expense splitting.',
        tech: ['UI/UX', 'HTML', 'CSS', 'JavaScript'],
        github: 'https://github.com',
        demo: 'https://example.com'
      }
    ],
    achievements: [
      { title: 'Winner — Adobe Campus Design Jam', issuer: 'Adobe', date: 'Apr 2026', badge: 'Design Winner' }
    ]
  },
  {
    id: 'stu-5',
    name: 'Rohan Das',
    headline: 'Full-Stack Builder & Data Analyst',
    domain: 'Full-Stack Web',
    level: 'Beginner',
    college: 'Jadavpur University',
    year: '2nd Year',
    location: 'Kolkata, India',
    bio: 'Building practical web apps and data visualizations that solve everyday campus problems.',
    skills: ['JavaScript', 'Python', 'SQL', 'HTML', 'CSS'],
    github: 'https://github.com/rohan-builds',
    linkedin: 'https://linkedin.com/in/rohan-das',
    projects: [
      {
        title: 'LibTrack Smart Seat Finder',
        description: 'Real-time university library occupancy tracker with SQL analytics.',
        tech: ['JavaScript', 'SQL', 'HTML', 'CSS'],
        github: 'https://github.com',
        demo: 'https://example.com'
      },
      {
        title: 'PlacementStats Explorer',
        description: 'Interactive query dashboard for historical engineering placement trends.',
        tech: ['Python', 'Data Analysis', 'SQL'],
        github: 'https://github.com',
        demo: 'https://example.com'
      }
    ],
    achievements: [
      { title: 'Open Source Contributor — Winter of Code', issuer: 'GDSC', date: 'Jan 2026', badge: 'Open Source' }
    ]
  },
  {
    id: 'stu-6',
    name: 'Meera Krishnan',
    headline: 'AI Engineer & Python Developer',
    domain: 'AI & Data Science',
    level: 'Advanced',
    college: 'VIT Vellore',
    year: '4th Year',
    location: 'Chennai, India',
    bio: 'Building NLP summarization pipelines and intelligent study assistants for engineering students.',
    skills: ['Python', 'Machine Learning', 'Java', 'SQL'],
    github: 'https://github.com/meera-ai',
    linkedin: 'https://linkedin.com/in/meera-krishnan',
    projects: [
      {
        title: 'LectureLens Note Synthesizer',
        description: 'Automated academic lecture transcript summarizer and flashcard generator.',
        tech: ['Python', 'Machine Learning'],
        github: 'https://github.com',
        demo: 'https://example.com'
      }
    ],
    achievements: [
      { title: 'AWS Certified Machine Learning Specialty', issuer: 'Amazon Web Services', date: 'Jun 2026', badge: 'Certified' }
    ]
  }
];

// Initialize localStorage with seed data if empty
function initAppStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.OPPORTUNITIES)) {
    localStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(DEFAULT_OPPORTUNITIES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(DEFAULT_STUDENTS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const demoUser = {
      id: 'user-demo',
      name: 'Siddharth Roy',
      email: 'student@talentbridge.io',
      password: 'password123',
      headline: 'Full-Stack Developer & UI Designer',
      college: 'IIT Kharagpur',
      course: 'B.Tech Computer Science & Engineering',
      year: '3rd Year',
      location: 'Kalyani, India',
      bio: 'Focused on building clean, scalable web products and data-driven user experiences. Actively seeking summer frontend & product engineering internships.',
      avatar: '',
      skills: ['HTML', 'CSS', 'JavaScript', 'UI/UX', 'Python', 'SQL'],
      github: 'https://github.com/siddharth-roy',
      linkedin: 'https://linkedin.com/in/siddharth-roy',
      portfolio: 'https://siddharthroy.dev',
      profileViews: 28,
      projects: [
        {
          id: 'proj-101',
          title: 'TalentBridge Portfolio Engine',
          description: 'A responsive student talent discovery and skill-matching platform built with clean modular architecture.',
          tech: ['HTML', 'CSS', 'JavaScript', 'UI/UX'],
          github: 'https://github.com/siddharth-roy/talentbridge',
          demo: 'https://talentbridge-demo.example.com'
        },
        {
          id: 'proj-102',
          title: 'CodeSprint Real-Time Judge',
          description: 'Frontend dashboard for monitoring student hackathon submissions and automated test suite metrics.',
          tech: ['JavaScript', 'Python', 'SQL'],
          github: 'https://github.com/siddharth-roy/codesprint',
          demo: 'https://codesprint-demo.example.com'
        },
        {
          id: 'proj-103',
          title: 'StudySync Collaborative Notes',
          description: 'Minimalist markdown workspace for engineering study groups with instant tag filtering.',
          tech: ['HTML', 'CSS', 'JavaScript'],
          github: 'https://github.com/siddharth-roy/studysync',
          demo: 'https://studysync-demo.example.com'
        }
      ],
      achievements: [
        {
          title: 'Winner — Smart India Campus Hackathon 2026',
          issuer: 'Ministry of Education Innovation Cell',
          date: 'Sep 2026',
          badge: 'Gold Medalist'
        },
        {
          title: 'Meta Frontend Developer Professional Certificate',
          issuer: 'Coursera / Meta',
          date: 'Jul 2026',
          badge: 'Verified Certificate'
        },
        {
          title: 'Dean’s Merit List — Top 5% in Computer Science',
          issuer: 'IIT Kharagpur',
          date: 'May 2026',
          badge: 'Academic Honor'
        }
      ],
      activities: [
        { text: 'TechNova Labs viewed your student profile', time: '2 hours ago', type: 'view' },
        { text: '92% Skill Match found: Frontend Engineering Intern', time: '5 hours ago', type: 'match' },
        { text: 'You published project "TalentBridge Portfolio Engine"', time: 'Yesterday', type: 'project' },
        { text: 'QuantEdge AI shortlisted your skill profile', time: '2 days ago', type: 'view' }
      ]
    };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([demoUser]));
  }
}

// Get currently logged-in user (falls back to demo user if exploring directly)
function getCurrentUser() {
  initAppStorage();
  const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  if (stored) {
    return JSON.parse(stored);
  }
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  return users[0] || null;
}

// Save updated current user back to session and users list
function saveCurrentUser(updatedUser) {
  localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  const idx = users.findIndex(u => u.email === updatedUser.email);
  if (idx !== -1) {
    users[idx] = updatedUser;
  } else {
    users.push(updatedUser);
  }
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

// Calculate dynamic match percentage between user skills and opportunity requirements
function calculateMatchPercentage(userSkills = [], requiredSkills = []) {
  if (!requiredSkills.length) return 85;
  const normalizedUser = userSkills.map(s => s.toLowerCase().trim());
  let matched = 0;
  requiredSkills.forEach(req => {
    if (normalizedUser.includes(req.toLowerCase().trim())) {
      matched++;
    }
  });
  const rawRatio = matched / requiredSkills.length;
  const score = Math.round(60 + rawRatio * 36);
  return Math.min(98, Math.max(62, score));
}

// Calculate user profile completion strength
function calculateProfileStrength(user) {
  if (!user) return 50;
  let score = 20;
  if (user.name && user.college) score += 20;
  if (user.bio && user.bio.length > 15) score += 15;
  if (user.skills && user.skills.length >= 3) score += 20;
  if (user.projects && user.projects.length >= 1) score += 15;
  if (user.github || user.linkedin) score += 10;
  return Math.min(100, score);
}

// Helper to get user initials
function getInitials(name = 'Student') {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Toast Notification helper
function showToast(message) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" stroke-width="2.5">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

// Populate sidebar user info & bind mobile navigation
function initSharedAppShell() {
  initAppStorage();
  const user = getCurrentUser();

  const nameEl = document.getElementById('sidebarUserName');
  const roleEl = document.getElementById('sidebarUserRole');
  const avatarEl = document.getElementById('sidebarUserAvatar');

  if (user && nameEl) {
    nameEl.textContent = user.name;
    roleEl.textContent = user.college || 'Student Profile';
    if (user.avatar) {
      avatarEl.innerHTML = `<img src="${user.avatar}" alt="${user.name}" class="avatar">`;
    } else {
      avatarEl.textContent = getInitials(user.name);
    }
  }

  // Mobile sidebar drawer toggle
  const menuBtn = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('appSidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (menuBtn && sidebar && overlay) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      overlay.classList.add('active');
    });
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      window.location.href = 'login.html';
    });
  }

  // Landing page mobile navbar toggle
  const landingMenuBtn = document.getElementById('landingMenuBtn');
  const landingNavbar = document.getElementById('landingNavbar');
  if (landingMenuBtn && landingNavbar) {
    landingMenuBtn.addEventListener('click', () => {
      landingNavbar.classList.toggle('mobile-open');
    });
  }
}

document.addEventListener('DOMContentLoaded', initSharedAppShell);