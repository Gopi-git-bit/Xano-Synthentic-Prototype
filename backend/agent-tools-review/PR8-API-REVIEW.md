# PR #8 API alignment review — 2026-11-03

Reviewed remote head `950ab843c4fcb4bf421aa1527211cc7ac69b3790`
(`fix/api-alignment-20261102`) against PR #7 head
`96619a8974c0b3bb90accfdd03036c52aea92011` and the inspected November 3 Xano sources.
This is a source/contract review, not a release approval. No PR #7/#8 source or gate
was edited. GitHub API access was unavailable during preparation; remote Git refs
provided the pinned revisions.

## Findings

1. **Preserve registration and write gates.** `gateway.mjs` correctly refuses
   `auth/signup` and `auth/register` with `503 REGISTRATION_PENDING`, even when login
   is released. Booking commands return `BOOKING_WRITES_PENDING`; assessment and
   review capabilities remain false. The live signup source still refuses onboarding;
   the inspected booking POST is an empty/null stub. Those are not working commands.
2. **Customer read shapes align with the inspected published source.** List uses
   `curPage/nextPage/items`; detail uses `booking/cargo/active_holds/blocking_reasons/allowed_actions`.
   `bookings.mjs` validates the owning organization, projects nine nonfinancial fields,
   and uses the actual eight lowercase booking states. Keep organization checks in
   Xano as well as the gateway. Foreign and nonexistent detail IDs should be identical.
3. **The seven tools are a separate interface.** Their `{ok, tool, mode,
   execution_enabled, data}` envelopes and role rules cannot be substituted directly
   for the HTTP booking adapter. Tool-debug authentication proves backend tool logic,
   not public MCP transport, HTTP onboarding, or frontend release eligibility.
   Do not map synthetic five-agent assessment views to these seven tools implicitly.
4. **Registration proposal is not yet a deployable binding.** Recovery 0.1.1 requires
   `organization_name`, returns a draft-only registration result without a login token,
   and has ambiguous API-server bindings. The next milestone needs an explicit isolated
   auth group, separate login, transactional user/organization/membership creation,
   duplicate-registration protection, and pending-verification semantics. New runtime
   evidence must be scoped to that target rather than replacing historical receipts.
5. **Existing contract blockers remain relevant.** Recovery financial `allOf`
   composition contradicts `additionalProperties:false`; proposed workflow states,
   admin projections and agent tables do not automatically match the current schema.
   No new frontend adapter is justified by the tool evidence alone.

## Executed checks

In a detached worktree at the exact PR #8 head:

```powershell
cd frontend
node --test server/*.test.mjs
```

**60 tests passed, 0 failed.** These are local mocked gateway/contract tests, not
provider or Xano runtime tests. They cover release gates, registration refusal,
tenant projection, malformed upstream responses, CRM scope and assessment readiness.
No production configuration, UI release switch, or shared preview setting was changed.
