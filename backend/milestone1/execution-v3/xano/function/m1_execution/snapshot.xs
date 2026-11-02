function "M1Execution/snapshot" {
  input {}
  stack {
    db.direct_query { sql = "SELECT current_database() AS database" response_type = "single" } as $database
    precondition ($database.database == "sn9m-aat6-200c") { error_type = "accessdenied" error = "ISOLATED_SANDBOX_REQUIRED" }
    db.query account_role_memberships { sort = {account_role_memberships.id: "asc"} return = {type: "list"} } as $account_role_memberships_rows
    db.query accounts { sort = {accounts.id: "asc"} return = {type: "list"} } as $accounts_rows
    db.query active_assignment_reservations { sort = {active_assignment_reservations.id: "asc"} return = {type: "list"} } as $active_assignment_reservations_rows
    db.query audit_events { sort = {audit_events.id: "asc"} return = {type: "list"} } as $audit_events_rows
    db.query customer_profiles { sort = {customer_profiles.id: "asc"} return = {type: "list"} } as $customer_profiles_rows
    db.query dispatch_offers { sort = {dispatch_offers.id: "asc"} return = {type: "list"} } as $dispatch_offers_rows
    db.query dispatch_requirements { sort = {dispatch_requirements.id: "asc"} return = {type: "list"} } as $dispatch_requirements_rows
    db.query driver_associations { sort = {driver_associations.id: "asc"} return = {type: "list"} } as $driver_associations_rows
    db.query driver_profiles { sort = {driver_profiles.id: "asc"} return = {type: "list"} } as $driver_profiles_rows
    db.query durable_tasks { sort = {durable_tasks.id: "asc"} return = {type: "list"} } as $durable_tasks_rows
    db.query event_outbox { sort = {event_outbox.id: "asc"} return = {type: "list"} } as $event_outbox_rows
    db.query idempotency_records { sort = {idempotency_records.id: "asc"} return = {type: "list"} } as $idempotency_records_rows
    db.query operational_events { sort = {operational_events.id: "asc"} return = {type: "list"} } as $operational_events_rows
    db.query order_state_transitions { sort = {order_state_transitions.id: "asc"} return = {type: "list"} } as $order_state_transitions_rows
    db.query order_stops { sort = {order_stops.id: "asc"} return = {type: "list"} } as $order_stops_rows
    db.query orders { sort = {orders.id: "asc"} return = {type: "list"} } as $orders_rows
    db.query quotes { sort = {quotes.id: "asc"} return = {type: "list"} } as $quotes_rows
    db.query service_commitments { sort = {service_commitments.id: "asc"} return = {type: "list"} } as $service_commitments_rows
    db.query transaction_participants { sort = {transaction_participants.id: "asc"} return = {type: "list"} } as $transaction_participants_rows
    db.query trip_assignments { sort = {trip_assignments.id: "asc"} return = {type: "list"} } as $trip_assignments_rows
    db.query trips { sort = {trips.id: "asc"} return = {type: "list"} } as $trips_rows
    db.query user { sort = {user.id: "asc"} return = {type: "list"} } as $user_rows
    db.query vehicle_documents { sort = {vehicle_documents.id: "asc"} return = {type: "list"} } as $vehicle_documents_rows
    db.query vehicle_models { sort = {vehicle_models.id: "asc"} return = {type: "list"} } as $vehicle_models_rows
    db.query vehicles { sort = {vehicles.id: "asc"} return = {type: "list"} } as $vehicles_rows
    db.query vendor_profiles { sort = {vendor_profiles.id: "asc"} return = {type: "list"} } as $vendor_profiles_rows
    db.query account_role_memberships { return = {type: "count"} } as $account_role_memberships_total
    precondition (($account_role_memberships_rows|count) == $account_role_memberships_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:account_role_memberships" }
    var $account_role_memberships_digests { value = [] }
    foreach ($account_role_memberships_rows) { each as $row {
      array.push $account_role_memberships_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query accounts { return = {type: "count"} } as $accounts_total
    precondition (($accounts_rows|count) == $accounts_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:accounts" }
    var $accounts_digests { value = [] }
    foreach ($accounts_rows) { each as $row {
      array.push $accounts_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query active_assignment_reservations { return = {type: "count"} } as $active_assignment_reservations_total
    precondition (($active_assignment_reservations_rows|count) == $active_assignment_reservations_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:active_assignment_reservations" }
    var $active_assignment_reservations_digests { value = [] }
    foreach ($active_assignment_reservations_rows) { each as $row {
      array.push $active_assignment_reservations_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query audit_events { return = {type: "count"} } as $audit_events_total
    precondition (($audit_events_rows|count) == $audit_events_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:audit_events" }
    var $audit_events_digests { value = [] }
    foreach ($audit_events_rows) { each as $row {
      array.push $audit_events_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query customer_profiles { return = {type: "count"} } as $customer_profiles_total
    precondition (($customer_profiles_rows|count) == $customer_profiles_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:customer_profiles" }
    var $customer_profiles_digests { value = [] }
    foreach ($customer_profiles_rows) { each as $row {
      array.push $customer_profiles_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query dispatch_offers { return = {type: "count"} } as $dispatch_offers_total
    precondition (($dispatch_offers_rows|count) == $dispatch_offers_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:dispatch_offers" }
    var $dispatch_offers_digests { value = [] }
    foreach ($dispatch_offers_rows) { each as $row {
      array.push $dispatch_offers_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query dispatch_requirements { return = {type: "count"} } as $dispatch_requirements_total
    precondition (($dispatch_requirements_rows|count) == $dispatch_requirements_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:dispatch_requirements" }
    var $dispatch_requirements_digests { value = [] }
    foreach ($dispatch_requirements_rows) { each as $row {
      array.push $dispatch_requirements_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query driver_associations { return = {type: "count"} } as $driver_associations_total
    precondition (($driver_associations_rows|count) == $driver_associations_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:driver_associations" }
    var $driver_associations_digests { value = [] }
    foreach ($driver_associations_rows) { each as $row {
      array.push $driver_associations_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query driver_profiles { return = {type: "count"} } as $driver_profiles_total
    precondition (($driver_profiles_rows|count) == $driver_profiles_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:driver_profiles" }
    var $driver_profiles_digests { value = [] }
    foreach ($driver_profiles_rows) { each as $row {
      array.push $driver_profiles_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query durable_tasks { return = {type: "count"} } as $durable_tasks_total
    precondition (($durable_tasks_rows|count) == $durable_tasks_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:durable_tasks" }
    var $durable_tasks_digests { value = [] }
    foreach ($durable_tasks_rows) { each as $row {
      array.push $durable_tasks_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query event_outbox { return = {type: "count"} } as $event_outbox_total
    precondition (($event_outbox_rows|count) == $event_outbox_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:event_outbox" }
    var $event_outbox_digests { value = [] }
    foreach ($event_outbox_rows) { each as $row {
      array.push $event_outbox_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query idempotency_records { return = {type: "count"} } as $idempotency_records_total
    precondition (($idempotency_records_rows|count) == $idempotency_records_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:idempotency_records" }
    var $idempotency_records_digests { value = [] }
    foreach ($idempotency_records_rows) { each as $row {
      array.push $idempotency_records_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query operational_events { return = {type: "count"} } as $operational_events_total
    precondition (($operational_events_rows|count) == $operational_events_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:operational_events" }
    var $operational_events_digests { value = [] }
    foreach ($operational_events_rows) { each as $row {
      array.push $operational_events_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query order_state_transitions { return = {type: "count"} } as $order_state_transitions_total
    precondition (($order_state_transitions_rows|count) == $order_state_transitions_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:order_state_transitions" }
    var $order_state_transitions_digests { value = [] }
    foreach ($order_state_transitions_rows) { each as $row {
      array.push $order_state_transitions_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query order_stops { return = {type: "count"} } as $order_stops_total
    precondition (($order_stops_rows|count) == $order_stops_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:order_stops" }
    var $order_stops_digests { value = [] }
    foreach ($order_stops_rows) { each as $row {
      array.push $order_stops_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query orders { return = {type: "count"} } as $orders_total
    precondition (($orders_rows|count) == $orders_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:orders" }
    var $orders_digests { value = [] }
    foreach ($orders_rows) { each as $row {
      array.push $orders_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query quotes { return = {type: "count"} } as $quotes_total
    precondition (($quotes_rows|count) == $quotes_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:quotes" }
    var $quotes_digests { value = [] }
    foreach ($quotes_rows) { each as $row {
      array.push $quotes_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query service_commitments { return = {type: "count"} } as $service_commitments_total
    precondition (($service_commitments_rows|count) == $service_commitments_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:service_commitments" }
    var $service_commitments_digests { value = [] }
    foreach ($service_commitments_rows) { each as $row {
      array.push $service_commitments_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query transaction_participants { return = {type: "count"} } as $transaction_participants_total
    precondition (($transaction_participants_rows|count) == $transaction_participants_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:transaction_participants" }
    var $transaction_participants_digests { value = [] }
    foreach ($transaction_participants_rows) { each as $row {
      array.push $transaction_participants_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query trip_assignments { return = {type: "count"} } as $trip_assignments_total
    precondition (($trip_assignments_rows|count) == $trip_assignments_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:trip_assignments" }
    var $trip_assignments_digests { value = [] }
    foreach ($trip_assignments_rows) { each as $row {
      array.push $trip_assignments_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query trips { return = {type: "count"} } as $trips_total
    precondition (($trips_rows|count) == $trips_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:trips" }
    var $trips_digests { value = [] }
    foreach ($trips_rows) { each as $row {
      array.push $trips_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query user { return = {type: "count"} } as $user_total
    precondition (($user_rows|count) == $user_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:user" }
    var $user_digests { value = [] }
    foreach ($user_rows) { each as $row {
      array.push $user_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query vehicle_documents { return = {type: "count"} } as $vehicle_documents_total
    precondition (($vehicle_documents_rows|count) == $vehicle_documents_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:vehicle_documents" }
    var $vehicle_documents_digests { value = [] }
    foreach ($vehicle_documents_rows) { each as $row {
      array.push $vehicle_documents_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query vehicle_models { return = {type: "count"} } as $vehicle_models_total
    precondition (($vehicle_models_rows|count) == $vehicle_models_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:vehicle_models" }
    var $vehicle_models_digests { value = [] }
    foreach ($vehicle_models_rows) { each as $row {
      array.push $vehicle_models_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query vehicles { return = {type: "count"} } as $vehicles_total
    precondition (($vehicles_rows|count) == $vehicles_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:vehicles" }
    var $vehicles_digests { value = [] }
    foreach ($vehicles_rows) { each as $row {
      array.push $vehicles_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
    db.query vendor_profiles { return = {type: "count"} } as $vendor_profiles_total
    precondition (($vendor_profiles_rows|count) == $vendor_profiles_total) { error = "SNAPSHOT_INCOMPLETE_OR_CONCURRENT_MUTATION:vendor_profiles" }
    var $vendor_profiles_digests { value = [] }
    foreach ($vendor_profiles_rows) { each as $row {
      array.push $vendor_profiles_digests { value = {id: $row.id, sha256: $row|json_encode|sha256:false} }
    } }
  }
  response = {
    database: $database.database
    scope: "entire_sandbox_tables"
    counts: {active_assignment_reservations: $active_assignment_reservations_rows|count, audit_events: $audit_events_rows|count, dispatch_offers: $dispatch_offers_rows|count, dispatch_requirements: $dispatch_requirements_rows|count, durable_tasks: $durable_tasks_rows|count, event_outbox: $event_outbox_rows|count, idempotency_records: $idempotency_records_rows|count, operational_events: $operational_events_rows|count, order_state_transitions: $order_state_transitions_rows|count, order_stops: $order_stops_rows|count, orders: $orders_rows|count, quotes: $quotes_rows|count, service_commitments: $service_commitments_rows|count, transaction_participants: $transaction_participants_rows|count, trip_assignments: $trip_assignments_rows|count, trips: $trips_rows|count}
    content_hashes: {active_assignment_reservations: $active_assignment_reservations_rows|json_encode|sha256:false, audit_events: $audit_events_rows|json_encode|sha256:false, dispatch_offers: $dispatch_offers_rows|json_encode|sha256:false, dispatch_requirements: $dispatch_requirements_rows|json_encode|sha256:false, durable_tasks: $durable_tasks_rows|json_encode|sha256:false, event_outbox: $event_outbox_rows|json_encode|sha256:false, idempotency_records: $idempotency_records_rows|json_encode|sha256:false, operational_events: $operational_events_rows|json_encode|sha256:false, order_state_transitions: $order_state_transitions_rows|json_encode|sha256:false, order_stops: $order_stops_rows|json_encode|sha256:false, orders: $orders_rows|json_encode|sha256:false, quotes: $quotes_rows|json_encode|sha256:false, service_commitments: $service_commitments_rows|json_encode|sha256:false, transaction_participants: $transaction_participants_rows|json_encode|sha256:false, trip_assignments: $trip_assignments_rows|json_encode|sha256:false, trips: $trips_rows|json_encode|sha256:false}
    row_digests: {account_role_memberships: $account_role_memberships_digests, accounts: $accounts_digests, active_assignment_reservations: $active_assignment_reservations_digests, audit_events: $audit_events_digests, customer_profiles: $customer_profiles_digests, dispatch_offers: $dispatch_offers_digests, dispatch_requirements: $dispatch_requirements_digests, driver_associations: $driver_associations_digests, driver_profiles: $driver_profiles_digests, durable_tasks: $durable_tasks_digests, event_outbox: $event_outbox_digests, idempotency_records: $idempotency_records_digests, operational_events: $operational_events_digests, order_state_transitions: $order_state_transitions_digests, order_stops: $order_stops_digests, orders: $orders_digests, quotes: $quotes_digests, service_commitments: $service_commitments_digests, transaction_participants: $transaction_participants_digests, trip_assignments: $trip_assignments_digests, trips: $trips_digests, user: $user_digests, vehicle_documents: $vehicle_documents_digests, vehicle_models: $vehicle_models_digests, vehicles: $vehicles_digests, vendor_profiles: $vendor_profiles_digests}
    fixture_counts: {user: $user_rows|count, accounts: $accounts_rows|count, customer_profiles: $customer_profiles_rows|count, vendor_profiles: $vendor_profiles_rows|count, driver_profiles: $driver_profiles_rows|count, vehicle_models: $vehicle_models_rows|count, vehicles: $vehicles_rows|count, vehicle_documents: $vehicle_documents_rows|count, driver_associations: $driver_associations_rows|count, account_role_memberships: $account_role_memberships_rows|count}
    fixture_hashes: {user: $user_rows|json_encode|sha256:false, accounts: $accounts_rows|json_encode|sha256:false, customer_profiles: $customer_profiles_rows|json_encode|sha256:false, vendor_profiles: $vendor_profiles_rows|json_encode|sha256:false, driver_profiles: $driver_profiles_rows|json_encode|sha256:false, vehicle_models: $vehicle_models_rows|json_encode|sha256:false, vehicles: $vehicles_rows|json_encode|sha256:false, vehicle_documents: $vehicle_documents_rows|json_encode|sha256:false, driver_associations: $driver_associations_rows|json_encode|sha256:false, account_role_memberships: $account_role_memberships_rows|json_encode|sha256:false}
  }
  tags = ["m1:execution-preparation"]
}
