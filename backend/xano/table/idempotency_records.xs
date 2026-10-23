// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table idempotency_records {
  auth = false

  schema {
    int id
    uuid idempotency_record_id
    uuid platform_id
    text operation_scope
    text idempotency_key
    text request_hash_sha256
    enum status?=pending {
      values = ["pending", "processing", "succeeded", "failed", "dead_lettered"]
    }
  
    int? response_code?
    text? response_reference?
    uuid correlation_id
    text? lease_owner?
    timestamp? lease_expires_at?
    timestamp created_at?=now
    timestamp? completed_at?
    timestamp expires_at
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "idempotency_record_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "operation_scope"}
        {name: "idempotency_key"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "-gOXCwAJgjLgU4t9lQU8vVnm3lA"
}