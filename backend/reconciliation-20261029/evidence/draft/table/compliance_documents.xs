// Regulatory compliance and verification documents for drivers, carriers, and fleet vehicles
table compliance_documents {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique document UUID
    uuid document_id
  
    // Owning resource category
    enum owner_type {
      values = ["driver", "organization", "vehicle"]
    }
  
    // Record ID of the owning entity
    int owner_id
  
    // Regulatory document category (e.g., CDL, INSURANCE, FITNESS, RC_BOOK, GSTIN, PAN)
    text document_type filters=trim
  
    // Official government certificate / document registration number
    text? document_reference_number filters=trim
  
    // Private encrypted storage key
    text private_storage_key filters=trim
  
    // SHA-256 integrity checksum
    text checksum_sha256 filters=trim
  
    // Document validity issuance date
    date? valid_from
  
    // Document regulatory expiration date
    date valid_until
  
    // Compliance officer verification status
    enum verification_status?=pending {
      values = ["pending", "verified", "rejected", "expired"]
    }
  
    // Officer user who verified compliance
    int? verified_by_user_id {
      table = "user"
    }
  
    // Verification timestamp
    timestamp? verified_at
  
    // Rejection reason if illegible or invalid
    text? rejection_reason filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "document_id"}]}
    {
      type : "btree"
      field: [{name: "owner_type"}, {name: "owner_id"}]
    }
    {type: "btree", field: [{name: "document_type"}]}
    {type: "btree", field: [{name: "verification_status"}]}
    {type: "btree", field: [{name: "valid_until"}]}
  ]

  guid = "i9Lix-ircSPEBGZDh77ppKrDgtA"
}
