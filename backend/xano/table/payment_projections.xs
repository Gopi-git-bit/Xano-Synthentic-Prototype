// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table payment_projections {
  auth = false

  schema {
    int id
    uuid payment_projection_id
    uuid platform_id
    uuid order_id
    uuid gateway_event_id
    enum operational_status {
      values = ["pending", "evidence_verified", "failed", "reversed"]
    }
  
    decimal amount
    text currency_code
    uuid correlation_id
    timestamp projected_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "payment_projection_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "payment_projection_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "order_id"}
        {name: "gateway_event_id"}
        {name: "operational_status"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
    {
      type : "btree"
      field: [
        {name: "platform_id", op: "asc"}
        {name: "order_id", op: "asc"}
        {name: "projected_at", op: "desc"}
      ]
    }
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "OJoQQv8-L8UWD4vUy-oS8egatQU"
}