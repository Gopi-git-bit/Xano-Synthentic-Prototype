// Commercial fleet vehicles owned or operated by vendor carrier organizations
table vehicle {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Carrier vendor organization owning/operating this vehicle
    int organization_id {
      table = "organization"
    }
  
    // Dedicated primary driver assigned to this vehicle
    int? assigned_driver_id {
      table = "driver_profile"
    }
  
    // Vehicle registration / license plate number
    text registration_number filters=trim|upper
  
    // Vehicle Identification Number (VIN)
    text? vin filters=trim|upper
  
    // Vehicle manufacturer / make
    text make filters=trim
  
    // Vehicle model
    text model filters=trim
  
    // Manufacturing year
    int? year
  
    // Commercial freight body type
    enum vehicle_type {
      values = ["flatbed", "reefer", "dry_van", "container", "box_truck", "tanker"]
    }
  
    // Maximum legal carrying payload capacity in kilograms
    decimal max_payload_kg filters=min:0
  
    // Cargo volumetric capacity in cubic meters (CBM)
    decimal? max_volume_cbm filters=min:0
  
    // Operational dispatch status (synchronized with trip lifecycle)
    enum status?=available {
      values = ["available", "assigned", "in_transit", "maintenance", "offline"]
    }
  
    // Hardware IoT GPS telemetry capability flag
    bool gps_enabled?=true
  
    // IoT GPS device / OBD tracker identifier
    text? tracker_device_id filters=trim
  
    // Commercial vehicle insurance policy details
    json? insurance_details
  
    // Commercial fitness certificate & inspection expiration
    json? fitness_certificate
  
    // Last reported location telemetry: {lat, lng, heading, speed, updated_at}
    json? current_location
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "registration_number"}]
    }
    {type: "btree", field: [{name: "organization_id"}]}
    {type: "btree", field: [{name: "assigned_driver_id"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree", field: [{name: "vehicle_type"}]}
  ]

  guid = "1HYTz6CP3KkGf4bzbJVAQVz23HA"
}
