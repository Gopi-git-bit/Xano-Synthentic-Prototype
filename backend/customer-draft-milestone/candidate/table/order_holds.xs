// Independent domain holds blocking order progression, dispatch, or settlement
table order_holds {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique hold UUID
    uuid hold_id
  
    // Booking order placed on hold
    int order_id {
      table = "customer_booking"
    }
  
    // Domain scope affected by this hold
    enum scope {
      values = ["operational", "payment", "settlement", "compliance", "customs"]
    }
  
    // Machine-readable reason code (e.g., PAYMENT_FAILED, DOCUMENT_EXPIRED, ADDRESS_AMBIGUOUS)
    text reason_code filters=trim
  
    // Plain-language hold narrative
    text? description filters=trim
  
    // User or operator who initiated the hold
    int opened_by_user_id {
      table = "user"
    }
  
    // Hold placement timestamp
    timestamp opened_at?=now
  
    // Authorized operator who approved release of hold
    int? released_by_user_id {
      table = "user"
    }
  
    // Release timestamp
    timestamp? released_at
  
    // Documentary evidence justifying release of hold
    text? release_evidence filters=trim
  
    // Order state before hold was engaged (restored upon legal release)
    text prior_state filters=trim
  
    // Active hold flag (true until released)
    bool is_active?=true
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "hold_id"}]}
    {type: "btree", field: [{name: "order_id"}]}
    {type: "btree", field: [{name: "scope"}]}
    {type: "btree", field: [{name: "is_active"}]}
  ]

  guid = "1RyofPd40KbIkVVl3BKjRm1Q80k"
}
