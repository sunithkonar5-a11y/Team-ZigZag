/* ==========================================================================
   PROFILE LOGIC - Render User or Queried Student Profile + Interactive Tabs
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const queriedStudentId = params.get('student');
  const students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');

  let profileData = getCurrentUser();
  let isViewingOtherStudent = false;

  if (queriedStudentId) {
    const found = students.find(s => s.id === queriedStudentId);
    if (found) {
      profileData = found;
      isViewingOtherStudent = true;
    }
  }

  if (!profileData) return;

  // Populate Top Hero Section
  const avatarEl = document.getElementById('profileAvatar');
  if (profileData.avatar) {
    avatarEl.innerHTML = `<img src="${profileData.avatar}" alt="${profileData.name}">`;
  } else {
    avatarEl.textContent = getInitials(profileData.name);
  }

  document.getElementById('profileName').textContent = profileData.name;
  document.getElementById('profileHeadline').textContent =
    profileData.headline || profileData.course || 'Student Developer';
  document.getElementById('profileCollege').textContent = profileData.college || 'University Student';
  document.getElementById('profileLocation').textContent = profileData.location || 'India';
  document.getElementById('profileBio').textContent = profileData.bio || '';

  const githubBtn = document.getElementById('profileGithubBtn');
  const linkedinBtn = document.getElementById('profileLinkedinBtn');
  if (githubBtn && profileData.github) githubBtn.href = profileData.github;
  if (linkedinBtn && profileData.linkedin) linkedinBtn.href = profileData.linkedin;

  const editBtn = document.getElementById('editProfileBtn');
  if (isViewingOtherStudent && editBtn) {
    editBtn.textContent = 'Connect with Student';
    editBtn.href = '#';
    editBtn.addEventListener('click', e => {
      e.preventDefault();
      showToast(`Connection request sent to ${profileData.name}!`);
      editBtn.textContent = '✓ Request Sent';
    });
  }

  // Top Skill Chips
  const skillsHtml = (profileData.skills || [])
    .map(s => `<span class="skill-chip teal">${s}</span>`)
    .join('');
  document.getElementById('profileTopSkills').innerHTML = skillsHtml;
  document.getElementById('overviewSkillsList').innerHTML = skillsHtml;

  // Overview Tab Details
  document.getElementById('overviewAboutText').textContent =
    profileData.bio || 'Passionate about building impactful projects and collaborating with engineering teams.';
  document.getElementById('overviewEduCollege').textContent = profileData.college || 'IIT Kharagpur';
  document.getElementById('overviewEduCourse').textContent =
    profileData.course || profileData.headline || 'B.Tech Computer Science';
  document.getElementById('overviewEduYear').textContent = profileData.year || '3rd Year';

  const strength = calculateProfileStrength(profileData);
  document.getElementById('overviewStrengthScore').textContent = `${strength}%`;
  document.getElementById('overviewStrengthBar').style.width = `${strength}%`;

  // Render Projects Tab
  const projectsGrid = document.getElementById('profileProjectsGrid');
  const projects = profileData.projects || [];
  projectsGrid.innerHTML = projects
    .map(
      proj => `
      <div class="card project-card">
        <div class="project-thumbnail">
          <div class="thumb-window-dots"><span></span><span></span><span></span></div>
          <div>
            <span class="thumb-badge">Portfolio Project</span>
            <div class="thumb-title-preview">${proj.title}</div>
          </div>
        </div>
        <div class="project-body">
          <div>
            <h3>${proj.title}</h3>
            <p>${proj.description}</p>
            <div class="project-tech-stack">
              ${(proj.tech || []).map(t => `<span class="skill-chip teal">${t}</span>`).join('')}
            </div>
          </div>
          <div class="project-links-row">
            <a href="${proj.github || 'https://github.com'}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">GitHub</a>
            <a href="${proj.demo || 'https://example.com'}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">Live Demo ↗</a>
          </div>
        </div>
      </div>
    `
    )
    .join('');

  // Render Achievements Tab
  const achievementsGrid = document.getElementById('profileAchievementsGrid');
  const achievements = profileData.achievements || [];
  achievementsGrid.innerHTML = achievements
    .map(
      ach => `
      <div class="card achievement-card">
        <div class="achievement-medal">★</div>
        <div>
          <span class="skill-chip teal" style="margin-bottom: 8px;">${ach.badge || 'Verified Achievement'}</span>
          <h4 style="font-size: 1.05rem; margin-bottom: 4px;">${ach.title}</h4>
          <p class="text-muted" style="font-size: 0.86rem;">${ach.issuer} • ${ach.date}</p>
        </div>
      </div>
    `
    )
    .join('');

  // Interactive Tab Switching
  const tabBtns = document.querySelectorAll('.profile-tab-btn');
  const tabContents = document.querySelectorAll('.profile-tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(target).classList.add('active');
    });
  });
});