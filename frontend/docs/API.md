# API integration and authorization

## Repository / document audit

- Worktree: `C:\Users\ashok\Documents\GitHub\zippy-frontend-polish`, branch `feat/frontend-tailwind-polish`, starting revision `223bae3`.
- Remote: `Gopi-git-bit/Xano-Synthentic-Prototype`. `frontend/` is the existing React subproject. Historical **New-logistic is a separate repository**; no local checkout was found, and the GitHub lookup timed out. Its contents are not claimed as inspected.
- No applicable `AGENTS.md` or approved logistics PRD exists in this checkout.
- Reviewed `customer app.pdf`, `driver app.pdf` and the Locus design summary in Downloads. Historical documents contain contradictory percentages/timeouts and proposed lifecycle contracts. They inform UI workflows, not executable pricing/policy.
- The existing compiled Tailwind v4 setup and useful components were continued. No Xano source was modified.
- Private provider configuration is outside this repository. Names/presence were inspected without printing values. The configured Zoho item is an MCP URL, not REST OAuth credentials.

## Discovered contracts and release-gated adapter

Current versioned evidence and remaining dependencies: [alignment 0.1.0](../../contracts/backend-frontend/0.1.0/README.md). Retained workspace **3** / **v1** published source contains hardened auth/customer readers; mutations are empty stubs and signup refuses. Drafts and recovery proposals are not a release. Positive runtime acceptance remains blocked.

| Browser → server | Server → verified Xano path | Contract |
|---|---|---|
| `POST /api/auth/login` | `POST {XANO_AUTH_BASE_URL}/auth/login` | email/password → authToken |
| `POST /api/auth/signup` or `/api/auth/register` | None | Always local 503 `REGISTRATION_PENDING`, even when login is released; no account/session creation |
| `GET /api/auth/me` | `GET …/auth/me` | Bearer token → validated active identity, system role and organization |
| `GET /api/bookings` | `GET {XANO_LOGISTICS_BASE_URL}/bookings` | Customer-only, tenant-scoped bounded page; projected scalar fields |
| `GET /api/bookings/{id}` | `GET …/bookings/{id}` | Authorized matching ID/organization; read-only state and hold/cargo counts |
| `GET /api/status` | Public: none. Authenticated Admin: `auth/me`, then release-gated Zoho v8 module metadata | Separate configuration, release authorization and per-request verified CRM availability; no record reads |

Sources: separately pulled published/draft workspace snapshots and authenticated Metadata API OpenAPI, recorded in `XANO.md`. Actual bases are now located. No approved positive-auth test account is available; authentication and booking read adapters are **mock-tested, gated, not verified positive live workflows**.

`XANO_AUTH_RELEASE=verified` is required before login or token validation reaches Xano. Default `blocked` remains until isolated runtime acceptance; retained published source fixes the older logger but does not prove persisted-log behavior. Login revalidates `auth/me` before releasing a session. Recovery registration `0.1.0-draft` is **NOT_DEPLOYED**, requires organization onboarding and returns no `authToken`; it is not adapted into login. Legacy `role: admin/member` never grants workspace access. Active `super_admin`/`operations_admin` map to restricted Admin, `customer_admin`/`customer_member` to customer, and `vendor_admin`/`fleet_manager`/`driver` to owner. Non-Admin identity requires an organization ID; published membership guards must still validate it for each operation. Unknown roles/statuses fail closed.

Booking reads also require `XANO_BOOKING_READS_RELEASE=verified`. Only customer roles may use them; driver/vendor/Admin reads are denied pending their own authorized contracts. Browser organization overrides are rejected. Pagination/status inputs are bounded; all records must match the authenticated organization. Null, malformed pages, unknown booking states and mismatched detail IDs return errors, never empty-success UI. Raw contacts, nested financial fields and provider `allowed_actions` are not passed through. Booking mutations always return `BOOKING_WRITES_PENDING`; this increment has no write-release flag. Trip/POD/settlement endpoints remain unwired.

Xano tokens are held in browser memory only, sent in Authorization headers to same-origin API calls, and cleared on sign-out/401. No credentials are placed in query strings, local storage or logs. Reload signs out. Authentication failures and timeouts do not produce success UI. Tokens are revalidated through Xano `auth/me` on every protected operation. Failed booking reads clear displayed results rather than retaining stale authorized data.

Session invalidation removes the authenticated workspace and rechecks `/api/status` before enabling credential entry. It handles non-JSON 401 responses as well as `IDENTITY_UNSUPPORTED` and `AUTH_RELEASE_PENDING` errors on authenticated requests. Object-level denial remains a read error rather than silently changing role. Requests capture a session version; sign-out cancels outstanding authenticated reads, and late responses cannot expose old records or invalidate a newer login.

The customer reader sends only `page` and optional canonical booking `status`. Changing status resets to page 1; refresh and explicit retry retain the requested page/filter. New reads supersede earlier ones. Empty-state copy appears only for a successful authorized empty page, never for timeout, denial or contract errors. `Retry-After` temporarily disables manual reads; expiry only re-enables controls and does not initiate requests or imply success. No search endpoint, financial permission or mutation is inferred from these read controls.

## CRM adapter: read-only, fail closed

**Wired and mock-verified; production release blocked.** The authenticated Admin now mounts the reader with `preview={false}`; development previews remain offline. The reader requests authenticated `/api/status` and then `/api/crm/modules` before rendering module selection. `ZOHO_READ_RELEASE` defaults to `blocked`. On October 31, MCP organization/module/field metadata calls succeeded, but REST credentials and explicit record grants were absent. See [current acceptance evidence](ZIPPY_ZOHO_CRM_FRONTEND_ACCEPTANCE.md). No live REST or real-record success is claimed.

`GET /api/crm/modules`, `/api/crm/records?module=…&page=…`, `/api/crm/record?module=…&id=…` are **new frontend server-runtime routes**, not invented Xano endpoints.

Authorization order:
1. Validate the Bearer token through Xano.
2. Require active authenticated `system_role: super_admin/operations_admin` and the independent server release gate.
3. Require server-only per-user `CRM_READ_GRANTS_JSON`.
4. Validate requested module/record IDs and fields against grants.
5. Intersect grants with Zoho's actual module metadata (`api_supported`, `viewable`, `visible`, visible status).
6. Before record retrieval, verify each granted field against `/crm/v8/settings/fields?module=…`: field presence alone is insufficient; require `visible: true` and no `private.restricted` flag.
7. Request only authorized IDs; project only allowlisted scalar fields. Nested lookup objects become null. Reject malformed or mismatched record responses. Recheck the grant configuration before reads and before releasing responses, including in-flight revocation.

Grant format (schema example only; no real records):

```json
{
  "<authenticated Xano user id>": {
    "<actual Zoho module api_name>": {
      "recordIds": ["<authorized numeric Zoho record id>"],
      "fields": ["<approved field API name>"]
    }
  }
}
```

Default `{}` denies everything. Missing required entries: approved active Xano Admin user ID, actual module API name, separately approved numeric test record IDs, and approved scalar field API names. None have been fabricated. At most 20 modules per Admin, 1,000 explicit IDs per module and 50 field names are accepted. Empty module/record grants return authorized empty results, never tenant-wide fallback. Admin alone does not grant tenant-wide CRM access. Grants belong to one configured tenant and must be maintained by the server operator; there is no client self-grant flow. For larger deployments, replace static grants with an approved authoritative CRM access/link service. Do not introduce wildcard grants or unscoped tenant reads.

### Pagination and limitations

The MVP pages **explicitly granted IDs** in groups of 10, fetching each using Zoho's record-by-ID endpoint. It does not enumerate the tenant-wide list and filter afterward. `nextPage` describes authorized IDs only; no raw provider page token is exposed. Reads are sequential and bounded. Search filters the current authorized page, clearly labelled in UI. Global CRM search and activity relationship joins remain pending approved scopes/contracts.

When separately released, Zoho's modules are discovered at runtime; Contacts/Accounts/Leads/Tasks/Calls/Meetings are not fabricated as available. Fields and modules are determined by configuration plus provider permissions. Related Zippy order links remain unavailable because no authorized CRM-to-booking mapping contract exists; no unscoped link is generated.

OAuth refresh uses the configured regional Accounts domain. Access token/API domain remain server-only, refresh requests are coalesced, tokens expire early in cache, and 401 retries refresh once. API domains must both be allowlisted and match the Accounts region (for India: `accounts.zoho.in` → `www.zohoapis.in`). Redirects are rejected. Each upstream request has a 12-second timeout; CRM work has a 15-second request budget. Rate-limit responses carry a bounded Retry-After and suspend further CRM calls in that process; there is no automatic retry storm. Upstream bodies/credential errors are sanitized. Serverless instances have independent caches and rate-limit windows; provider limits remain authoritative.

Public `/api/status` reports `crmConfigured` (complete OAuth configuration with valid Accounts host), `crmReleaseAuthorized` (server release marker), `crmConnectionVerified: false`, and `crmAvailable: false`. It does not probe Zoho. Authenticated Admin status additionally validates Xano identity/grants and performs an actual v8 module read when configuration and release checks pass. Only that successful response sets verified/available true. Failed authentication, permissions or provider reads return sanitized errors, not a cached success. This metadata result is not proof of record-read scopes or production acceptance; record routes revalidate module/field/object permissions independently on every request.

Required minimum REST scopes: `ZohoCRM.settings.modules.READ`, `ZohoCRM.settings.fields.READ`, and only the granted module scopes such as `ZohoCRM.modules.contacts.READ` or `ZohoCRM.modules.accounts.READ`. The MCP catalog's presence does not prove these REST token scopes. Neither metadata visibility nor OAuth token creation authorizes Zippy records. Keep release flags blocked until connection, authorized test-record reads, trusted Xano identity/security checks and regressions have separate recorded evidence and the operator approves release.

Run `npm run verify:crm -- <private-env-file-path>` for a bounded, sanitized check through this exact gateway. It uses an existing `ZIPPY_TEST_ADMIN_TOKEN`; it never performs login/signup, overrides gates, selects records automatically or logs tokens. `ZOHO_TEST_MODULE` and `ZOHO_TEST_RECORD_ID` must name a separately approved record already present in that Admin's grants. It runs module metadata, then field metadata and at most one record read. The probe always leaves production blocked; an operator must evaluate evidence separately. Without credentials/grants/session it reports blocked and makes no provider calls.

CRM UI search is local to the visible authorized page. Pagination/refresh/retry retain request context; failures clear records/details, denials remove module access, and session expiry unmounts the workspace. Superseded and signed-out requests cannot reintroduce old data. Rate-limit timers only re-enable manual controls. A11y checks cover module selection and mobile layout. Xano order relationships remain explicitly unavailable.

CRM writes are rejected with 405. No synchronization/creation is implemented, so no duplicate records can be created by this adapter. Orders, payments, POD, consent, refunds and holds are never updated from Zoho.

## Operational readiness

| Area | Precise missing contract / current behavior |
|---|---|
| Workspace grants | System roles/membership are present in draft security code, not the live identity projection/guards. Owner/driver assigned order/vehicle IDs and financial grants are still uncontracted. |
| Profile / company | Profile persistence, organization membership, preferred destination, driver/vehicle documents and verification. Preview forms only. |
| Catalog / addresses | Final vehicle IDs/capacity/body compatibility, location search/pins/routing. Reference vehicle labels and local cities only. |
| Quote / booking | Draft create/quote/accept/confirm contracts located; published endpoints are placeholders. Production writes blocked. Demo form is not mapped blindly to structured addresses/cargo/window inputs. No percentages invented. |
| Order / cancellation | Draft enums/list/detail/cancel contracts located. Gated read-only adapter prepared; live success unverified. Cancellation execution disabled. |
| Matching / availability | Eligible offers, authoritative expiry, accept/decline/idempotency, assignment and persisted availability. Explicit local response drafts only. |
| Trip / tracking | Allowed next actions, milestone command/version, location timestamps, ETA source and stale/offline thresholds. Illustrative map only. |
| Evidence / POD | Signed upload URL, MIME/content/size verification, submission record, recipient confirmation, review/correction and audit. File selection is local; no upload or verification. |
| Payments / invoices | Payment selection and consent routes located as unpublished implementations. Collection/provider verification, reconciliation, invoice/refund/settlement APIs were not found. UI states are separate sample records. |
| Exceptions | Hold/release/resume routes located with unpublished implementations. Evidence and human refund execution contracts remain unverified; all mutations disabled. |
| Messaging / agents | Support/notifications/announcements delivery and five-agent evidence feed. Local drafts; no broadcasts or synthetic agent activity. |

UI labels in `src/types.ts`/fixtures are **presentation models, not backend enums**. The new read projection uses discovered lowercase Xano lifecycle values without translating POD or payment into booking success. Unknown routes are rejected, including guessed payment/refund endpoints.

## Connectivity evidence

`docs/zoho-connectivity.json` preserves the historical October 27 MCP 401. `docs/zoho-audit-2026-10-31.json` records the current successful MCP metadata reads and independently blocked REST/real-record checks. No customer CRM records were read or modified. A connected MCP or configured URL alone is not a working frontend REST integration.
