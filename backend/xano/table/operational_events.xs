// Source: db/zippy/migrations/0004_controls.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table operational_events {
  auth = false

  schema {
    int id
    uuid operational_event_id
    uuid platform_id
    text aggregate_type
    uuid aggregate_id
    int aggregate_version
    text event_type
    json event_data
    uuid? actor_account_id?
    uuid correlation_id
    timestamp occurred_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "operational_event_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "operational_event_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "aggregate_type"}
        {name: "aggregate_id"}
        {name: "aggregate_version"}
        {name: "event_type"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "x-A3B7JHZMGbP7omL5gzkMLQkKI"
}