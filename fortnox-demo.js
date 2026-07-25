const apiBaseUrl = (window.KOK_API_BASE || 'http://localhost:3000').replace(/\/$/, '');
const tokenStorageKey = 'kok_access_token';
const connectButton = document.getElementById('demo-connect-button');
const startButton = document.getElementById('demo-start-button');
const disconnectButton = document.getElementById('demo-disconnect-button');
const downloadLink = document.getElementById('demo-download-link');
const demoLog = document.getElementById('demo-log');
const demoStatus = document.getElementById('demo-status');
const connectionLabel = document.getElementById('demo-connection-label');

function setDemoStatus(message) {
  demoStatus.textContent = message;
}

function addDemoLog(message, status = 'running') {
  const item = document.createElement('li');
  item.className = `demo-log-item ${status}`;
  item.textContent = message;
  demoLog.appendChild(item);
  item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function setFortnoxConnectionState(isConnected) {
  connectButton.disabled = isConnected;
  startButton.disabled = !isConnected;
  disconnectButton.disabled = !isConnected;
  connectionLabel.textContent = isConnected ? 'Fortnox is connected' : 'Fortnox is not connected';
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

function signedOutRedirect() {
  localStorage.removeItem(tokenStorageKey);
  window.location.href = 'index.html#connect';
}

async function initializeDemoPage() {
  const token = localStorage.getItem(tokenStorageKey);
  if (!token) {
    signedOutRedirect();
    return;
  }

  try {
    await apiRequest('/auth/me');
    const status = await apiRequest('/fortnox/status');
    const params = new URLSearchParams(window.location.search);

    if (params.get('fortnox') === 'connected') {
      setDemoStatus('Fortnox connected. You can start the demo now.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    setFortnoxConnectionState(Boolean(status.connected));
    if (!status.connected) {
      setDemoStatus('Connect Fortnox to activate the demo.');
    }
  } catch (error) {
    signedOutRedirect();
  }
}

connectButton.addEventListener('click', async () => {
  setDemoStatus('Opening Fortnox authorization...');
  try {
    const data = await apiRequest('/auth/fortnox/start?return_to=demo');
    window.location.href = data.authorization_url;
  } catch (error) {
    setDemoStatus(error.message);
  }
});

disconnectButton.addEventListener('click', async () => {
  setDemoStatus('Disconnecting Fortnox...');
  disconnectButton.disabled = true;

  try {
    await apiRequest('/fortnox/connection', { method: 'DELETE' });
    setFortnoxConnectionState(false);
    demoLog.replaceChildren();
    downloadLink.hidden = true;
    downloadLink.removeAttribute('href');
    setDemoStatus('Fortnox disconnected. Connect again to run the demo.');
  } catch (error) {
    setDemoStatus(error.message);
    disconnectButton.disabled = false;
  }
});

startButton.addEventListener('click', async () => {
  demoLog.replaceChildren();
  downloadLink.hidden = true;
  downloadLink.removeAttribute('href');
  startButton.disabled = true;
  connectButton.disabled = true;
  disconnectButton.disabled = true;
  setDemoStatus('Demo running...');

  try {
    const token = localStorage.getItem(tokenStorageKey);
    const response = await fetch(`${apiBaseUrl}/demo/invoices`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || 'Demo failed.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      lines.filter(Boolean).forEach((line) => {
        const event = JSON.parse(line);
        if (event.type === 'step') {
          addDemoLog(event.message, event.status);
        } else if (event.type === 'error') {
          addDemoLog(event.message, 'error');
          setDemoStatus(event.message);
        } else if (event.type === 'result') {
          const blob = new Blob([event.csv], { type: 'text/csv;charset=utf-8' });
          downloadLink.href = URL.createObjectURL(blob);
          downloadLink.download = event.filename;
          downloadLink.hidden = false;
          setDemoStatus('CSV is ready to download.');
        }
      });
    }
  } catch (error) {
    addDemoLog(error.message, 'error');
    setDemoStatus(error.message);
  } finally {
    const status = await apiRequest('/fortnox/status').catch(() => ({ connected: false }));
    setFortnoxConnectionState(Boolean(status.connected));
  }
});

initializeDemoPage();
