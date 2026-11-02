// Enforces server-side tenant isolation, active membership verification, and action-specific RBAC permissions
function "security/authorize_resource" {
  input {
    // Authenticated caller user ID
    int caller_user_id {
      table = "user"
    }
  
    // Organization ID owning the target resource
    int resource_organization_id {
      table = "organization"
    }
  
    // Operation being attempted
    text action_name?=read filters=trim
  
    // Optional organization selector to check
    int? requested_org_id
  }

  stack {
    // 1. Resolve caller security context from database
    function.run "security/resolve_context" {
      input = {
        user_id         : $input.caller_user_id
        requested_org_id: $input.requested_org_id
      }
    } as $caller_ctx
  
    // 2. Validate action name against permitted whitelist
    var $allowed_actions {
      value = [
        "read"
        "create"
        "update"
        "quote"
        "accept"
        "confirm"
        "hold"
        "release_hold"
        "resume"
        "cancel"
      ]
    }
  
    var $is_valid_action {
      value = false
    }
  
    foreach ($allowed_actions) {
      each as $act {
        conditional {
          if ($act == $input.action_name) {
            var.update $is_valid_action {
              value = true
            }
          }
        }
      }
    }
  
    precondition ($is_valid_action) {
      error_type = "accessdenied"
      error = "Denied: Unknown or unsupported action: " ~ $input.action_name
    }
  
    // 3. Check action permissions and tenant boundaries
    conditional {
      // Platform operators have operational oversight for read, holds, and resumes
      if ($caller_ctx.is_platform_admin) {
        // Platform operators permitted for administrative oversight
        var $authorized {
          value = true
        }
      }
    
      else {
        // Enforce tenant boundary: caller must have active membership in the resource organization
        precondition ($caller_ctx.organization_id != null) {
          error_type = "accessdenied"
          error = "Active organization membership is required to access freight resources."
        }
      
        precondition ($caller_ctx.organization_id == $input.resource_organization_id) {
          error_type = "accessdenied"
          error = "Unauthorized cross-tenant resource access attempted."
        }
      
        // Action-specific role restrictions
        conditional {
          // Booking actions require customer or dual-role organization and booking privilege
          if ($input.action_name == "create" || $input.action_name == "update" || $input.action_name == "quote" || $input.action_name == "accept" || $input.action_name == "confirm") {
            precondition ($caller_ctx.can_book) {
              error_type = "accessdenied"
              error = "Organization does not have customer booking privileges or account is pending verification."
            }
          }
        
          // Administrative actions like hold or release require company admin role
          elseif ($input.action_name == "hold" || $input.action_name == "release_hold" || $input.action_name == "resume") {
            precondition ($caller_ctx.is_org_admin) {
              error_type = "accessdenied"
              error = "Only organization administrators can manage freight holds."
            }
          }
        }
      
        var $authorized {
          value = true
        }
      }
    }
  }

  response = {
    authorized     : true
    caller_ctx     : $caller_ctx
    resource_org_id: $input.resource_organization_id
    action         : $input.action_name
  }

  guid = "2LbK9uCTM0nMFZPMy_om6EDR0Gs"
}
