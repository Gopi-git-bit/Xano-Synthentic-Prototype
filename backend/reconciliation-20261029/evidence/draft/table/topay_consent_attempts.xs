// Immutable ToPay freight payment consent attempts and decisions by consignees
table topay_consent_attempts {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique consent attempt UUID
    uuid consent_attempt_id
  
    // Customer booking freight order
    int order_id {
      table = "customer_booking"
    }
  
    // Hashed contact reference of the consignee / payer
    text payer_identifier_hash filters=trim
  
    // Freight charge amount in minor integer units (paise/cents)
    decimal amount_minor filters=min:1
  
    // ISO currency code
    text currency?=INR filters=trim|upper
  
    // Hash of accepted quote snapshot; consent is invalid if quote changes
    text quote_hash filters=trim
  
    // Explicit consent decision
    enum decision?=pending {
      values = ["pending", "accepted", "denied", "expired"]
    }
  
    // Timestamp when payer confirmed or declined consent
    timestamp? decided_at
  
    // Reason given if payer denied freight charges
    text? denial_reason filters=trim
  
    // Previous attempt ID if re-attempted after amendment
    uuid? supersedes_id
  
    // Expiration timestamp of this consent challenge window
    timestamp? expires_at
  
    // Bound OTP challenge ID if verified via SMS/WhatsApp code
    uuid? challenge_id
  
    // Scoped capability token for consignee decision verification
    text? capability_token filters=trim
  
    // Audit proof snapshot (client IP, user agent, timestamp)
    json? evidence
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "consent_attempt_id"}]}
    {type: "btree", field: [{name: "order_id"}]}
    {type: "btree", field: [{name: "decision"}]}
    {type: "btree", field: [{name: "capability_token"}]}
  ]

  guid = "aL2dGQ2TwUB2IvL9zPPRNh44CJ0"
}
