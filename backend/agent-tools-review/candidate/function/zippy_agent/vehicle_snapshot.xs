// Read-only dispatch screening using persisted booking requirements and fleet records.
function "zippy_agent/vehicle_snapshot" {
  input {
    json booking
    json order_check
    int vehicle_id filters=min:1
    int driver_id filters=min:1
  }
  stack {
    var $reasons { value = [] }
    db.get vehicle {
      field_name = "id"
      field_value = $input.vehicle_id
      output = ["id", "organization_id", "assigned_driver_id", "vehicle_type", "status", "max_payload_kg", "max_volume_cbm"]
    } as $vehicle
    db.get driver_profile {
      field_name = "id"
      field_value = $input.driver_id
      output = ["id", "organization_id", "user_id", "license_expiry", "kyc_verified", "duty_status", "is_available"]
    } as $driver
    precondition ($vehicle != null && $driver != null) {
      error_type = "notfound"
      error = "Fleet candidate unavailable."
    }
    precondition ($driver.organization_id == $vehicle.organization_id) {
      error_type = "accessdenied"
      error = "Driver and vehicle must belong to the same carrier."
    }
    db.get organization {
      field_name = "id"
      field_value = $vehicle.organization_id
      output = ["id", "type", "status", "kyb_verified"]
    } as $carrier
    precondition ($carrier != null && ($carrier.type == "vendor" || $carrier.type == "both")) {
      error_type = "accessdenied"
      error = "Verified carrier relationship required."
    }
    
    conditional {
      if ($carrier.status != "active" || $carrier.kyb_verified != true) {
        var.update $reasons { value = $reasons|push:"CARRIER_NOT_VERIFIED" }
      }
    }
    
    conditional {
      if ($vehicle.status != "available") {
        var.update $reasons { value = $reasons|push:"VEHICLE_UNAVAILABLE" }
      }
    }
    
    conditional {
      if ($vehicle.assigned_driver_id != null && $vehicle.assigned_driver_id != $driver.id) {
        var.update $reasons { value = $reasons|push:"PRIMARY_DRIVER_MISMATCH" }
      }
    }
    
    conditional {
      if ($input.order_check.total_weight_kg <= 0 || $vehicle.max_payload_kg < $input.order_check.total_weight_kg) {
        var.update $reasons { value = $reasons|push:"PAYLOAD_CAPACITY" }
      }
    }
    
    conditional {
      if ($input.order_check.total_volume_cbm <= 0 || $vehicle.max_volume_cbm == null || $vehicle.max_volume_cbm < $input.order_check.total_volume_cbm) {
        var.update $reasons { value = $reasons|push:"VOLUME_CAPACITY" }
      }
    }
    
    conditional {
      if ($input.order_check.quote == null || $input.order_check.quote.vehicle_type != $vehicle.vehicle_type) {
        var.update $reasons { value = $reasons|push:"VEHICLE_TYPE_MISMATCH" }
      }
    }
    
    conditional {
      if ($input.order_check.requires_temperature_control) {
        var.update $reasons { value = $reasons|push:"TEMPERATURE_CAPABILITY_REQUIRES_MANUAL_VERIFICATION" }
      }
    }
    
    conditional {
      if ($input.order_check.is_hazardous) {
        var.update $reasons { value = $reasons|push:"HAZMAT_CAPABILITY_REQUIRES_MANUAL_VERIFICATION" }
      }
    }
    
    conditional {
      if ($driver.kyc_verified != true || $driver.is_available != true || $driver.duty_status != "on_duty") {
        var.update $reasons { value = $reasons|push:"DRIVER_UNAVAILABLE_OR_UNVERIFIED" }
      }
    }
    var $end_date { value = $input.booking.delivery_window_end|format_timestamp:"Y-m-d":"UTC" }
    var $start_date { value = $input.booking.pickup_window_start|format_timestamp:"Y-m-d":"UTC" }
    
    conditional {
      if ($driver.license_expiry == null || $driver.license_expiry < $end_date) {
        var.update $reasons { value = $reasons|push:"DRIVER_LICENSE_EXPIRED" }
      }
    }
    db.query user {
      where = $db.user.id == $driver.user_id && $db.user.status == "active" && $db.user.system_role == "driver"
      return = {type: "exists"}
    } as $driver_active
    db.query organization_member {
      where = $db.organization_member.organization_id == $vehicle.organization_id && $db.organization_member.user_id == $driver.user_id && $db.organization_member.is_active == true && $db.organization_member.member_role == "driver"
      return = {type: "exists"}
    } as $driver_member
    
    conditional {
      if ($driver_active != true || $driver_member != true) {
        var.update $reasons { value = $reasons|push:"DRIVER_MEMBERSHIP_INVALID" }
      }
    }
    db.query vehicle_availability {
      where = $db.vehicle_availability.vehicle_id == $vehicle.id && $db.vehicle_availability.organization_id == $vehicle.organization_id && $db.vehicle_availability.is_active == true && $db.vehicle_availability.available_from <= $input.booking.pickup_window_start && $db.vehicle_availability.available_until >= $input.booking.delivery_window_end
      return = {type: "exists"}
    } as $available
    
    conditional {
      if ($available != true) {
        var.update $reasons { value = $reasons|push:"AVAILABILITY_WINDOW_MISSING" }
      }
    }
    db.query active_assignment_reservations {
      where = ($db.active_assignment_reservations.vehicle_id == $vehicle.id || $db.active_assignment_reservations.driver_id == $driver.id || $db.active_assignment_reservations.order_id == $input.booking.id) && ($db.active_assignment_reservations.status == "confirmed" || ($db.active_assignment_reservations.status == "active" && $db.active_assignment_reservations.expires_at > now))
      return = {type: "exists"}
    } as $reserved
    db.query trip {
      where = ($db.trip.vehicle_id == $vehicle.id || $db.trip.driver_id == $driver.id || $db.trip.booking_id == $input.booking.id) && $db.trip.status != "completed" && $db.trip.status != "cancelled"
      return = {type: "exists"}
    } as $busy
    
    conditional {
      if ($reserved || $busy) {
        var.update $reasons { value = $reasons|push:"ASSIGNMENT_CONFLICT" }
      }
    }
    foreach (["INSURANCE", "FITNESS", "RC_BOOK"]) {
      each as $document_type {
        db.query compliance_documents {
          where = $db.compliance_documents.owner_type == "vehicle" && $db.compliance_documents.owner_id == $vehicle.id && $db.compliance_documents.document_type == $document_type && $db.compliance_documents.verification_status == "verified" && $db.compliance_documents.valid_from != null && $db.compliance_documents.valid_from <= $start_date && $db.compliance_documents.valid_until >= $end_date
          return = {type: "exists"}
        } as $document_valid
        conditional {
          if ($document_valid != true) {
            var.update $reasons { value = $reasons|push:("COMPLIANCE_" ~ $document_type) }
          }
        }
      }
    }
  }
  response = {eligible_for_review: ($reasons|count) == 0, reason_codes: $reasons, vehicle_id: $vehicle.id, driver_id: $driver.id, carrier_organization_id: $vehicle.organization_id, checked_at: now, requires_human_review: true, execution_enabled: false}
  guid = "Yc6LCSElszo0Hhox2uZqMt3ZG5E"
}
