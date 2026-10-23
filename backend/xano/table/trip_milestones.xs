// Source: db/zippy/migrations/0002_operations.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table trip_milestones {
  auth = false

  schema {
    int id
    uuid trip_milestone_id
    uuid platform_id
    uuid trip_id
    enum milestone {
      values = [
        "pickup"
        "in_transit"
        "arrival"
        "delivery"
        "pod_pending"
        "exception"
      ]
    }
  
    int sequence_no
    uuid actor_account_id
    enum source {
      values = ["manual", "system", "verified_webhook"]
    }
  
    text? reason?
    uuid correlation_id
    timestamp occurred_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "trip_milestone_id"}]}
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "trip_id"}
        {name: "sequence_no"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
    {
      type : "btree"
      field: [
        {name: "platform_id", op: "asc"}
        {name: "trip_id", op: "asc"}
        {name: "occurred_at", op: "asc"}
      ]
    }
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "-AYYguXIoFiVyOq_r12CnORo2K0"
}