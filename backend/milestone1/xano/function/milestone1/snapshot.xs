// NOT IMPORTED OR EXECUTED. Internal read-only all-table snapshot; no public route.
function "Milestone1/snapshot" {
  input {
  }
  stack {
    db.direct_query {
      sql = "SELECT current_database() AS database, (SELECT count(*)::int FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'mvpw%') AS physical_table_count"
      response_type = "single"
    } as $identity
    precondition ($identity.database == "sn9m-aat6-200c" && $identity.physical_table_count == 51) {
      error_type = "accessdenied"
      error = "Isolated synthetic database and reconciled 51-table inventory required"
    }
    db.query audit_events {
      where = $db.audit_events.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" || $db.audit_events.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048"
      return = {type: "count"}
    } as $audit_events
    db.query dispatch_offers {
      where = $db.dispatch_offers.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" || $db.dispatch_offers.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048"
      return = {type: "count"}
    } as $dispatch_offers
    db.query dispatch_requirements {
      where = $db.dispatch_requirements.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" || $db.dispatch_requirements.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048"
      return = {type: "count"}
    } as $dispatch_requirements
    db.query durable_tasks {
      where = $db.durable_tasks.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" || $db.durable_tasks.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048"
      return = {type: "count"}
    } as $durable_tasks
    db.query event_outbox {
      where = $db.event_outbox.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" || $db.event_outbox.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048"
      return = {type: "count"}
    } as $event_outbox
    db.query idempotency_records {
      where = $db.idempotency_records.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" || $db.idempotency_records.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048"
      return = {type: "count"}
    } as $idempotency_records
    db.query operational_events {
      where = $db.operational_events.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" || $db.operational_events.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048"
      return = {type: "count"}
    } as $operational_events
    db.query order_state_transitions {
      where = $db.order_state_transitions.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" || $db.order_state_transitions.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048"
      return = {type: "count"}
    } as $order_state_transitions
    db.query order_stops {
      where = $db.order_stops.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" || $db.order_stops.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048"
      return = {type: "count"}
    } as $order_stops
    db.query orders {
      where = $db.orders.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" || $db.orders.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048"
      return = {type: "count"}
    } as $orders
    db.query quotes {
      where = $db.quotes.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" || $db.quotes.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048"
      return = {type: "count"}
    } as $quotes
    db.query service_commitments {
      where = $db.service_commitments.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" || $db.service_commitments.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048"
      return = {type: "count"}
    } as $service_commitments
    db.query transaction_participants {
      where = $db.transaction_participants.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" || $db.transaction_participants.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048"
      return = {type: "count"}
    } as $transaction_participants
    db.query trip_assignments {
      where = $db.trip_assignments.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" || $db.trip_assignments.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048"
      return = {type: "count"}
    } as $trip_assignments
    db.query trips {
      where = $db.trips.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" || $db.trips.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048"
      return = {type: "count"}
    } as $trips
  }
  response = {
    database: $identity.database
    physical_table_count: $identity.physical_table_count
    counts: {
      audit_events: $audit_events
      dispatch_offers: $dispatch_offers
      dispatch_requirements: $dispatch_requirements
      durable_tasks: $durable_tasks
      event_outbox: $event_outbox
      idempotency_records: $idempotency_records
      operational_events: $operational_events
      order_state_transitions: $order_state_transitions
      order_stops: $order_stops
      orders: $orders
      quotes: $quotes
      service_commitments: $service_commitments
      transaction_participants: $transaction_participants
      trip_assignments: $trip_assignments
      trips: $trips
    }
  }
  tags = ["synthetic:milestone1", "read-only", "unexecuted-candidate"]
}
