// Source: db/zippy/migrations/0004_controls.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table order_transition_rules {
  auth = false

  schema {
    int id
    enum from_status {
      values = [
        "pending"
        "quoted"
        "confirmed"
        "assigned"
        "in_transit"
        "delivered"
        "cancelled"
      ]
    }
  
    enum to_status {
      values = [
        "pending"
        "quoted"
        "confirmed"
        "assigned"
        "in_transit"
        "delivered"
        "cancelled"
      ]
    }
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "from_status"}, {name: "to_status"}]
    }
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "2hsRlM0BXeGO5RLQrJC16JDMRGw"
}