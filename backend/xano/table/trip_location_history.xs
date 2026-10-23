// Source: db/zippy/migrations/0002_operations.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table trip_location_history {
  auth = false

  schema {
    int id
    uuid location_sample_id
    uuid platform_id
    uuid trip_id
    uuid vehicle_id
    uuid actor_account_id
    decimal latitude
    decimal longitude
    decimal accuracy_meters
    enum source {
      values = ["browser", "manual", "device"]
    }
  
    text consent_reference
    uuid correlation_id
    timestamp captured_at
    timestamp received_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "location_sample_id"}]}
    {type: "btree", field: [{name: "platform_id"}]}
    {
      type : "btree"
      field: [
        {name: "platform_id", op: "asc"}
        {name: "trip_id", op: "asc"}
        {name: "captured_at", op: "desc"}
      ]
    }
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "le3BMgA0JZNb-ZddliRwl27BV5Q"
}