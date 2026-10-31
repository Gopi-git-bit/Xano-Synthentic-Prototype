# Assignment to connected ChatGPT / Composio — GitHub publication

## Requested recipient task

Use the user's authenticated Composio GitHub connection for **`Gopi-git-bit/Xano-Synthentic-Prototype`**. OpenCode's single remote-ref retry failed with a connection reset. No GitHub write or merge occurred. This file is the assignment; OpenCode cannot send it to a separate ChatGPT conversation through the available tools. The user must attach the private transfer package to that connected conversation.

Branch: **`codex/xano-m1-reconciliation-20261029`**.

Preserved reconciliation commit: **`ea543e9c4679006479144fc6412597b074dd5505`**.

Bundle prerequisite: **`ed62038f571c02f339972ad7ec5d7cd1a9cffe18`**.

Exact continuation tip, bundle filename, SHA-256, byte count and verification receipt are in the attached **`transfer-manifest.json`**. Do not assume the current remote branch exists or that its head matches any local checkpoint.

## Before any public write

1. Read [publication review](XANO_PUBLICATION_REVIEW.md). **Credentials/customer-data checks passed; public-release privacy disposition is still BLOCKED** for absolute machine paths/account metadata in the immutable original commit. The bundle is for private transfer, not a public repository attachment. Obtain the owner's explicit decision on those disclosures or on a separately redacted review artifact. Never hide a history-containing disclosure with a later deletion commit.
2. Inspect remote repository identity/visibility, the reconciliation ref, `codex/xano-backend-review`, and `feat/frontend-tailwind-polish`. Report actual SHAs. Confirm whether frontend `8eeef1e0cdca218f8bdf17f792f3b2cb6b68937b` is present. Do not modify the frontend.
3. Verify attachment hash/size, `git bundle verify`, prerequisite availability and imported branch tip. Confirm original `ea543e9…` is an ancestor and all 240 original seal hashes verify.
4. Confirm all outgoing files and commit attribution meet the approved public scope. No credential values, impersonation URLs, private environment files or raw customer records should be supplied to GitHub.

## Preferred exact-history import

In a private Git-capable connected worker with the prerequisite fetched:

```sh
git bundle verify reconciliation.bundle
git fetch reconciliation.bundle refs/heads/codex/xano-m1-reconciliation-20261029:refs/remotes/transfer/reconciliation
git rev-parse refs/remotes/transfer/reconciliation
git merge-base --is-ancestor ea543e9c4679006479144fc6412597b074dd5505 refs/remotes/transfer/reconciliation
```

Compare the returned SHA with `transfer-manifest.json`. Then, **only after the publication concerns are cleared**, use a new-ref or normal fast-forward push:

```sh
git push origin refs/remotes/transfer/reconciliation:refs/heads/codex/xano-m1-reconciliation-20261029
```

Never use `--force`, replace an existing divergent ref, merge unrelated histories, merge PR #1, or merge the frontend documentation PR. If a remote ref exists, prove it is an ancestor first; otherwise stop and report divergence.

## If Composio exposes only GitHub REST tools

The attached `git-data.json` supplies ordered commit metadata and exact changed blobs, including base64 for binary evidence. Use supported Git Database blob/tree/commit operations only after privacy clearance. Upload blobs and verify their SHA; build each tree from its stated parent tree and compare the expected tree SHA. Create commits in order, preserving message, author, committer and dates where the connector supports them. Compare **every** resulting SHA to the expected commit.

A GitHub ref cannot point to a local commit GitHub has not received. A Contents API upload or differently serialized commit does not preserve the original SHA. If the connector cannot faithfully import the Git objects or returns a different commit SHA, stop; report the limitation and request approval for a clearly labeled derived review commit. Do not claim the exact branch was published. Prefer a Git-capable worker for byte-identical history.

## Report back

- `PUSHED` or `BLOCKED`; exact repository, branch, remote SHA and branch URL if actually published.
- Remote frontend/backend reference SHAs and any divergence.
- Bundle/hash/integrity result and public-release decision.
- No merges, Xano publication, fixture/environment creation, payments, notifications or release-flag changes.

After the branch is available, hand back the exact remote SHA. Xano work remains separately approval-gated under [isolation scope](XANO_ISOLATION_APPROVAL.md); do not execute operational agents or deploy unsafe captured drafts.
