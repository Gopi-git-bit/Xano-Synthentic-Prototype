// Extended credentials, compliance documents, and duty status for commercial freight drivers
table driver_profile {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Authenticated user account for this driver
    int user_id {
      table = "user"
    }
  
    // Carrier / Vendor transport organization employing or contracting this driver
    int organization_id {
      table = "organization"
    }
  
    // Commercial Driver License (CDL) number
    text license_number filters=trim
  
    // CDL expiration date
    date license_expiry
  
    // Real-time duty standing
    enum duty_status?=off_duty {
      values = ["off_duty", "on_duty", "driving", "resting"]
    }
  
    // Identity & background verification status
    bool kyc_verified?
  
    // Verified mobile contact for dispatch & SMS updates
    text? phone filters=trim
  
    // Emergency contact name & phone
    text? emergency_contact filters=trim
  
    // Last reported GPS telemetry snippet: {lat, lng, speed, updated_at}
    json? current_location
  
    // Immediate availability to accept new transport trip assignments
    bool is_available?=true
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "user_id"}]}
    {type: "btree", field: [{name: "organization_id"}]}
    {type: "btree|unique", field: [{name: "license_number"}]}
    {type: "btree", field: [{name: "duty_status"}]}
    {type: "btree", field: [{name: "is_available"}]}
  ]

  guid = "GYW4a5nhCS6CWkyHfoVo2_O-2yg"
}
