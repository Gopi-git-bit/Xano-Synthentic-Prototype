# Seven read-only tools — isolated review

The exact 48-definition candidate verified on 2026-11-03 is preserved in `candidate/`:
seven tools, four helper functions, 34 schema definitions, one authenticated MCP server,
and a synthetic-account login API/group. The two security functions are the inspected
published guards, not the older, less restrictive drafts. The root repository exports
are historical and are not deployment inputs for this package.

## Recorded execution

- Tenant `ewkq-c4ck-894a` (ID 4), internal workspace 1; expires 2026-11-04 05:02:41 UTC.
- Developer MCP 2.2.6: **48/48** definitions validated.
- Actual authenticated Xano tool-debug API: **65/65** runtime checks passed.
- **34/34** domain tables unchanged during tool calls; source published and draft
  snapshots each matched across **87 files**.
- Tool IDs: booking 2, order validation 7, vehicle eligibility 1, assignment proposal 5,
  POD review 6, payment summary 3, refund prescreen 4. IDs are local to that tenant.
- External MCP stream transport remains unverified (attempt returned HTTP 404).

`evidence/verified-20261103.json` contains allowlisted per-case outcomes and candidate
hashes, not raw responses. Credentials, application tokens, passwords, record dumps,
production environment values and first-run diagnostics are excluded.
The portable scripts were rerun successfully against the original tenant: **65/65**,
with all 34 table fingerprints unchanged (`evidence/portable-runtime-20261103.json`).

## Reproduce in a fresh ephemeral tenant

Prerequisites: Node 22+, Xano CLI 1.3.4 or compatible, an authenticated local CLI
profile, and permission to create an ephemeral tenant under the intended parent
workspace. Follow current [ephemeral tenant documentation](https://docs.xano.com/xano-cli/ephemeral).

From this directory:

```powershell
npm ci --ignore-scripts
npm run validate
xano ephemeral create "Zippy synthetic tool review" -p <profile> -w <parent-workspace> --expires-hours 24
Copy-Item target.example.json target.local.json
```

Fill the ignored `target.local.json` with the exact origin, profile, parent workspace,
tenant name/ID and internal workspace ID returned by inspection. The example contains
no working environment. Scripts read the token at runtime from `XANO_CONFIG` or
`~/.xano/credentials.yaml`; they never accept a token in the target JSON.

```powershell
node scripts/verify-target.cjs --prepare-empty
xano ephemeral push <tenant-name> -p <profile> -w <parent-workspace> -d candidate --dry-run
# Review: exactly 34 tables, four functions, seven tools, one MCP server, one API group/endpoint.
xano ephemeral push <tenant-name> -p <profile> -w <parent-workspace> -d candidate --force
npm run readback
npm run seed
npm run test:runtime
```

Use `ephemeral push` only. The local profile and explicit target must agree; scripts
verify the parent tenant is unexpired, ephemeral, healthy, tasks-disabled, and has
the expected internal workspace before any record access. Tool/table/MCP IDs are
discovered, not copied from the historical tenant. Seeding requires empty identity
and booking tables and refuses a second manifest. If interrupted during setup, use
a fresh tenant. Tests can be rerun against completed fixtures; passwords/tokens are
generated in memory for each run. Fixture times are relative to setup time; rerun
with a fresh tenant after their windows expire.

`--prepare-empty` disables tasks only on a verified empty ephemeral tenant. It
preserves null domain settings; CLI 1.3.4's `tenant edit --no-tasks` returned a
duplicate-record error for the second tenant because it serialized null as empty text.

All local results go to ignored `.sandbox/`. To use a different target/evidence
directory, set `ZIPPY_TARGET` and `ZIPPY_EVIDENCE_DIR` explicitly. Never commit that
directory. Runtime output retains only statuses, assertions, counts and table hashes.

The login API belongs solely to this isolated test package. Tools perform no booking,
assignment, financial, refund approval or messaging writes. Specialized cargo and
non-prepaid payment readiness require human review; financial arithmetic is INR-only.
See `PR8-API-REVIEW.md` for frontend alignment and release-gate findings.
