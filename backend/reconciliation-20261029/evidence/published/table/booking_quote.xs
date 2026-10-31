// Immutable pricing quotes generated for customer bookings, capturing policy version and route evidence
table booking_quote {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique quote UUID
    uuid quote_id
  
    // Freight booking this quote was generated for
    int booking_id {
      table = "customer_booking"
    }
  
    // Booking aggregate version at time of quote generation
    int booking_version?=1
  
    // SHA-256 hash of normalized input parameters (route, cargo weight, dimensions, service)
    text input_hash filters=trim
  
    // Pricing policy version applied (e.g. v1.0)
    text policy_version filters=trim
  
    // Corridor lane code (e.g. TIR_CHE)
    text corridor_code filters=trim|upper
  
    // Required vehicle body/class
    text vehicle_type filters=trim
  
    // Actual total weight in kg
    decimal actual_weight_kg filters=min:0
  
    // Volumetric weight calculated using policy divisor
    decimal volumetric_weight_kg filters=min:0
  
    // Chargeable weight: max(actual_weight, volumetric_weight)
    decimal chargeable_weight_kg filters=min:0
  
    // Route distance in km from verified route cache or provider
    decimal distance_km filters=min:0
  
    // Base corridor tariff in minor currency units (paise)
    decimal base_rate_minor filters=min:0
  
    // Distance freight rate in minor currency units
    decimal distance_rate_minor filters=min:0
  
    // Gross freight quote amount before adjustments
    decimal gross_amount_minor filters=min:0
  
    // Commercial discount amount applied in minor units (bounded by cost floor)
    decimal discount_minor? filters=min:0
  
    // Final net freight charge in minor units
    decimal net_amount_minor filters=min:0
  
    // Converted decimal representation for display/billing (net_amount_minor / 100)
    decimal total_amount filters=min:0
  
    // Currency code
    text currency?=INR filters=trim|upper
  
    // Itemized fee, tax, and discount breakdown
    json breakdown
  
    // Routing provenance evidence (source, duration, polyline/cache hash)
    json route_evidence
  
    // Quote validity expiration timestamp
    timestamp expires_at
  
    // Acceptance flag
    bool is_accepted?
  
    // Timestamp when customer accepted this quote
    timestamp? accepted_at
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "quote_id"}]}
    {type: "btree", field: [{name: "booking_id"}]}
    {type: "btree", field: [{name: "expires_at"}]}
    {type: "btree", field: [{name: "is_accepted"}]}
  ]

  guid = "CyOM1DPNdMHUvltp4n3Ld7LeWhs"
}
