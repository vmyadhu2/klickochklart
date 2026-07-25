const menuButton = document.querySelector('.menu-button');
const mainNavigation = document.querySelector('.main-nav');
const navigationLinks = document.querySelectorAll('.main-nav a');

menuButton.addEventListener('click', () => {
  const isOpen = mainNavigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  document.body.classList.toggle('menu-open', isOpen);
});

navigationLinks.forEach((link) => {
  link.addEventListener('click', () => {
    mainNavigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  });
});

const revealObserver = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll('.reveal').forEach((element) => {
  revealObserver.observe(element);
});

const apiBaseUrl = (window.KOK_API_BASE || 'http://localhost:3000').replace(/\/$/, '');
const tokenStorageKey = 'kok_access_token';
const userEmailStorageKey = 'kok_user_email';
const authTabs = document.querySelectorAll('.auth-tab');
const authForms = document.querySelectorAll('[data-auth-form]');
const authCard = document.getElementById('auth-card');
const signupForm = document.getElementById('signup-form');
const signinForm = document.getElementById('signin-form');
const accountMenu = document.getElementById('account-menu');
const accountMenuButton = document.getElementById('account-menu-button');
const accountMenuPanel = document.getElementById('account-menu-panel');
const accountMenuInitial = document.getElementById('account-menu-initial');
const accountSignOutButton = document.getElementById('account-sign-out-button');
const authStatus = document.getElementById('auth-status');

function setAuthStatus(message) {
  if (authStatus) {
    authStatus.textContent = message;
  }
}

function applyCachedAccountInitial() {
  const email = localStorage.getItem(userEmailStorageKey);
  if (accountMenuInitial && email) {
    accountMenuInitial.textContent = email.trim().charAt(0).toUpperCase();
  }
}

function setSignedOutState() {
  localStorage.removeItem(tokenStorageKey);
  localStorage.removeItem(userEmailStorageKey);
  document.documentElement.classList.remove('has-session');
  if (authCard) {
    authCard.hidden = false;
  }
  if (accountMenu) {
    accountMenu.hidden = true;
  }
  if (accountMenuPanel) {
    accountMenuPanel.hidden = true;
  }
  if (accountMenuButton) {
    accountMenuButton.setAttribute('aria-expanded', 'false');
  }
  authTabs.forEach((tab) => {
    tab.hidden = false;
  });
  setAuthMode('signup', false);
}

function setSignedInState(user, fortnoxStatus) {
  document.documentElement.classList.add('has-session');
  if (authCard) {
    authCard.hidden = true;
  }
  authForms.forEach((form) => {
    form.hidden = true;
  });
  authTabs.forEach((tab) => {
    tab.hidden = true;
  });
  if (accountMenu) {
    accountMenu.hidden = false;
  }
  if (accountMenuInitial && user?.email) {
    accountMenuInitial.textContent = user.email.trim().charAt(0).toUpperCase();
    localStorage.setItem(userEmailStorageKey, user.email);
  }
}

function signOut() {
  setSignedOutState();
  window.location.href = `${window.location.pathname}#connect`;
}

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem(tokenStorageKey);
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || 'Request failed.');
  }

  return data;
}

function setAuthMode(mode, clearStatus = true) {
  authTabs.forEach((item) => item.classList.toggle('active', item.dataset.authMode === mode));
  authForms.forEach((form) => {
    const isSelectedForm = form.dataset.authForm === mode;
    form.hidden = !isSelectedForm;
    if (!isSelectedForm) {
      form.reset();
    }
  });
  if (clearStatus) {
    setAuthStatus('');
  }
}

function passwordPolicyError(password) {
  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must include at least one capital letter.';
  }
  if (!/\d/.test(password)) {
    return 'Password must include at least one number.';
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return 'Password must include at least one special character.';
  }
  return '';
}

async function refreshAccountState() {
  const token = localStorage.getItem(tokenStorageKey);
  if (!token) {
    setSignedOutState();
    return;
  }

  try {
    const user = await apiRequest('/auth/me');
    const fortnoxStatus = await apiRequest('/fortnox/status');
    setSignedInState(user, fortnoxStatus);
  } catch (error) {
    setSignedOutState();
  }
}

if (accountMenuButton && accountMenuPanel) {
  accountMenuButton.addEventListener('click', () => {
    const isOpen = accountMenuPanel.hidden;
    accountMenuPanel.hidden = !isOpen;
    accountMenuButton.setAttribute('aria-expanded', String(isOpen));
  });
}

document.addEventListener('click', (event) => {
  if (!accountMenu || !accountMenuButton || !accountMenuPanel || accountMenu.hidden) {
    return;
  }

  if (!accountMenu.contains(event.target)) {
    accountMenuPanel.hidden = true;
    accountMenuButton.setAttribute('aria-expanded', 'false');
  }
});

if (accountSignOutButton) {
  accountSignOutButton.addEventListener('click', signOut);
}

authTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    setAuthMode(tab.dataset.authMode);
  });
});

if (signupForm) {
  signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(signupForm);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirm_password');
    const policyError = passwordPolicyError(password);

    if (policyError) {
      setAuthStatus(policyError);
      return;
    }

    if (password !== confirmPassword) {
      setAuthStatus('The passwords do not match.');
      return;
    }

    setAuthStatus('Creating account...');

    try {
      const result = await apiRequest('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.get('email'),
          password,
        }),
      });
      signupForm.reset();
      setAuthStatus(result.message || 'Account created. Check your email before signing in.');
    } catch (error) {
      setAuthStatus(error.message);
    }
  });
}

if (signinForm) {
  signinForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(signinForm);

    setAuthStatus('Signing in...');

    try {
      const auth = await apiRequest('/auth/signin', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
        }),
      });
      localStorage.setItem(tokenStorageKey, auth.access_token);
      if (auth.user?.email) {
        localStorage.setItem(userEmailStorageKey, auth.user.email);
      }
      signinForm.reset();
      window.location.href = `${window.location.pathname}?auth=signed-in`;
    } catch (error) {
      setAuthStatus(error.message);
    }
  });
}

async function initializeAuthPage() {
  const params = new URLSearchParams(window.location.search);
  const authResult = params.get('auth');
  const fortnoxResult = params.get('fortnox');
  const emailResult = params.get('email');
  const resetResult = params.get('reset');

  if (authResult === 'signed-in') {
    await refreshAccountState();
    window.history.replaceState({}, document.title, window.location.pathname);
  } else if (fortnoxResult === 'connected') {
    await refreshAccountState();
    setAuthStatus('Fortnox connected successfully.');
    window.history.replaceState({}, document.title, window.location.pathname + '#connect');
  } else if (fortnoxResult) {
    await refreshAccountState();
    setAuthStatus(`Fortnox connection did not finish: ${fortnoxResult}.`);
    window.history.replaceState({}, document.title, window.location.pathname + '#connect');
  } else if (emailResult === 'verified') {
    setSignedOutState();
    setAuthMode('signin');
    setAuthStatus('Email verified. You can sign in now.');
    window.history.replaceState({}, document.title, window.location.pathname + '#connect');
  } else if (emailResult) {
    setSignedOutState();
    setAuthMode('signin');
    setAuthStatus('Email verification link is invalid or expired.');
    window.history.replaceState({}, document.title, window.location.pathname + '#connect');
  } else if (resetResult === 'password-changed') {
    setSignedOutState();
    setAuthMode('signin');
    setAuthStatus('Password changed. You can sign in now.');
    window.history.replaceState({}, document.title, window.location.pathname + '#connect');
  } else {
    await refreshAccountState();
  }
}

applyCachedAccountInitial();
initializeAuthPage();

document.getElementById('current-year').textContent = new Date().getFullYear();
