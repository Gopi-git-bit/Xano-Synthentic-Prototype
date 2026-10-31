# Disabled native execution preparation

See [the complete preparation and gate contract](../../../docs/XANO_EXECUTION_PREPARATION_V3.md).

- fixtures.json: immutable run-owned fixtures for 31 cases and two contention cohorts.
- xano/: generated internal helpers; NOT_PREVIEWED, NOT_IMPORTED, NOT_RUN.
- native-adapter.cjs: fixed target, reviewed evidence requirements, fresh preflight and private native receipts.
- executor.cjs: every existing hosted case, bounded races and 16-table rollback/recovery assertions.
- contention.cjs: separate actual-unique-index/lock-wait evaluator; no advisory serialization.
- activation.json: PENDING, writes disabled.
- manifest.json: separately hashed revision, preserving reservation-v2 and original evidence.

Generate deterministically offline with python scripts/prepare-m1-execution.py. Generation never imports anything. A second fixture run requires a new reviewed namespace/hash; do not retry an ambiguous seed or delete previous data. No cleanup or release path exists.
