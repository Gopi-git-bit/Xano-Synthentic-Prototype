# Zippy Synthetic Prototype — Xano backend

This repository contains the Xano sandbox implementation of Zippy Logistics. **It is not production-ready and has not been promoted to the live branch.**

## Current implementation

| Component | Reviewed snapshot |
| --- | --- |
| Target | Workspace 1, Zippy Synthetic Prototype; branch v1 |
| Deployment | Sandbox only; historical build evidence dated 2026-10-21 |
| Operational database | 49 tables, 476 mapped fields, plus two starter tables |
| Logistics functions | Eight domain predicates and one identity adapter |
| Logistics APIs | GET api/v1/health, GET api/v1/accounts/me, GET api/v1/orders |
| Domain checks | 41 local cases; retained Xano report records 41 passed, zero failed |

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

No npm dependencies, Xano credentials, or database access are needed. This executes the supplied 41 cases against both the shared predicates and JavaScript embedded in the exported Xano functions, and checks 49 tables/476 field names and types. It does not validate the complete XanoScript grammar or prove database constraints, transactions, authentication, HTTP behavior, or deployment.

## Work with Xano

Use a locally authenticated Xano CLI profile targeting workspace 1 and the intended development branch. Keep tokens in local credential storage/environment variables, never GitHub files. Codex MCP uses the saved `XANO_MCP_TOKEN` environment variable; the token is not part of this repository.

Before any import, inspect the current remote workspace and compare it with this historical snapshot. Follow the sandbox workflow: preview the proposed diff, push to an isolated sandbox, run Xano validation and unit tests, review the actual changes, and promote only after the release blockers are addressed and the owner authorizes promotion. CLI syntax depends on the installed version; check `xano sandbox --help`. CI never imports, promotes, or calls Xano.

Operational identities require an authorized provisioning process that binds `accounts.external_subject` to `xano:<authenticated user id>`, an active account, and valid role memberships. Starter-user role fields must not grant operational access.

## Remaining backend and database work

Booking transactions, idempotency/replay, controlled order transitions, atomic dispatch, signed payment webhooks, durable workers, and provider integration are incomplete. SQL foreign keys, CHECK constraints, RLS, partial indexes, append-only rules, and concurrency guarantees require explicit Xano equivalents and tests. Field parity alone does not implement these controls.

See [review findings](docs/REVIEW.md) before extending or deploying the build. In particular, the current payment-plan predicate accepts partial advances above the order total.

## Specification provenance

Business rules were adapted from [New-logistic-](https://github.com/Gopi-git-bit/New-logistic-/tree/52ca43d8a2fb4f3d5d105dc6bb9f7420e5cfca26), revision `52ca43d8a2fb4f3d5d105dc6bb9f7420e5cfca26`. Its canonical operational SQL is `db/zippy/migrations/`. This repository records the Xano adaptation rather than claiming that PostgreSQL protections transferred automatically.
