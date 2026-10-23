// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table gateway_events {
  auth = false

  schema {
    int id
    uuid gateway_event_id
    uuid platform_id
    uuid webhook_receipt_id
    uuid order_id
    text gateway
    text gateway_event_type
    decimal amount
    text currency_code
    text evidence_hash_sha256
    timestamp verified_at
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "gateway_event_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "gateway_event_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "webhook_receipt_id"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "ipluST8zo5qCvdLtXxEldJnF3dA"
}