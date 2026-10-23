// PROPOSED ONLY. Requires schema approval and native concurrency/rollback proof.
table active_assignment_reservations {
  auth = false
  schema {
    int id
    uuid reservation_id
    uuid platform_id
    enum resource_kind {
      values = ["vehicle", "driver"]
    }
    uuid resource_id
    uuid trip_assignment_id
    timestamp created_at?=now
  }
  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "reservation_id"}]}
    {
      type: "btree|unique"
      field: [{name: "platform_id"}, {name: "resource_kind"}, {name: "resource_id"}]
    }
    {
      type: "btree|unique"
      field: [{name: "platform_id"}, {name: "trip_assignment_id"}, {name: "resource_kind"}]
    }
  ]
  tags = ["milestone1:proposed-reservation", "requires-schema-approval"]
}
