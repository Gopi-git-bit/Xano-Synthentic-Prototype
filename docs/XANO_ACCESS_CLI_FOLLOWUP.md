# Xano access follow-up — 24 October 2026

Status: blocked. This follow-up supersedes earlier claims that token creation was pending or that the new token had the requested restrictions. It does not supersede any historical test evidence.

## Token creation failure and recovery

Administration sign-in succeeded according to the browser result. The browser then created `zippy-m1-sandbox`, key ID `0e6a46f9-9ec3-45d6-a7a9-b9240dd584c8`, with a reported seven-day expiry. The creation result claimed five read-only scopes. Subsequent inspection matching the exact token name and key ID reported broad saved settings, including Live Data Source, Tenant Releases, deployment, secrets, RBAC and impersonation. The requested restriction therefore failed UI readback.

The browser returned an English placeholder instead of the actual bearer credential. Sending that placeholder to auth/me returned 401. This is neither effective-permission evidence nor proof of live-read denial. No actual new bearer token was captured, no new GitHub secret was configured, and this token was not used for database or backend writes.

The inspected existing-token page exposed no scope-edit action, and the browser did not find an individual revoke control. This is an observed UI limitation, not proof that targeted revocation is unsupported. Xano documentation describes token revocation and says the secret is shown only once. The owner was informed of the error and asked to revoke only this failed new token, using Xano support if necessary. **Do not select Revoke All.** No pre-existing token or account role was changed.

Credential/schema changes remain paused until that token is individually revoked and the approved restricted credential is correctly captured and verified. Authentication success, effective permissions, bounded known-live content denial and reviewed live-function denial must be verified independently. Neither a profile name nor a sandbox target establishes those restrictions.

## CLI verification

Installed `@xano/cli@1.3.4` with its dependencies in the remote Linux tool environment at `/tmp/zippy-cli-runtime`. npm reported 1.3.4 as the current version; Node is 20.20.2. This does not install or configure the user's Windows shell.

The version command and help for `auth`, `workspace pull`, `ephemeral create` and `ephemeral push` succeeded. The profile-token check returned exit 2 with its output suppressed; no authenticated CLI profile has been verified. No authenticated pull, login-code exchange, ephemeral creation, push or signup was executed.

The supplied commands are supported, with these project-specific constraints:

- Use workspace **1**, not the documentation example `-w 5`.
- `xano auth` is the administrative browser login flow. Remote sessions support `--no-browser`; it still requires verification of the issued credential's permissions.
- `workspace pull -w 1 -b v1 -d <new-directory>` exports source. Omit `--records` and `--env`; preserve reviewed exports in a separate directory.
- An ephemeral tenant is a separate temporary target. Do not silently replace the confirmed sandbox or its diagnostic/assignment evidence with a newly created tenant.
- `--records` imports records, `--env` imports environment values, and `--force` skips preview/confirmation. The supplied combined push is not the reviewed candidate import.
- `--wait` waits for auto-deployed microservices; it is not a transaction, uniqueness or M1 acceptance check.
- `/api:abcD123/auth/signup` uses example placeholders and creates an application user. It is not Xano administration sign-in. Do not submit account credentials to that sample route.

## Evidence remains separated

The current offline total remains **184**: original **121**, prior follow-up **5**, reservation-v2 **35**, execution-v3 **23**. No tests were rerun or added for this documentation-only follow-up.

The original **eight-candidate native preview** remains evidence only for its original bytes. The separate reservation-v2 preview covers its eight candidates plus proposed schema. Execution-v3 helpers have not been natively previewed/imported. Hosted M1 execution remains **0/31**, native contention **NOT_RUN**, and full 16-table failure rollback **NOT_RUN**.

The approved reservation schema/backfill remains unapplied. Supported inventory treatment and writer-bypass prevention remain unresolved. Release/reuse is not implemented or proven. All backend exports, five agent drafts, diagnostics, existing assignments, review bundles and historical evidence are preserved.

Structured receipt: [access and CLI audit](../backend/evidence/xano-access-cli-followup-2026-10-24.json).

References: [official CLI](https://github.com/xano-inc/cli), [Metadata API and token administration](https://docs.xano.com/xano-features/metadata-api), [application authentication](https://www.xano.com/learn/all-about-authentication-in-xano/).
