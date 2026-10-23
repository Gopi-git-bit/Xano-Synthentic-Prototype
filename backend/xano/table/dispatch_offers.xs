// Source: db/zippy/migrations/0002_operations.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table dispatch_offers {
  auth = false

  schema {
    int id
    uuid dispatch_offer_id
    uuid platform_id
    uuid order_id
    uuid vendor_profile_id
    uuid? vehicle_id?
    uuid? driver_profile_id?
    enum status?=pending {
      values = ["pending", "accepted", "declined", "expired", "cancelled"]
    }
  
    text scoring_input_version
    text idempotency_key
    timestamp expires_at
    timestamp? responded_at?
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "dispatch_offer_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "dispatch_offer_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "idempotency_key"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
    {
      type : "btree"
      field: [
        {name: "platform_id", op: "asc"}
        {name: "order_id", op: "asc"}
        {name: "status", op: "asc"}
        {name: "expires_at", op: "asc"}
      ]
    }
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "dacD5vqlpIxSBi37WZDsL1ydzk4"
}