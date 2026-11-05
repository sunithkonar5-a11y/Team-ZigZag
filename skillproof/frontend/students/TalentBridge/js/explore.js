/* ==========================================================================
   EXPLORE TALENT LOGIC - Search, Filtering & Student Profile Cards
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const students = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDENTS) || '[]');
  const grid = document.getElementById('talentGrid');

  const searchInput = document.getElementById('talentSearchInput');
  const skillSelect = document.getElementById('filterSkill');
  const domainSelect = document.getElementById('filterDomain');
  const collegeSelect = document.getElementById('filterCollege');
  const levelSelect = document.getElementById('filterLevel');

  function renderStudents() {
    const query = searchInput.value.toLowerCase().trim();
    const skillFilter = skillSelect.value;
    const domainFilter = domainSelect.value;
    const collegeFilter = collegeSelect.value;
    const levelFilter = levelSelect.value;

    const filtered = students.filter(stu => {
      const matchesQuery =
        !query ||
        stu.name.toLowerCase().includes(query) ||
        stu.headline.toLowerCase().includes(query) ||
        stu.college.toLowerCase().includes(query) ||
        stu.skills.some(s => s.toLowerCase().includes(query));

      const matchesSkill = !skillFilter || stu.skills.includes(skillFilter);
      const matchesDomain = !domainFilter || stu.domain === domainFilter;
      const matchesCollege = !collegeFilter || stu.college === collegeFilter;
      const matchesLevel = !levelFilter || stu.level === levelFilter;

      return matchesQuery && matchesSkill && matchesDomain && matchesCollege && matchesLevel;
    });

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 48px;">
          <h3>No matching student profiles found</h3>
          <p class="text-muted" style="margin-top: 6px;">Try clearing one of the dropdown filters or searching another skill.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered
      .map(
        stu => `
        <div class="card student-card">
          <div>
            <div class="student-top">
              <div class="student-avatar">${getInitials(stu.name)}</div>
              <div class="student-meta">
                <h3>${stu.name}</h3>
                <div class="student-role">${stu.headline}</div>
                <div class="student-college">${stu.college} • ${stu.year}</div>
              </div>
            </div>
            <p class="text-muted" style="font-size: 0.88rem; margin: 14px 0;">${stu.bio}</p>
            <div class="student-skills">
              ${stu.skills.map(s => `<span class="skill-chip teal">${s}</span>`).join('')}
            </div>
          </div>

          <div class="student-footer">
            <span class="project-count-pill">⌘ ${(stu.projects || []).length} Showcase Projects</span>
            <a href="profile.html?student=${stu.id}" class="btn btn-secondary btn-sm">View Profile</a>
          </div>
        </div>
      `
      )
      .join('');
  }

  [searchInput, skillSelect, domainSelect, collegeSelect, levelSelect].forEach(el => {
    el.addEventListener('input', renderStudents);
    el.addEventListener('change', renderStudents);
  });

  renderStudents();
});