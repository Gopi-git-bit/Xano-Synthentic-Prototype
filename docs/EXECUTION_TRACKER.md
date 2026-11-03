# Zippy Logistics — Execution Tracker and Evidence Ledger

**Document role:** Project-wide recovery checkpoint and status validator for ChatGPT, OpenCode, Codex, Xano and GitHub. Read this file before assigning new work. Update it after each completed milestone. It is not proof of production readiness by itself.

**Project governance:** [SOUL.md](../SOUL.md) sets durable intent and engineering guardrails; [DECISION.md](../DECISION.md) records owner scope, pending proposals and approval boundaries; [AGENTS.md](../AGENTS.md) is the coding-agent read order. These do not override evidence or explicit scoped approvals.

**Mandatory stage evidence:** [EVIDENCE.md](EVIDENCE.md) stores the machine-readable predecessor chain, proof scope, approval gate and evidence receipt. A completed stage requires updating BOTH documents together; the evidence-chain CI only checks structure, not Xano runtime.

**Snapshot:** 2026-11-03 (Asia/Kolkata); historical October 30 entries retained  
**Repository:** [Gopi-git-bit/Xano-Synthentic-Prototype](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype) — active project. **New-logistic- is historical reference only.**  
**Default branch:** main, last inspected at 223bae3a1b63218f050ebe48cef7903595926db7; currently Xano-exported source, **not** the deployed React frontend.  
**Scope:** Read-only status reporting. This tracker does not authorize Xano publication, GitHub merges, Vercel production deployment, credential changes, synthetic tenant provisioning, notifications or payments.  
**Maintainers:** Owner approves external effects; OpenCode owns Xano implementation/verification; ChatGPT + Composio may audit GitHub and maintain documentation; neither can claim results that its tools did not confirm.

> **Current overall gate: BLOCKED for hosted M1 acceptance and production activation.** The frontend has an implemented, testable preview and GitHub automated checks. Source/offline tests do not establish customer authentication, organization isolation, transactional booking, agent operation, payment execution, or production safety.

## 1. Read this first at the start of every session

1. Open **this file and [EVIDENCE.md](EVIDENCE.md)**, verify the previous stage's source SHA, evidence scope, blocker and approval before checking the **Next executable task**; do not repeat completed audits without a changed input.
2. Check live GitHub branch tips, open PRs and CI using the authorized GitHub connector. Compare against Section 2. GitHub data is authoritative for **GitHub commits only**, not Xano runtime.
3. If Xano is authenticated in the current environment, verify its **workspace ID, source branch, data source, effective permissions, draft/published code and tenant isolation** with read-only calls. A GitHub export or imported API catalog is not a live runtime test.
4. If OpenCode has advanced **local-only** work, inspect the exact local commit/report or private approved handoff; do not invent a public GitHub URL or treat local evidence as deployed code.
5. Update rows below only with a **source, observed result, scope, branch/commit, verification date and next action**. If evidence is missing or old, use UNKNOWN, REPORTED or BLOCKED, not VERIFIED.
6. Finish every work session by updating **Section 9 checkpoint log**, **Section 7 next task**, and [EVIDENCE.md](EVIDENCE.md) in the same reviewable change. Preserve historical evidence; do not rewrite sealed receipts. Run `node --test scripts/validate-evidence-chain.cjs`; a green structural check does not establish runtime acceptance.

### Status vocabulary

| Label | Meaning |
| --- | --- |
| VERIFIED | Specific check observed and evidenced; always qualify **source / offline / CI / live** |
| REPORTED | A prior handoff claims a result; not independently re-executed in this checkpoint |
| PASSED_CI | GitHub check concluded success for the exact referenced SHA; **not** a live integration acceptance |
| FAILED | An actually executed assertion failed, or an observed unsafe behavior remains |
| BLOCKED | Mandatory permission, approval, isolation, test identity, implementation or evidence prerequisite is missing |
| NOT_RUN | Test or operation has not executed; never count as pass |
| NOT_IMPLEMENTED | Operational component/adapter is absent or unbound |
| UNKNOWN | No recent enough proof; perform minimum read-only inspection |

**Evidence precedence:** Current verified live Xano behavior > current published Xano source with accurate scope > current CI at exact commit > current local verified tests > historical handoff. Never let a newer **reported** claim automatically override a verified contradictory result. Record the conflict.

## 2. Exact repository topology (verified from GitHub on 2026-10-30)

| Purpose | GitHub branch | Verified HEAD | Remarks |
| --- | --- | --- | --- |
| Default Xano export | main | 223bae3a1b63218f050ebe48cef7903595926db7 | Do not assume frontend or M1 review has been merged |
| Historical backend M1 preparation | codex/xano-backend-review | ed62038f571c02f339972ad7ec5d7cd1a9cffe18 | [PR #1](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/1) open |
| Active frontend work | feat/frontend-tailwind-polish | 8eeef1e0cdca218f8bdf17f792f3b2cb6b68937b | React/Vite/Tailwind frontend lives here |
| Frontend docs and quality CI | docs/frontend-readme-release-e2e-20261028 | 4c2e716aaa90e5352e45474be45eb33488f584ac | [PR #2](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/2) open, draft |
| Workspace-3 decision-gate notes | docs/m1-workspace3-review-baseline-20261029 | 7428541c8b39a46c250150adf4dba9cb7867144a | [PR #3](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/3) open, draft |
| Sanitized workspace-3 review | review/xano-m1-sanitized-20261030 | d7cda3d0cac0a53699ffd2e60d02eece1fe16abf | [PR #4](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/4) open, draft; 16 new review-only files |
| **Private original reconciliation** | codex/xano-m1-reconciliation-20261029 | **61d1b139d27646187f7d4a52bcc6546e11b70a4c** | **LOCAL PRIVATE ONLY**; not a GitHub branch, must not equate to sanitized derivative |

Private local ancestry: ed62038f571c02f339972ad7ec5d7cd1a9cffe18 → ea543e9c4679006479144fc6412597b074dd5505 → 61d1b139d27646187f7d4a52bcc6546e11b70a4c. The original ZIP and Git bundle were independently SHA-256 and ancestry verified through the connected Windows device during the 2026-10-30 review; public source deliberately omits the private evidence history. Subsequent remote-device availability must be checked when required, not assumed.

**No cross-branch merges are implied by any of these PRs.** A review branch based on codex/xano-backend-review is not automatically included in main.

## 3. Project status by workstream

| ID | Workstream / delivery | Status (evidence scope) | Evidence / checkpoint | Remaining exit condition |
| --- | --- | --- | --- | --- |
| REPO-01 | Active repo, branches, four open PRs | **VERIFIED GitHub** | Section 2; branch and PR reads 2026-10-30 | Approve/merge each PR separately; keep source lineages distinct |
| FE-01 | Customer, Vehicle Owner (including salaried driver), restricted Admin previews; Tailwind, React/Vite | **VERIFIED committed source; REPORTED preview** | [Frontend delivery](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/blob/feat/frontend-tailwind-polish/frontend/docs/DELIVERY.md) | Current protected preview and end-user flows must be independently rechecked before release |
| FE-02 | Gated customer booking reader, filters, paging, retries and session expiry | **VERIFIED committed source; mocked behavior reported** | [Frontend plan](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/blob/feat/frontend-tailwind-polish/frontend/docs/FRONTEND-PLAN.md) | Positive published Xano auth/tenant tests; keep release flags blocked |
| QA-01 | Playwright browser tests and server mock tests | **REPORTED 26 browser scenarios across full/focused reruns; 17 server mocks** | [Delivery report](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/blob/feat/frontend-tailwind-polish/frontend/docs/DELIVERY.md) | Do not claim one consolidated 26-test CI run without actual check evidence |
| QA-02 | Frontend quality GitHub Actions | **PASSED_CI** at 4c2e716... (PR #2 head) | [Frontend CI run](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/actions/runs/40654010928) | Re-run at any new merged or release SHA |
| QA-03 | Sanitized M1 refusal-source CI | **PASSED_CI**, contracts/schema succeeded, Xano HTTP jobs skipped | [Review CI](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/actions/runs/41049893920), [backend CI](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/actions/runs/41049893926) | Cannot substitute for hosted Xano refusal, tenant or rollback tests |
| XB-01 | Current Xano workspace 3 / source v1 / parent live | **REPORTED verified by OpenCode Metadata GETs** | [Sanitized M1 gate report](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/blob/review/xano-m1-sanitized-20261030/review/workspace3-m1/M1_REVIEW_AND_GATES.md); private receipts preserved | Fresh authenticated Xano read, verify current identity and isolation before provisioning |
| XB-02 | Published auth logging, authoritative identity and customer booking-read source | **VERIFIED published source in OpenCode audit; 8/8 HTTP 401 denials reported** | [Sanitized M1 gate report](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/blob/review/xano-m1-sanitized-20261030/review/workspace3-m1/M1_REVIEW_AND_GATES.md) | Approved-account login, suspended/revoked user, own/foreign tenant read and persisted-log tests |
| XB-03 | Customer booking mutation refusal | **VERIFIED static review only; hosted NOT_RUN** | [PR #4](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/4) has 12 **GUID-omitted/non-deployable** candidates | Review original private GUID-bound versions; tenant-only preview and zero-effect runtime proof after approval |
| XB-04 | Database physical constraints, write atomicity, idempotency, consent and concurrency | **FAILED source gates / BLOCKED native proof** | OpenCode 2026-10-29 reconciliation; [public gate summary](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/blob/review/xano-m1-sanitized-20261030/review/workspace3-m1/M1_REVIEW_AND_GATES.md) | Address 11 failing source gates; real transaction/uniqueness/rollback/fencing proofs |
| XB-P0 | Workspace-3 read-only capability verification | **VERIFIED_READ_ONLY (retained private receipts only)** | 55d4dd278602c5a81706db70d91b53ca363f4d9c; 7/7 archived files and 12/12 Git receipt hashes independently matched; 25/25 offline tests retained; 0 hosted | Resolve supported Essential isolation controls; Stage P NOT_APPROVED |
| XB-P1 | Stage P1 Essential platform capability decision | **VERIFIED_READ_ONLY documents/integrity; BLOCKED_PENDING_XANO_CONFIRMATION** | Private P1 commit 215d4e600bd4c7454d31c5581971e058fe6147dd; 18 public document reads, 9/9 Git receipt hashes, 0 authenticated Xano requests; support draft UNSENT | Owner reviews existing vendor correspondence and private draft, seeks supported isolation proof |
| XB-05 | Workspace-3 restricted ephemeral test environment | **BLOCKED — STAGE P NOT APPROVED** | [Gate P scope](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/blob/docs/m1-workspace3-review-baseline-20261029/docs/M1_WORKSPACE3_DECISION_GATES_20261029.md); detailed plan private | Separate owner approval, verified parent-live denial, distinct physical database, expiry and egress restrictions |
| XB-06 | Synthetic A/B fixtures, native test adapter and observer | **NOT_IMPLEMENTED adapter / BLOCKED fixtures** | Private 2026-10-29 acceptance handoff; [public summary](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/blob/review/xano-m1-sanitized-20261030/review/workspace3-m1/M1_REVIEW_AND_GATES.md) | Stage P succeeds; separate fixture/test approval; native adapter independently verified |
| XB-07 | Historical M1 31-case hosted acceptance | **0/31 hosted passes; NOT_RUN in current workspace-3 reconciliation** | [Historical staging](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/blob/codex/xano-backend-review/docs/STAGING_STATUS.md) | Do not run workspace-1 harness unchanged against workspace 3; map native invariants and run approved tests |
| AI-01 | OMS, IMS, TMS, Verification, Finance/Compliance agents | **NOT_IMPLEMENTED as authorized workspace-3 operational agents** | [Backend review handoff](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/blob/codex/xano-backend-review/backend/agent-package/CODEX_HANDOFF.md) | Deterministic security/financial/transaction controls, separate approval and audit before agent binding |
| INT-01 | Telnyx email/SMS, Outlook receiving/replies, Zoho CRM | **UNKNOWN end-to-end / BLOCKED live integration** | Earlier project configuration/handoffs; [frontend integration notes](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/blob/feat/frontend-tailwind-polish/frontend/docs/API.md) | Prove test signup → notification → inbox → admin reply; Zoho auth and per-record grants, sanitized receipts |
| INT-02 | Razorpay, refund approvals, settlement and tax/POD | **NOT VERIFIED live / execution blocked** | Project governance; sanitized gate summary | Signed provider events, ledger reconciliation, human-only finance approval, audited denial and rollback proofs |
| OPS-01 | Production launch / release switches | **BLOCKED, not authorized** | [Release policy PR #2](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/2) | Approved published Xano contracts, tenant proofs, end-to-end tests and explicit owner release |
| FE-SB-ADAPTER | PR #12 server adapter → reproduced PR #10 customer backend | **VERIFIED_HOSTED — sandbox-only PASS** | [Actual HTTP report/receipts](evidence/sandbox-customer-http-20261103/README.md); frontend `697da352`, backend `4421892`; fresh tenant 6 / `exwq-wsmx-c3e1` | Review evidence; protected browser preview unrun; formal Stage P/AB/C and production gates remain blocked |
| FE-SB-BROWSER | PR #13 Customer UI → protected gateway → isolated Xano | **Implemented/local checks PASS; hosted acceptance BLOCKED** | `feat/protected-customer-xano-20261103` at `1f4953c10d420d78522c7b7561df789556e2eb58`; 89/89 mock server tests, 57/57 local Playwright, 7/7 overlapping enhanced rerun; [receipt package](evidence/customer-browser-gateway-20261103/README.md) | Shared Redis/key/origin configuration and separately authorized preview automation access; actual browser workflow NOT_RUN |

**Important:** historical workspace-1 51-versus-53 physical table observations and the 72 PostgreSQL reference cases are not current workspace-3 acceptance. Workspace-3 metadata **33 table declarations** is not a verified physical constraint count. Avoid reconciling by deletion or assumed equivalence.

### November 3 sandbox checkpoint — updated evidence scope

OpenCode pushed source and sanitized receipts at commit 4421892ff9c884e43711753cacde04efd4ddb7c6. ChatGPT independently verified the GitHub branch and created draft [PR #10](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/10). OpenCode reports seven read-only tools (48/48 syntax and 65/65 synthetic tool-debug tests) and an independent customer onboarding/draft milestone (45/45 syntax and 48/48 synthetic HTTP tests). Those runtime claims were **not re-executed by ChatGPT**. Both tenants are temporary and expire on November 4.

The canonical Stage P / Stage AB predecessor chain in EVIDENCE.md still lacks separately recorded owner approval and independent full-isolation acceptance. The sandbox work is a distinct REVIEW_ONLY evidence stream; it must not be used to relabel production as ready. The older October 30 table below remains historical, not the latest execution status.

### November 3 — Frontend sandbox adapter (initial CI checkpoint; superseded by HTTP checkpoint below)

Owner explicitly approved this sandbox-only vertical slice in conversation on November 3. This grants no live publication, payment, dispatch, provider or formal Stage P/AB/C approval.


[Draft PR #12](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/12) implements server-only customer registration → login → membership → draft POST → booking list/detail against exact isolated Xano API canonicals. The six new mocked Node tests passed locally; [frontend GitHub CI](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/actions/runs/41592096570) passed at commit 697da352a331dbe623cb21d81704bfc892079327, including existing server/build/browser checks. Hosted Xano readonly HTTP checks remained skipped. The sandbox adapter is **not** imported by production gateway and the manual synthetic Xano-through-adapter probe was **NOT_RUN**. This is frontend-source and CI evidence, not cross-stack acceptance.

### November 3 — Approved customer cross-stack HTTP execution: PASS

The owner explicitly requested execution of PR #10 + PR #12 in a fresh isolated tenant, with PR #11 as tracker, synthetic registration/login/drafts only. OpenCode executed the unchanged frontend at **697da352a331dbe623cb21d81704bfc892079327** against the exact **4421892ff9c884e43711753cacde04efd4ddb7c6** backend in fresh tenant **6 / `exwq-wsmx-c3e1`**, internal workspace **1**, expiring **2026-11-04 06:56:09 UTC**.

**45/45** source definitions matched/validated, **67/67** frontend server tests passed, and all **seven** prescribed real HTTP calls returned **200** with full schema and secret-exclusion checks. Additional A/B isolation, equivalent foreign/missing 404, forged-state denial, replay/no-write and parent-token denial checks passed. The initial supplementary **15/16** result is preserved: one assertion incorrectly equated absent-token and invalid-token denial bodies; a targeted recheck passed and found no product defect. **60 runtime HTTP receipts** are retained. The tenant has only synthetic records, zero configured environment keys and no executable provider/agent resources; tasks remain disabled.

Both tested worktrees stayed clean. All **87 published and 87 draft** parent-workspace files are byte-identical before/after. [Report, exact commands, hashes, limitations and receipts](evidence/sandbox-customer-http-20261103/README.md). This supersedes FE-SB-ADAPTER's NOT_RUN cross-stack blocker only; browser acceptance and formal Stage P/AB/C/production gates remain blocked.

### November 3 — Protected synthetic browser preview, CI and Vercel build accepted

[PR #13](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/13) at 4fd844b66901a387898e2c35e83714b96c999ba9 added an explicit synthetic-only customer UI to the Vite frontend. It implements registration, login, local draft booking and order detail, session expiry and disabled quote/payment/dispatch controls. Frontend CI [success](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/actions/runs/41597929982), including Playwright browser tests; backend schema-contract CI success. Vercel preview [READY](https://zippy-frontend-preview-gxai1q2gd-gopi-nathan-s-projects.vercel.app/?sandbox=1), deployment dpl_5NqdHNGjbeq6z5CcUzZevnniuecc; project SSO protection verified for all previews and build log confirms vite --mode sandbox-preview and compiled CustomerPreview chunk. Standard production builds still exclude this UI. The hosted page was **not** interactively exercised here due to SSO, and the preview is entirely in-memory synthetic: real browser → Xano HTTP is **NOT_RUN**.

### November 3 — GitHub PR14 and preview-only Vercel configuration checkpoint

[PR #14](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/14) is a draft from the pushed protected Customer Xano gateway implementation at 1f4953c10d420d78522c7b7561df789556e2eb58. [GitHub frontend CI](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/actions/runs/41608148770) and contracts/schema checks passed at that commit; Xano HTTP job was SKIPPED. Vercel independently reports protected preview deployment `dpl_FjVaaPYPpVqcs1ddFJrEn3ssv4Wy` READY for the exact SHA and SSO enabled for all previews. Composio verified seven committed OpenCode sanitized receipt hashes out of seven.

The Vercel project was configured with **three branch-scoped preview env values** (exact `ZIPPY_SANDBOX_WEB_ORIGIN`, sensitive encrypted `ZIPPY_SANDBOX_SESSION_KEY`, and 900-second `ZIPPY_SANDBOX_SESSION_TTL_SECONDS`). No decrypted values are recorded here. The `ZIPPY_SANDBOX_GATEWAY_RELEASE` flag was deliberately **not set**; no Redis credentials or automation bypass secret was installed, so the hosted customer browser gateway stays closed. Upstash is not installed on the team; marketplace terms need the owner. OpenCode MCP OAuth requires a local interactive sign-in and was not completed from ChatGPT. Existing production variables, SSO and production deployment were not changed. These scoped settings apply to FUTURE deployments, not retroactively to the already READY commit.

The project-wide most-recent docs-only deployment may show ERROR because that branch lacks the `frontend` root; this does not override the separately verified READY customer preview. No hosted browser-to-Xano acceptance was executed or inferred.

### November 3 — Upstash free store, branch-only runtime integration and CI

After owner reported accepting Upstash marketplace terms, ChatGPT verified installation `icfg_wI3CEvAD0eO5LIyV7YhTCB4L` and provisioned Upstash Redis store `store_Mu40uIAJoE7QLDvY`, FREE plan, Mumbai primary region, `autoUpgrade=false`, `prodPack=false`. It was connected only to **preview**, and all five injected `KV_*/REDIS_URL` environment variables were immediately restricted to `feat/protected-customer-xano-20261103`. No production environment variables or live payment/dispatch APIs were modified. The branch-only `ZIPPY_SANDBOX_SESSION_KEY` was rotated with a CSPRNG-generated 32-byte value; no value is recorded in evidence. The `ZIPPY_SANDBOX_WEB_ORIGIN` was pinned to the stable protected branch alias, TTL to 900 seconds, and the explicitly gated `ZIPPY_SANDBOX_GATEWAY_RELEASE=synthetic-only` flag was set for the same branch alone.

The server gateway was patched to accept either a *complete* explicit `ZIPPY_SANDBOX_REDIS_*` pair or the Vercel-managed sensitive `KV_REST_API_*` pair, never a mixed pair. Commit `da5db4e0cd997694b6c90d09adea793a7325f393` has [GitHub frontend CI](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/actions/runs/41611434258) and contracts/schema PASS; hosted Xano readonly HTTP check SKIPPED. A new Git-based Vercel preview `dpl_AMN1hxr9GhVfkoAXrEKRVmWknGLU` is READY for the exact commit with SSO preserved; no production promotion occurred.

A Vercel-authenticated GET to `/api/sandbox/csrf` returned 400 `INVALID_QUERY` because the temporary share-link client added a protection URL query parameter, which the strict sandbox gateway rejected. This **does not** verify Redis session initialization or an actual browser-to-Xano HTTP flow. The query guard was not weakened. The user says local OpenCode Vercel MCP OAuth is now connected, but the connected Windows desktop agent is offline and ChatGPT cannot independently verify that client. No project-wide SSO automation bypass was generated. Current hosted E2E verdict remains **BLOCKED / NOT_RUN**. A real authorized browser test needs a session authenticated on the protected preview, current Xano tenant identity and no secret leakage.

## 4. Current known defects and unresolved proof

### November 3 — Connected browser gateway implemented; actual acceptance BLOCKED

Owner requested the protected browser-to-Xano milestone and Vercel setup. The dedicated branch based on PR #13 implements a separate `/api/sandbox/*` boundary with exact tenant/API pins, synthetic registration, current membership authorization, signed CSRF/Origin protection, shared encrypted Redis sessions, durable logout/expiry, request limits and idempotent drafts. PR #13's Customer UI is reused. TypeScript, ESLint, standard and connected builds, **89/89** server tests, **57/57** local Playwright and an overlapping enhanced **7/7** browser-security rerun passed. Static bundle/CSP checks passed; shipped-dependency audit reported zero vulnerabilities. These are source/mock/local checks, not actual browser-to-Xano acceptance.

Tenant **6 / `exwq-wsmx-c3e1`**, internal workspace **1**, expires **2026-11-04 06:56:09 UTC**; read-only checks reconfirmed synthetic-only counts, zero secrets/executable integrations and disabled tasks. Original 42/45 literal token comparisons are retained; manual diff review plus formatting normalization matched 45/45 definitions. Parent **87 published + 87 draft** files stayed byte-identical. Zero Xano writes occurred in this browser milestone.

Implementation commit **`1f4953c10d420d78522c7b7561df789556e2eb58`** is pushed; Git automatically produced READY preview **`dpl_FjVaaPYPpVqcs1ddFJrEn3ssv4Wy`** at [the new deployment](https://zippy-frontend-preview-grsvluv3a-gopi-nathan-s-projects.vercel.app/?sandbox=1). CLI 65.10.0 is authenticated, global OpenCode Vercel skills are installed, and the shared MCP endpoint is configured with confirmation enabled. MCP OAuth still requires completion. Free Upstash provisioning stopped at human terms acceptance; no resource or automation secret exists. Production inventory, environment metadata and SSO match the authenticated baseline. The real-browser command stopped at configuration validation before calls/writes. See [evidence, retained failures and next dependencies](evidence/customer-browser-gateway-20261103/README.md).

- **11 failing draft source-readiness checks** in the private reconciliation: untrusted 480-km distance fallback; booking insert before full cargo validation; second-resolution reference collisions; missing create/confirm transactions; optional idempotency key; unenforced expiry; insufficient assignment uniqueness; absent worker fencing; fixed OTP; OTP consumed before decision validation. Retain actual test failures; no draft promotion.
- Additional unresolved controls: atomic expected-version write predicate; supported physical uniqueness/exclusion indexes; true independent vehicle/driver contention; crash/replay and non-database rollback; signed payment evidence and human-only refunds.
- Published auth/read source has newer hardening than some older frontend handoffs. **Do not overwrite it with earlier drafts** or infer positive runtime acceptance from eight denied anonymous/malformed-token requests.
- Formal Stage P still lacks restricted-credential/physical-isolation acceptance. The approved November 3 customer sandbox slice now has positive auth, owned synthetic A/B fixtures and app-token denial receipts; these do not certify the original full M1 observer/acceptance, operational agents or live payment/notification workflows.
- Original private SHA **61d1b139...** remains distinct from public sanitized review SHA **d7cda3d0...**. Never expose raw bundle, machine paths, principal/permission inventory or original source GUIDs through public commits.

## 5. Decisions and approvals

| Gate | Decision/status | Who may authorize | Allowed now |
| --- | --- | --- | --- |
| G: Public sanitized source review | **APPROVED by owner, executed in PR #4** | Owner | Review and source CI only; no merge implied |
| G-private: Publish unredacted local history | **NOT APPROVED** | Owner after disclosure review | Preserve privately only |
| P0: Read-only Xano capability and permission discovery | **ALLOWED** | Existing read authorization | OpenCode may verify the exact workspace/effective scope; no customer records |
| P: Create one workspace-3 ephemeral tenant, proposed four hours, one-hour restricted credential | **APPROVAL REQUIRED** | Owner, with supported RBAC capability | Prepare/validate exact scope; **no creation, token issuance or source import** |
| F/AB: Create 2 organizations, 7 synthetic users, 6 memberships, 5 bookings, 2 cargo rows and 2 holds; execute tests | **SEPARATE APPROVAL REQUIRED** | Owner after Stage P proof | Prepare fixture/test plan only |
| C: Transaction/dispatch/finance/agent execution | **BLOCKED** | Owner after isolated native acceptance and policy decisions | Read-only design, static test preparation |
| R: Live Xano publication / production Vercel / payments / notifications | **NOT AUTHORIZED** | Owner plus release gates | Nothing live |

The prior user approval to create a **sanitized public GitHub review branch** is not a Stage P tenant-provisioning approval, not a PR merge instruction, and not consent to upload unredacted history.

## 6. Evidence register and freshness checks

| ID | Source / exact reference | Checked | Limits |
| --- | --- | --- | --- |
| E-GH-01 | [Repository](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype), branch refs and PR #1–#4 | 2026-10-30 via Composio | GitHub refs/PRs only |
| E-CI-01 | [Frontend quality run](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/actions/runs/40654010928) at 4c2e716... | 2026-10-30 re-read | Browser/server checks on docs review commit; not live Xano |
| E-CI-02 | [Sanitized review CI](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/actions/runs/41049893920), [backend offline CI](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/actions/runs/41049893926) at d7cda3d... | 2026-10-30 | Source/offline success; xano-readonly-http SKIPPED |
| E-FE-01 | [Frontend delivery](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/blob/feat/frontend-tailwind-polish/frontend/docs/DELIVERY.md), [handoff](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/blob/feat/frontend-tailwind-polish/frontend/docs/FRONTEND-PLAN.md) | 2026-10-30 read | Includes historical local tests and reported preview, not new execution |
| E-XB-01 | [Backend staging](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/blob/codex/xano-backend-review/docs/STAGING_STATUS.md), [sanitized review](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/blob/review/xano-m1-sanitized-20261030/review/workspace3-m1/M1_REVIEW_AND_GATES.md) | 2026-10-30 read | Distinct workspace-1 and workspace-3 evidence lineages |
| E-PRIVATE-01 | Original private branch 61d1b139... and verified ZIP/bundle, kept only on authorized Windows device | 2026-10-30 prior verified inspection | Not accessible as a GitHub source; recheck device before relying on new local changes |
| E-XANO-01 | OpenCode authenticated Metadata/API capture, private sealed receipts | Last handoff 2026-10-29 | Current direct ChatGPT Xano session **not verified**, no positive app credentials or isolated runtime acceptance |

| E-GH-20261103 | [Backend draft PR #10](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/10), head 4421892ff9c884e43711753cacde04efd4ddb7c6 | 2026-11-03 via Composio | GitHub commit and PR only; runtime evidence was OpenCode-reported |
| E-HTTP-20261103 | [Customer cross-stack sandbox receipt package](evidence/sandbox-customer-http-20261103/README.md) | 2026-11-03 actual OpenCode HTTP execution | Pinned PR #10/#12, tenant 6, server adapter only; retained test-expectation failure and passing recheck; no browser or production acceptance |

Refresh all branch refs and CI on every handoff; refresh Xano runtime before a change/approval. Do not silently carry a stale status forward when a dependency or SHA changes. Credential values, private identity mappings and customer data must stay out of Markdown.

## 7. Next executable task — application architecture checkpoint, November 3

1. **OpenCode / Xano:** review the completed [sandbox HTTP receipt package](evidence/sandbox-customer-http-20261103/README.md). Revalidate only when the tested source, tenant lifetime or permissions change. Separately resolve formal restricted-credential, physical database identity and expiry/recovery proof before advancing Stage P.
2. **Frontend / Vercel:** [draft PR #14](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/14) is CI-green at `da5db4e0cd997694b6c90d09adea793a7325f393`; FREE Upstash Redis is now provisioned and connected only to the preview branch with sensitive credentials and CSPRNG session key, and the exact protected branch alias is pinned. The synthetic-only gateway release is enabled on this **one preview branch**, while production remains blocked. User reports OpenCode Vercel MCP OAuth connected (not independently verifiable via currently offline desktop). Real browser-to-Xano acceptance remains NOT_RUN because an authenticated same-origin browser session / authorized protection access is still required. Do not weaken strict query guards to accommodate share-link parameters; use authorized SSO access, reverify tenant before expiry, then run the Playwright browser harness and sanitize receipts.
3. **Operational backend order:** cargo/pricing and Mappls provenance → vendor/driver-scoped reads → atomic assignment and trip offers → private POD and tracking → Telnyx notification outbox → Razorpay test-mode payment/refund human approvals → Zoho CRM mapping.
4. **Native agents:** build OMS, IMS, TMS, Verification and Finance/Compliance as least-privilege assessment-only tools after deterministic services and authorization work. No autonomous dispatch or financial approval.
5. **Release:** require a separately approved Stage P/AB/C evidence chain, current source hashes, complete E2E denial/rollback tests and owner approval before merging to main or publishing to Xano/Vercel production.

**Exact next artifact:** Upstash free session storage and scoped preview runtime are now configured; run an *authenticated*, genuinely same-origin browser test against the rebuilt protected PR14 preview and active Xano tenant, record Redis/session checks and the complete sandbox Xano flow in a sanitized `npm run test:sandbox:browser` receipt. Current verdict is **BLOCKED**, not `CUSTOMER_SANDBOX_BROWSER_E2E_PASS`. Preserve the 89/57 local test results and prior seven-step HTTP PASS; rerun unchanged local checks only if source changes. Reverify the tenant after its November 4 expiration before any new execution.

## 8. Reusable OpenCode/ChatGPT resume contract

> Read docs/EXECUTION_TRACKER.md and docs/EVIDENCE.md in Gopi-git-bit/Xano-Synthentic-Prototype before starting. Identify the active repo, exact branch SHAs, current blockers, approvals and Section 7 next task. Refresh only the sources needed to validate the proposed action; keep source/offline, CI and hosted Xano evidence separate. Do not rerun unchanged historical tests or change live Xano. Complete the next permitted task, link sanitized proof, update the workstream row plus checkpoint log, and return DONE / BLOCKED / NOT RUN with one exact successor. Never report success from source presence or a green CI job alone.

ChatGPT should request new OpenCode status only when the tracker is stale, an approval gate has changed, or the needed runtime proof is unavailable through its connectors. If OpenCode cannot push due to Windows Git TLS resets, produce a **private** handoff/patch; Composio can review GitHub without making the raw evidence public.

## 9. Append-only checkpoint history

| Date (IST) | Actor | Change / outcome | Evidence | Next checkpoint |
| --- | --- | --- | --- | --- |
| 2026-10-23 | OpenCode/Codex | Historical backend M1 review pinned; 0/31 hosted acceptance, 184 offline checks reported | [PR #1](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/1) | Do not treat workspace-1 results as workspace-3 acceptance |
| 2026-10-28 | OpenCode + ChatGPT | Frontend reader/source delivered; docs and GitHub quality validation prepared | [Frontend commit](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/commit/8eeef1e0cdca218f8bdf17f792f3b2cb6b68937b), [PR #2](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/2) | Backend auth/read positive acceptance |
| 2026-10-29 | OpenCode | Workspace-3 reconciliation, source gaps, 12 refusal candidates and isolation plan completed locally | Private ancestors ea543e9... / 61d1b139...; [public gate notes PR #3](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/3) | Stage P capability and approval |
| 2026-10-30 | ChatGPT + Composio | Private bundle/hash and ancestry verified in prior inspection; user-approved sanitized review published; source CI passed; original history kept private | [PR #4](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/4), E-CI-02 | OpenCode Stage P0 read-only assessment |
| 2026-10-30 | ChatGPT + Composio | Established first centralized project execution tracker from GitHub, documented handoffs and private audit summary; no production operations | This tracker review commit/PR | Owner review and regular checkpoint updates |
| 2026-10-30 | ChatGPT + Composio | Linked predecessor evidence chain and a structural transition validator; Stage P0 NOT_RUN and Stage P NOT_APPROVED | [EVIDENCE.md](EVIDENCE.md), [validator](../scripts/validate-evidence-chain.cjs), [CI workflow](../.github/workflows/evidence-chain.yml) | OpenCode Stage P0 read-only verification and new evidence receipt |

| 2026-10-30 | OpenCode (reported) | Private P0 read-only discovery completed, 59/59 source integrity, 25/25 offline checks; private commit 55d4dd2, clean private worktree; canonical tracker unavailable in OpenCode | Private receipt SHA-256 9074cc849dcda0c57dc274b6186dd59f8b47018ce9c1ae468d1855fba142ebdf; handoff ZIP SHA-256 da33dc5e6cdb2702246653603ecddf6ee3c5ed601cc165e5bef24fd808cc3130 | Independently inspect private receipts; Stage P NOT_APPROVED |
| 2026-10-30 | ChatGPT + Composio | Synchronized public Stage P0 as REPORTED only; no hosted proof or Stage P approval claimed | [EVIDENCE.md](EVIDENCE.md), PR #5 | Complete independent receipt comparison and check supported platform controls |

| 2026-10-30 | ChatGPT + Remote Desktop Commander | Independently verified private P0 handoff ZIP SHA-256 da33dc5e6cdb2702246653603ecddf6ee3c5ed601cc165e5bef24fd808cc3130, 7 archive entries, private Git HEAD/parent/clean state, 12/12 Git object receipt hashes and source/test summary | Private commit 55d4dd278602c5a81706db70d91b53ca363f4d9c; [EVIDENCE.md](EVIDENCE.md) | Stage P platform capability review only; do not create tenant |

| 2026-10-30 | OpenCode / ChatGPT (remote Git audit) | P1 documentation-only review completed; private ZIP and 9/9 original Git evidence object hashes confirmed, seven capability outcomes unresolved | P1 commit 215d4e600bd4c7454d31c5581971e058fe6147dd; [EVIDENCE.md](EVIDENCE.md); handoff SHA-256 15336d59c6f04efb40272bf418d5a430b430f1aa77d88218ba33e3ff7394e752 | Owner reviews Xano support draft; no Stage P permission |

| 2026-11-03 | OpenCode (reported) + ChatGPT/Composio (GitHub observed) | Seven tool-review objects and customer-draft HTTP milestone source pushed; draft PR #10 opened; 65/65 and 48/48 sandbox tests reported, not independently re-run | [PR #10](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/10), commit 4421892ff9c884e43711753cacde04efd4ddb7c6; EVIDENCE.md W3-SB-TOOLS / W3-SB-CUSTOMER | Reproduce stable sandbox auth/draft API and build versioned frontend contract; Stage P and production remain blocked |

| 2026-11-03 | ChatGPT + Composio (GitHub CI verified) | Sandbox-only customer adapter, synthetic manual HTTP probe and contract tests added; 6/6 mocked adapter tests and frontend GitHub CI passed; real cross-stack HTTP through adapter NOT_RUN | [PR #12](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/12), commit 697da352a331dbe623cb21d81704bfc892079327, [frontend CI](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/actions/runs/41592096570); FE-SB-ADAPTER in [EVIDENCE.md](EVIDENCE.md) | OpenCode must execute manual synthetic HTTP probe on independently verified tenant; production writes stay blocked |

| 2026-11-03 | OpenCode (actual HTTP observed) | Owner-approved sandbox customer slice **PASS / VERIFIED_HOSTED sandbox-only**: 45/45 definitions, 67/67 server tests, seven-step adapter 200s, 60 HTTP receipts; original supplementary 15/16 assertion retained with passing targeted recheck; parent definitions unchanged | PR #10 `review/zippy-agent-tools-20261103` at `4421892ff9c884e43711753cacde04efd4ddb7c6`; PR #12 `feat/sandbox-customer-vertical-20261103` at `697da352a331dbe623cb21d81704bfc892079327`; tenant 6 / `exwq-wsmx-c3e1`; [sanitized receipt package](evidence/sandbox-customer-http-20261103/README.md); explicit November 3 execution request | Review evidence and prepare scoped protected sandbox UI proposal; original Stage P/AB/C and production remain blocked |

| 2026-11-03 | ChatGPT + Composio / Vercel | Protected synthetic browser UI implemented and preview deployed: customer registration/login/draft/list/detail, sign-out and expiry. Frontend+contract CI PASS, Vercel preview READY with SSO. No real browser-to-Xano API | [PR #13](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/13), 4fd844b66901a387898e2c35e83714b96c999ba9, [frontend CI](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/actions/runs/41597929982), [protected preview](https://zippy-frontend-preview-gxai1q2gd-gopi-nathan-s-projects.vercel.app/?sandbox=1) | Authorize and implement separate preview-only sandbox HTTP gateway; do not activate production routes |

| 2026-11-03 | OpenCode (implementation, local tests, read-only cloud verification) | Protected gateway and reused Customer UI pushed; 89/89 server and 57/57 local Playwright PASS, enhanced overlapping 7/7 rerun PASS; real browser acceptance BLOCKED before writes; Vercel CLI/guidance installed and Git preview READY | `feat/protected-customer-xano-20261103` / `1f4953c10d420d78522c7b7561df789556e2eb58`; [sanitized receipts](evidence/customer-browser-gateway-20261103/README.md); owner November 3 protected-browser execution request | Complete shared-store/preview access configuration and run actual protected browser harness; no production release or PR merge |

| 2026-11-03 | ChatGPT + Composio + Vercel | OpenCode branch preserved as draft PR #14 at 1f4953c1; frontend and schema GitHub CI passed, Xano HTTP CI skipped; exact-commit SSO preview READY. Added three PREVIEW-only, branch-scoped non-release env variables (origin, sensitive signing key, TTL); gateway release switch remains unset; Upstash/automation/OAuth and actual hosted browser acceptance BLOCKED | [PR #14](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/14), [frontend CI](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/actions/runs/41608148770), [protected preview](https://zippy-frontend-preview-grsvluv3a-gopi-nathan-s-projects.vercel.app/?sandbox=1), Vercel project env metadata read | Human Upstash terms and OpenCode MCP OAuth; authorize narrowly scoped automation, add Redis and enable dedicated preview only after verification. Production unchanged |

| 2026-11-03 | ChatGPT + Vercel / Composio | User-approved Upstash terms confirmed; created FREE Upstash Redis (Mumbai, no auto-upgrade), connected preview-only and scoped all five secrets to one protected PR14 branch; gateway reads Marketplace Redis variables at da5db4e0 with GitHub CI PASS and refreshed Vercel preview READY. Stable branch origin, CSPRNG session key, 900s TTL and synthetic-only preview release configured. Protected read via Vercel temporary share-link returned 400 INVALID_QUERY before session-storage verification; actual browser E2E NOT_RUN | [PR14](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/14), [CI](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/actions/runs/41611434258), [protected preview](https://zippy-frontend-preview-git-feat-p-d61403-gopi-nathan-s-projects.vercel.app/?sandbox=1), FE-SB-UPSTASH in [EVIDENCE.md](EVIDENCE.md) | OpenCode Vercel MCP connected (user reported), requires authorized SSO browser access, no project-wide bypass; verify Redis initialization on same-origin browser and test Xano sandbox before expiry. Production unchanged |

### Required new checkpoint row

When new work finishes, append **date; actor; specific delivered artifact; exact branch+SHA; VERIFIED/FAILED/BLOCKED/NOT_RUN scope; test/CI/runtime evidence link or private receipt identifier; owner approval reference; next executable task**. Update earlier table rows to reflect newly verified facts, but preserve the historical checkpoint log and explicitly note superseded evidence.

**Tracker health rule:** If a branch SHA, Xano published definition, data source, credential scope, approval, or CI result changes, mark dependent claims **NEEDS_REVALIDATION** until checks are rerun. Never overwrite a failure with a plan or an unexecuted test.
