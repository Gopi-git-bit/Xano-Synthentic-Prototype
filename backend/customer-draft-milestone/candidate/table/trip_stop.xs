// Ordered pickup, transit waypoint, border/customs checkpoint, and delivery stops for a trip
table trip_stop {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Parent freight transport trip
    int trip_id {
      table = "trip"
    }
  
    // Execution sequence order index (1 = first pickup, etc.)
    int stop_sequence filters=min:1
  
    // Functional category of stop
    enum stop_type {
      values = ["pickup", "waypoint", "fuel", "customs_checkpoint", "delivery"]
    }
  
    // Hub, warehouse, or facility name
    text facility_name filters=trim
  
    // Stop geocode and address: {street, city, state, postal_code, lat, lng}
    json address
  
    // Scheduled arrival time
    timestamp scheduled_arrival
  
    // Actual driver arrival timestamp recorded at gate
    timestamp? actual_arrival
  
    // Actual departure timestamp recorded after loading/unloading
    timestamp? actual_departure
  
    // Stop completion lifecycle standing
    enum status?=pending {
      values = ["pending", "arrived", "in_progress", "completed", "skipped"]
    }
  
    // On-site gate or dispatch contact person
    text? contact_person filters=trim
  
    // On-site gate contact phone number
    text? contact_phone filters=trim
  
    // Driver or facility instructions
    text? notes filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "trip_id"}]}
    {type: "btree", field: [{name: "stop_sequence"}]}
    {type: "btree", field: [{name: "status"}]}
    {
      type : "btree|unique"
      field: [{name: "trip_id"}, {name: "stop_sequence"}]
    }
  ]

  guid = "Rd1bI6BdyuEn2s2gEhOjFq3AnuE"
}
