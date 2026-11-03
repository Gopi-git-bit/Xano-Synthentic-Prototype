// Atomic single-use OTP challenges bound to specific security and operational purposes
table otp_challenges {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique challenge UUID identifier
    uuid challenge_id
  
    // Purpose binding: phone login, ToPay consent, POD verification, etc.
    enum purpose {
      values = [
        "phone_login"
        "topay_consent"
        "pod_verification"
        "driver_onboarding"
        "payout_authorization"
      ]
    
    }
  
    // Target domain entity type
    text subject_type filters=trim
  
    // Domain entity primary key
    int subject_id
  
    // Cryptographic SHA-256 hash of recipient contact to protect PII
    text recipient_hash filters=trim
  
    // Hashed OTP verification token
    text code_hash filters=trim
  
    // Failed verification attempt counter
    int attempts? filters=min:0
  
    // Maximum allowable attempts before challenge is locked
    int max_attempts?=5 filters=min:1
  
    // Challenge expiration timestamp
    timestamp expires_at
  
    // Atomic consumption timestamp
    timestamp? consumed_at
  
    // Single-use consumed flag
    bool is_consumed?
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "challenge_id"}]}
    {type: "btree", field: [{name: "purpose"}]}
    {
      type : "btree"
      field: [{name: "subject_type"}, {name: "subject_id"}]
    }
    {type: "btree", field: [{name: "expires_at"}]}
    {type: "btree", field: [{name: "is_consumed"}]}
  ]

  guid = "BoLiiFvGq5-2gyzd-isoY-sup0E"
}
