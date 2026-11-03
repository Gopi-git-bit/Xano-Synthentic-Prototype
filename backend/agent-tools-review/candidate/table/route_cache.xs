// Caches verified MapMyIndia distance matrices and routing profiles to optimize quote response times
table route_cache {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Normalized SHA-256 hash of coordinates, vehicle profile, and routing options
    text request_hash filters=trim
  
    // Origin latitude
    decimal origin_lat
  
    // Origin longitude
    decimal origin_lng
  
    // Destination latitude
    decimal dest_lat
  
    // Destination longitude
    decimal dest_lng
  
    // Calculated route distance in kilometers
    decimal distance_km filters=min:0
  
    // Estimated transit driving duration in minutes
    int duration_minutes filters=min:0
  
    // Upstream routing engine provider
    text provider?=mappls filters=trim
  
    // Cached route geometry summary and toll metadata
    json? route_summary
  
    // Cache entry expiration timestamp
    timestamp expires_at
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "request_hash"}]}
    {type: "btree", field: [{name: "expires_at"}]}
  ]

  guid = "bxYtPke4FRJZ4zp1wXfCdKn-GDM"
}
