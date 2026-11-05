/* ==========================================================================
   ONBOARDING LOGIC - Multi-step navigation, Skill selection & Profile Save
   ========================================================================== */

const SUGGESTED_SKILLS = [
  'HTML', 'CSS', 'JavaScript', 'Python', 'C++',
  'Java', 'UI/UX', 'Data Analysis', 'Machine Learning', 'SQL'
];

document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  let selectedSkills = new Set(user?.skills || ['HTML', 'CSS', 'JavaScript']);
  let uploadedAvatarData = user?.avatar || '';

  // Pre-fill existing user fields
  if (user) {
    document.getElementById('obName').value = user.name || '';
    document.getElementById('obCollege').value = user.college || '';
    document.getElementById('obCourse').value = user.course || '';
    document.getElementById('obLocation').value = user.location || '';
    document.getElementById('obBio').value = user.bio || '';
    document.getElementById('obGithub').value = user.github || '';
    document.getElementById('obLinkedin').value = user.linkedin || '';
    document.getElementById('obPortfolio').value = user.portfolio || '';
    const preview = document.getElementById('avatarPreview');
    if (user.avatar) {
      preview.innerHTML = `<img src="${user.avatar}" alt="Profile">`;
    } else {
      preview.textContent = getInitials(user.name);
    }
  }

  // Handle Profile Image Upload Preview
  const avatarInput = document.getElementById('avatarInput');
  if (avatarInput) {
    avatarInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        uploadedAvatarData = ev.target.result;
        document.getElementById('avatarPreview').innerHTML = `<img src="${uploadedAvatarData}" alt="Avatar">`;
      };
      reader.readAsDataURL(file);
    });
  }

  // Render Selectable Skill Chips
  const skillsContainer = document.getElementById('suggestedSkillsContainer');
  function renderSkillChips() {
    const allSkills = Array.from(new Set([...SUGGESTED_SKILLS, ...selectedSkills]));
    skillsContainer.innerHTML = allSkills
      .map(skill => {
        const isSelected = selectedSkills.has(skill);
        return `<button type="button" class="selectable-chip ${isSelected ? 'selected' : ''}" data-skill="${skill}">
          ${isSelected ? '✓ ' : '+ '}${skill}
        </button>`;
      })
      .join('');

    skillsContainer.querySelectorAll('.selectable-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const s = chip.dataset.skill;
        if (selectedSkills.has(s)) {
          selectedSkills.delete(s);
        } else {
          selectedSkills.add(s);
        }
        renderSkillChips();
      });
    });
  }
  renderSkillChips();

  // Add Custom Skill
  const customInput = document.getElementById('customSkillInput');
  const addCustomBtn = document.getElementById('addCustomSkillBtn');
  if (addCustomBtn && customInput) {
    addCustomBtn.addEventListener('click', () => {
      const val = customInput.value.trim();
      if (!val) return;
      selectedSkills.add(val);
      customInput.value = '';
      renderSkillChips();
      showToast(`Added "${val}" to your skills`);
    });
  }

  // Step Switching Function
  function goToStep(stepNumber) {
    document.querySelectorAll('.onboarding-step').forEach((el, idx) => {
      el.classList.toggle('active', idx + 1 === stepNumber);
    });

    document.querySelectorAll('.step-indicator').forEach(ind => {
      const s = Number(ind.dataset.step);
      ind.classList.toggle('active', s === stepNumber);
      ind.classList.toggle('completed', s < stepNumber);
    });

    document.getElementById('connector1').classList.toggle('filled', stepNumber >= 2);
    document.getElementById('connector2').classList.toggle('filled', stepNumber >= 3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.getElementById('toStep2Btn').addEventListener('click', () => {
    const nameVal = document.getElementById('obName').value.trim();
    if (!nameVal) {
      showToast('Please enter your full name to continue.');
      return;
    }
    goToStep(2);
  });

  document.getElementById('backToStep1Btn').addEventListener('click', () => goToStep(1));
  document.getElementById('toStep3Btn').addEventListener('click', () => {
    if (selectedSkills.size === 0) {
      showToast('Please select at least one skill.');
      return;
    }
    goToStep(3);
  });
  document.getElementById('backToStep2Btn').addEventListener('click', () => goToStep(2));

  // Complete Onboarding Submission
  document.getElementById('onboardingForm').addEventListener('submit', e => {
    e.preventDefault();
    const updatedUser = {
      ...user,
      name: document.getElementById('obName').value.trim() || 'Student User',
      college: document.getElementById('obCollege').value.trim() || 'IIT Kharagpur',
      course: document.getElementById('obCourse').value.trim() || 'B.Tech Computer Science',
      year: document.getElementById('obYear').value,
      location: document.getElementById('obLocation').value.trim() || 'India',
      bio: document.getElementById('obBio').value.trim() || 'Student builder passionate about technology and innovation.',
      avatar: uploadedAvatarData,
      skills: Array.from(selectedSkills),
      github: document.getElementById('obGithub').value.trim(),
      linkedin: document.getElementById('obLinkedin').value.trim(),
      portfolio: document.getElementById('obPortfolio').value.trim()
    };

    // Save optional project if entered
    const projTitle = document.getElementById('obProjTitle').value.trim();
    if (projTitle) {
      const projTech = document.getElementById('obProjTech').value
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      const newProject = {
        id: 'proj-' + Date.now(),
        title: projTitle,
        description: document.getElementById('obProjDesc').value.trim() || 'Student engineering project.',
        tech: projTech.length ? projTech : ['HTML', 'CSS', 'JavaScript'],
        github: document.getElementById('obProjGithub').value.trim() || 'https://github.com',
        demo: document.getElementById('obProjDemo').value.trim() || 'https://example.com'
      };
      updatedUser.projects = [newProject, ...(updatedUser.projects || [])];
    }

    saveCurrentUser(updatedUser);
    showToast('Profile completed! Launching your dashboard...');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 650);
  });
});