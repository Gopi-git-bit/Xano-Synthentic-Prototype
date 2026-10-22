# Codex handoff: implement the Zippy five-agent contracts for Xano

## User goal and authority
The owner requested a source-grounded business-first report and AI-readable PRD, confirmed OMS, IMS, TMS, Verification and Finance/Compliance, and asked to submit the report to Codex in order to build the agents in Xano. Read the entire package before implementation. Repository basis: Gopi-git-bit/obsidian at 4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5. Intended Xano implementation repository: Gopi-git-bit/Xano-Synthentic-Prototype; inspect and verify it rather than assuming it matches the export.

## First task
Acknowledge receipt of every package file. Verify their JSON/schema/cross-references and inspect the target repository state. Create a local, reviewable implementation-readiness map linking each requirement to existing files, missing work, policy decisions and capability proofs. Report current branch/commit and exact tools available. Do not claim Xano access from repository access.

## Safe preparation
You may prepare local contract/test scaffolding and an implementation plan for unambiguous, read-only validation work within this requested build preparation. Preserve existing files, business rules and tests. Do not overwrite the original New-logistic repository, merge divergent source histories, publish or push changes, migrate data, provision credentials, send external messages, execute payment/notification providers or mutate a live Xano workspace in this handoff stage.

## Required gates
DEC-01 through DEC-15 are open. Do not implement contested operational or monetary decisions as enabled defaults. Verify instance, workspace, branch, data-source isolation and transaction/concurrency guarantees before any live or sandbox mutation. If only a live v1 target or unavailable authenticated tools exist, report that exact blocker and continue independent documentation/contract inspection only. The reported prior direct Codex connection does not mean this environment has the same credentials/tools.

No publication or migration is justified from this package. Keep live M7 and Qwen disabled. The historical 72 PostgreSQL cases remain unverified unless actual new evidence is provided; do not relabel them as passed or as Xano tests.

## Delivery requirements
Return: package receipt; target repository SHA and clean/dirty status; five-agent ownership map; requirement-to-file gap map; proposed first synthetic slice; policy/capability blockers; checks actually run with results; changed local paths if any. Label every test definition not_run until executed and record exact evidence for any later runtime claim. The staged PRD is the work order, not an instruction to bypass its gates.
