// Source: db/zippy/migrations/0002_operations.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table vehicles {
  auth = false

  schema {
    int id
    uuid vehicle_id
    uuid platform_id
    uuid vendor_profile_id
    uuid vehicle_model_id
    text registration_number
    enum status?=pending {
      values = ["pending", "approved", "suspended", "rejected", "retired"]
    }
  
    uuid? approved_by_account_id?
    timestamp? approved_at?
    timestamp created_at?=now
    timestamp updated_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "vehicle_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "vehicle_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "registration_number"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
    {
      type : "btree"
      field: [
        {name: "platform_id", op: "asc"}
        {name: "vendor_profile_id", op: "asc"}
        {name: "status", op: "asc"}
      ]
    }
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "NkuoZk_hSlDKkkbI4jk9q6uhXQw"
}