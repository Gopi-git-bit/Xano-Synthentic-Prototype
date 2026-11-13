// Resolves caller authentication identity to active organization and effective tenant permissions
function "security/resolve_context" {
  input {
    // Authenticated user ID to resolve
    int user_id {
      table = "user"
    }
  
    // Optional untrusted organization selector to validate membership against
    int? requested_org_id
  }

  stack {
    // 1. Fetch authenticated user profile
    db.get user {
      field_name = "id"
      field_value = $input.user_id
      output = [
        "id"
        "name"
        "email"
        "phone"
        "role"
        "system_role"
        "active_organization_id"
        "status"
      ]
    } as $user
  
    // Precondition: user must exist
    precondition ($user != null) {
      error_type = "unauthorized"
      error = "Authenticated user not found."
    }
  
    // Rejection of suspended accounts
    precondition ($user.status != "suspended") {
      error_type = "accessdenied"
      error = "User account has been suspended."
    }
  
    var $is_pending_verification {
      value = ($user.status == "pending_verification")
    }
  
    // Determine platform administration capability
    var $is_platform_admin {
      value = ($user.system_role == "super_admin" || $user.system_role == "operations_admin")
    }
  
    // 2. Candidate organization evaluation
    var $candidate_org_id {
      value = null
    }
  
    conditional {
      if ($input.requested_org_id != null) {
        var.update $candidate_org_id {
          value = $input.requested_org_id
        }
      }
    
      elseif ($user.active_organization_id != null) {
        var.update $candidate_org_id {
          value = $user.active_organization_id
        }
      }
    }
  
    var $resolved_org_id {
      value = null
    }
  
    var $resolved_org_type {
      value = null
    }
  
    var $resolved_member_role {
      value = null
    }
  
    var $is_org_admin {
      value = false
    }
  
    // 3. Resolve active organization ONLY if active membership exists
    conditional {
      if ($candidate_org_id != null) {
        db.get organization {
          field_name = "id"
          field_value = $candidate_org_id
          output = ["id", "name", "type", "status"]
        } as $org
      
        conditional {
          if ($org != null && $org.status == "active") {
            // Verify active membership record in organization_member table
            db.query organization_member {
              where = $db.organization_member.organization_id == $candidate_org_id && $db.organization_member.user_id == $user.id
              return = {type: "single"}
              output = ["member_role", "is_active"]
            } as $membership
          
            conditional {
              if ($membership != null && $membership.is_active) {
                var.update $resolved_org_id {
                  value = $org.id
                }
              
                var.update $resolved_org_type {
                  value = $org.type
                }
              
                var.update $resolved_member_role {
                  value = $membership.member_role
                }
              
                var.update $is_org_admin {
                  value = ($membership.member_role == "owner" || $membership.member_role == "admin")
                }
              }
            }
          }
        }
      }
    }
  
    // Determine booking capability: not pending verification, and has customer role or platform admin
    var $can_book {
      value = ($is_pending_verification == false && ($is_platform_admin == true || ($resolved_org_id != null && ($resolved_org_type == "customer" || $resolved_org_type == "both"))))
    }
  
    // 4. Construct resolved caller security context
    var $context {
      value = {
        user_id                : $user.id
        name                   : $user.name
        email                  : $user.email
        system_role            : $user.system_role
        user_status            : $user.status
        is_pending_verification: $is_pending_verification
        is_platform_admin      : $is_platform_admin
        organization_id        : $resolved_org_id
        organization_type      : $resolved_org_type
        member_role            : $resolved_member_role
        is_org_admin           : $is_org_admin
        can_book               : $can_book
      }
    }
  }

  response = $context
  guid = "wZwblzdLzpQhs7Dm4uTsNjuVq7Y"
}
