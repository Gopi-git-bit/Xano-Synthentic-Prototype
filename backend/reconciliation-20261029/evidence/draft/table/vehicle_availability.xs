// Real-time dispatch availability windows, home-base, and geographic constraints for fleet matching
table vehicle_availability {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Available vehicle resource
    int vehicle_id {
      table = "vehicle"
    }
  
    // Carrier vendor organization offering this capacity
    int organization_id {
      table = "organization"
    }
  
    // Availability window start timestamp
    timestamp available_from
  
    // Availability window end timestamp
    timestamp available_until
  
    // Origin base / hub city
    text? current_city filters=trim
  
    // Geographic coordinate of origin base: {lat, lng}
    json? current_geo_point
  
    // Maximum operating radius from base in kilometers
    decimal? preferred_radius_km
  
    // Preferred destination cities / corridors
    json? destination_preferences
  
    // Active schedule flag
    bool is_active?=true
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "vehicle_id"}]}
    {type: "btree", field: [{name: "organization_id"}]}
    {type: "btree", field: [{name: "available_from"}]}
    {type: "btree", field: [{name: "available_until"}]}
    {type: "btree", field: [{name: "is_active"}]}
  ]

  guid = "br93n-NiOtf_voL1dXKoSVjK6TE"
}
