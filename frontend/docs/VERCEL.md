# Vercel readiness

Configuration is prepared locally. **No Vercel project settings, environment values, deployment or domain were changed.** Private local provider values do not automatically exist in Vercel.

## Project settings

- Repository branch for review: `feat/frontend-tailwind-polish`.
- Root Directory: **frontend** (the repository also contains Xano sources).
- Framework preset: Vite; Node runtime: **24.x**.
- Install: `npm ci`; build: `npm run build`; output: `dist`.
- `frontend/vercel.json` routes `/api/*` to the Node function, then serves SPA deep links through `index.html`; assets remain static.
- `api/gateway.mjs` imports `server/gateway.mjs`. Keep both inside the project root for function dependency tracing.
- Deep links such as `/admin/crm` reach the authenticated entry screen. Preview navigation uses hashes. No deep link, query, role hint or demo flag grants production access.
- Response headers restrict scripts and network connections to the app origin. API responses use `no-store`. Fonts/styles are local and compiled.

## Server-only environment variables

Set independently for Vercel **Preview** and **Production**, using the Vercel dashboard or an authorized secret-management workflow. Never prefix these with `VITE_`.

| Name | Purpose |
|---|---|
| `XANO_AUTH_BASE_URL` | Deployed authentication API group root, HTTPS, without `/auth/login` suffix |
| `ZOHO_ACCOUNTS_URL` | Correct tenant regional Accounts origin, e.g. `https://accounts.zoho.in` |
| `ZOHO_CLIENT_ID` | OAuth client ID |
| `ZOHO_CLIENT_SECRET` | OAuth client secret |
| `ZOHO_REFRESH_TOKEN` | Authorized CRM read/metadata refresh token |
| `CRM_READ_GRANTS_JSON` | Per authenticated Xano user, explicit module/record/field grants; default deny `{}` |

`ZOHO_CRM_MCP_URL` is only for the separate local discovery script and is not required by the REST adapter. No Vercel access token belongs in application environment variables. `.env.example` contains names and blanks only. `.env.local`, `.vercel/`, builds and dependencies are ignored.

## Remaining steps

1. Supply and verify deployed Xano auth base URL and a test account. Confirm `auth/me` response and revocation behavior.
2. Restore authorized Zoho MCP access if discovery through that connection is needed. Supply separate regional OAuth credentials for the REST adapter, with only approved read/metadata scopes.
3. Discover actual module API names/permissions. Configure narrow record/field grants for the verified Admin user. Check object denial with another record and non-Admin test account.
4. Run local checks in README. Configure project root/runtime and server variables under explicit deployment authorization.
5. Create an authorized preview deployment and smoke-test account entry, direct API denial, SPA deep links, CRM metadata, pagination, headers and absence of browser secrets. This remote verification has **not** been performed.
6. Connect approved logistics contracts before enabling production Customer/Vehicle Owner operations. Review the preview before any production deployment or merge.

The local tests verify application and adapter behavior, not Vercel's remote infrastructure or a live tenant. No deployment URL is claimed.
