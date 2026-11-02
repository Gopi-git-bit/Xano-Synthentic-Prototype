// OFFLINE PROPOSAL ONLY. Explicit target-organization scope; no unbounded admin listing.
query "admin/bookings" verb=GET {
  api_group = "Zippy_V1"
  auth = "user"

  input {
    int organization_id filters=min:1 {
      table = "organization"
    }
    int page?=1 filters=min:1|max:10000
    int per_page?=20 filters=min:1|max:100
  }

  stack {
    function.run "security/resolve_context" {
      input = { user_id: $auth.id }
    } as $ctx

    precondition ($ctx.is_platform_admin == true && ($ctx.system_role == "super_admin" || $ctx.system_role == "operations_admin")) {
      error_type = "accessdenied"
      error = "Platform-admin read authorization required."
    }

    db.get organization {
      field_name = "id"
      field_value = $input.organization_id
      output = ["id", "type", "status"]
    } as $org

    precondition ($org != null && $org.status == "active" && ($org.type == "customer" || $org.type == "both")) {
      error_type = "notfound"
      error = "Target customer organization not found."
    }

    // Platform role alone must never expose arbitrary customer organizations.
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
      where = $db.customer_booking.customer_organization_id == $org.id
      sort = { created_at: "desc", id: "desc" }
      return = {
        type: "list"
        paging: { page: $input.page, per_page: $input.per_page, totals: true }
      }
      output = [
        "curPage"
        "nextPage"
        "items.id"
        "items.booking_reference"
        "items.customer_organization_id"
        "items.status"
        "items.pickup_city"
        "items.delivery_city"
        "items.version"
      ]
    } as $bookings
  }

  response = $bookings
}
