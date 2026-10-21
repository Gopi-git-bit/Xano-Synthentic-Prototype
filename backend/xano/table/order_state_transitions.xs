// Source: db/zippy/migrations/0004_controls.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table order_state_transitions {
  auth = false

  schema {
    int id
    uuid order_state_transition_id
    uuid platform_id
    uuid order_id
    enum from_status {
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
  
    enum to_status {
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
  
    uuid actor_account_id
    text reason
    text idempotency_key
    uuid correlation_id
    timestamp occurred_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "order_state_transition_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "order_state_transition_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "order_id"}
        {name: "idempotency_key"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "QA6fRLRWf3kxnKzlsMA_mx9eyUc"
}