// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table service_commitments {
  auth = false

  schema {
    int id
    uuid service_commitment_id
    uuid platform_id
    uuid order_id
    enum commitment_type {
      values = ["pickup", "delivery", "pod"]
    }
  
    timestamp committed_at
    text policy_version
    timestamp created_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "service_commitment_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "service_commitment_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "order_id"}
        {name: "commitment_type"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "9YfHp2kQql0D5rHZLcqU6I9JfcM"
}