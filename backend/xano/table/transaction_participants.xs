// Source: db/zippy/migrations/0002_operations.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table transaction_participants {
  auth = false

  schema {
    int id
    uuid transaction_participant_id
    uuid platform_id
    uuid order_id
    enum participant_role {
      values = ["customer", "vendor"]
    }
  
    uuid? customer_profile_id?
    uuid? vendor_profile_id?
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "transaction_participant_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "order_id"}
        {name: "participant_role"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "1AWG5ZR4rnaVVJWPxYeZ5vTarWk"
}