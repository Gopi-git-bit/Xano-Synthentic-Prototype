// Request deduplication ledger preventing duplicate payments, double assignments, and repeated callbacks
table idempotency_key {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique idempotency key supplied in client header or webhook payload
    text key filters=trim
  
    // Targeted resource domain (e.g., payment_webhook, dispatch_assignment, refund_execution)
    text target_resource filters=trim
  
    // Cryptographic hash of incoming request body to detect payload tampering
    text request_hash filters=trim
  
    // Execution processing standing
    enum status?=processing {
      values = ["processing", "completed", "failed"]
    }
  
    // Cached response body returned for repeated idempotent calls
    json? cached_response
  
    // Expiration timestamp after which key can be garbage collected
    timestamp expires_at
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "key"}]}
    {type: "btree", field: [{name: "target_resource"}]}
    {type: "btree", field: [{name: "expires_at"}]}
  ]

  guid = "pti1yaXaLxrcRcU1my9K1dzvZT0"
}
