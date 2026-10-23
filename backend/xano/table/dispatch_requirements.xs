// Source: db/zippy/migrations/0006_operations_finance.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table dispatch_requirements {
  auth = false

  schema {
    int id
    uuid dispatch_requirement_id
    uuid platform_id
    uuid order_id
    text required_body_type
    uuid created_by_account_id
    uuid correlation_id
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "dispatch_requirement_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "dispatch_requirement_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "order_id"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "jvSRoRjhhtQnYJC5CmI8WR_NH4o"
}