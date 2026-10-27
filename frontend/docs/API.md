# API integration and authorization

## Repository / document audit

- Worktree: `C:\Users\ashok\Documents\GitHub\zippy-frontend-polish`, branch `feat/frontend-tailwind-polish`, starting revision `223bae3`.
- Remote: `Gopi-git-bit/Xano-Synthentic-Prototype`. `frontend/` is the existing React subproject. Historical **New-logistic is a separate repository**; no local checkout was found, and the GitHub lookup timed out. Its contents are not claimed as inspected.
- No applicable `AGENTS.md` or approved logistics PRD exists in this checkout.
- Reviewed `customer app.pdf`, `driver app.pdf` and the Locus design summary in Downloads. Historical documents contain contradictory percentages/timeouts and proposed lifecycle contracts. They inform UI workflows, not executable pricing/policy.
- The existing compiled Tailwind v4 setup and useful components were continued. No Xano source was modified.
- Private provider configuration is outside this repository. Names/presence were inspected without printing values. The configured Zoho item is an MCP URL, not REST OAuth credentials.

## Discovered contracts and release-gated adapter

Current deployment evidence and exact publication blockers: [Xano discovery](XANO.md). Workspace **3**, live branch **v1**, has published logistics placeholders and substantive unpublished drafts. These are different from the old local checkout. No backend changes were made; publication remains with the user.

| Browser → server | Server → verified Xano path | Contract |
|---|---|---|
| `POST /api/auth/login` | `POST {XANO_AUTH_BASE_URL}/auth/login` | email/password → authToken |
| `POST /api/auth/signup` | `POST …/auth/signup` | name/email/password → authToken; Xano creates **member**, never accepts browser role |
| `GET /api/auth/me` | `GET …/auth/me` | Bearer token → validated active identity, system role and organization |
| `GET /api/bookings` | `GET {XANO_LOGISTICS_BASE_URL}/bookings` | Customer-only, tenant-scoped bounded page; projected scalar fields |
| `GET /api/bookings/{id}` | `GET …/bookings/{id}` | Authorized matching ID/organization; read-only state and hold/cargo counts |
| `GET /api/status` | None | Configuration and release-availability booleans; not a live health probe |

Sources: separately pulled published/draft workspace snapshots and authenticated Metadata API OpenAPI, recorded in `XANO.md`. Actual bases are now located. No approved positive-auth test account is available; authentication and booking read adapters are **mock-tested, gated, not verified positive live workflows**.

`XANO_AUTH_RELEASE=verified` is required before any credential/token request reaches Xano. Default `blocked` protects against the observed old auth logger. Login/signup validate `auth/me` before releasing a session. Legacy `role: admin/member` never grants workspace access. Active `super_admin`/`operations_admin` map to restricted Admin, `customer_admin`/`customer_member` to customer, and `vendor_admin`/`fleet_manager`/`driver` to owner. Non-Admin identity requires an organization ID; published membership guards must still validate it for each operation. Unknown roles/statuses fail closed.

Booking reads also require `XANO_BOOKING_READS_RELEASE=verified`. Only customer roles may use them; driver/vendor/Admin reads are denied pending their own authorized contracts. Browser organization overrides are rejected. Pagination/status inputs are bounded; all records must match the authenticated organization. Null, malformed pages, unknown booking states and mismatched detail IDs return errors, never empty-success UI. Raw contacts, nested financial fields and provider `allowed_actions` are not passed through. Booking mutations always return `BOOKING_WRITES_PENDING`; this increment has no write-release flag. Trip/POD/settlement endpoints remain unwired.

Xano tokens are held in browser memory only, sent in Authorization headers to same-origin API calls, and cleared on sign-out/401. No credentials are placed in query strings, local storage or logs. Reload signs out. Authentication failures and timeouts do not produce success UI. Tokens are revalidated through Xano `auth/me` on every protected operation. Failed booking reads clear displayed results rather than retaining stale authorized data.

## CRM adapter: read-only, fail closed

**Unavailable in the current UI and preview.** `ZOHO_READ_RELEASE` defaults to `blocked`, before any provider request. The earlier reader implementation and mock coverage are retained for later review, but no troubleshooting or live Zoho calls were performed in this increment. The following describes the dormant adapter, not a verified integration. MCP HTTP 401 and missing REST OAuth credentials are independent blockers.

`GET /api/crm/modules`, `/api/crm/records?module=…&page=…`, `/api/crm/record?module=…&id=…` are **new frontend server-runtime routes**, not invented Xano endpoints.

Authorization order:
1. Validate the Bearer token through Xano.
2. Require active authenticated `system_role: super_admin/operations_admin` and the independent server release gate.
3. Require server-only per-user `CRM_READ_GRANTS_JSON`.
4. Validate requested module/record IDs and fields against grants.
5. Intersect grants with Zoho's actual module metadata (`api_supported`, `viewable`, `visible`).
6. Request only authorized IDs; project only allowlisted scalar fields. Nested lookup objects are not passed through.

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

Default `{}` denies everything. Admin alone does not grant tenant-wide CRM access. Grants belong to one configured tenant and must be maintained by the server operator; there is no client self-grant flow. For larger deployments, replace static grants with an approved authoritative CRM access/link service. Do not introduce wildcard grants or unscoped tenant reads.

### Pagination and limitations

The MVP pages **explicitly granted IDs** in groups of 10, fetching each using Zoho's record-by-ID endpoint. It does not enumerate the tenant-wide list and filter afterward. `nextPage` describes authorized IDs only; no raw provider page token is exposed. Reads are sequential and bounded. Search filters the current authorized page, clearly labelled in UI. Global CRM search and activity relationship joins remain pending approved scopes/contracts.

When separately released, Zoho's modules are discovered at runtime; Contacts/Accounts/Leads/Tasks/Calls/Meetings are not fabricated as available. Fields and modules are determined by configuration plus provider permissions. Related Zippy order links remain unavailable because no authorized CRM-to-booking mapping contract exists; no unscoped link is generated.

OAuth refresh uses the configured regional Accounts domain. Access token/API domain remain server-only, refresh requests are coalesced, tokens expire early in cache, and 401 retries refresh once. API domains are allowlisted before transmitting tokens. Redirects are rejected. Rate-limit responses carry a bounded Retry-After and suspend further CRM calls in that process; there is no automatic retry storm. Upstream bodies/credential errors are sanitized. Serverless instances have independent caches and rate-limit windows; provider limits remain authoritative.

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

`docs/zoho-connectivity.json`: read-only MCP initialization on 2026-10-27 returned **401**, with zero tools/modules discovered. No customer CRM records were read or modified. REST OAuth was not attempted because client ID, secret and refresh token were missing. A configured URL alone is not a working integration.
