# API integration and authorization

## Repository / document audit

- Worktree: `C:\Users\ashok\Documents\GitHub\zippy-frontend-polish`, branch `feat/frontend-tailwind-polish`, starting revision `223bae3`.
- Remote: `Gopi-git-bit/Xano-Synthentic-Prototype`. `frontend/` is the existing React subproject. Historical **New-logistic is a separate repository**; no local checkout was found, and the GitHub lookup timed out. Its contents are not claimed as inspected.
- No applicable `AGENTS.md` or approved logistics PRD exists in this checkout.
- Reviewed `customer app.pdf`, `driver app.pdf` and the Locus design summary in Downloads. Historical documents contain contradictory percentages/timeouts and proposed lifecycle contracts. They inform UI workflows, not executable pricing/policy.
- The existing compiled Tailwind v4 setup and useful components were continued. No Xano source was modified.
- Private provider configuration is outside this repository. Names/presence were inspected without printing values. The configured Zoho item is an MCP URL, not REST OAuth credentials.

## Verified source contracts wired through the adapter

| Browser → server | Server → verified Xano path | Contract |
|---|---|---|
| `POST /api/auth/login` | `POST {XANO_AUTH_BASE_URL}/auth/login` | email/password → authToken |
| `POST /api/auth/signup` | `POST …/auth/signup` | name/email/password → authToken; Xano creates **member**, never accepts browser role |
| `GET /api/auth/me` | `GET …/auth/me` | Bearer token → id/name/email/role |
| `GET /api/status` | None | Configuration booleans only |

Sources: `api/authentication/auth_login_POST.xs`, `auth_signup_POST.xs`, `auth_me_GET.xs`; role helper supports **admin/member only**. No deployed URL, credentials or test account was supplied. These are implemented and mock-tested adapters, not proven live connections.

Xano tokens are held in browser memory only, sent in Authorization headers to same-origin API calls, and cleared on sign-out/401. No credentials are placed in query strings, local storage or logs. Reload signs out. Authentication failures and timeouts do not produce success UI. Tokens are revalidated through Xano `auth/me` on every CRM operation.

## CRM adapter: read-only, fail closed

`GET /api/crm/modules`, `/api/crm/records?module=…&page=…`, `/api/crm/record?module=…&id=…` are **new frontend server-runtime routes**, not invented Xano endpoints.

Authorization order:
1. Validate the Bearer token through Xano.
2. Require exact authenticated `role: admin`.
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

Zoho's modules are discovered at runtime; Contacts/Accounts/Leads/Tasks/Calls/Meetings are not fabricated as available. Any actual granted module can be rendered. Fields and available modules are determined by configuration plus provider permissions. Related Zippy order links are unavailable because no authorized mapping or order-read API exists; no unscoped link is generated.

OAuth refresh uses the configured regional Accounts domain. Access token/API domain remain server-only, refresh requests are coalesced, tokens expire early in cache, and 401 retries refresh once. API domains are allowlisted before transmitting tokens. Redirects are rejected. Rate-limit responses carry a bounded Retry-After and suspend further CRM calls in that process; there is no automatic retry storm. Upstream bodies/credential errors are sanitized. Serverless instances have independent caches and rate-limit windows; provider limits remain authoritative.

CRM writes are rejected with 405. No synchronization/creation is implemented, so no duplicate records can be created by this adapter. Orders, payments, POD, consent, refunds and holds are never updated from Zoho.

## Missing operational contracts

| Area | Precise missing contract / current behavior |
|---|---|
| Workspace grants | Customer/Vehicle Owner capabilities, owner/driver relationships, assigned order/vehicle IDs and field-level financial grants. Production member role is not guessed into either workspace. |
| Profile / company | Profile persistence, organization membership, preferred destination, driver/vehicle documents and verification. Preview forms only. |
| Catalog / addresses | Final vehicle IDs/capacity/body compatibility, location search/pins/routing. Reference vehicle labels and local cities only. |
| Quote / booking | Quote ID/version/expiry, breakdown, tax, policy-eligible full/partial/ToPay plans, IST schedule validation, idempotent booking acceptance. Draft only; no percentages invented. |
| Order / cancellation | Canonical enums, authorized listing/detail, cancellation eligibility/fees, request acceptance and audit. Local requests never cancel trips. |
| Matching / availability | Eligible offers, authoritative expiry, accept/decline/idempotency, assignment and persisted availability. Explicit local response drafts only. |
| Trip / tracking | Allowed next actions, milestone command/version, location timestamps, ETA source and stale/offline thresholds. Illustrative map only. |
| Evidence / POD | Signed upload URL, MIME/content/size verification, submission record, recipient confirmation, review/correction and audit. File selection is local; no upload or verification. |
| Payments / invoices | Attempt ledger, verified provider events, collections, balances, reconciliation, ToPay consent, invoice access and authorized settlement history. UI states are separate sample records. |
| Exceptions | Scoped holds/release conditions, evidence channels, human refund approval, confirmation and audit persistence. Execution disabled. |
| Messaging / agents | Support/notifications/announcements delivery and five-agent evidence feed. Local drafts; no broadcasts or synthetic agent activity. |

UI labels in `src/types.ts`/fixtures are **presentation models, not approved backend enums**. No operational API is exposed until its contract and object-level authorization are verified. Unknown routes are rejected, including guessed payment/refund endpoints.

## Connectivity evidence

`docs/zoho-connectivity.json`: read-only MCP initialization on 2026-10-27 returned **401**, with zero tools/modules discovered. No customer CRM records were read or modified. REST OAuth was not attempted because client ID, secret and refresh token were missing. A configured URL alone is not a working integration.
