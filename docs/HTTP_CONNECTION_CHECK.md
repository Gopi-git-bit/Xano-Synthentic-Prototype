# Xano HTTP connection check

The owner configured XANO_METADATA_API in the GitHub environment Xano-Production. Only that secret is consumed by the manual connection job. Provider credentials are not used. The environment currently has no protection rules or branch restrictions; the job independently restricts the event, owner actor, review branch and exact reviewed commit. This does not certify the token as least privilege. No environment rules are changed.

Manually dispatch the existing backend-validation.yml workflow on codex/xano-backend-review, with run_http=true and expected_sha set to the reviewed commit. The automatic push/PR jobs do not receive secrets. The job verifies unauthenticated metadata rejection, credential validity, workspace binding, disabled direct push, a hash-pinned read-only probe and the sandbox database identity. Its only POST executes the reviewed SELECT-only identity function. It performs no imports, fixture writes, migrations, promotions, payments or messages.

PASS_METADATA_ONLY means a successful connection preflight. It does not mean staging readiness. Without a verified isolated application base URL, public application HTTP is explicitly NOT_VERIFIED. Metadata credentials are never sent to application URLs. Application user credentials and role tests remain separate. Reports contain statuses and allowlisted metadata, never raw bodies or tokens. Execution is bounded to five minutes with individual request deadlines.

The 72 original PostgreSQL cases remain historical New-logistic- references. They are not prerequisites for this Xano connection check and are not claimed executed here.

The owner confirmed origin https://xynd-fnea-khtp.n7e.xano.io and metadata MCP URL /x2/mcp/meta/mcp/stream. The check initializes an MCP session and lists tools without invoking any workspace tools. Both JSON and SSE responses are supported; session identifiers and raw responses are not reported. These URLs identify metadata access, not a separately verified public application API.
