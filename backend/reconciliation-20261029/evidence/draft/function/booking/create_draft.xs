// Creates a validated customer freight booking in draft state with cargo itemization
function "booking/create_draft" {
  input {
    // Authenticated caller user ID
    int caller_user_id {
      table = "user"
    }
  
    // Optional organization selector to associate with
    int? requested_org_id
  
    // Primary pickup hub / city
    text pickup_city filters=trim
  
    // Structured pickup address
    json pickup_address
  
    // Scheduled pickup window start timestamp
    timestamp pickup_window_start
  
    // Scheduled pickup window deadline timestamp
    timestamp pickup_window_end
  
    // Primary destination city
    text delivery_city filters=trim
  
    // Structured delivery address
    json delivery_address
  
    // Scheduled delivery window start timestamp
    timestamp delivery_window_start
  
    // Scheduled delivery window deadline timestamp
    timestamp delivery_window_end
  
    // Cargo itemization array
    json cargo_items
  
    // Estimated distance in km
    decimal? estimated_distance_km filters=min:0
  
    // Optional shipper instructions
    text? special_instructions filters=trim
  }

  stack {
    // 1. Resolve caller security context
    function.run "security/resolve_context" {
      input = {
        user_id         : $input.caller_user_id
        requested_org_id: $input.requested_org_id
      }
    } as $caller_ctx
  
    precondition ($caller_ctx.can_book) {
      error_type = "accessdenied"
      error = "Caller lacks customer freight booking privileges or account is pending verification."
    }
  
    // 2. Validate service windows ordering
    precondition ($input.pickup_window_start < $input.pickup_window_end) {
      error_type = "badrequest"
      error = "Pickup window start must precede pickup window end."
    }
  
    precondition ($input.pickup_window_end <= $input.delivery_window_start) {
      error_type = "badrequest"
      error = "Pickup window must end before or at delivery window start."
    }
  
    precondition ($input.delivery_window_start < $input.delivery_window_end) {
      error_type = "badrequest"
      error = "Delivery window start must precede delivery window end."
    }
  
    // 3. Validate cargo items
    precondition (($input.cargo_items|is_array) && ($input.cargo_items|count) > 0) {
      error_type = "badrequest"
      error = "Booking must contain at least one valid cargo item."
    }
  
    // 4. Generate unique human-readable booking reference
    var $booking_ref {
      value = "ZIP-BK-" ~ (now|format_timestamp:"Ymd":"UTC") ~ "-" ~ (now|format_timestamp:"His":"UTC")
    }
  
    var $distance {
      value = $input.estimated_distance_km ?? 480
    }
  
    // 5. Insert customer_booking aggregate root
    db.add customer_booking {
      data = {
        created_at              : "now"
        booking_reference       : $booking_ref
        customer_organization_id: $caller_ctx.organization_id
        booked_by_user_id       : $caller_ctx.user_id
        status                  : "draft"
        pickup_city             : $input.pickup_city
        pickup_address          : $input.pickup_address
        pickup_window_start     : $input.pickup_window_start
        pickup_window_end       : $input.pickup_window_end
        delivery_city           : $input.delivery_city
        delivery_address        : $input.delivery_address
        delivery_window_start   : $input.delivery_window_start
        delivery_window_end     : $input.delivery_window_end
        estimated_distance_km   : $distance
        quote_amount            : 0
        total_amount            : 0
        currency                : "INR"
        payment_status          : "pending"
        matching_status         : "unmatched"
        special_instructions    : $input.special_instructions
        version                 : 1
        payment_mode            : "prepaid"
      }
    } as $new_booking
  
    // 6. Insert itemized cargo records
    foreach ($input.cargo_items) {
      each as $c {
        precondition ($c.weight_kg > 0) {
          error_type = "badrequest"
          error = "Cargo item weight must be greater than zero."
        }
      
        db.add cargo_detail {
          data = {
            created_at       : "now"
            booking_id       : $new_booking.id
            cargo_description: $c.cargo_description ?? "General Merchandise"
            commodity_type   : $c.commodity_type ?? "general_merchandise"
            weight_kg        : $c.weight_kg
            volume_cbm       : $c.volume_cbm
            package_count    : $c.package_count ?? 1
            packaging_type   : $c.packaging_type ?? "pallet"
            is_hazardous     : $c.is_hazardous ?? false
            un_number        : $c.un_number
            declared_value   : $c.declared_value ?? 0
            length_cm        : $c.length_cm
            width_cm         : $c.width_cm
            height_cm        : $c.height_cm
          }
        } as $new_cargo
      }
    }
  
    // 7. Write immutable audit log
    db.add audit_log {
      data = {
        created_at : "now"
        entity_type: "customer_booking"
        entity_id  : $new_booking.id
        action     : "booking.created"
        actor_type : "user"
        actor_id   : $caller_ctx.user_id
        new_state  : {
        id               : $new_booking.id
        booking_reference: $booking_ref
        status           : "draft"
        version          : 1
      }
      }
    } as $audit_entry
  }

  response = {
    booking_id       : $new_booking.id
    booking_reference: $booking_ref
    status           : "draft"
    version          : 1
    pickup_city      : $input.pickup_city
    delivery_city    : $input.delivery_city
    currency         : "INR"
  }

  guid = "EpwQ_xNrTvFefJL0qKTz7HO62wM"
}
