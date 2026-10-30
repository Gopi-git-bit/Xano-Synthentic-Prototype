// OFFLINE PROPOSAL ONLY. Admin lookup requires explicit organization and record ID.
query "admin/bookings/{booking_id}" verb=GET {
  api_group = "Zippy_V1"
  auth = "user"

  input {
    int organization_id filters=min:1 {
      table = "organization"
    }
    int booking_id filters=min:1 {
      table = "customer_booking"
    }
  }

  stack {
    function.run "security/resolve_context" {
      input = { user_id: $auth.id }
    } as $ctx

    precondition ($ctx.is_platform_admin == true && ($ctx.system_role == "super_admin" || $ctx.system_role == "operations_admin")) {
      error_type = "accessdenied"
      error = "Platform admin required."
    }

    db.get organization {
      field_name = "id"
      field_value = $input.organization_id
      output = ["id", "type", "status"]
    } as $org

    precondition ($org != null && $org.status == "active" && ($org.type == "customer" || $org.type == "both")) {
      error_type = "notfound"
      error = "Customer organization not found."
    }

    // A platform role cannot substitute for a resource-specific access grant.
    db.query organization_member {
      where = $db.organization_member.organization_id == $org.id && $db.organization_member.user_id == $auth.id && $db.organization_member.is_active == true
      return = { type: "single" }
      output = ["member_role"]
    } as $grant

    precondition ($grant != null && ($grant.member_role == "owner" || $grant.member_role == "admin")) {
      error_type = "accessdenied"
      error = "Explicit active organization-level admin read grant required."
    }

    db.query customer_booking {
      where = $db.customer_booking.id == $input.booking_id && $db.customer_booking.customer_organization_id == $org.id
      return = { type: "single" }
      output = ["id", "booking_reference", "customer_organization_id", "status", "pickup_city", "delivery_city", "version"]
    } as $booking

    precondition ($booking != null) {
      error_type = "notfound"
      error = "Booking not found."
    }
  }

  response = { booking: $booking, read_only: true, allowed_actions: [] }
}
