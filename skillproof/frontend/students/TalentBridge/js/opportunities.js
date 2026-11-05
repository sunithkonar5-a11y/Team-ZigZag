/* ==========================================================================
   OPPORTUNITIES & DETAILS LOGIC - Filtering, Dynamic Cards & Apply Modal
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  const opportunities = JSON.parse(localStorage.getItem(STORAGE_KEYS.OPPORTUNITIES) || '[]');

  // 1. LIST PAGE LOGIC (opportunities.html)
  const listContainer = document.getElementById('opportunitiesList');
  if (listContainer) {
    const searchInput = document.getElementById('oppSearchInput');
    const typeCheckboxes = document.querySelectorAll('input[name="oppType"]');
    const locCheckboxes = document.querySelectorAll('input[name="oppLoc"]');
    const skillBtns = document.querySelectorAll('.filter-skill-btn');
    const resetBtn = document.getElementById('resetOppFilters');

    let activeSkills = new Set();

    skillBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const s = btn.dataset.skill;
        if (activeSkills.has(s)) {
          activeSkills.delete(s);
          btn.classList.remove('active');
        } else {
          activeSkills.add(s);
          btn.classList.add('active');
        }
        renderOpportunities();
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        searchInput.value = '';
        typeCheckboxes.forEach(cb => (cb.checked = false));
        locCheckboxes.forEach(cb => (cb.checked = false));
        activeSkills.clear();
        skillBtns.forEach(b => b.classList.remove('active'));
        renderOpportunities();
      });
    }

    function renderOpportunities() {
      const query = searchInput.value.toLowerCase().trim();
      const selectedTypes = Array.from(typeCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
      const selectedLocs = Array.from(locCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

      const filtered = opportunities.filter(opp => {
        const matchesQuery =
          !query ||
          opp.title.toLowerCase().includes(query) ||
          opp.organization.toLowerCase().includes(query) ||
          opp.requiredSkills.some(s => s.toLowerCase().includes(query));

        const matchesType = !selectedTypes.length || selectedTypes.includes(opp.type);
        const matchesLoc = !selectedLocs.length || selectedLocs.includes(opp.location);
        const matchesSkills =
          activeSkills.size === 0 ||
          Array.from(activeSkills).every(s => opp.requiredSkills.includes(s));

        return matchesQuery && matchesType && matchesLoc && matchesSkills;
      });

      if (filtered.length === 0) {
        listContainer.innerHTML = `
          <div class="card" style="text-align: center; padding: 48px;">
            <h3>No opportunities match your current filters</h3>
            <p class="text-muted" style="margin-top: 6px;">Try resetting your filters or broadening your skill selection.</p>
          </div>
        `;
        return;
      }

      listContainer.innerHTML = filtered
        .map(opp => {
          const matchScore = calculateMatchPercentage(user?.skills || [], opp.requiredSkills);
          return `
            <div class="card opp-card">
              <div class="opp-card-left">
                <div class="opp-org-logo">${opp.logo}</div>
                <div class="opp-card-body">
                  <h3>${opp.title}</h3>
                  <div class="opp-submeta">
                    <strong>${opp.organization}</strong>
                    <span>•</span>
                    <span class="type-badge">${opp.type}</span>
                    <span>•</span>
                    <span>${opp.location}</span>
                    <span>•</span>
                    <span>${opp.stipend}</span>
                  </div>
                  <div class="opp-card-skills">
                    ${opp.requiredSkills.map(s => `<span class="skill-chip">${s}</span>`).join('')}
                  </div>
                </div>
              </div>

              <div class="opp-card-right">
                <span class="match-badge">✨ ${matchScore}% Match</span>
                <span class="deadline-text">Deadline: ${opp.deadline}</span>
                <a href="opportunity-details.html?id=${opp.id}" class="btn btn-primary btn-sm">View Details</a>
              </div>
            </div>
          `;
        })
        .join('');
    }

    searchInput.addEventListener('input', renderOpportunities);
    typeCheckboxes.forEach(cb => cb.addEventListener('change', renderOpportunities));
    locCheckboxes.forEach(cb => cb.addEventListener('change', renderOpportunities));

    renderOpportunities();
  }

  // 2. DETAILS PAGE LOGIC (opportunity-details.html)
  const detailsContainer = document.getElementById('opportunityDetailsContainer');
  if (detailsContainer) {
    const params = new URLSearchParams(window.location.search);
    const oppId = params.get('id') || 'opp-1';
    const opp = opportunities.find(o => o.id === oppId) || opportunities[0];
    const matchScore = calculateMatchPercentage(user?.skills || [], opp.requiredSkills);

    const userSkills = user?.skills || ['HTML', 'CSS', 'JavaScript'];
    const matchedSkills = opp.requiredSkills.filter(req =>
      userSkills.map(s => s.toLowerCase()).includes(req.toLowerCase())
    );

    const reasons = [
      matchedSkills.length
        ? `You have verified ${matchedSkills.join(', ')} skills on your profile`
        : `Your core engineering fundamentals align with ${opp.requiredSkills[0]}`,
      `Your ${(user?.projects || []).length || 3} showcased portfolio projects match the technical domain`,
      `Your profile strength (${calculateProfileStrength(user)}%) meets ${opp.organization}'s priority criteria`
    ];

    detailsContainer.innerHTML = `
      <div class="card details-header-card">
        <div class="details-header-left">
          <div class="details-logo">${opp.logo}</div>
          <div class="details-title-block">
            <h1>${opp.title}</h1>
            <div class="details-meta-pills">
              <strong>${opp.organization}</strong>
              <span>•</span>
              <span class="type-badge">${opp.type}</span>
              <span>•</span>
              <span>${opp.location}</span>
              <span>•</span>
              <span>${opp.stipend}</span>
              <span>•</span>
              <span>Apply by ${opp.deadline}</span>
            </div>
          </div>
        </div>
        <span class="match-badge" style="font-size: 0.95rem; padding: 8px 16px;">✨ ${matchScore}% Match</span>
      </div>

      <div class="details-layout">
        <div>
          <div class="card details-section-card">
            <h3>About the Opportunity</h3>
            <p class="text-muted" style="margin-bottom: 18px;">${opp.description}</p>
            <h3>Key Responsibilities & Expectations</h3>
            <ul class="details-list">
              ${(opp.responsibilities || []).map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>

          <div class="card details-section-card">
            <h3>Required Skills</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
              ${opp.requiredSkills.map(s => `<span class="skill-chip teal">${s}</span>`).join('')}
            </div>
          </div>
        </div>

        <div>
          <div class="card match-highlight-card">
            <div class="prominent-match-score">
              <div>
                <span class="text-muted" style="font-size: 0.82rem; font-weight: 600;">PERSONALIZED FIT</span>
                <h3>Why You Match</h3>
              </div>
              <strong>${matchScore}%</strong>
            </div>

            <div class="match-reasons-list">
              ${reasons
                .map(
                  r => `
                <div class="match-reason-item">
                  <span class="match-check">✓</span>
                  <span>${r}</span>
                </div>
              `
                )
                .join('')}
            </div>

            <button type="button" class="btn btn-primary btn-block btn-lg" id="applyNowBtn">
              Apply Now with TalentBridge Profile
            </button>
          </div>
        </div>
      </div>
    `;

    const applyBtn = document.getElementById('applyNowBtn');
    const applyModal = document.getElementById('applyModal');
    const closeApplyBtn = document.getElementById('closeApplyModalBtn');

    applyBtn.addEventListener('click', () => {
      applyModal.classList.add('active');
      applyBtn.textContent = '✓ Application Sent';
      applyBtn.disabled = true;
      showToast(`Applied to ${opp.title} at ${opp.organization}!`);
    });

    closeApplyBtn.addEventListener('click', () => {
      applyModal.classList.remove('active');
    });
  }
});