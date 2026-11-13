# Xano agent tools — sandbox-to-frontend handoff (2026-11-03)

**Classification: sandbox evidence only; NOT DEPLOYED / NOT APPROVED FOR FRONTEND USE.**

OpenCode's supplied November 3 receipt reports seven new read-only, authenticated Xano tools executed in an ephemeral tenant, with **48/48 local syntax checks** and **65/65 synthetic runtime checks** passing. The suite exercised role and tenant denials, valid review requests, input validation, and no-write table snapshots. These are **not** frontend integration tests or production acceptance. The tested tenant is reported to expire on **2026-11-04 at 05:02:41 UTC**.

The tools are: `zippy_get_booking`, `zippy_validate_order`, `zippy_check_vehicle_eligibility`, `zippy_propose_assignment`, `zippy_review_pod`, `zippy_get_payment_summary`, and `zippy_prescreen_refund`.

## Boundaries

- The tool-debug endpoint worked with synthetic user credentials. **External MCP transport was not verified**: the attempted stream route returned HTTP 404. Do not configure a client to use that route.
- These tools are **review-only**. They do not create bookings, dispatch vehicles, approve POD, collect payments, issue refunds, or call external providers. The five operational Zippy agents are still a separate implementation milestone.
- No matching public app API route has been accepted. Never expose Xano tool IDs, debug endpoints, claim fences, tokens, or internal reservation functions in browser code.
- Keep `assessmentsAvailable`, `assessmentReviewAvailable`, `bookingWritesAvailable`, and `deliveryAvailable` false. `XANO_AUTH_RELEASE`, `XANO_BOOKING_READS_RELEASE`, or any new environment variable must not implicitly enable tool execution.
- Preserve PR #8's registration and API alignment gates. Its customer booking GET contracts are not evidence that the seven tool contracts are production-ready.

## Frontend activation checklist

1. Xano backend owner preserves sanitized source and test receipts in a reviewed backend PR; do not depend on ephemeral tenant storage.
2. Backend owner exposes *separate*, explicit read-only assessment API contracts with exact paths, actor/organization/role projection, response schemas, error mapping, rate limits, and revocation behavior. The browser must not call debug/MCP endpoints.
3. Run isolation tests against the final authorized API routes, including customer A/B separation, vendor restrictions, missing/foreign resource equivalence, and no leakage of credentials, OTP, financial gateway payloads, or proof-of-delivery images.
4. Verify durable environment, release metadata, API hostname, frontend gateway schema validation, rollback, and audit evidence. The successful temporary tool-debug tests alone do not satisfy this step.
5. Add separate named release gates *only after* the above approval. Until then, the gateway returns `ENDPOINT_UNAVAILABLE` for the tools.

## Regression coverage

`frontend/server/agent-tool-isolation.test.mjs` is discovered by the existing `npm run test:server` command and CI workflow. It verifies that all seven tool names and the attempted MCP path remain unrouted, even if hypothetical release flags are set, and that there are zero upstream network calls.

**This document changes no live Xano workspace, production Vercel deployment, release switch, or provider credential.**
