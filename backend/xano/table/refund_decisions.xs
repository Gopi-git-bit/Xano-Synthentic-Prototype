// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table refund_decisions {
  auth = false

  schema {
    int id
    uuid refund_decision_id
    uuid platform_id
    uuid refund_request_id
    uuid approver_account_id
    enum decision {
      values = ["approved", "rejected"]
    }
  
    text reason
    timestamp decided_at?=now
    uuid correlation_id
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "refund_decision_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "refund_decision_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "refund_request_id"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "-q1aL5DeYnGAHj_lxemLmCQKvQM"
}