// Customer refund claims requiring mandatory explicit human officer approval before gateway execution
table refund_request {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Unique refund claim reference code (e.g., ZIP-RFD-2025-0001)
    text refund_reference filters=trim|upper
  
    // Original payment transaction being refunded
    int payment_transaction_id {
      table = "payment_transaction"
    }
  
    // Customer freight booking associated with refund
    int booking_id {
      table = "customer_booking"
    }
  
    // Monetary amount requested to be refunded
    decimal refund_amount filters=min:0.01
  
    // Refund currency
    text currency?=INR filters=trim|upper
  
    // Justification for refund claim
    text reason filters=trim
  
    // Strict governance status (cannot proceed to 'processing' without explicit human officer approval)
    enum status?=pending_approval {
      values = [
        "pending_approval"
        "approved"
        "rejected"
        "processing"
        "completed"
        "failed"
      ]
    
    }
  
    // Originating actor category initiating claim
    enum requested_by_actor_type?=customer {
      values = ["customer", "agent", "support_admin"]
    }
  
    // User who initiated the refund claim
    int? requested_by_user_id {
      table = "user"
    }
  
    // MANDATORY HUMAN APPROVAL: Platform finance administrator who approved refund
    int? approved_by_user_id {
      table = "user"
    }
  
    // Timestamp when authorized human sign-off occurred
    timestamp? approved_at
  
    // Officer approval or rejection notes
    text? approval_notes filters=trim
  
    // Upstream gateway refund identifier (e.g., Razorpay rfd_id)
    text? gateway_refund_id filters=trim
  
    // Timestamp when payment gateway confirmed refund completion
    timestamp? completed_at
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "refund_reference"}]}
    {type: "btree", field: [{name: "payment_transaction_id"}]}
    {type: "btree", field: [{name: "booking_id"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree", field: [{name: "approved_by_user_id"}]}
  ]

  guid = "os7QpjrtEAuD9mpk3T3e3ZpAInQ"
}
