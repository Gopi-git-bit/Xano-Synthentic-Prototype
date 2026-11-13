# Protected customer browser gateway — sandbox only

Version **0.3.0-sandbox-browser**, against PR #10 backend contract **0.2.0-sandbox-customer**. Extends PR #13 `4fd844b66901a387898e2c35e83714b96c999ba9`; uses PR #12's server-only adapter and PR #10 `4421892ff9c884e43711753cacde04efd4ddb7c6` application APIs. Customer/Owner/Admin production release switches are independent and unchanged.

## Server boundary

`api/sandbox.mjs` and `server/sandbox-gateway.mjs` expose only:

| Method | Browser path | Result |
| --- | --- | --- |
| GET | `/api/sandbox/csrf` | Signed HttpOnly same-site CSRF cookie and memory-only nonce |
| POST | `/api/sandbox/auth/register` | Synthetic customer and pending organization review |
| POST | `/api/sandbox/auth/login` | Current identity/membership and opaque frontend session cookie |
| POST | `/api/sandbox/auth/logout` | Durable session deletion; clears session/CSRF cookies |
| GET | `/api/sandbox/auth/me` | Revalidated current identity and membership |
| GET | `/api/sandbox/organization/membership` | Revalidated active customer owner organization |
| POST | `/api/sandbox/bookings` | Idempotent draft only; exact UUID/route/time fields |
| GET | `/api/sandbox/bookings` | Own organization's first 100 drafts |
| GET | `/api/sandbox/bookings/{id}` | Own draft's safe projection; no operational actions |

The server pins the exact Xano HTTPS origin, tenant name/ID, workspace, expiry and two API groups in `server/sandbox-target.mjs`. There are no browser-selected upstream URLs, role/org selectors or generic proxies. Metadata, MCP, tool/debug/transaction, payments, refunds and dispatch have no gateway route. The seven read-only AI tools remain outside this interface.

Each protected request reads a shared session, then fetches current Xano identity and membership. The session's original user/org must still match. Inactive/revoked upstream authorization deletes the frontend session. Booking projections independently check organization ownership. Foreign/missing detail errors are sanitized identically.

Sessions use **opaque 256-bit cookie IDs**, `Secure; HttpOnly; SameSite=Strict; Path=/` and `__Host-` names. Xano bearer tokens never reach browser JSON/cookies/storage. Shared Redis stores AES-256-GCM encrypted session payloads with TTL; IDs and IP/account rate keys are HMAC-derived. There is **no deployed memory-store fallback**. Logout deletes shared state, denying replay across serverless instances. An unavailable store fails closed, including failed logout deletion. Cookie TTL, server expiry, tenant expiry and current membership all gate access.

Mutations require exact configured Origin, same-origin fetch metadata, JSON, a signed CSRF cookie and matching header. Request size is bounded to 8 KiB. Registration permits `SYNTHETIC ` names and `@example.invalid` email only. Shared atomic rate counters limit all requests (120/minute/IP), registration (3/hour/IP), login (10/5 minutes/IP) and account attempts (5/5 minutes). The adapter trusts only Vercel's overwritten `x-vercel-forwarded-for`; missing platform identity shares a restrictive bucket. These quotas intentionally limit repeated test runs.

## Configure only the authorized, SSO-protected preview

The connected bundle is allowed only for `feat/protected-customer-xano-20261103` in Vercel's **preview** environment. The old PR #13 branch retains its explicitly mocked rehearsal. Standard production builds omit both sandbox modes. The gateway additionally requires:

| Server-only environment variable | Required value |
| --- | --- |
| `ZIPPY_SANDBOX_GATEWAY_RELEASE` | `synthetic-only` |
| `ZIPPY_SANDBOX_WEB_ORIGIN` | Exact authorized HTTPS preview/branch-alias origin; no trailing slash/path |
| `ZIPPY_SANDBOX_SESSION_KEY` | Newly generated, cryptographically random 32-byte key encoded as base64 |
| `ZIPPY_SANDBOX_REDIS_URL` | Approved isolated Upstash Redis REST HTTPS origin |
| `ZIPPY_SANDBOX_REDIS_TOKEN` | Credential restricted to that dedicated sandbox Redis database |
| `ZIPPY_SANDBOX_SESSION_TTL_SECONDS` | Default 900; 60–1800 allowed; use **180** for bounded real-expiry acceptance |

Use Vercel preview/branch-specific environment settings; never production settings or `VITE_` secrets. Independently verify preview SSO before enabling the gate. The configured web origin must be the exact origin used by the browser, including a stable branch alias if selected. Do not disable SSO to run automation; provide an authorized Vercel automation-access secret through the local test process. No Redis service was provisioned or credential obtained by this implementation.

The pinned Xano tenant is **6 / `exwq-wsmx-c3e1`**, internal workspace **1**, branch **v1**, expiring **2026-11-04 06:56:09 UTC**. Expiry disables the gateway. Before using a different tenant, verify empty/synthetic-only bootstrap, no copied secrets, provider/task disablement, endpoint schemas and source; update the pin and preserve new evidence. Never substitute parent workspace 3 application paths.

## Test modes and evidence hygiene

1. `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:server`, `npm test`: source checks, mock-backed gateway tests and local Playwright. These **do not prove real Xano browser acceptance**.
2. Build the connected browser artifact for static scanning with `VITE_ZIPPY_SANDBOX_UI=xano-gateway npm run build -- --mode sandbox-preview --outDir dist-sandbox` (set the environment variable using the local shell), then `npm run scan:sandbox:browser`. This verifies bundle boundaries and CSP; Playwright also checks storage, URL/console secrecy, browser egress and accessibility at 320/390/1440px. `npm audit --omit=dev` checks shipped dependencies.
3. For **actual** browser acceptance, set locally: `ZIPPY_SANDBOX_BROWSER_ORIGIN`, `ZIPPY_SANDBOX_EXPECTED_COMMIT` (exact deployed SHA), `ZIPPY_PREVIEW_AUTOMATION_SECRET`, the three shared-store/key variables above, `ZIPPY_SANDBOX_BROWSER_APPROVAL=protected-synthetic-browser-only`, and optionally `ZIPPY_SANDBOX_EVIDENCE_DIR`. Execute `npm run test:sandbox:browser`.

The real runner verifies SSO denial without its automation credential and checks the deployed SHA/version. It uses actual browser requests through the gateway, never fulfills/mock-substitutes responses, and adds SSO access only to the exact preview origin. It registers two generated synthetic identities, validates membership, creates/lists/reads drafts, replays UUIDs, tests A/B denial, invalid credentials, CSRF/operational denial, three widths, logout replay, shared-store revocation and real server-clock expiry. Shared-store inspection/revocation occurs in the **Node test process**, never in browser code; only synthetic sessions are touched. Metadata credentials are not needed or deployed.

Real-test traces, videos, screenshots, HTML attachments and raw error logs are disabled. The custom reporter retains only test names/statuses and counts. HTTP receipts contain methods, gateway paths, statuses and synthetic assertions, with passwords/tokens held only in memory. Do not enable stock traces/reports on credential-bearing live tests. Local mock Playwright reports are separate and ignored by Git.

## Current execution dependency

Implementation and local tests can run without cloud credentials. Actual hosted browser acceptance requires an authenticated Vercel configuration/deployment path, an authorized SSO automation secret, and the shared Redis/key configuration. The supplied alias `https://zippy-frontend-preview.vercel.app/` returned **404**; the supplied deployment-specific URL returned **302 to Vercel SSO** during this execution. Neither response is browser E2E acceptance. Review the accompanying execution receipt before proceeding.
