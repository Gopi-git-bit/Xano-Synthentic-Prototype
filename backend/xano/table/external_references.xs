// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table external_references {
  auth = false

  schema {
    int id
    uuid external_reference_id
    uuid platform_id
    text local_entity_type
    uuid local_entity_id
    text external_system
    text external_model
    text external_id
    text? external_version?
    enum sync_status {
      values = ["pending", "synchronized", "stale", "failed"]
    }
  
    uuid correlation_id
    timestamp created_at?=now
    timestamp updated_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "external_reference_id"}]
    }
    {
      type : "btree|unique"
      field: [{name: "platform_id"}, {name: "external_reference_id"}]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "local_entity_type"}
        {name: "local_entity_id"}
        {name: "external_system"}
        {name: "external_model"}
      ]
    }
    {
      type : "btree|unique"
      field: [
        {name: "platform_id"}
        {name: "external_system"}
        {name: "external_model"}
        {name: "external_id"}
      ]
    }
    {type: "btree", field: [{name: "platform_id"}]}
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "IV60eQd65qGjwz6P83tNXdTyBIg"
}