// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table durable_tasks {
  auth = false

  schema {
    int id
    uuid durable_task_id
    uuid platform_id
    text task_type
    text aggregate_type
    uuid aggregate_id
    text payload_reference
    text idempotency_key
    enum status?=pending {
      values = ["pending", "processing", "succeeded", "failed", "dead_lettered"]
    }
  
    int attempt_count?
    int max_attempts
    timestamp next_attempt_at?=now
    text? lease_owner?
    timestamp? lease_expires_at?
    uuid correlation_id
    timestamp created_at?=now
    timestamp updated_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "durable_task_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "durable_task_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "task_type"}
        {name: "idempotency_key"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "eWHMrXz8QbWAkzsBM9idVQaMOqk"
}