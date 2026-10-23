// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table sla_evidence {
  auth = false

  schema {
    int id
    uuid sla_evidence_id
    uuid platform_id
    uuid service_commitment_id
    enum outcome {
      values = ["met", "breached", "not_applicable"]
    }
  
    text evidence_reference
    timestamp measured_at
    uuid correlation_id
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "sla_evidence_id"}]}
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "service_commitment_id"}]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "LHnYW0YfFoibnaxaiZmXfr5xtRY"
}