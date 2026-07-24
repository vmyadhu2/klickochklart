const apiBaseUrl = (window.KOK_API_BASE || 'http://localhost:3000').replace(/\/$/, '');
const requestForm = document.getElementById('request-reset-form');
const confirmForm = document.getElementById('confirm-reset-form');
const resetStatus = document.getElementById('reset-status');
const resetInstructions = document.getElementById('reset-instructions');
const params = new URLSearchParams(window.location.search);
const codeSentEmail = params.get('email');
const step = params.get('step');
const source = params.get('source');

function setResetStatus(message) {
  if (resetStatus) {
    resetStatus.textContent = message;
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || 'Request failed.');
  }

  return data;
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

function showConfirmStep(email) {
  requestForm.hidden = true;
  confirmForm.hidden = false;
  confirmForm.querySelector('input[name="email"]').value = email;
  resetInstructions.textContent = 'Enter the 4-character code from your email and choose a new password.';
}

if (step === 'code' && codeSentEmail) {
  showConfirmStep(codeSentEmail);
}

requestForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(requestForm);
  const email = formData.get('email');

  setResetStatus('Sending reset code...');

  try {
    await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    const sourceParam = source ? `&source=${encodeURIComponent(source)}` : '';
    window.location.href = `reset-password.html?step=code&email=${encodeURIComponent(email)}${sourceParam}`;
  } catch (error) {
    setResetStatus(error.message);
  }
});

confirmForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(confirmForm);
  const newPassword = formData.get('new_password');
  const confirmPassword = formData.get('confirm_password');
  const policyError = passwordPolicyError(newPassword);

  if (policyError) {
    setResetStatus(policyError);
    return;
  }

  if (newPassword !== confirmPassword) {
    setResetStatus('The new passwords do not match.');
    return;
  }

  setResetStatus('Changing password...');

  try {
    await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        email: formData.get('email'),
        code: String(formData.get('code')).toUpperCase(),
        new_password: newPassword,
      }),
    });
    localStorage.removeItem('kok_access_token');
    window.location.href = 'index.html?reset=password-changed#connect';
  } catch (error) {
    setResetStatus(error.message);
  }
});
