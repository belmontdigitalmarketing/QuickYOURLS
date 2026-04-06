// QuickYOURLS — Background Service Worker
// Handles API requests (CORS proxy) and context menu integration

// --- Context Menu Setup ---

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'shorten-link',
    title: 'Shorten This Link',
    contexts: ['link']
  });

  chrome.contextMenus.create({
    id: 'shorten-page-with-keyword',
    title: 'Shorten Page URL with "%s" as keyword',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'shorten-link') {
    chrome.storage.local.set({
      contextAction: { type: 'shorten-link', url: info.linkUrl }
    });
    chrome.action.openPopup();
  } else if (info.menuItemId === 'shorten-page-with-keyword') {
    chrome.storage.local.set({
      contextAction: {
        type: 'shorten-with-keyword',
        url: tab.url,
        keyword: info.selectionText.trim().replace(/\s+/g, '-').toLowerCase()
      }
    });
    chrome.action.openPopup();
  }
});

// --- API Proxy ---

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'makeApiRequest') {
    handleApiRequest(message.payload)
      .then(sendResponse)
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }
});

async function handleApiRequest({ apiUrl, params }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const body = new URLSearchParams(params).toString();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal,
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { success: false, error: 'Request timed out after 30 seconds' };
    }
    return { success: false, error: err.message };
  } finally {
    clearTimeout(timeout);
  }
}
