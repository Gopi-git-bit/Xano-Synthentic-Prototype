# P1 platform capability investigation — unsealed continuation

Baseline: `55d4dd278602c5a81706db70d91b53ca363f4d9c`. Stage `W3-P1-PLATFORM` follows `W3-P0`; feasibility is **BLOCKED_PENDING_XANO_CONFIRMATION**. Stage P remains **NOT_RUN / NOT_APPROVED**.

- Reports: `docs/XANO_STAGE_P_PLATFORM_DECISION.md`, `docs/XANO_STAGE_P_CAPABILITY_MATRIX.md`, private owner-review `docs/XANO_STAGE_P_SUPPORT_REQUEST.md`.
- `documentation-receipts.json` and `account-documentation-receipt.json`: 18 public official-document GET receipts, captured 2026-10-30; snapshots in `documents/`.
- `SOURCE_CATALOG.md`: source IDs, exact URLs, UTC access dates and SHA-256 values.
- `investigation-context.json`: retained input hashes, target, accepted P0 facts, support search scope and canonical retrieval blocker. Private: contains instance identifiers.
- `schema-observations.json`: offline analysis of retained P0 public Metadata schema. No entitlement, physical identity or policy-simulator claim.
- `pricing-text.txt`: deterministic derived extraction of D16 HTML. Retain HTML as authoritative captured bytes.
- `investigation-hashes.json`: new unsealed content index; excludes itself and later verification output to avoid recursive hashes. It is not a historical seal.
- `verification.json`: new document/reference/hash/preservation checks. Historical P0 tests are not rerun. Canonical evidence validator is unavailable and NOT RUN.

Capture scripts are one-shot (`wx`) and must not be replayed over existing receipts. Evaluation is offline and also refuses output overwrite. All current-task authenticated Xano/application/provider/SQL requests and mutations are zero. Public documentation fetches are not authenticated Xano discovery.

Only a separate allowlisted sanitized synchronization package is suitable for public review. Do not upload this directory wholesale, raw P0 receipts, the support submission history, credentials, original private bundle or private reconciliation branch. No vendor request has been sent.
