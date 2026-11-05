/* ==========================================================================
   PROJECTS LOGIC - Dynamic Rendering & Add Project Modal with localStorage
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  let user = getCurrentUser();
  const grid = document.getElementById('projectsGrid');
  const modal = document.getElementById('addProjectModal');
  const openBtn = document.getElementById('openAddProjectModalBtn');
  const closeBtn = document.getElementById('closeProjectModalBtn');
  const cancelBtn = document.getElementById('cancelProjectModalBtn');
  const form = document.getElementById('addProjectForm');

  function renderProjects() {
    user = getCurrentUser();
    const projects = user?.projects || [];

    if (projects.length === 0) {
      grid.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 48px;">
          <h3>No projects added yet</h3>
          <p class="text-muted" style="margin: 8px 0 18px;">Showcase your academic, hackathon, or personal builds to stand out.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = projects
      .map(
        proj => `
        <div class="card project-card">
          <div class="project-thumbnail">
            <div class="thumb-window-dots">
              <span></span><span></span><span></span>
            </div>
            <div>
              <span class="thumb-badge">Featured Build</span>
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
              <a href="${proj.github || 'https://github.com'}" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">
                GitHub Repo
              </a>
              <a href="${proj.demo || 'https://example.com'}" target="_blank" rel="noopener" class="btn btn-primary btn-sm">
                Live Demo ↗
              </a>
            </div>
          </div>
        </div>
      `
      )
      .join('');
  }

  openBtn.addEventListener('click', () => modal.classList.add('active'));
  closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  cancelBtn.addEventListener('click', () => modal.classList.remove('active'));

  form.addEventListener('submit', e => {
    e.preventDefault();
    const title = document.getElementById('projTitleInput').value.trim();
    const desc = document.getElementById('projDescInput').value.trim();
    const tech = document
      .getElementById('projTechInput')
      .value.split(',')
      .map(t => t.trim())
      .filter(Boolean);
    const github = document.getElementById('projGithubInput').value.trim() || 'https://github.com';
    const demo = document.getElementById('projDemoInput').value.trim() || 'https://example.com';

    const newProj = {
      id: 'proj-' + Date.now(),
      title,
      description: desc,
      tech: tech.length ? tech : ['JavaScript'],
      github,
      demo
    };

    user.projects = [newProj, ...(user.projects || [])];
    user.activities = [
      { text: `You added new project "${title}"`, time: 'Just now', type: 'project' },
      ...(user.activities || [])
    ];

    saveCurrentUser(user);
    form.reset();
    modal.classList.remove('active');
    renderProjects();
    showToast(`Project "${title}" added to your portfolio!`);
  });

  renderProjects();
});