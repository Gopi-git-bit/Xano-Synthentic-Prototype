// Read only the authenticated user's active membership in the selected organization.
query "organization/membership" verb=GET {
  api_group = "Customer Draft Authentication"
  auth = "user"
  input {
    int? requested_org_id? filters=min:1
  }
  stack {
    function.run "security/resolve_context" {
      input = {user_id: $auth.id, requested_org_id: $input.requested_org_id}
    } as $context
    precondition ($context.can_read_bookings) {
      error_type = "accessdenied"
      error = "Customer membership required."
    }
    db.query organization_member {
      where = $db.organization_member.organization_id == $context.organization_id && $db.organization_member.user_id == $auth.id && $db.organization_member.is_active == true
      return = {type: "single"}
      output = ["id", "organization_id", "user_id", "member_role", "is_primary", "is_active"]
    } as $membership
    db.get organization {
      field_name = "id"
      field_value = $context.organization_id
      output = ["id", "name", "type", "status", "kyb_verified"]
    } as $org
  }
  response = {organization: $org, membership: $membership, booking_scope: "draft_only"}
  guid = "Ad98WICDMfqIxFTlFKTncmnLQbc"
}
