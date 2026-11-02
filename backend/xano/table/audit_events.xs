// Source: db/zippy/migrations/0003_evidence_and_reliability.up.sql
// Native SQL controls are recorded in schema-control-map.json; service guards remain required.
table audit_events {
  auth = false

  schema {
    int id
    uuid audit_event_id
    uuid platform_id
    uuid? actor_account_id?
    enum actor_type {
      values = ["account", "service", "system"]
    }
  
    text action
    text entity_type
    uuid entity_id
    text? before_hash_sha256?
    text? after_hash_sha256?
    text? reason?
    uuid correlation_id
    timestamp occurred_at?=now
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "audit_event_id"}]}
    {type: "btree", field: [{name: "platform_id"}]}
    {
      type : "btree"
      field: [
        {name: "platform_id", op: "asc"}
        {name: "entity_type", op: "asc"}
        {name: "entity_id", op: "asc"}
        {name: "occurred_at", op: "desc"}
      ]
    }
  ]

  tags = ["zippy:prototype", "zippy:canonical"]
  guid = "HL2p_gjwfFEMyoW2TvqMVlRnLkA"
}