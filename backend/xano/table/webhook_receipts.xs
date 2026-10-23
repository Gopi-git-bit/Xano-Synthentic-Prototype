// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table webhook_receipts {
  auth = false

  schema {
    int id
    uuid webhook_receipt_id
    uuid platform_id
    text provider
    text provider_event_id
    bool signature_verified?
    text payload_hash_sha256
    text? payload_reference?
    enum processing_status?=pending {
      values = ["pending", "processing", "succeeded", "failed", "dead_lettered"]
    }
  
    int attempt_count?
    uuid correlation_id
    timestamp received_at?=now
    timestamp? processed_at?
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "webhook_receipt_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "webhook_receipt_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "provider"}
        {name: "provider_event_id"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
    {
      type : "btree"
      field: [
        {name: "platform_id", op: "asc"}
        {name: "processing_status", op: "asc"}
        {name: "received_at", op: "asc"}
      ]
    }
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "q-Nw_xjoc1KNIkEgCFQ_4mRqJcY"
}