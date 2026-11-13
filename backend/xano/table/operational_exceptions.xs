// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table operational_exceptions {
  auth = false

  schema {
    int id
    uuid operational_exception_id
    uuid platform_id
    text exception_code
    enum severity {
      values = ["low", "medium", "high", "critical"]
    }
  
    text entity_type
    uuid entity_id
    enum status?=open {
      values = ["open", "assigned", "resolved", "closed"]
    }
  
    uuid? owner_account_id?
    text reason
    uuid correlation_id
    timestamp opened_at?=now
    timestamp? resolved_at?
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "operational_exception_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "operational_exception_id"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
    {
      type : "btree"
      field: [
        {name: "platform_id", op: "asc"}
        {name: "status", op: "asc"}
        {name: "severity", op: "asc"}
        {name: "opened_at", op: "asc"}
      ]
    }
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "rbdhumLtDgwKUE7t0EVd014jOgU"
}