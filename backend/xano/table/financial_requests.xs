// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table financial_requests {
  auth = false

  schema {
    int id
    uuid financial_request_id
    uuid platform_id
    uuid order_id
    enum request_type {
      values = [
        "partner_sync"
        "draft_customer_invoice"
        "draft_vendor_bill"
        "read_status"
      ]
    }
  
    decimal? amount?
    text? currency_code?
    enum status?=requested {
      values = [
        "requested"
        "approved_for_send"
        "sent"
        "acknowledged"
        "rejected"
        "failed"
      ]
    }
  
    uuid requester_account_id
    text idempotency_key
    text request_hash_sha256
    uuid correlation_id
    timestamp requested_at?=now
    timestamp updated_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "financial_request_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "financial_request_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "request_type"}
        {name: "idempotency_key"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
    {
      type : "btree"
      field: [
        {name: "platform_id", op: "asc"}
        {name: "status", op: "asc"}
        {name: "requested_at", op: "asc"}
      ]
    }
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "US3YZt95c0AlDmzo5K1ilIpoCUE"
}