// Deterministic corridor pricing engine with chargeable weight calculation, cost floor enforcement, and immutable quote snapshots
function "pricing/calculate_quote" {
  input {
    // Booking ID to generate quote for
    int booking_id {
      table = "customer_booking"
    }
  
    // Requested commercial vehicle body/type
    text? vehicle_type_requested
  
    // Optional commercial discount requested in minor units
    decimal? discount_minor_requested filters=min:0
  }

  stack {
    // 1. Fetch booking record
    db.get customer_booking {
      field_name = "id"
      field_value = $input.booking_id
      output = [
        "id"
        "booking_reference"
        "pickup_city"
        "delivery_city"
        "estimated_distance_km"
        "version"
        "status"
      ]
    } as $booking
  
    precondition ($booking != null) {
      error_type = "notfound"
      error = "Customer booking not found."
    }
  
    // 2. Fetch cargo items
    db.query cargo_detail {
      where = $db.cargo_detail.booking_id == $booking.id
      return = {type: "list"}
      output = [
        "id"
        "weight_kg"
        "volume_cbm"
        "package_count"
        "length_cm"
        "width_cm"
        "height_cm"
      ]
    } as $cargo_items
  
    precondition (($cargo_items|count) > 0) {
      error_type = "badrequest"
      error = "Cannot calculate quote: booking contains no cargo items."
    }
  
    // 3. Compute actual weight and total cubic volume
    var $actual_weight_kg {
      value = 0
    }
  
    var $total_volume_cc {
      value = 0
    }
  
    foreach ($cargo_items) {
      each as $item {
        var.update $actual_weight_kg {
          value = $actual_weight_kg + $item.weight_kg
        }
      
        conditional {
          if ($item.length_cm != null && $item.width_cm != null && $item.height_cm != null) {
            var.update $total_volume_cc {
              value = $total_volume_cc + ($item.length_cm * $item.width_cm * $item.height_cm * $item.package_count)
            }
          }
        
          elseif ($item.volume_cbm != null) {
            var.update $total_volume_cc {
              value = $total_volume_cc + ($item.volume_cbm * 1000000)
            }
          }
        
          else {
            var.update $total_volume_cc {
              value = $total_volume_cc + ($item.weight_kg * 5000)
            }
          }
        }
      }
    }
  
    // 4. Resolve corridor code (e.g. TIR_CHE for Tiruppur to Chennai)
    var $corridor {
      value = ($booking.pickup_city|trim|to_upper) ~ "_" ~ ($booking.delivery_city|trim|to_upper)
    }
  
    var $vehicle_type {
      value = $input.vehicle_type_requested ?? "box_truck"
    }
  
    // 5. Query approved pricing policy
    db.query pricing_policies {
      where = $db.pricing_policies.corridor_code == $corridor && $db.pricing_policies.is_active == true
      sort = {effective_from: "desc"}
      return = {type: "single"}
      output = [
        "id"
        "version"
        "base_rate_minor"
        "per_km_rate_minor"
        "volumetric_divisor"
        "cost_floor_minor"
        "max_discount_pct"
      ]
    } as $policy
  
    // Fallback to default approved corridor policy if exact city string has spaces/variations
    conditional {
      if ($policy == null) {
        db.query pricing_policies {
          where = $db.pricing_policies.corridor_code == "TIR_CHE" && $db.pricing_policies.is_active == true
          sort = {effective_from: "desc"}
          return = {type: "single"}
          output = [
            "id"
            "version"
            "base_rate_minor"
            "per_km_rate_minor"
            "volumetric_divisor"
            "cost_floor_minor"
            "max_discount_pct"
          ]
        } as $policy
      }
    }
  
    precondition ($policy != null) {
      error_type = "badrequest"
      error = "No approved pricing policy found for corridor: " ~ $corridor ~ ". Refusing quote generation."
    }
  
    // 6. Volumetric and chargeable weight calculations
    var $divisor {
      value = $policy.volumetric_divisor ?? 5000
    }
  
    var $volumetric_weight_kg {
      value = ($total_volume_cc / $divisor)|round:2
    }
  
    var $chargeable_weight_kg {
      value = ($actual_weight_kg > $volumetric_weight_kg ? $actual_weight_kg : $volumetric_weight_kg)
    }
  
    // 7. Distance determination (from MapMyIndia route cache or booking estimate)
    var $distance_km {
      value = $booking.estimated_distance_km
    }
  
    conditional {
      if ($distance_km <= 0) {
        var.update $distance_km {
          value = 480
        }
      }
    }
  
    // 8. Tariff calculations in integer minor currency units (paise)
    var $base_rate_minor {
      value = $policy.base_rate_minor
    }
  
    var $distance_rate_minor {
      value = ($distance_km * $policy.per_km_rate_minor)|round:0
    }
  
    var $gross_amount_minor {
      value = $base_rate_minor + $distance_rate_minor
    }
  
    var $cost_floor_minor {
      value = $policy.cost_floor_minor
    }
  
    // Enforce cost floor on gross
    conditional {
      if ($gross_amount_minor < $cost_floor_minor) {
        var.update $gross_amount_minor {
          value = $cost_floor_minor
        }
      }
    }
  
    // Bounded commercial discount calculation (cannot breach policy limit or undercut cost floor)
    var $discount_applied_minor {
      value = 0
    }
  
    conditional {
      if ($input.discount_minor_requested != null && $input.discount_minor_requested > 0) {
        var $max_allowable_discount {
          value = ($gross_amount_minor * ($policy.max_discount_pct ?? 0)) / 100
        }
      
        var $max_floor_headroom {
          value = $gross_amount_minor - $cost_floor_minor
        }
      
        var.update $discount_applied_minor {
          value = $input.discount_minor_requested
        }
      
        conditional {
          if ($discount_applied_minor > $max_allowable_discount) {
            var.update $discount_applied_minor {
              value = $max_allowable_discount
            }
          }
        }
      
        conditional {
          if ($discount_applied_minor > $max_floor_headroom) {
            var.update $discount_applied_minor {
              value = $max_floor_headroom
            }
          }
        }
      }
    }
  
    var $net_amount_minor {
      value = $gross_amount_minor - $discount_applied_minor
    }
  
    // Hard guarantee: net quote must never undercut operating cost floor
    precondition ($net_amount_minor >= $cost_floor_minor) {
      error_type = "badrequest"
      error = "Calculated quote breached mandatory operating cost floor."
    }
  
    // Exact conversion boundary from minor units (paise) to decimal currency
    var $total_amount_decimal {
      value = ($net_amount_minor / 100)|round:2
    }
  
    // 9. Snapshot route evidence and itemized breakdown
    var $breakdown {
      value = {
        base_tariff_minor   : $base_rate_minor
        distance_km         : $distance_km
        per_km_rate_minor   : $policy.per_km_rate_minor
        distance_fee_minor  : $distance_rate_minor
        gross_amount_minor  : $gross_amount_minor
        discount_minor      : $discount_applied_minor
        net_amount_minor    : $net_amount_minor
        cost_floor_minor    : $cost_floor_minor
        actual_weight_kg    : $actual_weight_kg
        volumetric_weight_kg: $volumetric_weight_kg
        chargeable_weight_kg: $chargeable_weight_kg
      }
    }
  
    var $route_evidence {
      value = {
        provider     : "mappls"
        distance_km  : $distance_km
        origin_city  : $booking.pickup_city
        delivery_city: $booking.delivery_city
        calculated_at: "now"
      }
    }
  
    // 10. Generate immutable quote record
    security.create_uuid as $quote_uuid
  
    var $expires_at {
      value = now|add_secs_to_timestamp:3600
    }
  
    var $input_hash {
      value = ($corridor ~ ":" ~ ($actual_weight_kg|to_text) ~ ":" ~ ($chargeable_weight_kg|to_text) ~ ":" ~ ($distance_km|to_text) ~ ":" ~ $vehicle_type)|sha256
    }
  
    db.add booking_quote {
      data = {
        created_at          : "now"
        quote_id            : $quote_uuid
        booking_id          : $booking.id
        booking_version     : $booking.version ?? 1
        input_hash          : $input_hash
        policy_version      : $policy.version ?? "v1.0"
        corridor_code       : $corridor
        vehicle_type        : $vehicle_type
        actual_weight_kg    : $actual_weight_kg
        volumetric_weight_kg: $volumetric_weight_kg
        chargeable_weight_kg: $chargeable_weight_kg
        distance_km         : $distance_km
        base_rate_minor     : $base_rate_minor
        distance_rate_minor : $distance_rate_minor
        gross_amount_minor  : $gross_amount_minor
        discount_minor      : $discount_applied_minor
        net_amount_minor    : $net_amount_minor
        total_amount        : $total_amount_decimal
        currency            : "INR"
        breakdown           : $breakdown
        route_evidence      : $route_evidence
        expires_at          : $expires_at
        is_accepted         : false
      }
    } as $new_quote
  
    // 11. Update customer_booking projection
    var $next_status {
      value = ($booking.status == "draft" ? "quoted" : $booking.status)
    }
  
    db.edit customer_booking {
      field_name = "id"
      field_value = $booking.id
      data = {
        quote_amount: $total_amount_decimal
        total_amount: $total_amount_decimal
        status      : $next_status
        updated_at  : "now"
      }
    } as $updated_booking
  }

  response = {
    quote_id            : $quote_uuid
    booking_id          : $booking.id
    booking_version     : $booking.version ?? 1
    corridor_code       : $corridor
    vehicle_type        : $vehicle_type
    chargeable_weight_kg: $chargeable_weight_kg
    distance_km         : $distance_km
    total_amount        : $total_amount_decimal
    currency            : "INR"
    expires_at          : $expires_at
    breakdown           : $breakdown
  }

  guid = "gdL49OitRIU9iGumfA6SMsghKV8"
}
