// Legal business entity participating as a shipper (customer), carrier (vendor), or both
table organization {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
    text name filters=trim
  
    // Organization participation role: customer, vendor, both, or internal operator
    enum type {
      values = ["customer", "vendor", "both", "operator"]
    }
  
    // Current verification and operational standing
    enum status?=active {
      values = ["pending_verification", "active", "suspended", "inactive"]
    }
  
    // Legal registration / Tax ID (e.g., GSTIN, PAN, EIN)
    text? tax_id filters=trim
  
    // Primary contact phone
    text? phone filters=trim
  
    // Primary operational contact email
    email? contact_email filters=trim|lower
  
    // Structured physical address: street, city, state, postal_code, country
    json? address
  
    // Business verification status flag
    bool kyb_verified?
  
    // Payment terms, credit limit, and bank details
    json? billing_details
  
    // Additional domain-specific configuration and tags
    json? metadata
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "type"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree|unique", field: [{name: "tax_id"}]}
  ]

  guid = "aUUAzTNAD9bTwpTtB2WxTozxVB0"
}
