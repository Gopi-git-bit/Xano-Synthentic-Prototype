// Prototype foundation from db/zippy migration 0001. Cross-table and CHECK constraints require service enforcement.
table customer_profiles {
  auth = false

  schema {
    int id
    uuid customer_profile_id
    uuid platform_id
    uuid account_id
    uuid? legal_entity_id?
    enum verification_status?=pending {
      values = ["pending", "verified", "rejected"]
    }
  
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "customer_profile_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "customer_profile_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "account_id"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:foundation", "zippy:prototype"]
  guid = "dSIsOe8hia56AmscCBgs-7NYILQ"
}