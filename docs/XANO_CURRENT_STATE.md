# Xano current state — 29 October 2026

**Workspace 3 is authenticated and identified. Published auth and customer booking reads are materially safer than the October 27 snapshot. Runtime acceptance remains incomplete; booking mutations are empty stubs.**

## Identity, revision and evidence boundary

| Item | Observed value / status |
|---|---|
| Repository | `Gopi-git-bit/Xano-Synthentic-Prototype` |
| Review branch / exact base | `codex/xano-m1-reconciliation-20261029` / `ed62038f571c02f339972ad7ec5d7cd1a9cffe18` |
| Inspected frontend | `feat/frontend-tailwind-polish`, local `35461bd62bfd90b6f7e901791aa3d097b6649ead`; clean |
| User-reported frontend | `8eeef1e0cdca218f8bdf17f792f3b2cb6b68937b` — **BLOCKED** remote verification (GitHub transport resets; CLI unauthenticated) |
| Preserved application checkpoint | `00d9ef35eb4eb2688eeea290eb412320e0b50366` |
| Instance | `https://xynd-fnea-khtp.n7e.xano.io`, instance ID **9940** |
| Workspace | **3**, **Zippy Synthetic Prototype_1**; only workspace in returned accessible list |
| Branch / data source | **v1**, `live:true`; corrected data-source GET returns **label `live`** |
| Metadata identity | **VERIFIED**, principal **178782**, role `admin`; `/api:meta/auth/me` 200 |
| Permissions | Broad metadata scope, including `workspace:datasource:live=15`; expiry `never`. **BLOCKED** restricted-access/live-denial proof |
| Synthetic environment | **BLOCKED**: no verified isolated expiring target; tenant/ephemeral lists empty; no approved application accounts/fixtures available |

Evidence root: [`backend/reconciliation-20261029/evidence`](../backend/reconciliation-20261029/evidence). Raw external capture: `C:\Users\ashok\AppData\Local\Temp\opencode\zippy-m1-reconciliation-20261029`. Metadata capture began at `2026-10-29T08:26:39Z`; application denial probes at `08:36:13Z–08:36:15Z`.

Status meanings throughout these reports: **VERIFIED** = observed within the stated source/offline/HTTP scope; **FAILED** = executed assertion failed; **BLOCKED** = unmet prerequisite; **NOT RUN** = no execution; **NOT IMPLEMENTED** = required implementation absent from current published source. Source verification is not runtime acceptance.

No application records or environment values were requested. Metadata credentials were loaded in memory and never sent to application routes. No Xano preview/import/publication/write, operational agent run, payment, notification or production configuration change occurred.

## Published versus draft

- **VERIFIED:** each code-only export contains **84 definitions**: 33 tables, 23 queries, 19 functions, 3 API groups, and one each workspace/addon/agent/MCP server/middleware/tool.
- **41 definitions differ** between current published and draft exports. Full keys and hashes: [`published-draft-diff.json`](../backend/reconciliation-20261029/evidence/published-draft-diff.json).
- Published normalized inventory SHA-256: `7b06e6a779037407224fb357d2cfb1133d251f1ce0104d717ff0b74b6312c374`.
- Draft normalized inventory SHA-256: `535399c4c635b3ba2eec841e885fd7e09a73a4cc550798eb9061b91b543d85e5`.
- Comparing GUID-matched October 27 published sources finds **16 changed definitions**: three groups, logging, context/authorization, login/me/signup, both readers, event reader, notification and three recovery endpoints. `chatgpt` lacks a GUID match in that older capture; the workspace has no GUID. This comparison does not identify who published changes or when.
- Drafts are not a safe next release: they restore broader projections, shallow log redaction, onboarding/recovery side effects and incomplete mutations. Current draft login also declares `auth = "user"`; do not overwrite published login with it.

## API inventory (published source)

| Group | ID / canonical | Endpoints and source state |
|---|---|---|
| Authentication | 5 / `pofBqnrY` | POST `auth/login`; GET `auth/me`; POST `auth/signup`; GET `reset/request-reset-link`; POST `reset/magic-link-login`; POST `reset/update_password`; POST `message/send_welcome_email`; POST `chatgpt` |
| Zippy_V1 | 7 / `zippy-v1` | GET `bookings`, GET `bookings/{booking_id}`; 12 mutation routes below |
| Event Logs | 6 / `h1FBhliB` | GET `logs/user/my_events` |

All 12 published Zippy mutation handlers have an empty input/stack, no `auth` declaration and `response = null`: POST `bookings`; PATCH `bookings/{booking_id}`; POST suffixes `/cancel`, `/confirm`, `/consent-attempts`, `/holds`, `/holds/{hold_id}/release`, `/payment-selection`, `/quotes`, `/quotes/{quote_id}/accept`, `/resume`; POST `consent-attempts/{attempt_id}/decision`.

**FAILED** explicit-refusal source gate on all 12. **NOT IMPLEMENTED** published command behavior. Their HTTP status is **NOT RUN**; `null` source must not be reported as a verified 403 or successful operation. The local candidate adds explicit refusal; it is not deployed.

## Authentication and logging

**VERIFIED — published source:**

- Login requires email/password; password input is sensitive. It selects only `id,password,status`, checks the password and explicitly active status, resolves current backend context, then issues a token with empty extras. It logs only user ID and the action `login`.
- `Quick Start/log_event` ignores supplied metadata, allowlists actions, writes `metadata:{}` and returns null. It is the only observed published `db.add event_log`; login is its only published caller. No password/hash/token/reset credential/sensitive user object is written to this application-event path.
- `auth/me` is side-effect-free and calls `security/resolve_context` every time. It projects `id,name,email,system_role,status,active_organization_id` only.
- Context requires an active existing user and supported **database** system role. It resolves an active organization and active membership, rejects invalid explicit organization selectors, and derives customer-read capability from system role, organization type and membership role. Platform admins may resolve without an organization but do not gain customer-reader permission.
- Signup and all three recovery endpoints unconditionally fail closed before effects; welcome notification also refuses. API groups declare `history = 0`.
- Event reader requires current active context, scopes by user ID, allowlists event names and returns only ID/time/action; historical metadata is not projected.

**BLOCKED:** approved/suspended synthetic login and persisted-log assertions. Existing historical log contents, platform debug/history storage and retention are not inspected or certified. `history=0` and sensitive input declarations do not prove historical purging. The unused published `generate_magic_link` helper still queries a full user and writes a reset token; no published caller was found. It is not a reviewed recovery implementation. Legacy `enforce_role` is also unused by the readers.

## Customer booking reads

**VERIFIED — source:** both GETs require `auth="user"` and current `can_read_bookings`. List scopes organization and optional status together in the database predicate, uses deterministic descending created-at/ID order, and bounds page 1–10000 and per_page 1–100. Detail scopes booking ID **and organization before retrieval**, uses one `Booking not found.` failure for no scoped match, then reauthorizes. Cargo/active-hold projections contain IDs only. Booking projection contains nine fields, including organization ID, listed in the frontend handoff. Detail actions are empty.

**VERIFIED — HTTP:** eight anonymous/malformed-bearer probes of `auth/me`, list, detail `/1`, and filtered/page-2 list all returned **401**, `{code:string,message:string}`, code `ERROR_CODE_UNAUTHORIZED`. `/1` was an auth-denial path, not an approved fixture or successful record read.

**BLOCKED:** authorized A/B tenant tests, inactive membership/status and missing-versus-foreign response comparison with valid identities. Source scopes support the intended design; runtime tenant isolation is not yet accepted. Empty `Zippy_request_guard` (`exception_policy="silent"`) supplies no demonstrated protection; observed protections reside in endpoint/helper code. No binding in captured source establishes a global guard.

## Complete metadata table inventory

**VERIFIED:** metadata list page 1, `nextPage:null`, **33 tables**; code export also has 33. IDs below are metadata IDs, not a physical catalog reconciliation.

| ID | Table | ID | Table | ID | Table |
|---:|---|---:|---|---:|---|
| 8 | active_assignment_reservations | 9 | agent_decision | 10 | agent_execution |
| 11 | approval_request | 12 | audit_log | 37 | booking_quote |
| 13 | cargo_detail | 14 | compliance_documents | 15 | customer_booking |
| 16 | driver_profile | 17 | durable_tasks | 6 | event_log |
| 18 | event_outbox | 19 | idempotency_key | 20 | incident_dispute |
| 21 | order_holds | 23 | organization | 22 | organization_member |
| 24 | otp_challenges | 25 | payment_transaction | 26 | pricing_policies |
| 27 | proof_of_delivery | 28 | refund_request | 29 | route_cache |
| 30 | settlement | 7 | table_index | 31 | topay_consent_attempts |
| 32 | tracking_event | 34 | trip | 33 | trip_stop |
| 5 | user | 36 | vehicle | 35 | vehicle_availability |

[`table-inventory.json`](../backend/reconciliation-20261029/evidence/table-inventory.json) retains GUIDs/index metadata; full field definitions are in the snapshots. Membership declares unique `(organization_id,user_id)`; reservation declares unique `claim_id` only, ordinary vehicle/driver indexes. Idempotency declares unique `key`. These declarations are not physical `valid/ready/unique` proof or concurrency evidence. `table_index` is just a listed table; its records were not read.

**BLOCKED:** physical table/catalog inventory, physical constraint validity, orphan reconciliation and restricted catalog access. Workspace-1's 51/53 discrepancy cannot be compared directly to these 33 declarations.

## Tests, tasks, agents and exposure

Workflow-test, scheduled-task, table-trigger and agent-trigger inventories are empty. Published `tests/run_p2_suite` is an empty function; its draft returns 24 static result objects and hardcoded `passed_count:22`. **NOT IMPLEMENTED** executed assertions; those labels are not tests.

Current published/draft exports contain one **Xano Example Agent**, one MCP server `Xano-Synthetic-Prototype`, and tool `search_xano_docs`. Both agent and MCP bind only that documentation-search tool, which calls `https://docs.xano.com/mcp`. MCP descriptive text mentions payments/messages but does not implement them. `chatgpt` is an authenticated external GET to a fixed OAuth client-description URL, not a five-agent command gateway. All operational agent/tool executions and MCP transport tests are **NOT RUN**. Five planned business agents are **NOT IMPLEMENTED in workspace 3**; historical workspace-1 drafts remain reference evidence.

Next priorities and proof requirements: [M1 reconciliation](XANO_M1_RECONCILIATION.md). Exact executed commands: [test evidence](XANO_BACKEND_TEST_EVIDENCE.md).
