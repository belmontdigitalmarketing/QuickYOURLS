# QuickYOURLS — Chrome Web Store Listing Reference

Use this document when filling out the Chrome Web Store Developer Dashboard.

## Basic Information

| Field | Value |
|---|---|
| **Extension name** | QuickYOURLS |
| **Summary** (132 chars) | Quickly shorten URLs with your own YOURLS server. Supports up to 5 instances. Your API keys stay local. |
| **Category** | Productivity |
| **Language** | English |
| **Homepage URL** | https://belmontdigitalmarketing.com/chrome-extensions |
| **Support URL** | https://belmontdigitalmarketing.com/chrome-extensions |

## Description

Copy from `description.txt` in this folder.

## Privacy

| Field | Value |
|---|---|
| **Privacy policy URL** | https://belmontdigitalmarketing.com/privacy-policy |
| **Single purpose** | Copy from `single-purpose.txt` |
| **Permission justifications** | Copy from `privacy-policy.txt` (Permission Justifications section) |

### Host Permissions — In-Depth Review Notice

The `host_permissions` for `https://*/*` and `http://*/*` will trigger Chrome's **in-depth review process**, which can take **several days to weeks** instead of the usual 1-3 days.

**Why we need broad host permissions:** Users self-host YOURLS on their own domains, so the extension cannot declare specific host patterns in advance. The background service worker needs to reach whatever domain the user configures.

**To speed up the review:**
- In the "Permission justifications" field, paste the `host_permissions` justification from `privacy-policy.txt` — be thorough, reviewers look for this specifically
- Emphasize: requests only go to user-configured servers, only on explicit user action, no background activity
- Make sure your privacy policy at belmontdigitalmarketing.com/privacy-policy is live and mentions the extension by name
- Ensure screenshots clearly show the settings page where users configure their own server URLs — this demonstrates the user-driven nature of the network requests

### Data Use Certifications (check all that apply)

- [x] I do not sell user data to third parties
- [x] I do not use or transfer user data for purposes that are unrelated to the item's core functionality
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes

### Data Collected

In the "Data use" section of the Developer Dashboard, select:

| Data Type | Collected? |
|---|---|
| Personally identifiable info | No |
| Health info | No |
| Financial info | No |
| Authentication info | Yes (stored locally only, not transferred) |
| Personal communications | No |
| Location | No |
| Web history | No |
| User activity | No |
| Website content | No |

## Graphics Assets

| Asset | Dimensions | Notes |
|---|---|---|
| **Extension icon** | 128x128 px | `icons/icon128.png` |
| **Small promo tile** | 440x280 px | Create in Canva/Figma — show the icon + "QuickYOURLS" text on blue gradient |
| **Screenshots** | 1280x800 or 640x400 | See `screenshot-guide.md` |
| **Marquee promo** (optional) | 1400x560 px | Optional large banner for featured placement |

## Distribution

| Field | Value |
|---|---|
| **Visibility** | Public |
| **Regions** | All regions |
| **Pricing** | Free |
