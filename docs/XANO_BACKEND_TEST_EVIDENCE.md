# Backend test evidence — 29 October 2026

**Executed:** authenticated metadata discovery, eight denied HTTP reads, local source gates, frontend mock contracts and selected historical offline validators. **No hosted positive-account, mutation, concurrency, agent or financial acceptance test ran.**

Exact base: `ed62038f571c02f339972ad7ec5d7cd1a9cffe18`; branch `codex/xano-m1-reconciliation-20261029`. Target `xynd-fnea-khtp.n7e.xano.io`, workspace **3**, **v1**, data-source **live**. Synthetic environment: **none verified**. Inspected frontend SHA: `35461bd62bfd90b6f7e901791aa3d097b6649ead`; remote reported `8eeef1e0cdca218f8bdf17f792f3b2cb6b68937b` **BLOCKED**.

**VERIFIED** is bounded to the listed check. **FAILED** remains a failure even when expected. **BLOCKED** means missing prerequisites; **NOT RUN** means no execution; **NOT IMPLEMENTED** identifies absent current behavior. Do not total source checks, mocks and HTTP receipts into a hosted acceptance score.

## Actual results

| Check | Actual result | Scope / receipt |
|---|---|---|
| Metadata identity/workspace/branch/data-source | **VERIFIED**, HTTP 200; workspace 3/v1/live | `effective-identity.json`, `workspaces.json`, `branches.json`, `data-sources-corrected.json` |
| Code/schema inventories | **VERIFIED**, 84 definitions per export, 33 metadata tables, 41 differing definitions | `published-inventory.json`, `draft-inventory.json`, `table-inventory.json`, `published-draft-diff.json` |
| Anonymous and malformed-bearer reads | **VERIFIED**, **8/8 HTTP 401** | `read-denials.json` |
| Published mutation-refusal baseline | **FAILED**, **12 route failures**, 1 inventory-coverage pass; exit 1, before candidate creation | `mutation-refusal-red.txt`; original PowerShell UTF-16 output retained as `.tap` |
| Local refusal candidate | **VERIFIED offline**, **13/13 pass**, exit 0 | `checks/mutation-refusal-green.txt` |
| Current draft readiness | **FAILED**, final **11/11 source prerequisites fail**, exit 1 | `checks/known-gaps-final.json`; earlier nine-check result also retained |
| Frontend server contracts | **VERIFIED mocks**, **17/17 pass**, exit 0 | `checks/frontend-contracts.txt`; 8 Xano adapter tests + 9 gateway tests |
| Historical M1 execution-model subset | **VERIFIED offline**, **23/23 pass**, exit 0 | `checks/m1-execution-model.txt`; model traverses 31 simulated cases with duplicate-profile fixture qualification, **zero hosted passes** |
| Agent-package validators on checkout | **FAILED**, both exit 1 on byte-manifest length | `checks/five-agent-config.txt`, `checks/five-agent-schema.txt` |
| Validators on exact Git archive | **FAILED**, same manifest mismatch | `checks/five-agent-canonical.json`; proves mismatch is present in committed bytes, not only worktree conversion |
| Separate LF-normalized package comparison | **VERIFIED comparison only**: config/references pass; **37 schema + 13 binding-preparation cases pass**, zero acceptance cases | `checks/five-agent-lf-comparison.json`, `checks/five-agent-schema-lf-comparison.json`; all nine manifest files match LF hashes |
| Candidate Xano compilation/preview/runtime | **NOT RUN** | No current isolation; candidate not deployed |
| Positive/suspended login, persisted logs, cross-tenant reads | **BLOCKED / NOT RUN** | No approved accounts/fixture IDs |
| Physical constraints, rollback, true contention, worker reclaim | **BLOCKED / NOT RUN** | No isolated verified database/runtime |
| Current P2 runtime tests, assignment/worker/finance services | **NOT IMPLEMENTED** as asserted operational implementations | Empty published runner and 14 empty published functions; static draft P2 PASS objects are not results |
| Five-agent operational acceptance and historical 31 hosted M1 cases | **NOT RUN** | 70 package scenarios unchanged; historical workspace-1 lineage kept separate |

All receipt paths above are under [`backend/reconciliation-20261029/evidence`](../backend/reconciliation-20261029/evidence).

## Actual HTTP status/shape receipts

Both modes were executed for each URL: absent Authorization, then `Bearer invalid-synthetic-not-a-jwt`. No metadata bearer, customer credential or fixture token was used.

| GET path | Anonymous | Malformed bearer | Sanitized response |
|---|---:|---:|---|
| `/api:pofBqnrY/auth/me` | 401 | 401 | `{code:"ERROR_CODE_UNAUTHORIZED", message:string}` |
| `/api:zippy-v1/bookings` | 401 | 401 | Same shape/code |
| `/api:zippy-v1/bookings/1` | 401 | 401 | Same shape/code |
| `/api:zippy-v1/bookings?page=2&per_page=1&status=draft` | 401 | 401 | Same shape/code |

These establish missing/malformed-token denial only, not valid-account authorization, suspended-token behavior or indistinguishable foreign/missing IDs. Bodies were projected to error field names/types; no record values or full response messages retained. The probe stops on unexpected status/shape and does not retain arbitrary content.

## Reproduce offline checks

From the backend review worktree; Node used was **v24.22.1**, Windows. Python/jsonschema versions are in the LF schema receipt.

```powershell
# Local refusal candidates: expected 13 passes, exit 0.
node --test --test-reporter=tap scripts/test-workspace3-mutation-refusal.cjs

# Published baseline: expected 12 failures + 1 coverage pass, exit 1.
$env:W3_TEST_PUBLISHED='1'
node --test --test-reporter=tap scripts/test-workspace3-mutation-refusal.cjs
Remove-Item Env:W3_TEST_PUBLISHED

# Deliberately open source gates: expected 11 failures, exit 1.
node scripts/check-workspace3-known-gaps.cjs

# Historical offline model subset only.
node --test --test-reporter=tap scripts/test-m1-execution.cjs

# These raw byte validators currently FAIL; do not silently update their manifest.
node scripts/validate-five-agent-config.cjs
python scripts/validate-five-agent-schema.py

# Sealed source/evidence integrity, no network.
node scripts/verify-workspace3-evidence.cjs
```

From `C:\Users\ashok\Documents\GitHub\zippy-frontend-polish\frontend`:

```powershell
node --test --test-reporter=tap server/gateway.test.mjs server/xano.test.mjs
```

The executed receipt orchestrator was:

```powershell
node scripts/run-workspace3-offline-checks.cjs 'C:\Users\ashok\Documents\GitHub\zippy-frontend-polish\frontend'
```

It returned exit 1 because the two package validators failed. It refuses to overwrite receipt files; reproduce individual commands instead. `checks/results.json` records exact arguments, timestamps, exit codes, script hashes and output hashes. The later final-gap check adds two newly discovered OTP defects; it does not replace the initial nine-failure receipt.

For exact-Git versus LF comparison, the executed commands used:

```powershell
$git='C:\Users\ashok\AppData\Local\GitHubDesktop\app-3.6.9\resources\app\git\cmd\git.exe'
node scripts/validate-committed-five-agent-package.cjs $git 'C:\Users\ashok\AppData\Local\Temp\opencode\zippy-m1-reconciliation-20261029-canonical-package'
node scripts/validate-committed-five-agent-package.cjs $git 'C:\Users\ashok\AppData\Local\Temp\opencode\zippy-m1-reconciliation-20261029-lf-comparison' --lf-comparison
```

Extraction is pinned to `ed62038…`; the comparison records raw/LF hashes and changes only the new temporary extraction. Existing output directories/receipts cannot be reused. Original package bytes remain untouched. The schema checks validate synthetic documents/context-binding preparation, not agent execution or tenant authorization.

## Discovery/probe provenance

The core capture ledger contains 20 Metadata API GETs. Earlier public Metadata OpenAPI retrieval and identity/workspace discovery add three GETs; the corrected data-source label read adds one. All 24 discovery requests were GETs. Eight subsequent application GETs are separate. No SQL, record-content endpoint, environment-value endpoint, run/preview endpoint or write request was invoked.

Capture scripts are retained under `evidence/capture-tools/`; original Metadata OpenAPI remains external with its hash receipt. Exports requested `branch=v1&env=false&records=false`, with `include_draft=false` then `true`. Definition hashes normalize outer whitespace and CRLF to LF; the bundle manifest separately hashes actual bytes. All publication assessment uses the published snapshot, not OpenAPI descriptions alone.

Executed denial command:

```powershell
node scripts/probe-workspace3-read-denials.cjs 'C:\Users\ashok\AppData\Local\Temp\opencode\zippy-m1-reconciliation-20261029' 'C:\Users\ashok\AppData\Local\Temp\opencode\zippy-m1-reconciliation-20261029\read-denials.json'
```

Unlike the offline checks, rerunning this command makes real bounded GETs. It uses source-reviewed authenticated read routes, no credential loader, no redirects and a new write-exclusive receipt. No POST/PATCH mutation probe was made.

The historical 26 frontend browser/mock cases and earlier 184-check backend total were not rerun. Browser builds/tests were unnecessary for this backend-only source change. All blocked hosted cases are specified in [TEST_PLAN.md](../backend/reconciliation-20261029/TEST_PLAN.md); no successful result is implied by their presence.
