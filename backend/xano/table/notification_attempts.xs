// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table notification_attempts {
  auth = false

  schema {
    int id
    uuid notification_attempt_id
    uuid platform_id
    uuid recipient_account_id
    enum channel {
      values = ["email", "sms", "in_app"]
    }
  
    text template_version
    uuid business_event_reference
    text idempotency_key
    enum status?=pending {
      values = ["pending", "processing", "succeeded", "failed", "dead_lettered"]
    }
  
    int attempt_count?
    timestamp? next_attempt_at?
    text? provider_reference?
    uuid correlation_id
    timestamp created_at?=now
    timestamp? delivered_at?
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "notification_attempt_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "notification_attempt_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "channel"}
        {name: "idempotency_key"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
    {
      type : "btree"
      field: [
        {name: "platform_id", op: "asc"}
        {name: "status", op: "asc"}
        {name: "next_attempt_at", op: "asc"}
      ]
    }
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "mOR07jWUUBljVuB0r_tHRIxhocw"
}