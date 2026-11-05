/* ==========================================================================
   DASHBOARD LOGIC - Dynamic Stats, Recommended Matches & Recent Activity
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  const opportunities = JSON.parse(localStorage.getItem(STORAGE_KEYS.OPPORTUNITIES) || '[]');

  if (!user) return;

  // Dynamic Greeting
  const firstName = user.name.split(' ')[0];
  document.getElementById('dashboardGreeting').textContent = `Good Morning, ${firstName}`;

  // Statistics Calculation
  const strength = calculateProfileStrength(user);
  document.getElementById('statProfileStrength').textContent = `${strength}%`;
  document.getElementById('statProfileBar').style.width = `${strength}%`;
  document.getElementById('statProjectsCount').textContent = (user.projects || []).length;
  document.getElementById('statViewsCount').textContent = user.profileViews || 24;

  // Score and sort opportunities by match percentage
  const scoredOpps = opportunities
    .map(opp => ({
      ...opp,
      matchScore: calculateMatchPercentage(user.skills, opp.requiredSkills)
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

  document.getElementById('statMatchesCount').textContent = scoredOpps.length + 6;

  // Render Recommended Opportunities
  const recContainer = document.getElementById('recommendedOpportunitiesList');
  recContainer.innerHTML = scoredOpps
    .slice(0, 4)
    .map(
      opp => `
      <div class="card rec-opp-card">
        <div class="rec-opp-left">
          <div class="org-logo-box">${opp.logo}</div>
          <div class="rec-opp-info">
            <h4>${opp.title}</h4>
            <div class="rec-opp-meta">${opp.organization} • ${opp.type} • ${opp.location}</div>
            <div class="rec-opp-skills">
              ${opp.requiredSkills.map(s => `<span class="skill-chip">${s}</span>`).join('')}
            </div>
          </div>
        </div>
        <div class="rec-opp-right">
          <span class="match-badge">✨ ${opp.matchScore}% Match</span>
          <a href="opportunity-details.html?id=${opp.id}" class="btn btn-primary btn-sm">View Opportunity</a>
        </div>
      </div>
    `
    )
    .join('');

  // Render User Skills Widget
  const skillsEl = document.getElementById('dashboardUserSkills');
  skillsEl.innerHTML = (user.skills || [])
    .map(skill => `<span class="skill-chip teal">${skill}</span>`)
    .join('');

  // Render Recent Activity Feed
  const activities = user.activities || [
    { text: 'Your profile was viewed by TechNova Labs', time: '2 hours ago' },
    { text: 'A new opportunity matches 92% of your skills', time: '5 hours ago' },
    { text: 'Someone viewed your featured project', time: 'Yesterday' }
  ];

  const activityList = document.getElementById('recentActivityList');
  activityList.innerHTML = activities
    .map(
      act => `
      <li class="activity-item">
        <span class="activity-dot"></span>
        <div>
          <div class="activity-text">${act.text}</div>
          <span class="activity-time">${act.time}</span>
        </div>
      </li>
    `
    )
    .join('');
});