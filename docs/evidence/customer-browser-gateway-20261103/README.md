# Protected customer browser gateway — BLOCKED hosted acceptance

**Verdict: BLOCKED.** The protected gateway and connected Customer UI are implemented and tested locally. No actual protected-browser-to-Xano flow ran; no browser-milestone Xano writes occurred. The earlier server-adapter HTTP PASS remains separate evidence.

## Pinned sources and versions

| Source | Exact commit |
| --- | --- |
| PR #10 backend / API `0.2.0-sandbox-customer` | `4421892ff9c884e43711753cacde04efd4ddb7c6` |
| PR #12 server adapter | `697da352a331dbe623cb21d81704bfc892079327` |
| PR #13 reused Customer UI / branch base | `4fd844b66901a387898e2c35e83714b96c999ba9` |
| Gateway / browser API `0.3.0-sandbox-browser` | `1f4953c10d420d78522c7b7561df789556e2eb58` |
| PR #11 checkpoint extended by this evidence | `c4268886486bd5fd2642c07586bf2bd5ba4c34d5` |
| Main observed | `223bae3a1b63218f050ebe48cef7903595926db7` |

Implementation branch: **`feat/protected-customer-xano-20261103`**, pushed through SSH. GitHub CLI was unauthenticated; PR creation is handed to ChatGPT + Composio. No PR was merged and no existing frontend branch was overwritten. Local checks below ran on the source subsequently committed at `1f4953c`; no application source changed after those checks.

Git automatically built READY preview **`dpl_FjVaaPYPpVqcs1ddFJrEn3ssv4Wy`** for this exact commit: `https://zippy-frontend-preview-grsvluv3a-gopi-nathan-s-projects.vercel.app/?sandbox=1`. Its build log confirms `sandbox-preview` and `CustomerPreview-BYAUwp8k.js`; an unauthenticated GET returned **302 to Vercel SSO** ([receipt](preview-deployment.json)). READY is build/deployment evidence only; the gateway remains closed until preview configuration is supplied.

## Implemented boundary

The separate `/api/sandbox/*` gateway provides synthetic registration, login/logout, identity/membership, idempotent draft POST and own-organization list/detail. It pins the exact Xano origin/tenant/two application groups and expiration. Browser-selected roles, organizations, tenant URLs, financial fields and operational status are rejected. The browser has no Metadata, MCP, debug, internal transaction or operational route.

Opaque `__Host-` Secure/HttpOnly/SameSite cookies reference shared Redis state containing AES-256-GCM encrypted Xano tokens. HMAC-keyed rate counters, TTL, durable logout deletion, exact Origin/signed-CSRF checks, bounded requests and current Xano membership checks enforce the server boundary. Deployed sessions have no in-memory fallback. The existing responsive Customer UI is reused; production Customer/Vehicle Owner/Admin gates are preserved.

Deployment instructions and exact variables: [`frontend/docs/SANDBOX_GATEWAY.md`](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/blob/1f4953c10d420d78522c7b7561df789556e2eb58/frontend/docs/SANDBOX_GATEWAY.md). Implementation paths include `frontend/api/sandbox.mjs`, `frontend/server/sandbox-{gateway,store,target}.mjs`, `frontend/src/sandbox/`, `frontend/tests/sandbox-gateway-ui.spec.ts` and `frontend/sandbox-e2e/customer.spec.ts`.

## Checks actually executed

| Command / check | Result | Scope |
| --- | --- | --- |
| `npm run typecheck` | PASS | TypeScript source |
| `npm run lint` | PASS | ESLint source, server and both test harnesses |
| `npm run build` | PASS | Standard production artifact; sandbox UI excluded |
| Connected `sandbox-preview` build to `dist-sandbox` | PASS | Preview artifact only |
| `npm run test:server` | **89/89 PASS** | Mock-backed server/Redis contracts |
| `npm test` | **57/57 PASS** | Local/mocked Playwright, including existing role experiences |
| Targeted enhanced gateway UI/security rerun | **7/7 PASS** | Overlaps the 57; do not add counts |
| `npm run scan:sandbox:browser` | PASS | Static bundle boundary and CSP |
| `npm audit --omit=dev --json` | **0 vulnerabilities** | Shipped dependencies |
| `npm run test:sandbox:browser` | **BLOCKED before tests/writes** | Missing protected access, Redis and session-key configuration |
| `node --test scripts/validate-evidence-chain.cjs` | **3/3 PASS** | PR #11 documentation structure only |

Mock-backed negatives cover organization A/B ownership and foreign/missing 404 equivalence, unchanged-UUID replay and changed-payload denial, invalid credentials, revoked membership, server expiry, cross-instance logout replay, shared-store failure, Origin/CSRF/fetch-site rejection, caller authority injection, quotas and unavailable operational endpoints. Browser checks cover 320px, 390px and 1440px, no serious/critical axe violations, same-origin egress, empty local/session storage and no test password in URL/console. None of these mocked assertions is reported as a genuine hosted browser security pass.

The real harness contains no response fulfillment, injects authorized protection access only on the exact preview origin, checks deployed commit/version, and disables traces/videos/screenshots/raw error reports. Its sanitized reporter has **no actual browser result** for this milestone because configuration validation prevented execution.

## Independently reverified Xano target

- Origin `https://xynd-fnea-khtp.n7e.xano.io`; parent workspace **3**, branch **v1**.
- Ephemeral tenant **6 / `exwq-wsmx-c3e1`**, internal workspace **1**, expires **2026-11-04 06:56:09 UTC**.
- **34 tables, two API groups, two functions, seven application endpoints**; tasks disabled, **zero environment keys**, zero executable task/agent/tool/MCP/trigger resources. Both API groups have history disabled. Seven AI tool review objects remain outside this browser tenant/gateway.
- Synthetic counts equal the prior HTTP milestone: four users/organizations/memberships/reviews, three drafts/idempotency claims, seven audit rows; the other **27 tables empty**. Names/emails are synthetic; organization verification remains pending. No copied production data or secrets observed in this tenant.
- Original source comparison retained **42/45** literal token-normalized matches. The three full diffs were reviewed: Xano expands inline arrays/objects and removes comma separators. A supplemental comparison preserving string contents, field/token order and operators matches **45/45** after that formatting normalization. This is not a new runtime execution or a formal parser equivalence proof.
- Parent definitions remain byte-identical across **87 published + 87 draft** files. Published manifest: `1adb98815dc92334bb927b83f1a60bf1c3ed39408e5489ad563e272ec1471596`; draft manifest: `4b3d93690516fdfdba2f91c5e7c587d0b1d21030fbf67b3d4385c1ec708817eb`.

Receipts: [tenant verification](tenant-verification.json), [original source integrity](source-integrity.json), [formatting supplement](source-comparison-supplement.json). Production records were not read; unchanged-source proof and zero issued mutations do not attest unrelated concurrent database activity.

## Vercel setup and remaining dependencies

The requested `https://vercel.com/get-started.md` was followed: Vercel CLI **65.10.0** installed and login verified. The OpenCode plugin failed twice with an unknown Git error; after consulting its documentation, the standalone guidance pack was installed globally for OpenCode. HTTPS skill download failed; cloning the official repository over the existing pinned SSH connection and installing locally succeeded. Existing MCP settings were preserved, `vercel` was added at **`https://mcp.vercel.com`**, and explicit confirmation was configured for its MCP tools. MCP OAuth remained pending at this checkpoint, so documentation-search and authenticated `list_teams` checks were not performed.

Authenticated project inspection verified `zippy-frontend-preview`, Vite, root `frontend`, and SSO `prod_deployment_urls_and_all_previews`. The local worktree was linked to that existing project. Its environment metadata has no sandbox Redis/session-key configuration; it has no automation-access secret or linked integration resources. A free isolated Upstash Redis request, with auto-upgrade disabled and no project connection, stopped at **human marketplace-terms acceptance**; no Redis resource was created. The user reported completing browser steps, but subsequent tool checks still reported both prerequisites pending; retain the observed status.

The supplied canonical alias returned **404**; the supplied PR #13 deployment returned **302 to Vercel SSO** ([HTTP receipts](preview-access.json)). A project-wide automation secret would authorize all deployments, including the existing production deployment URL; separate authorization was requested but not established. No secret was created and SSO was not relaxed.

Read-only Vercel production inventory was captured after CLI login: one READY production deployment `dpl_BCeJ4MiyWhhkaxCXCttNSbnAwqxH`, commit `8eeef1e0cdca218f8bdf17f792f3b2cb6b68937b`. The final authenticated comparison is recorded in `vercel-production-integrity.json`. No production deployment, promotion, release-setting change, Xano publication/mutation, migration, payment/refund, dispatch, notification or operational-agent execution was issued.

**Next executable task:** finish MCP OAuth and Upstash terms acceptance, provide separately authorized preview automation access, provision/configure the dedicated shared store and preview-only session key/origin, then deploy the exact implementation SHA to an SSO-protected preview. Recheck tenant lifetime and deployment commit, set the documented local runner variables, and run `npm run test:sandbox:browser`. Claim `CUSTOMER_SANDBOX_BROWSER_E2E_PASS` only after the actual workflow and required denials pass.

## Preserved failures and limitations

Initial implementation checks caught a missing CSRF-condition parenthesis and two React Hooks lint findings; these were fixed before the passing checks. The first `npm ci` timed out; its later background run completed. Original source-comparison and preview-access receipts remain unchanged. The prior server-adapter **15/16** supplementary assertion and passing boundary recheck remain in the [earlier evidence package](../sandbox-customer-http-20261103/README.md). All current runtime browser acceptance remains NOT_RUN, with BLOCKED as the milestone verdict.
