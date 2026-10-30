# Workspace-3 M1 — sanitized public source review

**Status: SOURCE REVIEW ONLY — NOT HOSTED ACCEPTANCE; NOT A DEPLOYMENT.**

This directory derives narrowly scoped, non-deployable review copies from OpenCode's independently verified **private** workspace-3 reconciliation lineage.

## Provenance and boundaries

- GitHub: `Gopi-git-bit/Xano-Synthentic-Prototype`.
- Public parent branch: `codex/xano-backend-review` at `ed62038f571c02f339972ad7ec5d7cd1a9cffe18`.
- Private, unchanged review ancestor: `ea543e9c4679006479144fc6412597b074dd5505`.
- Private, unchanged continuation tip: `61d1b139d27646187f7d4a52bcc6546e11b70a4c`.
- **This public branch does not contain those two private commits** or their full original 264-file evidence history. It necessarily has a **different Git commit SHA**.
- Local bundle/ZIP verification and source integrity were independently checked before preparing this derived review. Exact original Git objects remain in the private worktree and bundle; original sealed evidence was not edited or copied here.

## Included in this public derivative

- `refusal-candidates/`: 12 action-specific, XanoScript-style **review copies** of the proposed denial-only booking mutation handlers. These copies retain the refusal logic and endpoint naming, but **intentionally omit each original GUID**.
- `refusal-source.test.cjs`: static, offline review checks confirming all 12 intended files are present, require user auth, unconditionally raise `accessdenied`, omit endpoint GUIDs, and do not show database/provider execution.
- `M1_REVIEW_AND_GATES.md`: current bounded acceptance results, pending protections and separate approval gates.

## Explicit exclusions

No Metadata API snapshots, host/account paths, administrative principal IDs or permission maps, credential loaders, raw Git bundle, transfer JSON, full response receipts, private instance URLs, provider secrets, customer data, OTP literal, agent definitions, schema migrations, operation-enabling backend code, or full historical source are included as new files.

**Do not import the candidate files into Xano.** Their GUIDs are deliberately absent. They are public source-review examples, *not* runnable deployment input, not a claim of 12 successfully refused hosted mutations, and not an approved operational contract.

Run the offline source audit at the repository root:

```sh
node --test review/workspace3-m1/refusal-source.test.cjs
```

Any future executable Xano release must be built from the **separately reviewed private sources**, with current GUID, provenance, security and isolated runtime acceptance — not from these public review copies.
