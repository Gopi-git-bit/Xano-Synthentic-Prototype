// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table settlement_projections {
  auth = false

  schema {
    int id
    uuid settlement_projection_id
    uuid platform_id
    uuid order_id
    uuid? financial_request_id?
    uuid? external_reference_id?
    enum operational_status {
      values = [
        "not_requested"
        "requested"
        "pending_external"
        "externally_confirmed"
        "failed"
      ]
    }
  
    timestamp? source_observed_at?
    uuid correlation_id
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "settlement_projection_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "settlement_projection_id"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "4HKtITWfZvtWzaPOHRKjhP_2zAY"
}