// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table event_outbox {
  auth = false

  schema {
    int id
    uuid outbox_event_id
    uuid platform_id
    text aggregate_type
    uuid aggregate_id
    int aggregate_version
    text event_type
    text destination
    json payload
    text idempotency_key
    enum status?=pending {
      values = ["pending", "processing", "succeeded", "failed", "dead_lettered"]
    }
  
    int attempt_count?
    timestamp next_attempt_at?=now
    uuid correlation_id
    timestamp created_at?=now
    timestamp? published_at?
    int max_attempts?=5
    text? lease_owner?
    timestamp? lease_expires_at?
    text? last_error?
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "outbox_event_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "outbox_event_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "destination"}
        {name: "idempotency_key"}
      ]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "aggregate_type"}
        {name: "aggregate_id"}
        {name: "aggregate_version"}
        {name: "event_type"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "6z_6cmz2ll1jQuSUefQTCqem81o"
}