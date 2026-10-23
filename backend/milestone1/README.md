# M1 candidates and evidence checks

These files are prepared repository changes. **Nothing in `xano/` has been imported, syntax-validated by Xano, or executed there.** `backend/xano/` and its historical manifest remain unchanged.

The manifest binds three replacement candidates to their original hashes/GUIDs and lists five new internal snapshot/workflow resources. Inspect a fresh native export before applying any candidate. The four fault workflows refuse occupied assets 6–9, never seed/delete fixtures, assert error provenance, compare all 15 tables across both fixture tenants, then require create/replay with stable IDs and exact record deltas. Run them sequentially against verified unused fixtures; a missing/occupied fixture must stop the run.

The identity candidate rejects missing customer profiles and ambiguous profiles. The command candidate adds only application-failure injection points. The acceptance helper adds independent driver selection, all 15 record counts, linkage checks, result IDs and actual conflict status. Existing lifecycle, payment and idempotency behavior is preserved.

Run `node scripts/test-milestone1.cjs` for source-fragment, evidence-rejection and adapter-orchestration tests. These do not emulate Xano transactions or prove database behavior. Run `node scripts/evaluate-milestone1.cjs` to inventory the 31 unexecuted hosted cases. Offline fixtures never become native evidence.

`runner.cjs` provides bounded race orchestration through an injected adapter; it supplies no credentials or network adapter. Before a real adapter is wired, obtain fresh authenticated target/source reads, restricted access and physical-index evidence, and resolve 53 physical tables versus 51 declarations. The runner refuses unverified preflight facts and occupied fixtures. Its tests use a visibly labeled offline adapter.

All 72 scoped integrity controls remain explicitly deferred in the manifest. All 70 operational agent cases remain unrun. The historical native evidence and the new offline evidence have separate scopes; neither establishes deployment readiness.
