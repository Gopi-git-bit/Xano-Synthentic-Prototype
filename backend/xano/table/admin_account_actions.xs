// Prototype foundation from db/zippy migration 0001. Cross-table and CHECK constraints require service enforcement.
table admin_account_actions {
  auth = false

  schema {
    int id
    uuid admin_action_id
    uuid platform_id
    uuid affected_account_id
    uuid acting_admin_account_id
    enum action {
      values = ["create", "block", "suspend", "unblock"]
    }
  
    enum? previous_status? {
      values = ["pending", "active", "suspended", "blocked"]
    }
  
    enum new_status {
      values = ["pending", "active", "suspended", "blocked"]
    }
  
    text reason_code
    text? reason_note?
    uuid correlation_id
    timestamp occurred_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "admin_action_id"}]}
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:foundation", "zippy:prototype"]
  guid = "t9-1h-7qjGoxC72ZO-YPzWLDwag"
}