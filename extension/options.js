// QuickYOURLS — Options Page Logic

document.addEventListener('DOMContentLoaded', init);

let servers = [];
let activeServerId = null;
let preferences = { autoCopy: true, askForKeyword: false };
let saveTimeout = null;

async function init() {
  const data = await chrome.storage.sync.get(['servers', 'activeServerId', 'preferences']);
  servers = data.servers || [];
  activeServerId = data.activeServerId || null;
  preferences = data.preferences || { autoCopy: true, askForKeyword: false };

  renderServers();
  setupTabs();
  setupPreferences();
  setupAddButton();
}

// --- Tabs ---

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });
}

// --- Preferences ---

function setupPreferences() {
  const autoCopy = document.getElementById('pref-auto-copy');
  const askKeyword = document.getElementById('pref-ask-keyword');

  autoCopy.checked = preferences.autoCopy;
  askKeyword.checked = preferences.askForKeyword;

  autoCopy.addEventListener('change', () => {
    preferences.autoCopy = autoCopy.checked;
    savePreferences();
  });

  askKeyword.addEventListener('change', () => {
    preferences.askForKeyword = askKeyword.checked;
    savePreferences();
  });
}

function savePreferences() {
  chrome.storage.sync.set({ preferences }, () => {
    showStatus('Preferences saved', 'success');
  });
}

// --- Servers ---

function renderServers() {
  const list = document.getElementById('server-list');
  list.innerHTML = '';
  servers.forEach(server => list.appendChild(createServerCard(server)));
  updateServerCount();
}

function createServerCard(server) {
  const template = document.getElementById('server-card-template');
  const card = template.content.cloneNode(true).querySelector('.server-card');
  card.dataset.serverId = server.id;

  const nameInput = card.querySelector('.server-name');
  const urlInput = card.querySelector('.server-url');
  const sigInput = card.querySelector('.server-signature');

  const badge = card.querySelector('.default-badge');
  const setDefaultBtn = card.querySelector('.btn-set-default');

  nameInput.value = server.name || '';
  urlInput.value = server.url || '';
  sigInput.value = server.signature || '';

  // Show default badge or set-default button
  const isDefault = server.id === activeServerId;
  if (isDefault) {
    badge.classList.remove('hidden');
    setDefaultBtn.classList.add('hidden');
    card.classList.add('is-default');
  } else {
    badge.classList.add('hidden');
    setDefaultBtn.classList.remove('hidden');
  }

  setDefaultBtn.addEventListener('click', () => {
    activeServerId = server.id;
    chrome.storage.sync.set({ activeServerId }, () => {
      renderServers();
      showStatus(`"${server.name || 'Server'}" set as default`, 'success');
    });
  });

  // Auto-save on input
  const autoSave = () => {
    server.name = nameInput.value.trim();
    server.url = urlInput.value.trim();
    server.signature = sigInput.value.trim();
    debouncedSave();
  };

  nameInput.addEventListener('input', autoSave);
  urlInput.addEventListener('input', autoSave);
  sigInput.addEventListener('input', autoSave);

  // Delete
  card.querySelector('.btn-delete').addEventListener('click', () => {
    if (confirm(`Remove "${server.name || 'this server'}"?`)) {
      servers = servers.filter(s => s.id !== server.id);
      saveServers();
      renderServers();
    }
  });

  // Toggle password visibility
  const toggleBtn = card.querySelector('.btn-toggle-vis');
  toggleBtn.addEventListener('click', () => {
    const isPassword = sigInput.type === 'password';
    sigInput.type = isPassword ? 'text' : 'password';
  });

  // Test connection
  const testBtn = card.querySelector('.btn-test');
  const testResult = card.querySelector('.test-result');
  testBtn.addEventListener('click', () => testConnection(server, testBtn, testResult));

  return card;
}

function updateServerCount() {
  document.getElementById('server-count').textContent = servers.length;
  document.getElementById('btn-add-server').disabled = servers.length >= 5;
}

function setupAddButton() {
  document.getElementById('btn-add-server').addEventListener('click', () => {
    if (servers.length >= 5) return;

    const newServer = {
      id: generateId(),
      name: '',
      url: '',
      signature: ''
    };
    servers.push(newServer);
    saveServers();
    renderServers();

    // Focus the new card's name input
    const cards = document.querySelectorAll('.server-card');
    const lastCard = cards[cards.length - 1];
    if (lastCard) {
      lastCard.querySelector('.server-name').focus();
      lastCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

// --- Host Permission Request ---

function getOriginPattern(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.hostname}/*`;
  } catch {
    return null;
  }
}

async function ensureHostPermission(url) {
  const pattern = getOriginPattern(url);
  if (!pattern) throw new Error('Invalid URL');

  const hasPermission = await chrome.permissions.contains({ origins: [pattern] });
  if (hasPermission) return true;

  const granted = await chrome.permissions.request({ origins: [pattern] });
  if (!granted) throw new Error('Permission denied — you must allow access to connect to your YOURLS server');
  return true;
}

// --- Test Connection ---

async function testConnection(server, btn, resultEl) {
  const url = server.url.trim();
  const signature = server.signature.trim();

  if (!url || !signature) {
    resultEl.textContent = 'URL and signature required';
    resultEl.className = 'test-result error';
    return;
  }

  btn.disabled = true;
  resultEl.textContent = 'Testing...';
  resultEl.className = 'test-result loading';

  try {
    await ensureHostPermission(url);

    const apiUrl = url.replace(/\/+$/, '') + '/yourls-api.php';
    const result = await chrome.runtime.sendMessage({
      type: 'makeApiRequest',
      payload: {
        apiUrl,
        params: {
          signature,
          action: 'db-stats',
          format: 'json'
        }
      }
    });

    if (result.success && result.data && result.data['db-stats']) {
      const stats = result.data['db-stats'];
      resultEl.textContent = `Connected! ${stats.total_links || 0} links in database`;
      resultEl.className = 'test-result success';
    } else if (result.success && result.data && result.data.message) {
      resultEl.textContent = result.data.message;
      resultEl.className = 'test-result error';
    } else {
      resultEl.textContent = result.error || 'Connection failed';
      resultEl.className = 'test-result error';
    }
  } catch (err) {
    resultEl.textContent = err.message;
    resultEl.className = 'test-result error';
  } finally {
    btn.disabled = false;
  }
}

// --- Save ---

function debouncedSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveServers(), 1000);
}

function saveServers() {
  const activeExists = servers.some(s => s.id === activeServerId);
  const updates = { servers };
  if (!activeExists && servers.length > 0) {
    activeServerId = servers[0].id;
    updates.activeServerId = activeServerId;
  }
  chrome.storage.sync.set(updates, () => {
    updateServerCount();
    showStatus('Servers saved', 'success');
  });
}

// --- Status Bar ---

function showStatus(message, type) {
  const bar = document.getElementById('status-bar');
  const msg = document.getElementById('status-message');
  bar.className = type || '';
  msg.textContent = message;
  bar.classList.remove('hidden');
  setTimeout(() => bar.classList.add('hidden'), 2000);
}

// --- Utilities ---

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}
