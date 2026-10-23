// RESERVATION V2: full-table content snapshots, not just aggregate counts.
// Inventory reconciliation is NOT verified. This candidate intentionally refuses
// execution until a reviewed inventory implementation replaces the false guard.
// That later change requires another hash and native preview.
function "Milestone1/snapshot" {
  input {}
  stack {
    db.direct_query {
      sql = "SELECT current_database() AS database"
      response_type = "single"
    } as $identity
    precondition ($identity.database == "sn9m-aat6-200c") {
      error_type = "accessdenied"
      error = "Verified isolated sandbox required"
    }
    precondition (false) {
      error_type = "accessdenied"
      error = "SUPPORTED_INVENTORY_RECONCILIATION_REQUIRED"
    }
    db.query active_assignment_reservations {
      sort = {active_assignment_reservations.id: "asc"}
      return = {type: "list"}
    } as $active_assignment_reservations_rows
    db.query audit_events {
      sort = {audit_events.id: "asc"}
      return = {type: "list"}
    } as $audit_events_rows
    db.query dispatch_offers {
      sort = {dispatch_offers.id: "asc"}
      return = {type: "list"}
    } as $dispatch_offers_rows
    db.query dispatch_requirements {
      sort = {dispatch_requirements.id: "asc"}
      return = {type: "list"}
    } as $dispatch_requirements_rows
    db.query durable_tasks {
      sort = {durable_tasks.id: "asc"}
      return = {type: "list"}
    } as $durable_tasks_rows
    db.query event_outbox {
      sort = {event_outbox.id: "asc"}
      return = {type: "list"}
    } as $event_outbox_rows
    db.query idempotency_records {
      sort = {idempotency_records.id: "asc"}
      return = {type: "list"}
    } as $idempotency_records_rows
    db.query operational_events {
      sort = {operational_events.id: "asc"}
      return = {type: "list"}
    } as $operational_events_rows
    db.query order_state_transitions {
      sort = {order_state_transitions.id: "asc"}
      return = {type: "list"}
    } as $order_state_transitions_rows
    db.query order_stops {
      sort = {order_stops.id: "asc"}
      return = {type: "list"}
    } as $order_stops_rows
    db.query orders {
      sort = {orders.id: "asc"}
      return = {type: "list"}
    } as $orders_rows
    db.query quotes {
      sort = {quotes.id: "asc"}
      return = {type: "list"}
    } as $quotes_rows
    db.query service_commitments {
      sort = {service_commitments.id: "asc"}
      return = {type: "list"}
    } as $service_commitments_rows
    db.query transaction_participants {
      sort = {transaction_participants.id: "asc"}
      return = {type: "list"}
    } as $transaction_participants_rows
    db.query trip_assignments {
      sort = {trip_assignments.id: "asc"}
      return = {type: "list"}
    } as $trip_assignments_rows
    db.query trips {
      sort = {trips.id: "asc"}
      return = {type: "list"}
    } as $trips_rows
  }
  response = {
    database: $identity.database
    scope: "entire_sandbox_tables"
    counts: {
      active_assignment_reservations: $active_assignment_reservations_rows|count
      audit_events: $audit_events_rows|count
      dispatch_offers: $dispatch_offers_rows|count
      dispatch_requirements: $dispatch_requirements_rows|count
      durable_tasks: $durable_tasks_rows|count
      event_outbox: $event_outbox_rows|count
      idempotency_records: $idempotency_records_rows|count
      operational_events: $operational_events_rows|count
      order_state_transitions: $order_state_transitions_rows|count
      order_stops: $order_stops_rows|count
      orders: $orders_rows|count
      quotes: $quotes_rows|count
      service_commitments: $service_commitments_rows|count
      transaction_participants: $transaction_participants_rows|count
      trip_assignments: $trip_assignments_rows|count
      trips: $trips_rows|count
    }
    content_hashes: {
      active_assignment_reservations: $active_assignment_reservations_rows|json_encode|sha256:false
      audit_events: $audit_events_rows|json_encode|sha256:false
      dispatch_offers: $dispatch_offers_rows|json_encode|sha256:false
      dispatch_requirements: $dispatch_requirements_rows|json_encode|sha256:false
      durable_tasks: $durable_tasks_rows|json_encode|sha256:false
      event_outbox: $event_outbox_rows|json_encode|sha256:false
      idempotency_records: $idempotency_records_rows|json_encode|sha256:false
      operational_events: $operational_events_rows|json_encode|sha256:false
      order_state_transitions: $order_state_transitions_rows|json_encode|sha256:false
      order_stops: $order_stops_rows|json_encode|sha256:false
      orders: $orders_rows|json_encode|sha256:false
      quotes: $quotes_rows|json_encode|sha256:false
      service_commitments: $service_commitments_rows|json_encode|sha256:false
      transaction_participants: $transaction_participants_rows|json_encode|sha256:false
      trip_assignments: $trip_assignments_rows|json_encode|sha256:false
      trips: $trips_rows|json_encode|sha256:false
    }
  }
  tags = ["synthetic:milestone1", "read-only", "reservation-v2", "inventory-blocked"]
}
