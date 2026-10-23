// Source: db/zippy/migrations/0006_operations_finance.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table payment_intents {
  auth = false

  schema {
    int id
    uuid payment_intent_id
    uuid platform_id
    uuid order_id
    uuid external_reference_id
    int expected_amount_minor_units
    text expected_currency_code
    uuid correlation_id
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "payment_intent_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "payment_intent_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "external_reference_id"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "KwzFnx5HVwm2h91iidFbZAHhgl8"
}