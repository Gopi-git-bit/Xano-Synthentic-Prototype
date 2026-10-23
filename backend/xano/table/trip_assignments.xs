// Source: db/zippy/migrations/0002_operations.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table trip_assignments {
  auth = false

  schema {
    int id
    uuid trip_assignment_id
    uuid platform_id
    uuid trip_id
    uuid dispatch_offer_id
    uuid vendor_profile_id
    uuid vehicle_id
    uuid driver_profile_id
    uuid assigned_by_account_id
    timestamp assigned_at?=now
    timestamp? released_at?
    uuid correlation_id
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "trip_assignment_id"}]}
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "trip_id"}
        {name: "assigned_at"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "rRQW_hkpZGPl0G9Tphc47Yk0-ys"
}