// Physical freight haul execution entity connecting vehicle, driver, carrier vendor, and customer booking
table trip {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Human-readable unique trip code (e.g., ZIP-TR-2025-0001)
    text trip_code filters=trim|upper
  
    // Associated customer booking
    int booking_id {
      table = "customer_booking"
    }
  
    // Carrier vendor organization executing the haul
    int vendor_organization_id {
      table = "organization"
    }
  
    // Dispatched fleet vehicle
    int vehicle_id {
      table = "vehicle"
    }
  
    // Dispatched commercial driver
    int driver_id {
      table = "driver_profile"
    }
  
    // Detailed granular TMS trip state machine
    enum status?=assigned {
      values = [
        "assigned"
        "driver_en_route_pickup"
        "arrived_pickup"
        "loading"
        "in_transit"
        "arrived_delivery"
        "unloading"
        "pod_pending"
        "completed"
        "cancelled"
      ]
    
    }
  
    // Timestamp when driver commenced transport
    timestamp? started_at
  
    // Timestamp when transport was successfully finished and cargo handed over
    timestamp? completed_at
  
    // Agreed carrier freight payout compensation
    decimal carrier_payout_amount filters=min:0
  
    // Starting vehicle odometer reading in km
    decimal? start_odometer_km
  
    // Final vehicle odometer reading in km
    decimal? end_odometer_km
  
    // MapMyIndia route geometry polyline and waypoint metadata
    json? route_geometry
  
    // Cancellation reason if aborted
    text? cancellation_reason filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "trip_code"}]}
    {type: "btree", field: [{name: "booking_id"}]}
    {type: "btree", field: [{name: "vendor_organization_id"}]}
    {type: "btree", field: [{name: "vehicle_id"}]}
    {type: "btree", field: [{name: "driver_id"}]}
    {type: "btree", field: [{name: "status"}]}
  ]

  guid = "CmwzYaR0YlIJSB8OZI2rlxDtfaE"
}
