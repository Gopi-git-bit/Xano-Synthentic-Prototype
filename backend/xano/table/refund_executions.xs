// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table refund_executions {
  auth = false

  schema {
    int id
    uuid refund_execution_id
    uuid platform_id
    uuid refund_request_id
    uuid refund_decision_id
    uuid external_reference_id
    decimal amount
    text currency_code
    text target_reference
    text idempotency_key
    text evidence_hash_sha256
    timestamp executed_at
    timestamp recorded_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "refund_execution_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "refund_execution_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "refund_request_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "idempotency_key"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "nhJrot-rsN8Y4Dk3mH2PmtINL9U"
}