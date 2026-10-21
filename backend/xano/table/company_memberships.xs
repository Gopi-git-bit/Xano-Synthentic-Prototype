// Prototype foundation from db/zippy migration 0001. Cross-table and CHECK constraints require service enforcement.
table company_memberships {
  auth = false

  schema {
    int id
    uuid company_membership_id
    uuid platform_id
    uuid legal_entity_id
    uuid account_id
    enum membership_role {
      values = ["owner", "manager", "dispatcher", "driver"]
    }
  
    timestamp valid_from?=now
    timestamp? valid_until?
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "company_membership_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "legal_entity_id"}
        {name: "account_id"}
        {name: "membership_role"}
        {name: "valid_from"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:foundation", "zippy:prototype"]
  guid = "yFvwroU0rmzPAR3Xjoh1NBqiigc"
}