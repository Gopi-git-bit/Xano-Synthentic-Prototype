// Source: db/zippy/migrations/0002_operations.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table vehicle_models {
  auth = false

  schema {
    int id
    uuid vehicle_model_id
    uuid platform_id
    text model_code
    text display_name
    decimal capacity_kg
    text body_type
    text source_version
    uuid approved_by_account_id
    timestamp approved_at
    bool active?=true
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "vehicle_model_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "vehicle_model_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "model_code"}
        {name: "source_version"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "UqRF8Hq-_OSbqdL1IA94849cENc"
}