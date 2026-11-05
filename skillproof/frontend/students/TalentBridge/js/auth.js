/* ==========================================================================
   AUTHENTICATION LOGIC - Login, Signup, Validation & Password Visibility
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Show / Hide Password Toggle
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = 'Hide';
      } else {
        input.type = 'password';
        btn.textContent = 'Show';
      }
    });
  });

  // 2. Forgot Password Demo Link
  const forgotLink = document.getElementById('forgotPasswordLink');
  if (forgotLink) {
    forgotLink.addEventListener('click', e => {
      e.preventDefault();
      showToast('Demo Credentials: student@talentbridge.io / password123');
    });
  }

  // 3. Login Form Validation & Submission
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();

      const emailInput = document.getElementById('loginEmail');
      const passInput = document.getElementById('loginPassword');
      const emailGroup = document.getElementById('emailGroup');
      const passGroup = document.getElementById('passwordGroup');

      let isValid = true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(emailInput.value.trim())) {
        emailGroup.classList.add('invalid');
        isValid = false;
      } else {
        emailGroup.classList.remove('invalid');
      }

      if (passInput.value.length < 6) {
        passGroup.classList.add('invalid');
        isValid = false;
      } else {
        passGroup.classList.remove('invalid');
      }

      if (!isValid) return;

      // Authenticate using localStorage
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const matchedUser = users.find(
        u => u.email.toLowerCase() === emailInput.value.trim().toLowerCase()
      );

      if (matchedUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(matchedUser));
      } else if (users.length > 0) {
        const demoUser = { ...users[0], email: emailInput.value.trim() };
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(demoUser));
      }

      showToast('Welcome back! Redirecting to your dashboard...');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 650);
    });
  }

  // 4. Signup Form Validation & Submission (Ready for Page 3)
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', e => {
      e.preventDefault();

      const nameInput = document.getElementById('signupName');
      const emailInput = document.getElementById('signupEmail');
      const passInput = document.getElementById('signupPassword');
      const confirmInput = document.getElementById('confirmPassword');

      const nameGroup = document.getElementById('nameGroup');
      const emailGroup = document.getElementById('signupEmailGroup');
      const emailError = document.getElementById('signupEmailError');
      const passGroup = document.getElementById('signupPasswordGroup');
      const confirmGroup = document.getElementById('confirmPasswordGroup');

      let isValid = true;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (nameInput.value.trim().length < 2) {
        nameGroup.classList.add('invalid');
        isValid = false;
      } else {
        nameGroup.classList.remove('invalid');
      }

      if (!emailRegex.test(emailInput.value.trim())) {
        emailError.textContent = 'Please enter a valid email address.';
        emailGroup.classList.add('invalid');
        isValid = false;
      } else {
        emailGroup.classList.remove('invalid');
      }

      // Check for duplicate email in localStorage
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const emailExists = users.some(
        u => u.email.toLowerCase() === emailInput.value.trim().toLowerCase()
      );

      if (emailExists) {
        emailError.textContent = 'An account with this email already exists.';
        emailGroup.classList.add('invalid');
        isValid = false;
      }

      if (passInput.value.length < 6) {
        passGroup.classList.add('invalid');
        isValid = false;
      } else {
        passGroup.classList.remove('invalid');
      }

      if (confirmInput.value !== passInput.value || !confirmInput.value) {
        confirmGroup.classList.add('invalid');
        isValid = false;
      } else {
        confirmGroup.classList.remove('invalid');
      }

      if (!isValid) return;

      const newUser = {
        id: 'user-' + Date.now(),
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passInput.value,
        headline: 'Aspiring Software & Product Builder',
        college: '',
        course: '',
        year: '3rd Year',
        location: '',
        bio: '',
        avatar: '',
        skills: ['HTML', 'CSS', 'JavaScript'],
        github: '',
        linkedin: '',
        portfolio: '',
        profileViews: 14,
        projects: [],
        achievements: [
          {
            title: 'Verified TalentBridge Member',
            issuer: 'TalentBridge Platform',
            date: 'Nov 2026',
            badge: 'Early Builder'
          }
        ],
        activities: [
          { text: 'Welcome to TalentBridge! Your digital profile is live.', time: 'Just now' }
        ]
      };

      users.push(newUser);
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));

      showToast('Account created! Redirecting to profile onboarding...');
      setTimeout(() => {
        window.location.href = 'onboarding.html';
      }, 650);
    });
  }
});