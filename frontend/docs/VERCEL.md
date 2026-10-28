# Protected Vercel preview

## Current Git publication — Composio handoff

https://zippy-frontend-preview-5z2dnet0k-gopi-nathan-s-projects.vercel.app

The user supplied this verification from the ChatGPT/Composio session after resolving the GitHub publication blocker:

- Branch: `Gopi-git-bit/Xano-Synthentic-Prototype` → `feat/frontend-tailwind-polish`.
- HEAD / deployed Git SHA: `c36631c04e824242b377af05a807f1245579d586`.
- Preserved parent: `f2fdbbac2f7305a876729af73ba2fa2f57effe15`.
- Deployment: `dpl_5uGH41TYBgSpCj7svHpxNURLjKrB`, **READY / Git-triggered Preview**.
- Project: `prj_qdS0VoN46xsmiL9USAGGAPo8f04b`; Root Directory: `frontend`.

This is the supplied publication handoff, not a new remote probe from OpenCode. Newer local frontend work awaits the next Composio publication. Composio tools are unavailable in this OpenCode session; hand subsequent GitHub operations back to that session rather than retrying the failed HTTPS push path.

Open while signed in to Vercel with access to the `gopi-nathan-s-projects` team. Deployment protection redirects anonymous visitors to Vercel authentication. After that, the application shows its closed Xano access gate; this is not a live booking demo. Existing fixture workspaces remain available locally in development.

- Isolated project: `zippy-frontend-preview` (`prj_qdS0VoN46xsmiL9USAGGAPo8f04b`).
- Protection: `prod_deployment_urls_and_all_previews`; automatic custom-domain assignment disabled.
- Audited GitHub integration: `Gopi-git-bit/Xano-Synthentic-Prototype`; production branch `main`, distinct from the feature branch above.
- Local mapping is at repository-root `.vercel/project.json`, ignored through Git's local `info/exclude`. Deployment cwd is the repository root; Vercel applies `frontend` once. There is no nested `frontend/.vercel/project.json`.

## Historical direct-upload verification — 2026-10-27

Earlier deployment `dpl_BrGBBWUSvTbLwhu78tEnwu9UiNJa` used direct source upload. Its [sanitized remote checks](vercel-preview.json), [mobile access-gate screenshot](screenshots/vercel-protected-access.png), and [project audit](vercel-project-audit.json) remain historical evidence. The audit recorded only that Preview, five Preview-only variables and zero automation bypasses **at the time of that check**; it is not a current deployment inventory.

Vercel forces a new project's first deployment to Production, even when Preview is requested. Two bootstrap deployments encountered that behavior and were deleted; the final deployment was created after bootstrap, verified as Preview, and the remaining bootstrap was removed. No Production environment variables were configured. All application gates stayed closed throughout. The deployed code was uploaded from an explicit source allowlist; private files, raw Xano snapshots, build caches and local credentials were excluded.

## Project settings

- Repository branch for review: `feat/frontend-tailwind-polish`.
- Root Directory: **frontend** (the repository also contains Xano sources).
- Framework preset: Vite; Node runtime: **24.x**.
- Install: `npm ci`; build: `npm run build`; output: `dist`.
- `frontend/vercel.json` routes `/api/*` to the Node function, then serves SPA deep links through `index.html`; assets remain static.
- `api/gateway.mjs` imports `server/gateway.mjs` and its booking projection. All are inside the project root for function dependency tracing; remote API responses confirm the function is deployed.
- Deep links such as `/admin/crm` reach the authenticated entry screen. Preview navigation uses hashes. No deep link, query, role hint or demo flag grants production access.
- Response headers restrict scripts and network connections to the app origin. API responses use `no-store`. Fonts/styles are local and compiled.

## Server-only environment variables

Five encrypted project variables were configured for **Preview only**. The bases are public endpoint configuration; release switches are server-only and blocked. No Xano Metadata token, Vercel access token or Zoho secret was uploaded or placed in application configuration. Future Preview/Production values must be managed independently and never prefixed with `VITE_`.

| Name | Purpose |
|---|---|
| `XANO_AUTH_BASE_URL` | `https://xynd-fnea-khtp.n7e.xano.io/api:pofBqnrY` |
| `XANO_LOGISTICS_BASE_URL` | `https://xynd-fnea-khtp.n7e.xano.io/api:zippy-v1` |
| `XANO_AUTH_RELEASE` | `blocked`; awaits safe published auth and authoritative identity verification |
| `XANO_BOOKING_READS_RELEASE` | `blocked`; awaits published tenant guards and positive/denial read tests |
| `ZOHO_READ_RELEASE` | `blocked`; independent MCP/REST blockers remain with the user |

Zoho regional OAuth values and `CRM_READ_GRANTS_JSON` were not configured remotely. `.env.example` includes public Xano bases, blocked gates and blank private credential fields. `.env.local`, `.vercel/`, builds and dependencies are ignored. There is no release switch for booking mutations or delivery execution in this increment.

## Historical remote smoke checks

These checks apply to the earlier direct-upload deployment. An ephemeral automation bypass was used in request headers and **revoked afterward**. No bypass URL or persistent public share link was created. The first smoke attempt saw a protection redirect while the new bypass propagated; a bounded retry passed without disabling protection. They do not claim the newer local reader changes are deployed.

| Check | Result |
|---|---|
| Anonymous deployment request | 302 to Vercel protection |
| Authorized `/` and `/admin/crm` | 200; secure app entry / SPA deep link |
| `/api/status` | 200, JSON, `no-store`; configured auth base but all availability gates false |
| Anonymous app `/api/bookings`, `/api/crm/modules` | 401, JSON, `no-store` |
| `/api/auth/login` with synthetic input | 503 `AUTH_RELEASE_PENDING`; no credential forwarding to Xano |
| Headers | Same-origin CSP present; API responses not cached |
| Browser | 390px, disabled sign-in, no fixture role selector despite demo/role URL hints, no overflow or page errors |
| Deployed JS | No fixture identifiers or private provider values; matches tested local build |

## Next release

Follow [Xano handoff](XANO.md): backend-owner fixes/publication, approved test accounts, positive identity/tenant/denial checks, then a separately reviewed redeployment with the relevant read gates released. Do not toggle flags merely because the URLs exist. Zoho troubleshooting remains with the user. No positive Xano or Zoho workflow is claimed by these infrastructure checks.

To review the preserved complete UI now, use the local development fixture links in [README](../README.md). The protected remote preview intentionally runs the production bundle and excludes those fixtures.
