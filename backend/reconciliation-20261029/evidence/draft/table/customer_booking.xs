// Freight shipment bookings and transport orders initiated by customer shippers
table customer_booking {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Human-readable unique booking reference code (e.g., ZIP-BK-2025-0001)
    text booking_reference filters=trim|upper
  
    // Shipper customer organization placing the booking
    int customer_organization_id {
      table = "organization"
    }
  
    // Individual user who created this freight booking
    int booked_by_user_id {
      table = "user"
    }
  
    // Freight order operational lifecycle state
    enum status?=draft {
      values = [
        "draft"
        "quoted"
        "booked"
        "assigned"
        "in_transit"
        "delivered"
        "completed"
        "cancelled"
      ]
    
    }
  
    // Primary pickup hub / city
    text pickup_city filters=trim
  
    // Structured pickup address & geocode: {street, city, state, postal_code, lat, lng}
    json pickup_address
  
    // Scheduled pickup window start
    timestamp pickup_window_start
  
    // Scheduled pickup window deadline
    timestamp pickup_window_end
  
    // Primary drop-off hub / destination city
    text delivery_city filters=trim
  
    // Structured delivery address & geocode: {street, city, state, postal_code, lat, lng}
    json delivery_address
  
    // Scheduled delivery window start
    timestamp delivery_window_start
  
    // Scheduled delivery window deadline
    timestamp delivery_window_end
  
    // Estimated route distance calculated via MapMyIndia
    decimal estimated_distance_km filters=min:0
  
    // Initial dynamic price quote amount
    decimal quote_amount filters=min:0
  
    // Final confirmed freight billing amount
    decimal total_amount filters=min:0
  
    // Transaction currency ISO code
    text currency?=INR filters=trim|upper
  
    // Synchronized financial payment standing
    enum payment_status?=pending {
      values = [
        "pending"
        "authorized"
        "paid_escrow"
        "settled"
        "refunded"
        "failed"
      ]
    
    }
  
    // Autonomous matching engine standing
    enum matching_status?=unmatched {
      values = ["unmatched", "searching", "matched", "accepted", "rejected"]
    }
  
    // Shipper special handling & gate pass instructions
    text? special_instructions filters=trim
  
    // Server-managed aggregate version for optimistic concurrency control
    int version?=1 filters=min:1
  
    // Selected payment mode for freight haulage
    enum payment_mode?=prepaid {
      values = ["prepaid", "topay", "credit"]
    }
  
    // UUID of the accepted and active booking_quote
    uuid? active_quote_id
  
    // Structured consignee contact & recipient details for ToPay/delivery
    json? consignee_details
  
    // Reason narrative if booking was aborted or cancelled
    text? cancellation_reason filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "booking_reference"}]}
    {type: "btree", field: [{name: "customer_organization_id"}]}
    {type: "btree", field: [{name: "booked_by_user_id"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree", field: [{name: "payment_status"}]}
    {type: "btree", field: [{name: "matching_status"}]}
    {type: "btree", field: [{name: "pickup_window_start"}]}
    {type: "btree", field: [{name: "delivery_window_end"}]}
    {type: "btree", field: [{name: "version"}]}
  ]

  guid = "uDlEjr1xlp2p9_CVdrJLfdgS9D0"
}
