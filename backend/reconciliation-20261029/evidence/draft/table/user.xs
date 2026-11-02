// Stores user information and allows the user to authenticate against
table user {
  auth = true

  schema {
    int id
    timestamp created_at?=now
    text name filters=trim
    email? email filters=trim|lower
    password? password filters=min:8|minAlpha:1|minDigit:1
  
    // The role of the user within their company (e.g., 'admin', 'member').
    enum role? {
      values = ["admin", "member"]
    }
  
    object password_reset? {
      schema {
        password token?
        timestamp? expiration?
        bool used?
      }
    }
  
    // Mobile phone number for SMS notifications and dispatch alerts
    text? phone filters=trim
  
    // Platform-wide Zippy authorization persona
    enum? system_role?=customer_member {
      values = [
        "super_admin"
        "operations_admin"
        "support_agent"
        "customer_admin"
        "customer_member"
        "vendor_admin"
        "fleet_manager"
        "driver"
        "autonomous_agent"
      ]
    
    }
  
    // Account active standing
    enum? status?=active {
      values = ["active", "suspended", "pending_verification"]
    }
  
    // Active / primary organization context
    int? active_organization_id {
      table = "organization"
    }
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "created_at", op: "desc"}]}
    {type: "btree|unique", field: [{name: "email", op: "asc"}]}
    {type: "btree", field: [{name: "system_role"}]}
    {type: "btree", field: [{name: "active_organization_id"}]}
  ]

  tags = ["xano:quick-start"]
  guid = "hqdzoIV_nlTN8xTQwQMkOZ4kJ0Q"
}
