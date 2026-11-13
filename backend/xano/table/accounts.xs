// Prototype foundation from db/zippy migration 0001. Cross-table and CHECK constraints require service enforcement.
table accounts {
  auth = false

  schema {
    int id
    uuid account_id
    uuid platform_id
    text external_subject
    text? email_normalized?
    text? phone_e164?
    enum status?=pending {
      values = ["pending", "active", "suspended", "blocked"]
    }
  
    timestamp created_at?=now
    timestamp updated_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "account_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "account_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "external_subject"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "email_normalized"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "phone_e164"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:foundation", "zippy:prototype"]
  guid = "An54RoKWD4A5jEMdACKXRcTAjyc"
}