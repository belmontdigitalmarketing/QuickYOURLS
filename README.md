# QuickYOURLS

A privacy-first Chrome extension (Manifest V3) for shortening URLs through your own self-hosted [YOURLS](https://yourls.org) server. Your API signature tokens never leave your browser — every request goes directly to your own server, never to any third party.

> Built as an auditable alternative to closed-source shortener extensions. You can read every line of code before installing.

## Why QuickYOURLS?

Most YOURLS browser extensions require you to hand over your API signature token to code you don't control. Since extensions auto-update silently, even a trustworthy extension today could be compromised tomorrow. QuickYOURLS solves that two ways:

- **Open source** — full source is right here in this repo, easy to audit before you install.
- **Optional host permissions** — the extension does **not** request blanket access to all websites at install time. It asks for access to *only* the specific YOURLS server domain you configure, and only when you add it.

## Features

- **One-click shortening** — click the toolbar icon to shorten the current tab's URL.
- **Up to 5 YOURLS servers** — add multiple instances and switch between them from the popup.
- **Custom keywords** — optionally set your own keyword (e.g. `yourdomain.com/launch`).
- **Right-click context menus**:
  - *Shorten This Link* — right-click any link on a page.
  - *Shorten Page URL with "%s" as keyword* — select text first to use it as the keyword.
- **Auto-copy** — shortened URLs are copied to your clipboard automatically.
- **Connection testing** — verify your server URL and signature token before saving.
- **Settings sync** — server configs are stored in `chrome.storage.sync`, so they follow your Chrome profile across devices.
- **30-second request timeout** — slow or unreachable servers fail gracefully instead of hanging.

## Privacy

QuickYOURLS communicates **only** with the YOURLS server(s) you configure. No analytics, no telemetry, no third-party calls.

| Data | Collected? | Where it lives |
|---|---|---|
| YOURLS API signature tokens | Yes | `chrome.storage.sync` (local to your browser/profile) |
| URLs you choose to shorten | In transit only | Sent to your YOURLS server when you click shorten |
| Browsing history | **No** | Current tab URL is only read on explicit user action |
| Personal info | **No** | — |

Full privacy policy: <https://belmontdigitalmarketing.com/privacy-policy>

## Installation

### From the Chrome Web Store

*Coming soon — pending review.*

### From source (unpacked)

1. Clone or download this repo:
   ```bash
   git clone https://github.com/belmontdigitalmarketing/QuickYOURLS.git
   ```
2. Open `chrome://extensions` in Chrome (or any Chromium browser — Edge, Brave, etc.).
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the `extension/` folder from this repo.
5. Pin the QuickYOURLS icon to your toolbar for one-click access.

## Setup

1. Click the QuickYOURLS toolbar icon, then **Open Settings** (or right-click the icon → *Options*).
2. Click **Add Server** and fill in:
   - **Name** — any label you want (e.g. *Marketing*, *Personal*).
   - **Server URL** — the base URL of your YOURLS install (e.g. `https://links.example.com`).
   - **API Signature Token** — found in your YOURLS admin under **Tools → API**.
3. Click **Test Connection** to verify, then **Save**.
4. Chrome will prompt you to grant the extension permission to communicate with that specific domain — approve it.
5. You're done. Click the toolbar icon on any page to start shortening.

## Usage

### Toolbar popup
Click the extension icon. The current tab's URL is pre-filled. Optionally add a custom keyword, then click **Shorten URL**. The short URL is copied to your clipboard automatically.

### Right-click any link
Right-click → *Shorten This Link*. The popup opens with that link ready to shorten.

### Right-click with custom keyword
Select text on a page, then right-click → *Shorten Page URL with "your-text" as keyword*. The current page URL is shortened using your selected text (lowercased, with spaces converted to dashes) as the keyword.

### Switching servers
If you've added more than one server, a dropdown appears at the top of the popup to choose which one to shorten against.

## Requirements

- **Browser**: Chrome, Edge, Brave, or any Chromium-based browser supporting Manifest V3
- **YOURLS**: a working YOURLS installation, version 1.7.3 or higher
- **API access**: your YOURLS API signature token (admin → Tools → API)

## Permissions Explained

| Permission | Why it's needed |
|---|---|
| `activeTab` | Read the current tab's URL when you click the extension icon — only on user action, never in the background. |
| `storage` | Save your server configs and preferences via `chrome.storage.sync`. |
| `contextMenus` | Add the right-click "Shorten This Link" and "Shorten Page URL with keyword" menu items. |
| `clipboardWrite` | Copy the shortened URL to your clipboard automatically. |
| `optional_host_permissions` | Declared as **optional** — granted per-domain only when you add a server, never blanket-granted at install. |

## Architecture

QuickYOURLS is a standard Manifest V3 extension with three moving parts:

| File | Purpose |
|---|---|
| `extension/manifest.json` | Extension config, permissions, icon refs |
| `extension/background.js` | Service worker — acts as a CORS proxy for API calls and handles context menus |
| `extension/popup.{html,js,css}` | The toolbar popup UI |
| `extension/options.{html,js,css}` | Settings page — server management and preferences |
| `extension/icons/` | Icon set (16/32/48/128 px) + SVG source |

The service worker is what actually makes the HTTP requests to your YOURLS server. The popup and options pages send messages via `chrome.runtime.sendMessage`, and the background script performs the `fetch()` — this is why the extension works even though the popup itself can't bypass CORS. API calls use the standard YOURLS POST format to `/yourls-api.php` with `signature`, `action`, and `format=json`.

## Building / Packaging

To create a zip for Chrome Web Store submission or unpacked distribution:

```bash
cd extension
zip -r ../QuickYOURLS.zip . -x "*.DS_Store" "*Thumbs.db*"
```

Or just zip the `extension/` folder's contents (not the folder itself) with any tool.

## Project Structure

```
QuickYOURLS/
├── extension/              # The Chrome extension — load this as "unpacked"
│   ├── manifest.json
│   ├── background.js       # Service worker (API proxy + context menus)
│   ├── popup.{html,js,css} # Toolbar popup
│   ├── options.{html,js,css} # Settings page
│   └── icons/              # 16/32/48/128 px icons + SVG source
├── store-assets/           # Chrome Web Store submission docs
│   ├── description.txt
│   ├── privacy-policy.txt
│   ├── single-purpose.txt
│   ├── screenshot-guide.md
│   └── store-listing.md
└── PROJECT_BRIEF.md        # Internal project notes
```

## Companion Plugins

QuickYOURLS pairs well with these server-side YOURLS plugins from the same author:

- **[YOURLS Users and API Tokens](https://github.com/belmontdigitalmarketing/YOURLS-Users-and-API-Tokens)** — multi-user accounts with per-integration, labeled, rotatable, revocable API tokens. **Recommended for QuickYOURLS:** instead of pasting your master admin signature token into the extension (or sharing it with a teammate), issue a scoped token per device or per person and revoke it independently if a browser is lost.
- **[Custom Fields for Links](https://github.com/belmontdigitalmarketing/custom-fields-for-links)** — adds `cf1`, `cf2`, `cf3`, and `notification_url` fields to your links for campaign tracking.
- **[Custom Notifier for Links](https://github.com/belmontdigitalmarketing/custom-notifier-for-links)** — webhook notifications when links are clicked.

## Changelog

### 2.0.0 — Initial public release
- One-click URL shortening from the toolbar popup.
- Up to 5 YOURLS server instances with a popup-level switcher.
- Right-click context menus: shorten any link, or shorten the page URL with selected text as the keyword.
- Optional host permissions — access granted per-domain only when you add a server, never blanket-granted at install.
- Connection testing, auto-copy to clipboard, 30-second request timeout.

## Support & Contributing

- **Issues / feature requests**: <https://github.com/belmontdigitalmarketing/QuickYOURLS/issues>
- **Website**: <https://belmontdigitalmarketing.com/chrome-extensions>

Pull requests welcome. For non-trivial changes, please open an issue first to discuss the approach.

## License

[MIT](LICENSE) — free to use, modify, and distribute. No warranty.

## Credits

Developed by **[Belmont Digital Marketing](https://belmontdigitalmarketing.com)**.

Inspired by — but built independently from — the [YOURLS Link Shortener](https://chromewebstore.google.com/detail/yourls-link-shortener/bpaidpglokfmipgcbippdmcncngcjghh) extension by SimplyTil. We reviewed their public source to understand the YOURLS API integration pattern, then wrote QuickYOURLS from scratch with optional host permissions and a multi-server design.

---

Made for the YOURLS community.
