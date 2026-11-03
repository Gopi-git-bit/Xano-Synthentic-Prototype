// Exclusive active assignment reservation claims preventing double-booking of vehicles and drivers
table active_assignment_reservations {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique reservation claim UUID
    uuid claim_id
  
    // Freight order locked for dispatch
    int order_id {
      table = "customer_booking"
    }
  
    // Vehicle claimed for this assignment
    int vehicle_id {
      table = "vehicle"
    }
  
    // Driver claimed for this assignment
    int driver_id {
      table = "driver_profile"
    }
  
    // High-entropy random claim token held by winning offer session
    text claim_token filters=trim
  
    // Reservation standing
    enum status?=active {
      values = ["active", "confirmed", "expired", "released"]
    }
  
    // Short-lived lease expiration timestamp
    timestamp expires_at
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "claim_id"}]}
    {type: "btree", field: [{name: "order_id"}]}
    {type: "btree", field: [{name: "vehicle_id"}]}
    {type: "btree", field: [{name: "driver_id"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree", field: [{name: "expires_at"}]}
  ]

  guid = "AZ158Fo2BpTszdZ1LGX59PPF7r8"
}
