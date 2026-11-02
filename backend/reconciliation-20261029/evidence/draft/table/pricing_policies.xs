// Approved deterministic corridor pricing policies, cost floors, and volumetric calculation divisors
table pricing_policies {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique policy UUID
    uuid policy_id
  
    // Policy version string (e.g., v1.0, v1.1)
    text version filters=trim
  
    // Corridor lane code (e.g., TIR_CHE for Tiruppur to Chennai)
    text corridor_code filters=trim|upper
  
    // Fleet vehicle class / body type
    text vehicle_type filters=trim
  
    // Base freight booking fee in minor currency units (paise/cents)
    decimal base_rate_minor filters=min:0
  
    // Rate per kilometer in minor currency units
    decimal per_km_rate_minor filters=min:0
  
    // Volumetric weight conversion divisor (e.g., 5000 for standard road freight)
    decimal volumetric_divisor?=5000 filters=min:1
  
    // Hard minimum cost floor; no discount or coupon may price below this floor
    decimal cost_floor_minor filters=min:0
  
    // Maximum commercial discount percentage allowable
    decimal max_discount_pct? filters=min:0
  
    // Policy active window start
    timestamp effective_from
  
    // Policy active window end
    timestamp effective_until
  
    // Finance administrator who authorized this tariff policy
    int approved_by_user_id {
      table = "user"
    }
  
    // Active policy standing flag
    bool is_active?=true
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "policy_id"}]}
    {type: "btree", field: [{name: "corridor_code"}]}
    {type: "btree", field: [{name: "vehicle_type"}]}
    {type: "btree", field: [{name: "is_active"}]}
    {type: "btree", field: [{name: "effective_from"}]}
  ]

  guid = "ZEXezqyQZGzDxBLN8N0tLmUBsPA"
}
