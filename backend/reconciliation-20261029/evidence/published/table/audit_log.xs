// Immutable compliance audit ledger capturing every critical financial and operational state transition
table audit_log {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Domain entity type (e.g., payment_transaction, refund_request, settlement, trip, customer_booking)
    text entity_type filters=trim
  
    // Primary key identifier of audited record
    int entity_id
  
    // Specific operational action executed (e.g., status_transition, refund_approved, driver_assigned)
    text action filters=trim
  
    // Actor initiating event: user, driver, system, autonomous_agent
    enum actor_type?=system {
      values = ["user", "driver", "system", "autonomous_agent"]
    }
  
    // User account ID of actor if authenticated human
    int? actor_id {
      table = "user"
    }
  
    // IP address of caller
    text? ip_address filters=trim
  
    // Pre-transition state snapshot
    json? previous_state
  
    // Post-transition state snapshot
    json? new_state
  
    // Audit notes, reason, or agent rationale
    text? reason filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree"
      field: [{name: "entity_type"}, {name: "entity_id"}]
    }
    {type: "btree", field: [{name: "created_at", op: "desc"}]}
    {type: "btree", field: [{name: "actor_id"}]}
    {type: "btree", field: [{name: "action"}]}
  ]

  guid = "1U2ioedvljORPrfArMQPgW6ytB4"
}
