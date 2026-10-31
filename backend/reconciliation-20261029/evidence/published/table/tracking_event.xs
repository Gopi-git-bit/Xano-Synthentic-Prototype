// Real-time telematics, IoT GPS pings, geofence events, and driver telemetry
table tracking_event {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Active trip being monitored
    int trip_id {
      table = "trip"
    }
  
    // Transmitting fleet vehicle
    int vehicle_id {
      table = "vehicle"
    }
  
    // Logged driver at timestamp
    int? driver_id {
      table = "driver_profile"
    }
  
    // Geographic latitude in decimal degrees
    decimal latitude
  
    // Geographic longitude in decimal degrees
    decimal longitude
  
    // Vehicle speed in km/h
    decimal? speed_kmh filters=min:0
  
    // Compass heading / bearing in degrees (0-360)
    decimal? heading_degrees
  
    // Device battery percentage or vehicle voltage
    decimal? battery_level
  
    // Telematics event trigger category
    enum event_type?=periodic_ping {
      values = [
        "periodic_ping"
        "geofence_entry"
        "geofence_exit"
        "speeding_alert"
        "harsh_braking"
        "engine_idle"
        "sos_alert"
        "manual_checkin"
      ]
    
    }
  
    // Unprocessed raw IoT / mobile telemetry packet
    json? raw_payload
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "trip_id"}]}
    {type: "btree", field: [{name: "vehicle_id"}]}
    {type: "btree", field: [{name: "created_at", op: "desc"}]}
    {type: "btree", field: [{name: "event_type"}]}
  ]

  guid = "X0PmT00LrEAXqSlNYulQRODOUCs"
}
