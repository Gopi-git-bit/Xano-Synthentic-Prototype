// Operational transit exceptions, vehicle breakdowns, cargo damage, and insurance claims
table incident_dispute {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Freight trip where the incident occurred
    int trip_id {
      table = "trip"
    }
  
    // Customer booking affected
    int? booking_id {
      table = "customer_booking"
    }
  
    // User who flagged or reported the incident (driver, customer, or agent)
    int reported_by_user_id {
      table = "user"
    }
  
    // Operational incident categorization
    enum incident_type {
      values = [
        "vehicle_breakdown"
        "route_delay"
        "cargo_damage"
        "accident"
        "theft_pilferage"
        "wrong_destination"
        "consignee_refusal"
        "other"
      ]
    
    }
  
    // Urgency and risk severity level
    enum severity?=medium {
      values = ["low", "medium", "high", "critical"]
    }
  
    // Resolution workflow state
    enum status?=reported {
      values = [
        "reported"
        "investigating"
        "resolution_proposed"
        "resolved"
        "closed"
      ]
    
    }
  
    // Narrative details of the incident
    text description filters=trim
  
    // Array of incident photos / survey reports
    json? evidence_photos
  
    // Disputed or claimed monetary loss amount
    decimal? claim_amount filters=min:0
  
    // Official resolution and corrective action documentation
    text? resolution_notes filters=trim
  
    // Support officer or operations admin who authorized resolution
    int? resolved_by_user_id {
      table = "user"
    }
  
    // Timestamp when dispute was formally settled
    timestamp? resolved_at
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "trip_id"}]}
    {type: "btree", field: [{name: "booking_id"}]}
    {type: "btree", field: [{name: "incident_type"}]}
    {type: "btree", field: [{name: "severity"}]}
    {type: "btree", field: [{name: "status"}]}
  ]

  guid = "GH6sqmzdcbKHlvWcPbdZ7rYxCD4"
}
