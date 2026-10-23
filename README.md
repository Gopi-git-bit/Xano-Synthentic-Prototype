> Current M1 status (24 October 2026): [full gated execution preparation](docs/XANO_EXECUTION_PREPARATION_V3.md) and [submitted support request](docs/XANO_ADMIN_SUPPORT_REQUEST.md). 184 offline checks; hosted execution remains 0/31. Restricted access and supported inventory/writer enforcement remain prerequisites.

# Zippy Synthetic Prototype — Xano backend

Current M1 follow-up: [approved reservation revision, native preview and remaining gates](docs/XANO_RESERVATION_REVISION.md). Eight revised-set candidates plus the proposed table passed preview; 161 M1 offline checks pass. Hosted M1 remains **0/31 executed**. No schema/backfill was applied and no release/reuse support is claimed.

This repository contains the Xano sandbox implementation of Zippy Logistics. **It is not production-ready and has not been promoted to the live branch.**

## Resumed sandbox work

The owner-review pause is cleared. The coordinate validator is fixed and 133 fresh native predicate checks pass; staging remains blocked by database, HTTP, security and recovery requirements. See [audit resumption and retained evidence](docs/AUDIT_RESUMPTION.md). No live promotion occurred.

## Five-agent sandbox drafts

OMS, IMS, TMS, Verification and Finance/Compliance are saved as unconnected sandbox configurations. No model runs or operational tools are enabled by this work. See [configuration, tests and unresolved decisions](docs/FIVE_AGENT_CONFIGURATION.md). The supplied 70 acceptance scenarios remain unrun.

## Current implementation

| Component | Reviewed snapshot |
| --- | --- |
| Target | Workspace 1, Zippy Synthetic Prototype; branch v1 |
| Deployment | Sandbox only; refreshed export and payment tests dated 2026-10-22 |
| Operational database | 49 tables, 476 mapped fields, plus two starter tables |
| Logistics functions | Eight domain predicates, identity adapter, auth helpers and internal Slice1 prototypes |
| Logistics APIs | GET api/v1/health, GET api/v1/accounts/me, GET api/v1/orders |
| Domain checks | 49 local cases; 16 fresh Xano payment tests pass; original 41-pass report retained as historical |

The authenticated routes are syntax-checked implementations. Their runtime authorization and tenant-isolation behavior still need proof. The health response is static and does not establish database readiness.

## Repository layout

- `backend/xano/`: complete final sandbox export captured by the build, including starter resources. This is the reviewed implementation snapshot.
- `backend/contracts/`: deterministic JavaScript predicates, test cases, and the canonical SQL-to-Xano field/control map.
- `backend/evidence/`: historical structured build and test reports; these are not fresh live checks.
- `docs/BUILD_STATUS.md`: original build scope, limitations, and remaining implementation.
- `docs/REVIEW.md`: independent review findings and release blockers.
- `scripts/validate-backend.cjs`: offline contract, exported-predicate, and field coverage checks.
- `.github/workflows/backend-validation.yml`: automatic offline checks on pushes and pull requests.
- `.github/dependabot.yml`: weekly GitHub Actions dependency update configuration.
- `workspace/zippy_synthetic_prototype/`: pre-existing October 19 export retained for history. Do not combine it with the newer snapshot or treat it as the current implementation.

## Validate locally

Install Node.js 22 or newer, then run from the repository root:

```powershell
node scripts/validate-backend.cjs
```

No npm dependencies, Xano credentials, or database access are needed. This executes the supplied 49 cases against both the shared predicates and JavaScript embedded in the exported Xano functions, and checks 49 tables/476 field names and types. It does not validate the complete XanoScript grammar or prove database constraints, transactions, authentication, HTTP behavior, or deployment.

## Work with Xano

Use a locally authenticated Xano CLI profile targeting workspace 1 and the intended development branch. Keep tokens in local credential storage/environment variables, never GitHub files. Codex MCP uses the saved `XANO_MCP_TOKEN` environment variable; the token is not part of this repository.

Before any import, inspect the current remote workspace and compare it with this historical snapshot. Follow the sandbox workflow: preview the proposed diff, push to an isolated sandbox, run Xano validation and unit tests, review the actual changes, and promote only after the release blockers are addressed and the owner authorizes promotion. CLI syntax depends on the installed version; check `xano sandbox --help`. Automatic CI never imports or promotes. A separately authorized manual workflow performs bounded read-only Xano metadata checks.

Operational identities require an authorized provisioning process that binds `accounts.external_subject` to `xano:<authenticated user id>`, an active account, and valid role memberships. Starter-user role fields must not grant operational access.

## Remaining backend and database work

Booking transactions, idempotency/replay, controlled order transitions, atomic dispatch, signed payment webhooks, durable workers, and provider integration are incomplete. SQL foreign keys, CHECK constraints, RLS, partial indexes, append-only rules, and concurrency guarantees require explicit Xano equivalents and tests. Field parity alone does not implement these controls.

See [review findings](docs/REVIEW.md) before extending or deploying the build. The overpayment predicate is now corrected; provider integration remains incomplete.

## Specification provenance

Business rules were adapted from [New-logistic-](https://github.com/Gopi-git-bit/New-logistic-/tree/52ca43d8a2fb4f3d5d105dc6bb9f7420e5cfca26), revision `52ca43d8a2fb4f3d5d105dc6bb9f7420e5cfca26`. Its canonical operational SQL is `db/zippy/migrations/`. This repository records the Xano adaptation rather than claiming that PostgreSQL protections transferred automatically.

## Staging continuation (22 October 2026)

**BLOCKED at the database-guarantee gate.** The latest sandbox source and authentication/Slice1 work have been preserved. See [staging status](docs/STAGING_STATUS.md), [required API contract](docs/API_CONTRACT.md), and the per-control database inventory. The manual staging workflow deliberately fails while critical evidence or executable integration tests are missing. It is not an acceptance suite.

## Xano-native safeguards and current proof evidence

Use Xano’s managed database. The previous New-logistic repository supplies pinned reference invariants only. [Current safeguards and evidence](docs/XANO_NATIVE_CONTINUATION.md) include explicit profile binding, signup denial, removed MCP tool bindings, shared-state Metadata API races and independent rollback probes. All 72 original cases are now individually mapped, but remain unaccepted until native equivalents pass. Staging remains blocked.

The owner clarified that the 72 unverified PostgreSQL cases belong to the previous New-logistic project. Their inventory is retained as historical reference; it is not an automatic Xano staging requirement. Xano acceptance follows the current implementation and its applicable business invariants. See [HTTP connection checks](docs/HTTP_CONNECTION_CHECK.md).
