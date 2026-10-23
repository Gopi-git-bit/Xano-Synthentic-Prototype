// Source: db/zippy/migrations/0002_operations.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table quotes {
  auth = false

  schema {
    int id
    uuid quote_id
    uuid platform_id
    uuid customer_profile_id
    text policy_version
    text input_hash_sha256
    json input_evidence
    decimal amount
    text currency_code
    timestamp expires_at
    uuid created_by_account_id
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "quote_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "quote_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "customer_profile_id"}
        {name: "policy_version"}
        {name: "input_hash_sha256"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "wNlkARbYHZZwFoT_8oRtuCuIJyE"
}