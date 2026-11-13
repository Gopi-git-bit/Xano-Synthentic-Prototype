// OFFLINE PROPOSAL ONLY. An assigned driver cannot view another driver's trip.
query "owner/trips/{trip_id}" verb=GET {
  api_group = "Zippy_V1"
  auth = "user"

  input {
    int trip_id filters=min:1 {
      table = "trip"
    }
  }

  stack {
    function.run "security/resolve_context" {
      input = { user_id: $auth.id }
    } as $ctx

    precondition ($ctx.organization_id != null && ($ctx.organization_type == "vendor" || $ctx.organization_type == "both")) {
      error_type = "accessdenied"
      error = "Active vendor organization required."
    }
    precondition ($ctx.system_role == "vendor_admin" || $ctx.system_role == "fleet_manager" || $ctx.system_role == "driver") {
      error_type = "accessdenied"
      error = "Vendor/driver identity required."
    }
    var $is_driver { value = $ctx.system_role == "driver" }
    precondition (($is_driver && $ctx.member_role == "driver") || (!$is_driver && ($ctx.member_role == "owner" || $ctx.member_role == "admin" || $ctx.member_role == "dispatcher"))) {
      error_type = "accessdenied"
      error = "Vendor membership is insufficient."
    }

    var $driver_id { value = null }
    conditional {
      if ($is_driver) {
        db.query driver_profile {
          where = $db.driver_profile.user_id == $auth.id && $db.driver_profile.organization_id == $ctx.organization_id
          return = { type: "single" }
          output = ["id"]
        } as $profile
        precondition ($profile != null) {
          error_type = "accessdenied"
          error = "Unverified assigned driver profile."
        }
        var.update $driver_id { value = $profile.id }
      }
    }

    db.query trip {
      where = $db.trip.id == $input.trip_id && $db.trip.vendor_organization_id == $ctx.organization_id && ($is_driver == false || $db.trip.driver_id == $driver_id)
      return = { type: "single" }
      output = ["id", "trip_code", "booking_id", "vendor_organization_id", "vehicle_id", "driver_id", "status", "started_at", "completed_at"]
    } as $trip

    precondition ($trip != null) {
      error_type = "notfound"
      error = "Trip not found."
    }
  }

  response = { trip: $trip, read_only: true, allowed_actions: [] }
}
