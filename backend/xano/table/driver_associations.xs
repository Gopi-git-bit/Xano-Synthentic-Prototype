// Prototype foundation from db/zippy migration 0001. Cross-table and CHECK constraints require service enforcement.
table driver_associations {
  auth = false

  schema {
    int id
    uuid driver_association_id
    uuid platform_id
    uuid driver_profile_id
    uuid vendor_profile_id
    timestamp valid_from
    timestamp? valid_until?
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "driver_association_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "driver_profile_id"}
        {name: "vendor_profile_id"}
        {name: "valid_from"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:foundation", "zippy:prototype"]
  guid = "3bbfsxR4tUfoBcxvqFf26ig7XOQ"
}