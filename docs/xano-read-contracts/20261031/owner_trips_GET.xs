// OFFLINE PROPOSAL ONLY. Authenticated, vendor-tenant and driver-assignment scoped trip list.
query "owner/trips" verb=GET {
  api_group = "Zippy_V1"
  auth = "user"

  input {
    int page?=1 filters=min:1|max:10000
    int per_page?=20 filters=min:1|max:100
  }

  stack {
    function.run "security/resolve_context" {
      input = { user_id: $auth.id }
    } as $ctx

    precondition ($ctx.organization_id != null && ($ctx.organization_type == "vendor" || $ctx.organization_type == "both")) {
      error_type = "accessdenied"
      error = "Active vendor organization scope required."
    }

    precondition ($ctx.system_role == "vendor_admin" || $ctx.system_role == "fleet_manager" || $ctx.system_role == "driver") {
      error_type = "accessdenied"
      error = "Vehicle owner or driver role required."
    }

    var $is_driver {
      value = $ctx.system_role == "driver"
    }

    precondition (($is_driver && $ctx.member_role == "driver") || (!$is_driver && ($ctx.member_role == "owner" || $ctx.member_role == "admin" || $ctx.member_role == "dispatcher"))) {
      error_type = "accessdenied"
      error = "Current vendor membership does not permit assigned-trip reads."
    }

    var $driver_id { value = null }
    conditional {
      if ($is_driver) {
        db.query driver_profile {
          where = $db.driver_profile.user_id == $auth.id && $db.driver_profile.organization_id == $ctx.organization_id
          return = { type: "single" }
          output = ["id"]
        } as $driver

        precondition ($driver != null) {
          error_type = "accessdenied"
          error = "Driver profile is not linked to this vendor organization."
        }
        var.update $driver_id { value = $driver.id }
      }
    }

    db.query trip {
      where = $db.trip.vendor_organization_id == $ctx.organization_id && ($is_driver == false || $db.trip.driver_id == $driver_id)
      sort = { created_at: "desc", id: "desc" }
      return = {
        type: "list"
        paging: { page: $input.page, per_page: $input.per_page, totals: true }
      }
      output = [
        "curPage"
        "nextPage"
        "items.id"
        "items.trip_code"
        "items.vendor_organization_id"
        "items.booking_id"
        "items.vehicle_id"
        "items.driver_id"
        "items.status"
      ]
    } as $trips
  }

  response = $trips
}
