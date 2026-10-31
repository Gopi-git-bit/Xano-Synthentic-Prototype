// Source: db/zippy/migrations/0002_operations.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table trips {
  auth = false

  schema {
    int id
    uuid trip_id
    uuid platform_id
    uuid order_id
    enum status?=planned {
      values = [
        "planned"
        "assigned"
        "active"
        "completed"
        "cancelled"
        "exception"
      ]
    }
  
    timestamp created_at?=now
    timestamp updated_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "trip_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "trip_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "order_id"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
    {
      type : "btree"
      field: [
        {name: "platform_id", op: "asc"}
        {name: "status", op: "asc"}
        {name: "updated_at", op: "desc"}
      ]
    }
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "iEh9kdpbokXDoHaGl7boas8lSRU"
}