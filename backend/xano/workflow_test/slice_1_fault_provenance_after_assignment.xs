workflow_test "Slice1 fault provenance after_assignment" {
  stack {
    function.call "Slice1/setup" as $setup
    db.get user {
      field_name = "email"
      field_value = "s1-61aa324d-a@example.invalid"
      output = ["id"]
    } as $actor
  
    function.call "Slice1/create_and_assign" {
      input = {
        user_id             : $actor.id
        expected_platform_id: "87c1d523-8ba6-4e16-849e-0ca819e572ad"
        vehicle_id          : "501b62df-0c88-4511-bd7a-9998f08276a5"
        driver_profile_id   : "691375bd-3af9-48b6-aa6c-21d2259cab45"
        idempotency_key     : "proof-after_assignment"
        cargo_description   : "Synthetic 61aa324d:proof-after_assignment"
        cargo_weight_kg     : 20
        fault               : "after_assignment"
      }
    } as $failure
  
    expect.to_equal ($failure.code) {
      value = "ERROR_FATAL"
    }
  
    expect.to_contain ($failure.message) {
      value = "division by zero"
    }
  
    db.query idempotency_records {
      where = $db.idempotency_records.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
      return = {type: "count"}
    } as $count
  
    expect.to_equal ($count) {
      value = 0
    }
  
    db.query quotes {
      where = $db.quotes.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
      return = {type: "count"}
    } as $count
  
    expect.to_equal ($count) {
      value = 0
    }
  
    db.query orders {
      where = $db.orders.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
      return = {type: "count"}
    } as $count
  
    expect.to_equal ($count) {
      value = 0
    }
  
    db.query order_stops {
      where = $db.order_stops.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
      return = {type: "count"}
    } as $count
  
    expect.to_equal ($count) {
      value = 0
    }
  
    db.query dispatch_requirements {
      where = $db.dispatch_requirements.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
      return = {type: "count"}
    } as $count
  
    expect.to_equal ($count) {
      value = 0
    }
  
    db.query transaction_participants {
      where = $db.transaction_participants.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
      return = {type: "count"}
    } as $count
  
    expect.to_equal ($count) {
      value = 0
    }
  
    db.query service_commitments {
      where = $db.service_commitments.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
      return = {type: "count"}
    } as $count
  
    expect.to_equal ($count) {
      value = 0
    }
  
    db.query dispatch_offers {
      where = $db.dispatch_offers.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
      return = {type: "count"}
    } as $count
  
    expect.to_equal ($count) {
      value = 0
    }
  
    db.query trips {
      where = $db.trips.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
      return = {type: "count"}
    } as $count
  
    expect.to_equal ($count) {
      value = 0
    }
  
    db.query trip_assignments {
      where = $db.trip_assignments.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
      return = {type: "count"}
    } as $count
  
    expect.to_equal ($count) {
      value = 0
    }
  
    db.query order_state_transitions {
      where = $db.order_state_transitions.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
      return = {type: "count"}
    } as $count
  
    expect.to_equal ($count) {
      value = 0
    }
  
    db.query operational_events {
      where = $db.operational_events.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
      return = {type: "count"}
    } as $count
  
    expect.to_equal ($count) {
      value = 0
    }
  
    db.query audit_events {
      where = $db.audit_events.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
      return = {type: "count"}
    } as $count
  
    expect.to_equal ($count) {
      value = 0
    }
  
    db.query durable_tasks {
      where = $db.durable_tasks.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
      return = {type: "count"}
    } as $count
  
    expect.to_equal ($count) {
      value = 0
    }
  
    db.query event_outbox {
      where = $db.event_outbox.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
      return = {type: "count"}
    } as $count
  
    expect.to_equal ($count) {
      value = 0
    }
  
    function.call "Slice1/acceptance" {
      input = {key: "proof-after_assignment", asset: 10}
    } as $retry
  
    expect.to_equal ($retry.code) {
      value = "CREATED"
    }
  
    expect.to_be_true ($retry.complete)
    function.call "Slice1/acceptance" {
      input = {key: "proof-after_assignment", asset: 10}
    } as $replay
  
    expect.to_equal ($replay.code) {
      value = "REPLAY"
    }
  
    expect.to_be_true ($replay.complete)
  }

  tags = ["synthetic:slice1", "rollback:provenance"]
  guid = "PHO-h1u48HmNvdjDaUgnAzZ2rJ4"
}