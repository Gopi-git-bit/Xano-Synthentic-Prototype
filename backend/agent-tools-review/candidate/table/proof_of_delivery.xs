// Proof of Delivery (POD) documents, signatures, OTP verifications, and consignee sign-offs
table proof_of_delivery {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Freight trip fulfilled
    int trip_id {
      table = "trip"
    }
  
    // Specific delivery stop verified
    int stop_id {
      table = "trip_stop"
    }
  
    // Driver submitting POD evidence
    int driver_id {
      table = "driver_profile"
    }
  
    // POD review and approval status (must be approved before carrier settlement)
    enum status?=submitted {
      values = ["pending", "submitted", "under_review", "approved", "rejected"]
    }
  
    // Consignee receiver authorized representative name
    text? consignee_name filters=trim
  
    // Consignee contact phone
    text? consignee_phone filters=trim
  
    // Storage URL / key for digital receiver signature
    text? signature_image_url filters=trim
  
    // Storage URL / key for stamped bill of lading / delivery note photo
    text? document_image_url filters=trim
  
    // One-Time Password (OTP) dispatched to consignee mobile
    text? otp_code filters=trim
  
    // OTP verification confirmation flag
    bool otp_verified?
  
    // Verification timestamp
    timestamp? verified_at
  
    // Operations agent or customer user who reviewed POD
    int? reviewed_by_user_id {
      table = "user"
    }
  
    // Rejection explanation if POD document was illegible or disputed
    text? rejection_reason filters=trim
  
    // GPS geostamp at exact moment of POD capture: {lat, lng, accuracy_meters}
    json? delivery_geostamp
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "trip_id"}]}
    {type: "btree", field: [{name: "stop_id"}]}
    {type: "btree", field: [{name: "driver_id"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree", field: [{name: "otp_verified"}]}
  ]

  guid = "vCm4J72gGd0NgE0dOb4II9KMFWg"
}
