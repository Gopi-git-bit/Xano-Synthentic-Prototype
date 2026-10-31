// Prototype foundation from db/zippy migration 0001. Cross-table and CHECK constraints require service enforcement.
table account_role_memberships {
  auth = false

  schema {
    int id
    uuid membership_id
    uuid platform_id
    uuid account_id
    text role_code
    timestamp valid_from?=now
    timestamp? valid_until?
    uuid? granted_by_account_id?
    uuid correlation_id
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "membership_id"}]}
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "account_id"}
        {name: "role_code"}
        {name: "valid_from"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:foundation", "zippy:prototype"]
  guid = "U4gN7Z8zC73AQdJqbvUMxxXDHsY"
}