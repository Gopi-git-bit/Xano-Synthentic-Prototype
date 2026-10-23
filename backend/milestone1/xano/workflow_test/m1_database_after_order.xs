// NOT IMPORTED OR RUN. Refuses occupied fixture assets; never seeds, resets or deletes.
workflow_test "Milestone1 database after_order" {
  stack {
    function.call "Milestone1/snapshot" as $before
    db.get user {
      field_name = "email"
      field_value = "s1-61aa324d-a@example.invalid"
      output = ["id"]
    } as $actor
    precondition ($actor != null) {
      error = "Existing synthetic fixture required"
    }
    db.query trip_assignments {
      where = $db.trip_assignments.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" && $db.trip_assignments.released_at == null && ($db.trip_assignments.vehicle_id == "ae583565-f2f8-4dab-845d-74c58904d7d8" || $db.trip_assignments.driver_profile_id == "86a21c28-18e6-44bd-a4c9-c9be697f84c4")
      return = {type: "count"}
    } as $occupied
    precondition ($occupied == 0) {
      error = "Fixture occupied: retain existing assignments and stop"
    }
    security.create_uuid as $run_id
    var $key {
      value = "m1-after_order-" ~ $run_id
    }
    var $description {
      value = "Synthetic 61aa324d:" ~ $key
    }
    function.call "Slice1/create_and_assign" {
      input = {
        user_id: $actor.id
        expected_platform_id: "87c1d523-8ba6-4e16-849e-0ca819e572ad"
        vehicle_id: "ae583565-f2f8-4dab-845d-74c58904d7d8"
        driver_profile_id: "86a21c28-18e6-44bd-a4c9-c9be697f84c4"
        idempotency_key: $key
        cargo_description: $description
        cargo_weight_kg: 20
        body_type: "closed"
        fault: "after_order"
        hold_seconds: 0
      }
    } as $failure
    expect.to_contain ($failure.message) {
      value = "division by zero"
    }
    function.call "Milestone1/snapshot" as $after_failure
    expect.to_equal ($after_failure) {
      value = $before
    }
    function.call "Slice1/acceptance" {
      input = {key: $key, asset: 6, fault: "none", hold_seconds: 0}
    } as $retry
    expect.to_equal ($retry.code) {
      value = "CREATED"
    }
    expect.to_equal ($retry.http_status) {
      value = 202
    }
    expect.to_be_true ($retry.complete)
    expect.to_be_true ($retry.linkage_verified)
    function.call "Milestone1/snapshot" as $after_retry
    expect.to_equal ($after_retry.counts.audit_events - $before.counts.audit_events) {
      value = 1
    }
    expect.to_equal ($after_retry.counts.dispatch_offers - $before.counts.dispatch_offers) {
      value = 1
    }
    expect.to_equal ($after_retry.counts.dispatch_requirements - $before.counts.dispatch_requirements) {
      value = 1
    }
    expect.to_equal ($after_retry.counts.durable_tasks - $before.counts.durable_tasks) {
      value = 1
    }
    expect.to_equal ($after_retry.counts.event_outbox - $before.counts.event_outbox) {
      value = 1
    }
    expect.to_equal ($after_retry.counts.idempotency_records - $before.counts.idempotency_records) {
      value = 1
    }
    expect.to_equal ($after_retry.counts.operational_events - $before.counts.operational_events) {
      value = 4
    }
    expect.to_equal ($after_retry.counts.order_state_transitions - $before.counts.order_state_transitions) {
      value = 3
    }
    expect.to_equal ($after_retry.counts.order_stops - $before.counts.order_stops) {
      value = 2
    }
    expect.to_equal ($after_retry.counts.orders - $before.counts.orders) {
      value = 1
    }
    expect.to_equal ($after_retry.counts.quotes - $before.counts.quotes) {
      value = 1
    }
    expect.to_equal ($after_retry.counts.service_commitments - $before.counts.service_commitments) {
      value = 1
    }
    expect.to_equal ($after_retry.counts.transaction_participants - $before.counts.transaction_participants) {
      value = 2
    }
    expect.to_equal ($after_retry.counts.trip_assignments - $before.counts.trip_assignments) {
      value = 1
    }
    expect.to_equal ($after_retry.counts.trips - $before.counts.trips) {
      value = 1
    }
    function.call "Slice1/acceptance" {
      input = {key: $key, asset: 6, fault: "none", hold_seconds: 0}
    } as $replay
    expect.to_equal ($replay.code) {
      value = "REPLAY"
    }
    expect.to_be_true ($replay.complete)
    expect.to_be_true ($replay.linkage_verified)
    expect.to_equal ($replay.order_id) {
      value = $retry.order_id
    }
    expect.to_equal ($replay.trip_id) {
      value = $retry.trip_id
    }
    expect.to_equal ($replay.workflow_id) {
      value = $retry.workflow_id
    }
    expect.to_equal ($replay.correlation_id) {
      value = $retry.correlation_id
    }
    function.call "Milestone1/snapshot" as $after_replay
    expect.to_equal ($after_replay) {
      value = $after_retry
    }
  }
  tags = ["synthetic:milestone1", "unexecuted-candidate", "rollback:all-15-tables"]
}
