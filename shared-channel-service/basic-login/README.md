# Basic identity login

The dashboard now points to the basic-identity gateway. The original USER_ACCESSING data service in the parent directory is legacy and is no longer linked by the dashboard.

Two standalone, owner-only Apps Script projects separate identity from data access. The gateway requests only userinfo.email, signs a one-hour session for the current Google identity, and passes it in a URL fragment. The backend clears the fragment from browser history and keeps the session in memory. Every channel read, save and UID lookup validates the signature, audience, lifetime, and current direct-user permissions on the designated folder and sheet. Viewer accounts cannot save. Group/domain/link shares do not grant access. No channel data is returned anonymously.

The backend executes as the owner. Only the owner authorizes Drive metadata and Sheets access once. Do not share either script project or store the signing key in this repository; __SESSION_KEY__ is substituted during private deployment. The original shared sheet and all channel data remain unchanged.

Owner activation: open the backend project and run authorizeBackend_ once. Then verify live authorized reads, denied outside accounts, and viewer/editor behavior before replacing the dashboard launcher. Google may still display standard first-use identity consent; this is not Firebase and does not claim to eliminate every Google consent screen.

Backend project: 1tLWnocve1fBP1eY-eGSb5wsKfe1QmR4yqiloyYOBmS7OhqG8aZG_NMXf
Gateway project: 1pF8YnlhOo50QcCfJk-9II3WtqyT7D51vwI0xoDE7EaFrA6vmhmKW5OhK

Tests: identity-test.cjs covers missing/forged/expired/wrong-audience sessions, revoked and expired shares, read-only accounts, edit conflicts and 16 channels; identity-ui-test.cjs covers URL assembly, UID lookup, manual URLs, editing, and responsive layout using isolated mocks. Owner activated the backend. Live read-only checks verified all 16 channels including pwa-17/pwa-18, anonymous rejection and outside-folder rejection. Authorized backend verification used an owner test session; the complete interactive Google consent flow has not been exercised with a colleague account. No shared data was written during verification.

## Dashboard-native workspace

The gateway now returns to the dashboard with a short-lived fragment ticket. The dashboard clears the fragment immediately and keeps the ticket only in memory (no localStorage/sessionStorage). Its shadow-DOM workspace calls the authenticated doPost action allowlist. Every read, save, and token-query authorization independently verifies the signature, expiry and current folder/sheet permissions. Default Apps Script framing protection remains enabled; no ALLOWALL is used. Reloading requires login again.

TOKEN lookup runs from the browser after access authorization because the same upstream query fails from Apps Script but returns HTTP 200 in the browser. Exact UID matching, unique 32-hex token validation, request-generation checks, and a 15-second timeout prevent stale or mismatched results. Tokens are never persisted. Live read-only verification confirmed the reported UID query, 16 shared channels, URL assembly and logout in the dashboard.
