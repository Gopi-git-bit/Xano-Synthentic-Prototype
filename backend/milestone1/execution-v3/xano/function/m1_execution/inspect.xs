// Read-only inspection; fixed fixture selection, no command execution.
function "M1Execution/inspect" {
  input {
    enum case_id { values = ["identity-missing_account","identity-duplicate_account","identity-blocked_account","identity-suspended_account","identity-no_membership","identity-expired_membership","identity-future_membership","identity-starter_admin_only","identity-missing_customer_profile","identity-duplicate_customer_profile","identity-foreign_tenant_claim","identity-foreign_resource","identity-foreign_owner","identity-overweight","identity-wrong_body","identity-unverified_document","identity-expired_document","identity-inactive_vendor","identity-inactive_driver","positive-a","positive-b","same-key-race","same-vehicle-race","same-driver-race","database-after_order","database-after_assignment","application-after_order","application-after_assignment","discarded-result","proof-vehicle","proof-driver","changed-payload","expired-key"] }
    int index? filters=min:0|max:3
  }
  stack {
    db.direct_query { sql = "SELECT current_database() AS database" response_type = "single" } as $database
    precondition ($database.database == "sn9m-aat6-200c") { error_type = "accessdenied" error = "ISOLATED_SANDBOX_REQUIRED" }
    function.run "M1Execution/plan" { input = {case_id: $input.case_id} } as $plan

    var $request { value = $plan.requests[$input.index] }
    precondition ($request != null) { error = "REQUEST_INDEX_OUTSIDE_PLAN" }
    var $site { value = $plan }
    var $asset { value = {vehicle: $request.vehicle_id} }
    var $driver_asset { value = {driver: $request.driver_profile_id} }
    var $description { value = $request.cargo_description }
    var $outcome { value = {code: "INSPECT"} }
    var $caught { value = false }
    db.query orders {
      where = $db.orders.platform_id == $site.platform && $db.orders.created_by_account_id == $site.account && $db.orders.cargo_description == $description
      return = {type: "list"}
    } as $order_rows

    var $order {
      value = $order_rows|first
    }

    var $order_count {
      value = $order_rows|count
    }

    db.query idempotency_records {
      where = $db.idempotency_records.platform_id == $site.platform && $db.idempotency_records.operation_scope == ("slice1:create_assign:" ~ $site.account) && $db.idempotency_records.idempotency_key == $request.idempotency_key
      return = {type: "list"}
    } as $idem_rows

    db.query trip_assignments {
      where = $db.trip_assignments.platform_id == $site.platform && $db.trip_assignments.vehicle_id == $asset.vehicle && $db.trip_assignments.released_at == null
      return = {type: "count"}
    } as $asset_assignments

    db.query trip_assignments {
      where = $db.trip_assignments.platform_id == $site.platform && $db.trip_assignments.driver_profile_id == $driver_asset.driver && $db.trip_assignments.released_at == null
      return = {type: "count"}
    } as $driver_assignments

    var $reservation_rows {
      value = []
    }
    var $linked_assignment_id {
      value = null
    }
    var $reservation_linkage {
      value = false
    }

    var $counts {
      value = {
        offers      : 0
        quotes      : 0
        requirements: 0
        commitments : 0
        stops       : 0
        participants: 0
        transitions : 0
        events      : 0
        audit       : 0
        tasks       : 0
        outbox      : 0
        trips       : 0
        assignments : 0
        reservations: 0
      }
    }

    conditional {
      if ($order != null) {
        db.query quotes {
          where = $db.quotes.platform_id == $site.platform && $db.quotes.quote_id == $order.quote_id && $db.quotes.customer_profile_id == $site.customer
          return = {type: "count"}
        } as $quote_count

        db.query dispatch_requirements {
          where = $db.dispatch_requirements.platform_id == $site.platform && $db.dispatch_requirements.order_id == $order.order_id
          return = {type: "count"}
        } as $requirement_count

        db.query service_commitments {
          where = $db.service_commitments.platform_id == $site.platform && $db.service_commitments.order_id == $order.order_id
          return = {type: "count"}
        } as $commitment_count

        db.query dispatch_offers {
          where = $db.dispatch_offers.platform_id == $site.platform && $db.dispatch_offers.order_id == $order.order_id && $db.dispatch_offers.vehicle_id == $asset.vehicle && $db.dispatch_offers.driver_profile_id == $driver_asset.driver && $db.dispatch_offers.status == "accepted"
          return = {type: "count"}
        } as $offer_count

        db.query order_stops {
          where = $db.order_stops.platform_id == $site.platform && $db.order_stops.order_id == $order.order_id
          return = {type: "count"}
        } as $stops

        db.query transaction_participants {
          where = $db.transaction_participants.platform_id == $site.platform && $db.transaction_participants.order_id == $order.order_id
          return = {type: "count"}
        } as $participants

        db.query order_state_transitions {
          where = $db.order_state_transitions.platform_id == $site.platform && $db.order_state_transitions.order_id == $order.order_id && $db.order_state_transitions.correlation_id == $order.correlation_id
          return = {type: "count"}
        } as $transitions

        db.query operational_events {
          where = $db.operational_events.platform_id == $site.platform && $db.operational_events.aggregate_id == $order.order_id && $db.operational_events.correlation_id == $order.correlation_id
          return = {type: "count"}
        } as $events

        db.query audit_events {
          where = $db.audit_events.platform_id == $site.platform && $db.audit_events.entity_id == $order.order_id && $db.audit_events.correlation_id == $order.correlation_id
          return = {type: "count"}
        } as $audit

        db.query durable_tasks {
          where = $db.durable_tasks.platform_id == $site.platform && $db.durable_tasks.aggregate_id == $order.order_id && $db.durable_tasks.correlation_id == $order.correlation_id
          return = {type: "count"}
        } as $tasks

        db.query event_outbox {
          where = $db.event_outbox.platform_id == $site.platform && $db.event_outbox.aggregate_id == $order.order_id && $db.event_outbox.correlation_id == $order.correlation_id
          return = {type: "count"}
        } as $outbox

        db.query trips {
          where = $db.trips.platform_id == $site.platform && $db.trips.order_id == $order.order_id
          return = {type: "count"}
        } as $trips

        db.query trips {
          where = $db.trips.platform_id == $site.platform && $db.trips.order_id == $order.order_id
          return = {type: "single"}
        } as $trip

        db.query trip_assignments {
          where = $db.trip_assignments.platform_id == $site.platform && $db.trip_assignments.trip_id == $trip.trip_id && $db.trip_assignments.vehicle_id == $asset.vehicle && $db.trip_assignments.driver_profile_id == $driver_asset.driver && $db.trip_assignments.correlation_id == $order.correlation_id
          return = {type: "count"}
        } as $assignments

        db.query trip_assignments {
          where = $db.trip_assignments.platform_id == $site.platform && $db.trip_assignments.trip_id == $trip.trip_id && $db.trip_assignments.vehicle_id == $asset.vehicle && $db.trip_assignments.driver_profile_id == $driver_asset.driver && $db.trip_assignments.correlation_id == $order.correlation_id && $db.trip_assignments.released_at == null
          return = {type: "single"}
        } as $linked_assignment

        var.update $linked_assignment_id {
          value = $linked_assignment.trip_assignment_id
        }

        db.query active_assignment_reservations {
          where = $db.active_assignment_reservations.platform_id == $site.platform && $db.active_assignment_reservations.trip_assignment_id == $linked_assignment.trip_assignment_id
          sort = {active_assignment_reservations.resource_kind: "asc"}
          return = {type: "list"}
        } as $reservation_rows

        db.query active_assignment_reservations {
          where = $db.active_assignment_reservations.platform_id == $site.platform && $db.active_assignment_reservations.trip_assignment_id == $linked_assignment.trip_assignment_id && $db.active_assignment_reservations.resource_kind == "vehicle" && $db.active_assignment_reservations.resource_id == $asset.vehicle
          return = {type: "count"}
        } as $vehicle_claim_count

        db.query active_assignment_reservations {
          where = $db.active_assignment_reservations.platform_id == $site.platform && $db.active_assignment_reservations.trip_assignment_id == $linked_assignment.trip_assignment_id && $db.active_assignment_reservations.resource_kind == "driver" && $db.active_assignment_reservations.resource_id == $driver_asset.driver
          return = {type: "count"}
        } as $driver_claim_count

        var.update $reservation_linkage {
          value = (($reservation_rows|count) == 2 && $vehicle_claim_count == 1 && $driver_claim_count == 1)
        }

        var.update $counts {
          value = {
            offers      : $offer_count
            quotes      : $quote_count
            requirements: $requirement_count
            commitments : $commitment_count
            stops       : $stops
            participants: $participants
            transitions : $transitions
            events      : $events
            audit       : $audit
            tasks       : $tasks
            outbox      : $outbox
            trips       : $trips
            assignments : $assignments
            reservations: $reservation_rows|count
          }
        }
      }
    }

    var $idem {
      value = $idem_rows|first
    }

    var $linked_task_id {
      value = null
    }

    conditional {
      if ($order != null) {
        db.query durable_tasks {
          where = $db.durable_tasks.platform_id == $site.platform && $db.durable_tasks.aggregate_id == $order.order_id && $db.durable_tasks.correlation_id == $order.correlation_id
          return = {type: "single"}
        } as $linked_task

        var.update $linked_task_id {
          value = $linked_task.durable_task_id
        }
      }
    }

    var $idem_count {
      value = $idem_rows|count
    }

    var $complete {
      value = ($order_count == 1 && $idem_count == 1 && $order.status == "assigned" && $order.version == 4 && $counts.offers == 1 && $counts.quotes == 1 && $counts.requirements == 1 && $counts.commitments == 1 && $counts.stops == 2 && $counts.participants == 2 && $counts.transitions == 3 && $counts.events == 4 && $counts.audit == 1 && $counts.tasks == 1 && $counts.outbox == 1 && $counts.trips == 1 && $counts.assignments == 1 && $reservation_linkage )
    }

  }
  response = {
    reservation_rows    : $reservation_rows
    trip_assignment_id  : $linked_assignment_id
    reservation_linkage_verified: $reservation_linkage
    table_counts        : {
      active_assignment_reservations: $counts.reservations
      idempotency_records: $idem_count
      quotes: $counts.quotes
      orders: $order_count
      order_stops: $counts.stops
      dispatch_requirements: $counts.requirements
      transaction_participants: $counts.participants
      service_commitments: $counts.commitments
      dispatch_offers: $counts.offers
      trips: $counts.trips
      trip_assignments: $counts.assignments
      order_state_transitions: $counts.transitions
      operational_events: $counts.events
      audit_events: $counts.audit
      durable_tasks: $counts.tasks
      event_outbox: $counts.outbox
    }
    http_status         : $outcome|get:"http_status":$idem.response_code
    order_id            : $order.order_id
    trip_id             : $trip.trip_id
    workflow_id         : $linked_task_id
    correlation_id      : $order.correlation_id
    order_status        : $order.status
    order_version       : $order.version
    driver_assignments  : $driver_assignments
    selected_vehicle_id : $asset.vehicle
    selected_driver_id  : $driver_asset.driver
    platform_id         : $site.platform
    request_hash_sha256 : $idem.request_hash_sha256
    linkage_verified    : ($complete && $order.created_by_account_id == $site.account && $order.booking_customer_profile_id == $site.customer && $trip.order_id == $order.order_id && $idem.response_reference == $order.order_id && $idem.correlation_id == $order.correlation_id && $idem.status == "succeeded" && $idem.response_code == 202)
    lock_wait_ms        : $outcome|get:"lock_wait_ms":0
    db_pid              : $outcome|get:"db_pid":0
    lock_started_ms     : $outcome|get:"lock_started_ms":0
    lock_acquired_ms    : $outcome|get:"lock_acquired_ms":0
    code                : $outcome.code
    caught              : $caught
    order_count         : $order_count
    idem_count          : $idem_count
    asset_assignments   : $asset_assignments
    complete            : $complete
    counts              : $counts
    acceptable          : ($outcome.code == "CREATED" || $outcome.code == "RESOURCE_BUSY")
    duplicate_acceptable: ($outcome.code == "CREATED" || $outcome.code == "REPLAY")
  }

  tags = ["m1:execution-preparation"]
}
