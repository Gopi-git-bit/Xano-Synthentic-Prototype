# M1 workspace-3 — publication and isolated-testing decision gates

**Status:** REVIEW ONLY — no environment provisioning, fixture import, API mutation, or Git history import approved by this document.  
**Current target:** Xano workspace 3, source branch v1. Historical workspace-1 sandbox receipts are separate and cannot authorize reuse.

## Gate G — exact-history transfer and publication

**G0. Preserve**: retain the complete local reconciliation lineage and private ZIP as originally prepared by OpenCode. No force-push, rebase or modification of historical sealed artifacts.

**G1. Receive privately**: obtain the archive through an authenticated private file channel. OpenCode's reported ZIP size is 725,031 bytes and SHA-256 is `1f94f1358e66b5268a7276652e23db0ce33f26b94ce22df2cdb7fd2df59e85cc`. Confirm SHA-256 on the actual received bytes before using the package. Do not post the archive as a public issue, PR attachment, repository commit or release asset.

**G2. Verify history**: inspect handoff manifest, bundle prerequisite `ed62038f571c02f339972ad7ec5d7cd1a9cffe18`, review ancestor `ea543e9c4679006479144fc6412597b074dd5505`, and reported tip `61d1b139d27646187f7d4a52bcc6546e11b70a4c`. Independently verify Git objects and all sealed artifacts. If any mismatch occurs, stop without importing.

**G3. Resolve disclosure**: assess every outgoing Git object, including history, for credentials, tenant/customer data, private administrative identities, machine/account metadata, sensitive paths and environment-only internals. A clean token-pattern scan alone is insufficient for a public repository. Record the owner's disposition of all identified categories.

**G4. Publish only after G1–G3**: choose private preservation or a reviewed sanitized public publication. If sanitizing changes Git objects, issue new commit IDs and explicitly document that they are not the original private tip. Publish a separate review branch only, never force-push, auto-merge PR #1 or publish Xano live.

### GitHub status at this baseline

- Confirmed published backend review branch: `codex/xano-backend-review` at `ed62038f571c02f339972ad7ec5d7cd1a9cffe18`.
- OpenCode reconciliation branch `codex/xano-m1-reconciliation-20261029`: **not found** in the checked remote branch list.
- This review-only documentation is *not* the missing implementation or an exact-history Git transfer.

## Gate P — isolated Xano stage-P provisioning (separate owner approval)

OpenCode proposed, but has **not** created or obtained approval for:

| Control | Proposed stage-P boundary |
| --- | --- |
| Isolation | One workspace-3 ephemeral synthetic environment, source v1, no copies of parent live records |
| Lifetime | Four-hour environment; separately restricted one-hour metadata credential |
| Permissions | Prove tenant-only access and denial to parent-live data, record-level grants and all required read scopes |
| Identity | Verify isolated physical database identity and safe host/endpoint binding |
| Egress | Block or stub messages, payments, providers, AI/agent execution and external side effects |
| Source | Preview a reviewed 59-definition allowlist of already published safe auth/read/schema and explicit refusal candidates |
| Safety | Capture expiration, cleanup/recovery, no-unsafe-fallback, and complete pre/post state evidence |

**Do not interpret this plan as authorization.** Owner must approve the exact stage-P scope and any required administrative role adjustments. If isolation proof cannot be obtained, stop before tenant/source writes.

## Gate A/B — fixtures and runtime acceptance (further approvals)

After Gate P succeeds, a *separate* approval is required to create synthetic organizations/users/bookings and execute application tests. The proposed fixture plan involves two organizations, seven users, five bookings, two cargo rows and two holds; counts are planning inputs, not actual created records.

Then run the approved acceptance matrix for login, status/membership revocation, tenant-scoped booking reads, missing/foreign booking equivalence, and explicit mutation refusals with zero side effects. A native adapter, bounded observer and tenant URL verification must be reviewed and implemented first. The prepared transport-neutral acceptance engine has passed offline safety checks but is **not** a hosted executable proof.

**Do not use a broad administrative metadata token as application user authentication.**

## Gate C — later operational controls

Keep transactional booking commands, concurrency/assignment uniqueness, idempotency, worker fencing, verified consent, payment/refund authority, five-agent activation and production release switches disabled until independent policies, published contracts and isolated rollback/concurrency proofs are accepted.

## Required decision record for future reviews

For each gate: owner approval reference; target workspace/tenant; branch and source SHA; exact operation scope; isolation and permission evidence; actual response/receipt hashes; positive and negative test outcomes; unexpected effects and rollback evidence; pending blockers; reviewer acceptance. Label `NOT RUN` and `BLOCKED` explicitly rather than inferring completion.
