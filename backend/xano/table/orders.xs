// Source: db/zippy/migrations/0002_operations.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table orders {
  auth = false

  schema {
    int id
    uuid order_id
    uuid platform_id
    uuid booking_customer_profile_id
    uuid quote_id
    enum status?=pending {
      values = [
        "pending"
        "quoted"
        "confirmed"
        "assigned"
        "in_transit"
        "delivered"
        "cancelled"
      ]
    }
  
    text cargo_description
    decimal cargo_weight_kg
    text? special_handling_code?
    int version?=1
    uuid created_by_account_id
    uuid correlation_id
    timestamp created_at?=now
    timestamp updated_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "order_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "order_id"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
    {
      type : "btree"
      field: [
        {name: "platform_id", op: "asc"}
        {name: "booking_customer_profile_id", op: "asc"}
        {name: "status", op: "asc"}
        {name: "created_at", op: "desc"}
      ]
    }
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "kRNJWav2P9_L11oiTl9GjePZPE8"
}