# Workspace-3 reconciliation — 29 October 2026

Local review candidate and immutable evidence, based on Git `ed62038f571c02f339972ad7ec5d7cd1a9cffe18`, branch `codex/xano-m1-reconciliation-20261029`.

Target: `xynd-fnea-khtp.n7e.xano.io`, workspace **3**, **Zippy Synthetic Prototype_1**, branch **v1**, data-source label **live**. No approved isolated synthetic environment was available. This directory is **not a deployable workspace export**.

## Contents

- `evidence/published/`, `evidence/draft/`: captured definitions, not newly authored implementations. Both contain unsafe/incomplete code; do not import either tree wholesale.
- `evidence/*inventory.json`: normalized definition hashes and metadata inventory. Physical enforcement is not established by these files.
- `evidence/read-denials.json`: eight actual anonymous/malformed-token HTTP checks, all 401; no record bodies retained.
- `evidence/checks/`: passing offline checks, intentional source-gate failures, and retained package-validator failures.
- `candidate/`: 12 endpoint-only refusal candidates preserving captured route names, methods, groups and GUIDs. No table/function changes. Requires application authentication, then unconditionally denies with `accessdenied`. No helper calls, writes or external effects.
- `TEST_PLAN.md`: blocked synthetic acceptance cases and exact assertions for future implementation.
- `manifest.json`: byte hashes of this review bundle and its scripts; generated after checks. `scripts/verify-workspace3-evidence.cjs` verifies it locally.

Candidate status: **VERIFIED offline source constraints; NOT RUN in Xano; not previewed, imported or published**. Expected anonymous/invalid-token denial is 401; expected authenticated denial is 403 with the fixed unavailable message. These candidate HTTP outcomes are expectations, not observed results. The consent route also denies all callers; this does not define a future consignee authentication design.

The refusal stack follows the syntax already published on disabled onboarding/recovery endpoints. Xano compilation and path-parameter behavior still need isolated verification. `response = null` is unreachable after the explicit refusal; it remains in the declarative response field to match the existing disabled-handler pattern.

## Reports

- [Current state](../../docs/XANO_CURRENT_STATE.md)
- [M1 reconciliation and requirement matrix](../../docs/XANO_M1_RECONCILIATION.md)
- [Executed test evidence](../../docs/XANO_BACKEND_TEST_EVIDENCE.md)
- [Frontend integration handoff](../../docs/XANO_FRONTEND_INTEGRATION_HANDOFF.md)

Published/draft originals and historical workspace-1 evidence are preserved. Candidate files are deliberately outside the existing `backend/xano` tree. There is no deployment command in this bundle. The current Xano deployment remains the captured version.
