// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table refund_requests {
  auth = false

  schema {
    int id
    uuid refund_request_id
    uuid platform_id
    uuid order_id
    uuid requester_account_id
    decimal amount
    text currency_code
    text target_reference
    text reason
    text idempotency_key
    enum status?=requested {
      values = ["requested", "approved", "rejected", "executed", "failed"]
    }
  
    uuid correlation_id
    timestamp requested_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "refund_request_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "refund_request_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "idempotency_key"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
    {
      type : "btree"
      field: [
        {name: "platform_id", op: "asc"}
        {name: "order_id", op: "asc"}
        {name: "status", op: "asc"}
      ]
    }
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "T0_6m9yayU9sQ94rOpvP-w3FXBI"
}