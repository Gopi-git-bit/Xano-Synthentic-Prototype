// Detailed cargo itemization, physical dimensions, and hazardous material classification per booking
table cargo_detail {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Parent freight booking
    int booking_id {
      table = "customer_booking"
    }
  
    // Commodity item description
    text cargo_description filters=trim
  
    // Commercial freight classification category
    enum commodity_type {
      values = [
        "general_merchandise"
        "perishable"
        "hazardous"
        "fragile"
        "heavy_machinery"
        "automotive"
        "electronics"
        "pharmaceutical"
      ]
    
    }
  
    // Total cargo weight in kilograms
    decimal weight_kg filters=min:0.1
  
    // Total volumetric space occupied in cubic meters (CBM)
    decimal? volume_cbm filters=min:0
  
    // Package or unit count
    int package_count filters=min:1
  
    // Standard freight packaging format
    enum packaging_type?=pallet {
      values = ["pallet", "box", "crate", "drum", "bundle", "loose"]
    }
  
    // Hazardous materials (HAZMAT) flag
    bool is_hazardous?
  
    // United Nations hazardous substance identifier (e.g., UN1203)
    text? un_number filters=trim
  
    // Reefer / cold-chain requirement flag
    bool requires_temperature_control?
  
    // Minimum allowable cargo storage temperature in Celsius
    decimal? min_temperature_c
  
    // Maximum allowable cargo storage temperature in Celsius
    decimal? max_temperature_c
  
    // Declared monetary value for freight cargo insurance
    decimal? declared_value filters=min:0
  
    // Cargo transit insurance policy elected
    bool insurance_opted?
  
    // Item length in centimeters for exact volumetric calculation
    decimal? length_cm filters=min:0
  
    // Item width in centimeters for exact volumetric calculation
    decimal? width_cm filters=min:0
  
    // Item height in centimeters for exact volumetric calculation
    decimal? height_cm filters=min:0
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "booking_id"}]}
    {type: "btree", field: [{name: "commodity_type"}]}
    {type: "btree", field: [{name: "is_hazardous"}]}
  ]

  guid = "lRnsiRDlAjK89gV9AnFGpeiPTSE"
}
