// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table dead_letter_records {
  auth = false

  schema {
    int id
    uuid dead_letter_id
    uuid platform_id
    enum source_kind {
      values = ["task", "outbox", "inbox", "webhook"]
    }
  
    uuid source_id
    text terminal_reason
    int attempt_count
    text? payload_reference?
    uuid correlation_id
    timestamp dead_lettered_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "dead_letter_id"}]}
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "source_kind"}
        {name: "source_id"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "K7rtiqipJdovmepb67zfJtw3wCk"
}