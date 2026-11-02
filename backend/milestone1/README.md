Current administrator follow-up: [remediation plan](../../docs/XANO_ADMIN_REMEDIATION_PLAN.md). The original 121-check bundle is preserved; five additional checks cover the diagnostic source pin, physical index validity and failed-race settlement. No M1 behavior cases have run.

# M1 candidates and evidence checks

All eight candidates passed the native Xano sandbox dry-run on 23 October 2026. The preview lists three function updates, one new function and four new workflow tests, with no table changes, deletions or truncations. **The candidates have not been imported or executed.** Native preview acceptance does not prove runtime behavior. See [dry-run evidence](../evidence/milestone1-native-preview-2026-10-23.json).

The manifest binds three replacements to their original hashes/GUIDs and lists five new internal resources. All 109 definitions in backend/xano/, the eight candidate source files, five agent drafts and historical evidence remain unchanged. The identity candidate rejects missing or ambiguous customer profiles. The command adds application-failure injection points. The helper adds independent driver selection, all 15 record counts, linkage checks and actual conflict status. Existing lifecycle, payment and idempotency policies remain in place.

The four rollback workflows use assets 6–9, refuse occupied fixtures, never seed/delete fixtures, verify error provenance and compare all 15 tables across both fixture tenants. They require a successful retry and stable replay. Run them sequentially only after the prerequisites pass.

## Native adapter

native-adapter.cjs implements the existing race runner interface using Xano's Metadata API. Its fixed target is workspace 1 / branch v1 / sandbox sn9m-aat6-200c. Supply XANO_METADATA_TOKEN through the execution environment's secret facility. Do not put it in source, command-line arguments or evidence files.

Read-only preflight:

~~~sh
node scripts/preflight-milestone1-native.cjs reports/m1-native-preflight.json
~~~

Exit 0 means the implemented preflight checks passed, 2 means prerequisites are blocked, and 1 means a request or validation failed. The output directory must already exist. The CLI has no import or case-execution option. Current [native preflight evidence](../evidence/milestone1-native-preflight-2026-10-23.json) exits 2:

- 51 metadata tables map successfully, but two additional physical tables remain: mvpw1_56 and mvpw1_57. Resolve them through supported Xano administration; do not raw-drop, reset or whitelist 53.
- The idempotency unique index is present. Partial unique indexes for active vehicle and driver assignments were not found in the physical catalog.
- The authenticated token has live-data scope 15; a restricted development connection and live-denial proof are still required.
- The eight candidates remain unimported. Native source readback must match before execution.

Preflight recognizes the additional read-only diagnostic only by its reviewed native source hash. It checks authenticated identity, token expiry, live-data/admin scopes, stable source exports, known read-only probe source, sandbox database identity, metadata GUIDs/columns, full table mapping, scoped index definitions and candidate source hashes. The source_hashes field contains manifest byte hashes only when native source equals the candidate after LF normalization and trimming; separate export hashes describe the actual native response bytes.

The restricted-access check currently understands explicit zero scope values only. Other permission models require review; unrecognized values are never assumed safe. It probes live record access only after the scope and expiry checks pass, discards the response body, and requires a 401/403 denial. Catalog definitions plus indisunique/indisvalid/indisready are required. They do not prove behavior under load or clear the 72 deferred controls.

All native execution requests force X-Tenant, disable redirects, use a 30-second timeout and a 2 MB response ceiling, and have no automatic retry. Each adapter is limited to 96 requests and four concurrent requests. A passing preflight grants a two-minute execution window, bounded by token expiry; request failures invalidate it. Use a fresh adapter per cohort.

After a future passing preflight, runner.cjs can use createNativeAdapter() for its three bounded race kinds. Only its exact Slice1/acceptance race inputs and Milestone1/snapshot are callable. The runner checks unused vehicles/drivers and zero key counts before commands. This adapter does **not** provision the missing negative fixtures, execute four workflow tests, or implement the entire 31-case suite.

## Verification and scope

~~~sh
node scripts/test-milestone1-native.cjs
node scripts/test-milestone1.cjs
node scripts/evaluate-milestone1.cjs
~~~

The current 19 adapter tests use mocked HTTP responses; 107 M1 checks test source fragments, evidence assertions and orchestration. The original bundle retains its separate 121-pass result. Neither suite emulates Xano transactions. The read-only native preflight is real hosted evidence; the 31 M1 behavior cases and 70 operational agent cases remain NOT_RUN. All 72 scoped integrity controls retain explicit deferrals. Global staging remains blocked.
