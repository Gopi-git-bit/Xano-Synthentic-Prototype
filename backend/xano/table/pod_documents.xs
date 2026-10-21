// Source: db/zippy/migrations/0002_operations.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table pod_documents {
  auth = false

  schema {
    int id
    uuid pod_document_id
    uuid platform_id
    uuid order_id
    uuid trip_id
    uuid uploaded_by_account_id
    text object_key
    text content_type
    int byte_size
    text checksum_sha256
    enum verification_status?=pending {
      values = ["pending", "accepted", "rejected", "manual_review"]
    }
  
    uuid? verified_by_account_id?
    timestamp? verified_at?
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "pod_document_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "pod_document_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "object_key"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
    {
      type : "btree"
      field: [
        {name: "platform_id", op: "asc"}
        {name: "order_id", op: "asc"}
        {name: "verification_status", op: "asc"}
      ]
    }
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "majj1OGjuwdrJaIGARrVJBSxVn4"
}