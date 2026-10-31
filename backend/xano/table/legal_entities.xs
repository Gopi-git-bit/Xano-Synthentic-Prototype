// Prototype foundation from db/zippy migration 0001. Cross-table and CHECK constraints require service enforcement.
table legal_entities {
  auth = false

  schema {
    int id
    uuid legal_entity_id
    uuid platform_id
    text legal_name
    text? registration_reference?
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "legal_entity_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "legal_entity_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "registration_reference"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:foundation", "zippy:prototype"]
  guid = "niKzHQkbgPgCeX185RuNp5vbljk"
}