// Transactional outbox ledger guaranteeing at-least-once asynchronous event delivery to external providers
table event_outbox {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique outbox event UUID
    uuid outbox_event_id
  
    // Aggregation root category (e.g., customer_booking, trip, payment_transaction)
    text aggregate_type filters=trim
  
    // Primary key identifier of aggregate root
    int aggregate_id
  
    // Version of aggregate when event was produced
    int aggregate_version?=1
  
    // Domain event type (e.g., order.confirmed, trip.assigned, pod.verified)
    text event_type filters=trim
  
    // Target external system or dispatcher worker (e.g., telnyx_email, telnyx_sms, zoho_sync)
    text destination filters=trim
  
    // Structured JSON message payload
    json payload
  
    // Upstream idempotency deduplication key
    text? idempotency_key filters=trim
  
    // Delivery queue lifecycle state
    enum status?=queued {
      values = ["queued", "leased", "published", "failed"]
    }
  
    // Dispatch retry count
    int attempt_count? filters=min:0
  
    // Maximum allowable delivery attempts before dead-lettering
    int max_attempts?=5 filters=min:1
  
    // Earliest timestamp for next retry attempt (exponential backoff)
    timestamp? next_attempt_at
  
    // Worker instance holding the current execution lease
    text? lease_owner filters=trim
  
    // Lease expiration timestamp after which an abandoned event can be reclaimed
    timestamp? lease_expires_at
  
    // Timestamp when external delivery was successfully acknowledged
    timestamp? published_at
  
    // Failure diagnostic error string
    text? last_error filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "outbox_event_id"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree", field: [{name: "destination"}]}
    {type: "btree", field: [{name: "next_attempt_at"}]}
    {
      type : "btree"
      field: [{name: "aggregate_type"}, {name: "aggregate_id"}]
    }
  ]

  guid = "OSt4uREt2QDWmE1p4NeX04YUTq0"
}
