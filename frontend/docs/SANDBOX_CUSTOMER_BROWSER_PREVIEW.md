# Zippy customer synthetic browser preview

Date: November 3, 2026. This is a draft browser UI rehearsal, NOT DEPLOYED as a live Xano integration.

Backend reference: draft PR #10 at 4421892ff9c884e43711753cacde04efd4ddb7c6.
Frontend server adapter: draft PR #12 at 697da352a331dbe623cb21d81704bfc892079327.
Actual cross-stack sandbox HTTP evidence: PR #11 at 94d7d0dc99d7abb7a2b3ce521fc732c47de274a7.

## Browser behavior

The route /?sandbox=1 is available in Vite development, or in an explicitly configured sandbox-preview build with VITE_ZIPPY_SANDBOX_UI set to synthetic-only. A normal production build never includes synthetic registration/booking screens, even if that query is supplied.

The UI simulates registration, login, draft creation, draft list/detail, logout, and session expiry using browser memory only. Synthetic names must start with SYNTHETIC and emails must use @example.invalid. No data is stored or transmitted to a backend. Payment, quote, dispatch, confirmation, financial and provider actions remain disabled. The customer role is not selected from a query or form.

## Browser CI

The Playwright tests in frontend/tests/sandbox-preview.spec.ts assert:
- The complete synthetic customer registration → login → draft → detail flow.
- No /api calls and no session/local storage writes.
- Rejection of non-synthetic identities and clearing data on session expiry.
- Disabled quote, payment, dispatch and confirmation actions.
- Responsive navigation at a 320px viewport.
- Production build retaining the existing registration-blocked behavior.

## Protected hosted preview is a separate gate

No Vercel project settings are changed here and no preview is deployed by this PR. A protected hosted build requires separate verification of Vercel Deployment Protection and an explicit nonproduction sandbox-preview build. Standard production and CI builds retain the disabled signup and booking-write controls.

The actual browser-to-Xano execution is NOT_RUN. It requires a separately approved protected server gateway for sandbox-only data, exact tenant identity, isolated credentials, CSRF/origin enforcement, rate limits, session expiry, revocation, real cross-tenant denials, and current isolation proof. The existing server-only adapter from PR #12 must never be imported by the browser or replaced by direct Xano Metadata, debug, MCP or internal locking calls.

The last reported Xano test tenant expires November 4, 2026 at 06:56 UTC. Reverify any target before additional synthetic writes.

No live Xano publication, provider execution, payments, refunds, dispatch, autonomous agents, production merge or Vercel promotion is authorized.
