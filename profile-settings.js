const apiBaseUrl = (window.KOK_API_BASE || 'http://localhost:3000').replace(/\/$/, '');
const tokenStorageKey = 'kok_access_token';
const profileEmail = document.getElementById('profile-email');
const profileUserId = document.getElementById('profile-user-id');
const profileStatus = document.getElementById('profile-status');
const changePasswordButton = document.getElementById('profile-change-password-button');
const deleteButton = document.getElementById('profile-delete-button');
let currentUser = null;

function setProfileStatus(message) {
  if (profileStatus) {
    profileStatus.textContent = message;
  }
}

function generatedUserId(id) {
  return `KOK-${String(id).padStart(6, '0')}`;
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

function redirectToSignin() {
  localStorage.removeItem(tokenStorageKey);
  window.location.href = 'index.html#connect';
}

async function loadProfile() {
  try {
    currentUser = await apiRequest('/auth/me');
    profileEmail.textContent = currentUser.email;
    profileUserId.textContent = generatedUserId(currentUser.id);
  } catch (error) {
    redirectToSignin();
  }
}

if (changePasswordButton) {
  changePasswordButton.addEventListener('click', async () => {
    if (!currentUser) {
      return;
    }

    setProfileStatus('Sending reset code...');

    try {
      await apiRequest('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: currentUser.email }),
      });
      window.location.href = `reset-password.html?step=code&source=profile&email=${encodeURIComponent(currentUser.email)}`;
    } catch (error) {
      setProfileStatus(error.message);
    }
  });
}

if (deleteButton) {
  deleteButton.addEventListener('click', async () => {
    const confirmed = window.confirm('This will permanently delete your profile and all Fortnox data saved for this account. Do you want to continue?');
    if (!confirmed) {
      return;
    }

    setProfileStatus('Deleting profile...');

    try {
      await apiRequest('/auth/me', { method: 'DELETE' });
      localStorage.removeItem(tokenStorageKey);
      window.location.href = 'index.html';
    } catch (error) {
      setProfileStatus(error.message);
    }
  });
}

loadProfile();
