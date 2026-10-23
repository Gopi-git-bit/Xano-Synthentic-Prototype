# Xano access recovery — 24 October 2026

Status: **BLOCKED**. The exact failed token remains present after the attempted individual revocation. No replacement token was created, and database/backend writes remain disabled.

## Targeted revocation and independent readback

The owner explicitly approved revoking only `zippy-m1-sandbox`, key ID `0e6a46f9-9ec3-45d6-a7a9-b9240dd584c8`.

A read-only inspection located the supported per-token control: the danger trash/X icon beside NAME in that token's Access Token Details. This corrects the earlier browser report that no individual control was available. The confirmation requires typing `zippy-m1-sandbox` and selecting **Confirm Delete**. The exact key ID was checked before the action. **Revoke All was not used.**

The action returned a success message, “Data was successfully removed,” but also reported a 403/451 anti-bot block during a save/commit action. Its claimed post-action list was incomplete. A separate fresh read-only inspection found the exact target token still present, together with all nine other token rows. The apparently missing CLI entry was present with its own distinct key ID. The complete list contained ten tokens.

The success message is therefore rejected as revocation proof. No unrelated token loss is established. The automated mutation was not retried after this failed readback.

The owner was asked to perform the already-approved targeted operation directly, or obtain targeted Xano support assistance. This is a tooling failure, not a request for duplicate approval. Preserve all pre-existing tokens and account roles. Do not use Revoke All or bypass the reported automation restriction.

## Creation process remains unverified

Read-only inspection of an unsubmitted form reported that **Front End (WeWeb)** grants only Workspace Content Read and Workspace API Groups Read, with other CRUD permissions and all seven features off. A replacement would require three additional Read cells: Workspace Database, Workspace Functions and Workspace Workflow Test Features.

The final narrowly scoped probe did not return the complete 24-row matrix, raw control-state evidence, or proof of exactly five Read grants. It also did not confirm explicit cancellation of that final unsaved form. It reported no new token creation. An earlier probe's anomalous Read Only preset report is retained in the structured evidence and is not treated as a reliable baseline.

No actual bearer capture was tested. No new credential or GitHub secret was configured. **Do not retry Create on the basis of these reports.** Before creation, verify the full rendered matrix and a secure capture path. Then verify the saved token's scopes, actual authenticated identity, expiry and bounded live-read denial. A placeholder's 401, a missing route's 404, intended checkbox clicks or an unverified browser success report cannot satisfy these checks.

## Inventory decision remains unavailable

The previously submitted support request retains its acknowledgement and stated 2–3-business-day response window. The in-app Intercom support history was blocked by a persistent adblock modal. No matching conversation or vendor decision was accessible; no new support message was sent.

No connected mailbox was available for this read. The owner was asked for any reply or ticket link received at the designated email address. These access limits do not establish that Xano has not replied. Supported treatment of the retained diagnostic tables remains unresolved.

## Execution gates and retained evidence

No additional feature work was performed. Exact execution-v3 helper validation/import, the conditionally approved schema/backfill, actual index/writer-restriction verification, contention and the 31 hosted cases remain blocked.

Evidence stays separated: **121** original offline passes, **5** prior follow-up, **35** reservation-v2 and **23** execution-v3, totaling **184 retained offline passes**. No new tests ran in this documentation-only follow-up. The original **eight-candidate preview** and separate reservation-v2 preview remain historical evidence for their exact bytes; neither validates execution-v3.

Hosted execution remains **0/31**, native contention **NOT_RUN**, full 16-table rollback **NOT_RUN**. All 109 backend exports, five agent drafts, diagnostics, existing assignments, archived patches/adapters and historical evidence are preserved. Release/reuse remains unimplemented and unproven. No live database/backend change, payment execution, Xano agent run, merge or deployment occurred.

[Sanitized structured receipt](../backend/evidence/xano-access-recovery-2026-10-24.json). Active token identifiers other than the failed target, passwords, bearer credentials and secret-bearing browser links are omitted.

Sources: [Xano token administration](https://docs.xano.com/xano-features/metadata-api), [scope reference](https://docs.xano.com/xano-features/metadata-api/token-scopes-reference).
