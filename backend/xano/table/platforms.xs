// Prototype foundation from db/zippy migration 0001. Cross-table and CHECK constraints require service enforcement.
table platforms {
  auth = false

  schema {
    int id
    uuid platform_id
    text platform_key
    text display_name
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:foundation", "zippy:prototype"]
  guid = "uPkC_JPPx9PRMtNp_F4Esr1N6wg"
}