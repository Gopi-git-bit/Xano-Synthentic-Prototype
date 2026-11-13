// Maps authenticated users to organizations with company-specific permissions and roles
table organization_member {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Organization the user belongs to
    int organization_id {
      table = "organization"
    }
  
    // User associated with the organization
    int user_id {
      table = "user"
    }
  
    // Member role within this specific organization
    enum member_role?=member {
      values = ["owner", "admin", "dispatcher", "billing", "driver", "member"]
    }
  
    // Primary organization indicator for multi-org users
    bool is_primary?
  
    // Active membership standing
    bool is_active?=true
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "organization_id"}]}
    {type: "btree", field: [{name: "user_id"}]}
    {
      type : "btree|unique"
      field: [{name: "organization_id"}, {name: "user_id"}]
    }
  ]

  guid = "i3feB0lhXFnQ72k7yfjpHtcyY6Q"
}
