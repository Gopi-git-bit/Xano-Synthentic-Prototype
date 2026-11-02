// Durable background tasks and asynchronous reliability queue with worker fencing and leasing
table durable_tasks {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique durable task UUID
    uuid task_id
  
    // Task handler category (e.g., reconcile_unmatched_payments, sweep_expired_reservations, process_outbox)
    text task_type filters=trim
  
    // Aggregate category if bound to an entity
    text? aggregate_type filters=trim
  
    // Entity record ID
    int? aggregate_id
  
    // Task input parameters
    json? payload
  
    // Idempotency deduplication key
    text? idempotency_key filters=trim
  
    // Task worker standing
    enum status?=pending {
      values = ["pending", "leased", "completed", "failed", "dead_letter"]
    }
  
    // Execution retry count
    int attempt_count? filters=min:0
  
    // Maximum allowable attempts
    int max_attempts?=5 filters=min:1
  
    // Earliest timestamp for next scheduled attempt
    timestamp? next_attempt_at
  
    // Identity of the worker executing this task
    text? lease_owner filters=trim
  
    // Expiration timestamp of execution lease
    timestamp? lease_expires_at
  
    // Failure stack trace or error message
    text? last_error filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "task_id"}]}
    {type: "btree", field: [{name: "task_type"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree", field: [{name: "next_attempt_at"}]}
  ]

  guid = "6hRBZMFhfDrvonnahl2J5C8TKjA"
}
