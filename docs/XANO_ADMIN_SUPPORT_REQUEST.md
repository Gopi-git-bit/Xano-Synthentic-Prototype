# Draft Xano administrator/support request — not sent

Target: instance xynd-fnea-khtp.n7e.xano.io, workspace 1, source v1, isolated sandbox sn9m-aat6-200c. Please do not change the live workspace.

1. Metadata lists 51 tables, while the sandbox physical catalog lists 53. Metadata table IDs 56 and 57 return 404, but physical tables mvpw1_56 (two rows) and mvpw1_57 (zero rows) remain. Attached evidence records their schema/dependency fingerprints. No current exported application source references them. Please establish their lineage and provide a supported method to retain/reconcile their metadata or confirm intentional retained-diagnostic status, preserving identifiers and all data. We do not authorize table deletion, reset or count-only cleanup.
2. Is there a supported Xano mechanism for unique indexes on trip_assignments(platform_id,vehicle_id) and (platform_id,driver_profile_id), each WHERE released_at IS NULL? The public XanoScript/index API inspected exposes no predicate. Please specify creation, export/import, backup/restore, schema-edit and support guarantees before any DDL is considered.
3. Please confirm the least-privilege role/token configuration for sandbox multidoc import, function/run and workflow tests with live-data access denied, including the Tenant Metadata API gateway. We will independently prove safe sandbox reads and actual live authorization denial. We will not treat a 404 or a denied login as a live-access denial test.

Evidence: backend/evidence/milestone1-admin-inventory-2026-10-23.json, milestone1-native-preflight-2026-10-23.json, and docs/XANO_ADMIN_REMEDIATION_PLAN.md. No tokens, database passwords or raw diagnostic records are included.
