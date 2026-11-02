# ZIPPY_ZOHO_CRM_FRONTEND_ACCEPTANCE

Audit date: **2026-10-31**. Repository: `Gopi-git-bit/Xano-Synthentic-Prototype`.
Local worktree: `zippy-frontend-polish`; branch: `feat/frontend-tailwind-polish`.

## Acceptance statuses

| Status | Result | Evidence boundary |
|---|---|---|
| `MCP_VERIFIED` | **PASS — metadata only** | OpenCode reports connected, with 15 tools; organization, module and field metadata reads succeeded. |
| `REST_API_VERIFIED` | **BLOCKED / false** | Server REST OAuth credentials/region absent; refresh and v8 API access through deployed credentials cannot be proven. |
| `FRONTEND_MOCK_VERIFIED` | **PASS** | Production-build UI calls the real gateway, whose Xano/Zoho HTTP providers are synthetic. |
| `AUTHORIZED_RECORD_READ_VERIFIED` | **BLOCKED / false** | No separately approved test record, per-admin grants or trusted test-admin session supplied. Zero live record reads. |
| `PRODUCTION_RELEASE_BLOCKED` | **YES** | Credentials, least-privilege scopes, live authorization evidence and separate release approval remain required. |

## Existing connection and OAuth audit

- `opencode mcp list` confirmed **ZohoMCP connected** in this project. It uses the existing global `npx mcp-remote` HTTP-only configuration. No MCP credentials/URL were copied into the application.
- MCP organization: **Zippy Logitech**, organization ID `1484941000000020813`. This is organization metadata, not a customer/contact record.
- Successfully invoked only `getOrganization`, `getModules` and `getFields` for Accounts, Contacts, Leads, Deals and Tasks. **Zero record reads, searches, record counts or mutations.** The broader MCP catalog is not a frontend permission grant.
- Current PowerShell Process/User/Machine environment has no values for `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_ACCOUNTS_URL`, `ZOHO_READ_RELEASE`, `CRM_READ_GRANTS_JSON` or `XANO_AUTH_RELEASE`. The checkout has only the blocked `.env.example`, with no `.env.local` or PowerShell connector scripts. No private REST configuration was supplied; the user selected **Continue with mocks**.
- `npm run verify:crm` executed the exact `createGateway` implementation used by the frontend server. It reported all configuration/availability/release booleans false, and blocked before any upstream request. This is denial evidence, **not** successful REST verification.
- Refresh-token validity and actual REST token scope strings are **unknown**, not inferred from MCP. MCP metadata capabilities succeeded, but the MCP does not expose its OAuth scope strings here.
- The existing MCP endpoint is in the India region. The India REST host contract is `https://accounts.zoho.in` → `https://www.zohoapis.in/crm/v8`; actual REST regional verification is blocked. Host pairing is covered by mocks, including rejection of a different otherwise allowlisted region before transmitting an access token.

Minimum scope contract: `ZohoCRM.settings.modules.READ`, `ZohoCRM.settings.fields.READ`, plus only necessary module-specific scopes, e.g. `ZohoCRM.modules.contacts.READ`, `ZohoCRM.modules.accounts.READ`, `ZohoCRM.modules.leads.READ`, `ZohoCRM.modules.deals.READ`, `ZohoCRM.modules.tasks.READ`. No write scopes are required by this adapter. Do not request all-module read permission to compensate for missing grants.

## Available modules and permission classification

| MCP module API name | Provider metadata classification | Field metadata inspected | Zippy REST record permission |
|---|---|---|---|
| Accounts | Visible, viewable, API-supported | 50 fields | Not granted / unverified |
| Contacts | Visible, viewable, API-supported | 60 fields | Not granted / unverified |
| Leads | Visible, viewable, API-supported | 55 fields | Not granted / unverified |
| Deals | Visible, viewable, API-supported | 28 fields | Not granted / unverified |
| Tasks | Visible, viewable, API-supported | 21 fields | Not granted / unverified |
| Events (Meetings), Calls | Visible, viewable, API-supported | Not requested | Not granted / unverified |

Other visible/API-supported metadata included Products, Quotes, Sales_Orders, Purchase_Orders, Invoices, Campaigns, Vendors, Price_Books, Cases, Solutions, Visits and internal/item modules listed in `zoho-audit-2026-10-31.json`. Hidden/non-viewable/non-API modules are excluded by the adapter. **Metadata visibility does not authorize Zippy record reads or imply Xano order/finance integration.** No production module selector was enabled.

## Gateway and frontend changes

- Reused `server/gateway.mjs` and the existing `/api/crm/modules`, `/api/crm/records`, `/api/crm/record` contracts. No additional proxy or operational provider route.
- Every CRM request revalidates trusted Xano identity; only active `super_admin` / `operations_admin` can proceed through the independent Zoho release gate and server-controlled grants.
- Validates grant structure and limits (20 modules/Admin, 1,000 explicit IDs/module, 50 fields). Foreign IDs and ungranted modules are denied before Zoho retrieval. Unexpected/duplicate browser query parameters are refused.
- Calls v8 field metadata before record retrieval. Hidden, missing or API-restricted fields deny the read. Returned records must match the requested ID; only approved scalar fields are projected; nested lookup data is null. Grant changes during requests discard the result.
- Preserves server-only token caching, coalesced refresh, early expiry and one 401 refresh retry; strengthens exact regional host pairing. Redirects are rejected; requests have finite deadlines. Errors are sanitized; 429 honors a bounded cooldown.
- `/api/status` separates configuration, operator release authorization and successful **authenticated module metadata** verification. Public status never probes Zoho or reports verified CRM access. Metadata verification does not assert record-read permission or production acceptance.
- Fixed authenticated Admin wiring: `AdminRestricted` passes `preview={false}`. `Access.tsx` retains its trusted-session and workspace routing; customer and owner workflows are unchanged. Development CRM preview stays offline and no longer presents the obsolete historical 401 as current status.
- CRM UI provides dynamic module selection, current-page search, ten-record pagination, projected record detail, read-only indication, loading/empty/error states, manual refresh/retry and rate-limit cooldown. Superseded reads, sign-out and expiry cannot restore stale records. Revoked roles/grants clear records and module access.
- Zippy order links remain explicitly unavailable. Xano remains authoritative for logistics, dispatch, payments, POD and refunds.
- Added `scripts/verify-crm.mjs`: sanitized bounded verification through the existing gateway, without bypassing release/identity/grant checks or selecting a record automatically.

## Verification

| Check | Result |
|---|---|
| ESLint (`npm run lint`) | PASS |
| TypeScript + Vite (`npm run build`) | PASS |
| Mocked server unit tests (`npm run test:server`) | **45 passed, 0 failed** |
| Playwright Microsoft Edge (`npm test`) | **45 passed, 0 failed**; includes 16 CRM browser tests, existing booking/owner regressions and accessibility checks |
| Browser artifact credential-contract scan | PASS; no private credential values available for exact-value scan |
| Live MCP metadata | PASS; organization, modules, five field-metadata responses |
| Exact REST gateway probe | BLOCKED safely; no upstream calls |
| Live explicitly authorized record read | BLOCKED; zero attempted |

The initial browser run passed all new CRM tests and failed two legacy assertions expecting the superseded historical MCP 401 copy; those assertions were updated. An initial test-fixture TypeScript union mismatch was also corrected. Final result: **90 automated tests passed, zero failures**. Synthetic records are confined to test fixtures and are not operational configuration.

## Security and access-control matrix

| Scenario | Enforced result / evidence |
|---|---|
| Anonymous CRM request | 401; no upstream request |
| Customer/vendor/fleet-manager/driver | 403 from CRM; no Zoho access; CRM reader not mounted |
| Forged browser role/user/organization | Cannot override Xano identity or server grants |
| Admin without grants / revoked grants | 403; no record retrieval; in-flight revoked results discarded |
| Foreign record ID / ungranted module | 403 before Zoho retrieval |
| Unauthorized fields | Browser overrides rejected (400); hidden/missing/restricted metadata denied (403); extra response fields removed |
| Nested relationships | Redacted to null; no related-record traversal |
| Expired Zoho access token | Bounded refresh and one retry; OAuth remains server-only |
| Refresh-token failure / wrong region | Sanitized 503; no token sent to wrong host |
| Provider 401/403 | At most one refresh retry for 401; sanitized 403 after denial |
| Provider 404 / empty record | Sanitized unavailable response; no fabricated record |
| Provider 429 | Bounded Retry-After; server cooldown and manual-only UI retry |
| Timeout / malformed provider payload | Sanitized failure (503 / 502); no successful/empty fallback |
| Xano session expiry | 401 ends session; clears protected UI and cancels outstanding requests |
| Revoked Admin role | Next read denied; module selector and prior records removed |
| CRM mutations | Rejected; no create/update/delete/import/email/workflow route |
| Xano finance/dispatch/POD/refund operations | Uncontracted routes denied; customer bookings still deny Admin/owner roles |

## Remaining release blockers

1. Supply REST client ID/secret/refresh token and confirmed regional Accounts URL **server-side**, without printing or committing values. Verify minimum scopes and that the token belongs to the intended organization.
2. Complete trusted Xano authentication/security publication and independent positive/negative live validation; `XANO_AUTH_RELEASE` remains blocked. Existing Xano concerns in `XANO.md` were not resolved by this CRM change.
3. Supply actual approved `CRM_READ_GRANTS_JSON` entries: trusted Xano Admin user ID → permitted module → separately approved record IDs and field names. No real IDs have been invented.
4. Supply an approved test-admin session and explicit test module/record selection. Run bounded read-only verification through this exact gateway in an appropriately approved local/staging release context. Capture successful refresh, module metadata, field metadata and granted-record evidence, including denial cases. Keep production blocked.
5. Record live authorization/regression evidence and obtain separate production release approval. Neither an environment variable, OAuth metadata success nor these mocks is sufficient to enable production.
6. Order/CRM association needs a separately verified object-authorization contract; it stays unavailable.

Changes are intended for a **local commit only** on the existing feature branch. No merge, push, deployment, release-flag activation, Xano schema change or live business-data modification is part of this delivery.

## Official API references

- [v8 OAuth refresh](https://www.zoho.com/crm/developer/docs/api/v8/refresh.html)
- [v8 modules](https://www.zoho.com/crm/developer/docs/api/v8/modules-api.html)
- [v8 field metadata](https://www.zoho.com/crm/developer/docs/api/v8/field-meta.html)
- [v8 record GET](https://www.zoho.com/crm/developer/docs/api/v8/get-records.html)
