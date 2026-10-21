// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table exception_status_history {
  auth = false

  schema {
    int id
    uuid exception_status_history_id
    uuid platform_id
    uuid operational_exception_id
    enum? previous_status? {
      values = ["open", "assigned", "resolved", "closed"]
    }
  
    enum new_status {
      values = ["open", "assigned", "resolved", "closed"]
    }
  
    uuid actor_account_id
    text reason
    uuid correlation_id
    timestamp occurred_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "exception_status_history_id"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "JqOymkNFFDLCuolNP6LzVlZODCU"
}