// Source: db/zippy/migrations/0002_operations.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table order_stops {
  auth = false

  schema {
    int id
    uuid order_stop_id
    uuid platform_id
    uuid order_id
    int stop_sequence
    enum stop_kind {
      values = ["pickup", "delivery", "waypoint"]
    }
  
    text address_text
    decimal? latitude?
    decimal? longitude?
    decimal? accuracy_meters?
    text source
    uuid created_by_account_id
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "order_stop_id"}]}
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "order_id"}
        {name: "stop_sequence"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "lVQJrXER8DuiBA3xGgBynoJK4dQ"
}