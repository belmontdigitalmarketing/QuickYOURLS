# QuickYOURLS — Chrome Extension

## What This Is
A Chrome extension (Manifest V3) that shortens URLs using self-hosted YOURLS servers. Built as a privacy-focused alternative to the third-party "YOURLS Link Shortener" extension (by SimplyTil) so we don't have to trust an unknown developer with our YOURLS API keys.

## Why We Built It
The existing extension at https://github.com/SimplyTil/yourls-shortener-extension works fine, but requires providing your YOURLS API signature token to code you don't control. Since extensions auto-update silently, even a currently-safe extension could become compromised. We reviewed their full source code to understand the architecture, then built our own.

## What It Does
- **One-click URL shortening** via browser popup
- **Up to 5 YOURLS server instances** (the original only supports 2)
- **Context menu integration** — right-click a link to shorten it, or select text to use as a custom keyword
- **Auto-copy** shortened URL to clipboard
- **Connection testing** — verify server credentials before saving
- All API communication goes **only** to the user's own YOURLS server(s). No third-party calls.

## Architecture
- **Manifest V3** with service worker background script
- Background script acts as a **CORS proxy** — popup/options send messages via `chrome.runtime.sendMessage`, background performs the `fetch()` (exempt from CORS with `host_permissions`)
- Server configs stored in `chrome.storage.sync` (syncs across Chrome profile)
- YOURLS API calls: POST to `{server_url}/yourls-api.php` with `signature`, `action`, `format=json`

## Folder Structure
- `extension/` — the complete Chrome extension, zip this to upload to Chrome Web Store or use "Load unpacked"
- `store-assets/` — Chrome Web Store submission documents (description, privacy disclosures, permission justifications, screenshot guide)

## Key Files
| File | Purpose |
|---|---|
| `extension/manifest.json` | Extension config, permissions, icon refs |
| `extension/background.js` | Service worker — API proxy + context menus |
| `extension/popup.html/js/css` | Main popup UI |
| `extension/options.html/js/css` | Settings — server management + preferences |
| `extension/icons/` | Original icon (teal/blue chain link + lightning bolt) as SVG + PNGs |

## Chrome Web Store
- **Name**: QuickYOURLS
- **Publisher**: Belmont Digital Marketing
- **Homepage**: https://belmontdigitalmarketing.com/chrome-extensions
- **Privacy policy**: https://belmontdigitalmarketing.com/privacy-policy
- **YOURLS server used**: https://inslnk.cc

## Status
- Extension is built and tested locally (loads and connects to inslnk.cc)
- Store submission docs are ready in `store-assets/`
- Still needed: screenshots for Chrome Web Store listing, 440x280 promo tile
