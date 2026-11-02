# Required API contract — pending implementation

This document specifies the target contract, not deployed functionality. The export currently has authenticated read routes and internal fixture commands; it does not expose the required public booking command.

POST /api/v1/orders must accept an authenticated user token plus Idempotency-Key. Resolve the account, tenant, roles, membership expiry and ownership from trusted records; reject body authority overrides. Request fields include immutable quote reference, pickup/delivery, cargo and participants; exact field schemas remain blocked until the database gate passes. Money is an exact minor-unit amount with currency, never binary floating point.

On successful atomic persistence return HTTP 202 with order_id and persisted workflow_id. The same tenant, operation and key with an identical canonical request returns the original result; changed payload is HTTP 409. Workflow status retrieval must authenticate and authorize the same tenant and owner. Its public route and schema are not implemented yet.

Expected order version is mandatory for every state-changing operation. Reject stale versions and illegal transitions with HTTP 409; unauthenticated 401; unauthorized/blocked/expired identity 403; inaccessible foreign resource 404; invalid inputs 422. Error objects must contain a stable code and safe request identifier, without secrets or foreign-tenant existence details.

Full payment equals total; partial is 50–100% inclusive; to-pay advance is zero; overpayment is rejected. Verified webhook signatures precede financial evidence writes. Intents bind tenant/order/amount/currency. Duplicate and out-of-order events cannot repeat effects. Refunds require human approval, settlement requires verified POD, and Odoo retains accounting authority.

Concrete HTTP request/response schemas, provider signature rules and status endpoints remain explicit acceptance blockers.
