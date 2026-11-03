## Summary
- Preserve the seven verified read-only Xano tools and their exact dependencies.
- Include portable isolated test scripts and sanitized actual runtime evidence.
- Record PR #8 API-alignment review against head `950ab84`; retain existing release gates.
- Continue in a separate ephemeral tenant with customer registration, owner membership,
  authenticated booking reads and idempotent draft-only creation.

## Verification
- Tools: 48/48 definitions; 65/65 actual authenticated tool-debug checks; 34 unchanged tables.
- Customer milestone: 45/45 definitions; 48/48 real HTTP checks, including rollback,
  concurrency, cross-organization denial, revocation and idempotency.
- PR #8: 60/60 local gateway/contract tests at the pinned head.
- Candidate sources and evidence scanned; secrets and local target settings excluded.

## Review status
Draft, nonproduction review only. No merge or promotion is authorized. PR #7 and #8
remain independent; their gates are unchanged. MCP stream transport remains unverified.
Ephemeral environments expire on November 4; this branch preserves source and evidence.

Details: `backend/agent-tools-review/README.md`, `PR8-API-REVIEW.md`, and
`backend/customer-draft-milestone/README.md`.
