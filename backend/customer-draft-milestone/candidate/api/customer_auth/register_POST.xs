// Atomically create a customer identity, new organization, owner membership, review and audit.
// No token is issued; verification remains pending. No caller-selected organization or role.
query "auth/register" verb=POST {
  api_group = "Customer Draft Authentication"
  input {
    text name filters=trim|min:1|max:100
    email email filters=trim|lower
    text password filters=min:8|max:256 {
      sensitive = true
    }
    text organization_name filters=trim|min:1|max:200
    text? phone? filters=trim|max:30
    text? requested_system_role?
  }
  stack {
    precondition (($input.email|strlen) <= 254) {
      error_type = "inputerror"
      error = "Email is too long."
    }
    precondition ($input.requested_system_role == null) {
      error_type = "accessdenied"
      error = "Role selection is unavailable."
    }
    util.get_raw_input {
      encoding = "json"
      exclude_middleware = false
    } as $raw
    var $allowed {
      value = ["name", "email", "password", "organization_name", "phone", "requested_system_role"]
    }
    foreach ($raw|keys) {
      each as $key {
        precondition ($allowed|in:$key) {
          error_type = "inputerror"
          error = "Unsupported registration field."
        }
      }
    }
    try_catch {
      try {
        db.transaction {
          stack {
            db.add organization {
              data = {name: $input.organization_name, type: "customer", status: "active", kyb_verified: false}
            } as $org
            // Unique normalized email is enforced by the database. A duplicate rolls back the org above.
            db.add user {
              data = {name: $input.name, email: $input.email, password: $input.password, phone: $input.phone, role: "member", system_role: "customer_admin", status: "active", active_organization_id: $org.id}
              output = ["id"]
            } as $user
            db.add organization_member {
              data = {organization_id: $org.id, user_id: $user.id, member_role: "owner", is_primary: true, is_active: true}
            } as $membership
            db.add approval_request {
              data = {request_type: "customer_onboarding", entity_type: "organization", entity_id: $org.id, description: "Customer verification pending human review; draft-only scope.", context_data: {user_id: $user.id, organization_id: $org.id}, status: "pending"}
            } as $review
            db.add audit_log {
              data = {entity_type: "organization", entity_id: $org.id, action: "customer_registered", actor_type: "user", actor_id: $user.id, new_state: {organization_id: $org.id, user_id: $user.id, membership_id: $membership.id, approval_request_id: $review.id, booking_scope: "draft_only"}}
            } as $audit
          }
        }
      }
      catch {
        precondition (false) {
          error_type = "accessdenied"
          error = "Registration could not be completed."
        }
      }
    }
  }
  response = {user_id: $user.id, organization_id: $org.id, system_role: "customer_admin", status: "active", booking_scope: "draft_only", approval_request_id: $review.id, verification_state: "pending_human_review"}
  guid = "deYEHtDiZxNRiUT3wDyZJeAW-_0"
}
