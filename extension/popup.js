// QuickYOURLS — Popup Logic

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const data = await chrome.storage.sync.get(['servers', 'activeServerId', 'preferences']);
  const servers = data.servers || [];
  const preferences = data.preferences || { autoCopy: true, askForKeyword: false };

  if (servers.length === 0) {
    show('no-config');
    document.getElementById('btn-open-options').addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
      window.close();
    });
    return;
  }

  show('main-ui');
  setupServerSelector(servers, data.activeServerId);
  setupKeywordToggle(preferences);
  await loadCurrentUrl();
  await checkContextAction();
  setupShortenButton(servers, data.activeServerId, preferences);
  setupSettingsLink();
}

function show(id) {
  document.getElementById(id).classList.remove('hidden');
}

function hide(id) {
  document.getElementById(id).classList.add('hidden');
}

// --- Server Selector ---

function setupServerSelector(servers, activeServerId) {
  if (servers.length <= 1) return;

  const row = document.getElementById('server-selector-row');
  const select = document.getElementById('server-select');
  row.classList.remove('hidden');

  servers.forEach(server => {
    const opt = document.createElement('option');
    opt.value = server.id;
    opt.textContent = server.name || server.url;
    if (server.id === activeServerId) opt.selected = true;
    select.appendChild(opt);
  });

  select.addEventListener('change', () => {
    chrome.storage.sync.set({ activeServerId: select.value });
  });
}

// --- Keyword Toggle ---

function setupKeywordToggle(preferences) {
  const btn = document.getElementById('btn-toggle-keyword');
  const row = document.getElementById('keyword-row');
  const input = document.getElementById('keyword-input');

  if (preferences.askForKeyword) {
    row.classList.remove('hidden');
    btn.textContent = '- Hide keyword';
  }

  btn.addEventListener('click', () => {
    const isHidden = row.classList.toggle('hidden');
    btn.textContent = isHidden ? '+ Custom keyword' : '- Hide keyword';
    if (!isHidden) input.focus();
  });
}

// --- Load Current URL ---

async function loadCurrentUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const urlEl = document.getElementById('current-url');
  if (tab && tab.url) {
    urlEl.textContent = tab.url;
    urlEl.title = tab.url;
    urlEl.dataset.url = tab.url;
  } else {
    urlEl.textContent = 'Unable to read current tab URL';
  }
}

// --- Context Menu Action ---

async function checkContextAction() {
  const data = await chrome.storage.local.get('contextAction');
  if (!data.contextAction) return;

  const action = data.contextAction;
  await chrome.storage.local.remove('contextAction');

  const urlEl = document.getElementById('current-url');
  if (action.url) {
    urlEl.textContent = action.url;
    urlEl.title = action.url;
    urlEl.dataset.url = action.url;
  }

  if (action.keyword) {
    document.getElementById('keyword-row').classList.remove('hidden');
    document.getElementById('btn-toggle-keyword').textContent = '- Hide keyword';
    document.getElementById('keyword-input').value = action.keyword;
  }
}

// --- Host Permission Check ---

async function ensureHostPermission(url) {
  try {
    const parsed = new URL(url);
    const pattern = `${parsed.protocol}//${parsed.hostname}/*`;
    const has = await chrome.permissions.contains({ origins: [pattern] });
    if (!has) {
      const granted = await chrome.permissions.request({ origins: [pattern] });
      if (!granted) throw new Error('Permission denied for this server domain');
    }
  } catch (err) {
    if (err.message.includes('Permission')) throw err;
    throw new Error('Invalid server URL');
  }
}

// --- Shorten ---

function setupShortenButton(servers, activeServerId, preferences) {
  const btn = document.getElementById('btn-shorten');
  let isProcessing = false;

  btn.addEventListener('click', async () => {
    if (isProcessing) return;
    isProcessing = true;

    hide('result-area');
    hide('error-area');
    btn.disabled = true;
    btn.classList.add('btn-loading');

    try {
      const selectEl = document.getElementById('server-select');
      const serverId = selectEl.value || activeServerId || (servers[0] && servers[0].id);
      const server = servers.find(s => s.id === serverId) || servers[0];

      if (!server) throw new Error('No server configured');

      const url = document.getElementById('current-url').dataset.url;
      if (!url) throw new Error('No URL to shorten');

      await ensureHostPermission(server.url);

      const keyword = document.getElementById('keyword-input').value.trim();
      const params = {
        signature: server.signature,
        action: 'shorturl',
        format: 'json',
        url
      };
      if (keyword) params.keyword = keyword;

      const apiUrl = server.url.replace(/\/+$/, '') + '/yourls-api.php';
      const result = await chrome.runtime.sendMessage({
        type: 'makeApiRequest',
        payload: { apiUrl, params }
      });

      if (!result.success) throw new Error(result.error);

      const responseData = result.data;
      if (responseData.status === 'fail') {
        throw new Error(responseData.message || 'YOURLS returned an error');
      }

      const shortUrl = responseData.shorturl;
      if (!shortUrl) throw new Error('No short URL returned');

      document.getElementById('short-url').value = shortUrl;
      show('result-area');

      if (preferences.autoCopy) {
        await copyToClipboard(shortUrl);
      }
    } catch (err) {
      document.getElementById('error-message').textContent = err.message;
      show('error-area');
    } finally {
      btn.disabled = false;
      btn.classList.remove('btn-loading');
      isProcessing = false;
    }
  });
}

// --- Clipboard ---

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showCopyFeedback();
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showCopyFeedback();
  }
}

function showCopyFeedback() {
  const el = document.getElementById('copy-feedback');
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2000);
}

// --- Copy Button ---

document.getElementById('btn-copy').addEventListener('click', () => {
  const url = document.getElementById('short-url').value;
  if (url) copyToClipboard(url);
});

// --- Settings Link ---

function setupSettingsLink() {
  document.getElementById('btn-settings').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
    window.close();
  });
}
