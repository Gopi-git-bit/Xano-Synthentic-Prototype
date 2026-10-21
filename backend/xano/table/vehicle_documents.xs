// Source: db/zippy/migrations/0002_operations.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table vehicle_documents {
  auth = false

  schema {
    int id
    uuid vehicle_document_id
    uuid platform_id
    uuid vehicle_id
    text document_type
    text object_key
    text checksum_sha256
    date? valid_from?
    date? valid_until?
    enum verification_status?=pending {
      values = ["pending", "verified", "rejected", "expired"]
    }
  
    uuid? verified_by_account_id?
    timestamp? verified_at?
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "vehicle_document_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "vehicle_document_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "vehicle_id"}
        {name: "document_type"}
        {name: "object_key"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "yv7ZqE8d7EXg9s_0THXmQLhh6B0"
}