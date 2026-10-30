# AGENTS.md — Read before changing Zippy Logistics

Coding agents: this is the **discovery entry point**, not a delegated owner approval. The project uses the active `Gopi-git-bit/Xano-Synthentic-Prototype` repository; the historical `New-logistic-` project is reference only.

## Required reading sequence

1. [SOUL.md](SOUL.md) — product mission, architecture, security and coding principles.
2. [DECISION.md](DECISION.md) — decisions, proposals, explicit approvals and blocked actions.
3. [docs/EXECUTION_TRACKER.md](docs/EXECUTION_TRACKER.md) — the latest snapshot, exact active branches, completed work and next permitted milestone.
4. [docs/EVIDENCE.md](docs/EVIDENCE.md) — predecessor chain, proofs, source hashes, accepted vs NOT_RUN stages and owner approval references.
5. The exact feature-specific source, tests and private/approved handoff for the task.

**Read every document from the same intended branch.** The tracker and evidence currently live on a **draft PR branch**, not necessarily `main`. If documents are absent on your branch, fetch/read the approved tracker review branch; do not silently create duplicate local truth.

## Execution contract

- Before work, state: target repo/branch/SHA, Xano workspace/branch/source/data source if relevant, predecessor stage, observed evidence, owner approval boundary, and intended read/write scope.
- Reuse code and tests; never redo an unchanged successful audit merely to create progress narration.
- Implement/test locally or in explicitly authorized isolated environments; keep data/org/roles scoped, funds human-controlled and released functionality fail-closed.
- Never run Xano live mutations, tenant/credential creation, provider sends, payment/refunds, operational agents, git force pushes, PR merges or production releases without *specific* permission.
- Do not upgrade `REPORTED`, `PASSED_CI` or `SOURCE_ONLY` into `VERIFIED_HOSTED`. Stop if a prerequisite lacks trustworthy evidence.
- After work, update the **same milestone** in tracker and evidence; append a checkpoint, retain historical failures, identify exact changed paths and run `node --test scripts/validate-evidence-chain.cjs`.
- Update DECISION.md only if the owner adopts or changes a material decision, or a proposal status changes **with evidence**. Preserve superseded decisions.
- Report `DONE`, `BLOCKED` or `NOT_RUN` with evidence, changed refs, approvals and one next permitted task.

## Current handoff constraint

The private OpenCode Stage P0 report dated 2026-10-30 **reports** successful workspace-3 read-only discovery and 25/25 offline checks. Its results must first be verified and synchronized into the shared tracker/evidence. Stage P tenant provisioning is **not approved**; Essential-plan tenant-only restrictions, parent-live denial, bootstrap/no-copy, physical identity, provider blocking and app-token isolation are unresolved.

**Do not read this instruction as authority to create a Xano tenant or merge PR #5.**
