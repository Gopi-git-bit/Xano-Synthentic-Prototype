// Prototype foundation from db/zippy migration 0001. Cross-table and CHECK constraints require service enforcement.
table driver_profiles {
  auth = false

  schema {
    int id
    uuid driver_profile_id
    uuid platform_id
    uuid account_id
    text licence_reference
    enum eligibility_status?=pending {
      values = ["pending", "approved", "suspended", "expired", "rejected"]
    }
  
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "driver_profile_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "driver_profile_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "account_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "licence_reference"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:foundation", "zippy:prototype"]
  guid = "FRW6GYX3Y1Oe-Fk7jwYStvxDzLc"
}