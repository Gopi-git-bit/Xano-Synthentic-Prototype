// Prototype foundation from db/zippy migration 0001. Cross-table and CHECK constraints require service enforcement.
table vendor_profiles {
  auth = false

  schema {
    int id
    uuid vendor_profile_id
    uuid platform_id
    uuid? account_id?
    uuid? legal_entity_id?
    enum eligibility_status?=pending {
      values = ["pending", "approved", "suspended", "rejected"]
    }
  
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "vendor_profile_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "vendor_profile_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "account_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "legal_entity_id"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:foundation", "zippy:prototype"]
  guid = "yt-T27K_7ARmldRdlbH8C1uM6so"
}