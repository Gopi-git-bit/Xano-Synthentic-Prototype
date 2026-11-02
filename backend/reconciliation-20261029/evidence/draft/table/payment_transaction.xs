// Financial payment records, gateway transactions (Razorpay/Stripe), escrow, and status tracking
table payment_transaction {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Unique payment transaction reference code (e.g., ZIP-TXN-2025-0001)
    text transaction_reference filters=trim|upper
  
    // Customer freight booking linked to this transaction
    int booking_id {
      table = "customer_booking"
    }
  
    // Customer organization remitting payment
    int customer_organization_id {
      table = "organization"
    }
  
    // Monetary transaction amount
    decimal amount filters=min:0.01
  
    // ISO currency code
    text currency?=INR filters=trim|upper
  
    // Granular transaction lifecycle state
    enum status?=initiated {
      values = ["initiated", "authorized", "captured", "failed", "refunded"]
    }
  
    // Payment method used
    enum payment_method?=gateway {
      values = [
        "gateway"
        "net_banking"
        "upi"
        "card"
        "bank_transfer"
        "credit_line"
      ]
    
    }
  
    // Upstream gateway order identifier (e.g., Razorpay order_id)
    text? gateway_order_id filters=trim
  
    // Upstream gateway payment identifier (e.g., Razorpay pay_id)
    text? gateway_payment_id filters=trim
  
    // Gateway cryptographic verification signature
    text? gateway_signature filters=trim
  
    // Full JSON payload returned by payment gateway webhook/API
    json? gateway_response
  
    // Exact timestamp when funds were captured into escrow
    timestamp? captured_at
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "transaction_reference"}]
    }
    {type: "btree", field: [{name: "booking_id"}]}
    {type: "btree", field: [{name: "customer_organization_id"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree", field: [{name: "gateway_payment_id"}]}
    {type: "btree", field: [{name: "gateway_order_id"}]}
  ]

  guid = "XYqPw1tXZyqSLVprpdfo93X8eRw"
}
