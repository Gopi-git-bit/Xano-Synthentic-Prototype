// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table event_inbox {
  auth = false

  schema {
    int id
    uuid inbox_event_id
    uuid platform_id
    text source
    text source_event_id
    text payload_hash_sha256
    enum status?=pending {
      values = ["pending", "processing", "succeeded", "failed", "dead_lettered"]
    }
  
    int attempt_count?
    uuid correlation_id
    timestamp received_at?=now
    timestamp? processed_at?
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "inbox_event_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "inbox_event_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "source"}
        {name: "source_event_id"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
    {
      type : "btree"
      field: [
        {name: "platform_id", op: "asc"}
        {name: "status", op: "asc"}
        {name: "received_at", op: "asc"}
      ]
    }
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "XHs9vTumeMoxA2TYpAoqosQSMUM"
}