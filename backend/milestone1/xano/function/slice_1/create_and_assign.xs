// Bounded synthetic acceptance slice; not a production API.
function "Slice1/create_and_assign" {
  input {
    int user_id
    uuid expected_platform_id
    uuid vehicle_id
    uuid driver_profile_id
    text idempotency_key filters=trim|min:1|max:128
    text cargo_description filters=trim|min:1|max:500
    decimal cargo_weight_kg filters=min:0.001
    text body_type?=closed filters=trim|min:1|max:64
    enum fault?=none {
      values = ["none", "after_order", "after_assignment", "application_after_order", "application_after_assignment"]
    }

    decimal hold_seconds? filters=min:0|max:2
  }

  stack {
    db.direct_query {
      sql = "SELECT current_database() AS database"
      response_type = "single"
    } as $db_identity

    precondition ($db_identity.database == "sn9m-aat6-200c") {
      error_type = "accessdenied"
      error = "Synthetic slice is restricted to the verified sandbox database"
    }

    function.run "Logistics/resolve_identity" {
      input = {user_id: $input.user_id}
    } as $identity

    precondition ($identity.platform_id == $input.expected_platform_id) {
      error_type = "accessdenied"
      error = "Platform does not match authenticated identity"
    }

    var $is_customer {
      value = false
    }

    var $is_admin {
      value = false
    }

    foreach ($identity.roles) {
      each as $role {
        conditional {
          if ($role == "customer") {
            var.update $is_customer {
              value = true
            }
          }
        }

        conditional {
          if ($role == "admin") {
            var.update $is_admin {
              value = true
            }
          }
        }
      }
    }

    precondition ($is_customer && $is_admin && $identity.customer != null) {
      error_type = "accessdenied"
      error = "Synthetic coordinator requires both server-resolved customer and admin memberships"
    }

    precondition ($identity.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" || $identity.platform_id == "809fab1c-e8aa-4b87-af06-9b54bff92048") {
      error_type = "accessdenied"
      error = "Only this run synthetic platforms are permitted"
    }

    var $today {
      value = now|format_timestamp:"Y-m-d":"UTC"
    }

    var $scope {
      value = "slice1:create_assign:" ~ $identity.account_id
    }

    var $business {
      value = {
        vehicle_id       : $input.vehicle_id
        driver_profile_id: $input.driver_profile_id
        cargo_description: $input.cargo_description
        cargo_weight_kg  : $input.cargo_weight_kg
        body_type        : $input.body_type
        policy_version   : "test-m3-v1"
        distance_km      : 10
      }
    }

    var $fingerprint {
      value = $business|json_encode|sha256:false
    }

    function.run "Logistics/validate_order" {
      input = {
        payload: {
        pickup             : {
        address  : "Synthetic origin"
        latitude : 18.5204
        longitude: 73.8567
      }
        delivery           : {
        address  : "Synthetic destination"
        latitude : 19.076
        longitude: 72.8777
      }
        cargo_description  : $input.cargo_description
        cargo_weight_kg    : $input.cargo_weight_kg
        distance_km        : 10
        service            : {
        vehicle_class: "light"
        body_type    : $input.body_type
        hazardous    : false
        return_trip  : false
      }
        requested_pickup_at: "2030-01-02T10:00:00+05:30"
      }
      }
    } as $validation

    precondition ($validation.valid) {
      error_type = "accessdenied"
      error = "Invalid synthetic order input"
    }

    function.run "Logistics/calculate_test_quote" {
      input = {
        payload: {
        policy_version : "test-m3-v1"
        base_amount    : "100.00"
        per_km         : "12.50"
        per_kg         : "0.75"
        distance_km    : 10
        cargo_weight_kg: $input.cargo_weight_kg
        currency       : "INR"
      }
      }
    } as $pricing

    precondition ($pricing.valid) {
      error_type = "accessdenied"
      error = "Test pricing configuration invalid"
    }

    var $ids {
      value = []
    }

    for (32) {
      each as $index {
        security.create_uuid as $uuid
        array.push $ids {
          value = $uuid
        }
      }
    }

    var $result {
      value = null
    }

    db.direct_query {
      sql = "SELECT (extract(epoch FROM clock_timestamp()) * 1000)::bigint AS ms"
      response_type = "single"
    } as $lock_started

    var $lock_acquired {
      value = {ms: 0, pid: 0}
    }

    db.transaction {
      stack {
        db.direct_query {
          sql = "SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtextextended(CAST(? AS text), 0))"
          response_type = "single"
          arg = "slice1:61aa324d:" ~ $identity.platform_id
        } as $locked

        db.direct_query {
          sql = "SELECT (extract(epoch FROM clock_timestamp()) * 1000)::bigint AS ms, pg_backend_pid() AS pid"
          response_type = "single"
        } as $lock_acquired

        db.direct_query {
          sql = "SELECT 1 AS held FROM pg_sleep(CAST(? AS double precision))"
          response_type = "single"
          arg = $input.hold_seconds
        } as $held

        db.query idempotency_records {
          where = $db.idempotency_records.platform_id == $identity.platform_id && $db.idempotency_records.operation_scope == $scope && $db.idempotency_records.idempotency_key == $input.idempotency_key
          return = {type: "single"}
        } as $prior

        conditional {
          if ($prior != null) {
            conditional {
              if ($prior.request_hash_sha256 != $fingerprint) {
                var.update $result {
                  value = {code: "IDEMPOTENCY_CONFLICT", http_status: 409}
                }
              }

              else {
                precondition ($prior.status == "succeeded" && $prior.expires_at > now) {
                  error_type = "accessdenied"
                  error = "Original request is unavailable or expired"
                }

                db.query orders {
                  where = $db.orders.platform_id == $identity.platform_id && $db.orders.order_id == $prior.response_reference
                  return = {type: "single"}
                } as $original_order

                db.query trips {
                  where = $db.trips.platform_id == $identity.platform_id && $db.trips.order_id == $original_order.order_id
                  return = {type: "single"}
                } as $original_trip

                db.query durable_tasks {
                  where = $db.durable_tasks.platform_id == $identity.platform_id && $db.durable_tasks.aggregate_id == $original_order.order_id && $db.durable_tasks.task_type == "synthetic_order_assignment"
                  return = {type: "single"}
                } as $original_task

                var.update $result {
                  value = {
                    code              : "REPLAY"
                    http_status       : 202
                    order_id          : $original_order.order_id
                    trip_id           : $original_trip.trip_id
                    workflow_id       : $original_task.durable_task_id
                    correlation_id    : $prior.correlation_id
                    idempotency_replay: true
                  }
                }
              }
            }
          }

          else {
            db.query vehicles {
              where = $db.vehicles.platform_id == $identity.platform_id && $db.vehicles.vehicle_id == $input.vehicle_id
              return = {type: "single"}
            } as $vehicle

            db.query driver_profiles {
              where = $db.driver_profiles.platform_id == $identity.platform_id && $db.driver_profiles.driver_profile_id == $input.driver_profile_id
              return = {type: "single"}
            } as $driver

            precondition ($vehicle != null && $driver != null) {
              error_type = "accessdenied"
              error = "Resource not available to this platform"
            }

            db.query vendor_profiles {
              where = $db.vendor_profiles.platform_id == $identity.platform_id && $db.vendor_profiles.vendor_profile_id == $vehicle.vendor_profile_id
              return = {type: "single"}
            } as $vendor

            db.query vehicle_models {
              where = $db.vehicle_models.platform_id == $identity.platform_id && $db.vehicle_models.vehicle_model_id == $vehicle.vehicle_model_id
              return = {type: "single"}
            } as $model

            precondition ($vendor != null && $model != null && $vendor.account_id != null) {
              error_type = "accessdenied"
              error = "Synthetic provider metadata incomplete"
            }

            db.query accounts {
              where = $db.accounts.platform_id == $identity.platform_id && $db.accounts.account_id == $vendor.account_id
              return = {type: "single"}
            } as $vendor_account

            db.query accounts {
              where = $db.accounts.platform_id == $identity.platform_id && $db.accounts.account_id == $driver.account_id
              return = {type: "single"}
            } as $driver_account

            db.query account_role_memberships {
              where = $db.account_role_memberships.platform_id == $identity.platform_id && $db.account_role_memberships.account_id == $driver.account_id && $db.account_role_memberships.role_code == "driver" && $db.account_role_memberships.valid_from <= now && ($db.account_role_memberships.valid_until == null || $db.account_role_memberships.valid_until > now)
              return = {type: "single"}
            } as $driver_role

            db.query driver_associations {
              where = $db.driver_associations.platform_id == $identity.platform_id && $db.driver_associations.driver_profile_id == $driver.driver_profile_id && $db.driver_associations.vendor_profile_id == $vendor.vendor_profile_id && $db.driver_associations.valid_from <= now && ($db.driver_associations.valid_until == null || $db.driver_associations.valid_until > now)
              return = {type: "single"}
            } as $association

            db.query vehicle_documents {
              where = $db.vehicle_documents.platform_id == $identity.platform_id && $db.vehicle_documents.vehicle_id == $vehicle.vehicle_id && $db.vehicle_documents.document_type == "insurance" && $db.vehicle_documents.verification_status == "verified" && ($db.vehicle_documents.valid_from == null || $db.vehicle_documents.valid_from <= $today) && ($db.vehicle_documents.valid_until == null || $db.vehicle_documents.valid_until >= $today)
              return = {type: "single"}
            } as $insurance

            db.query vehicle_documents {
              where = $db.vehicle_documents.platform_id == $identity.platform_id && $db.vehicle_documents.vehicle_id == $vehicle.vehicle_id && $db.vehicle_documents.document_type == "fitness" && $db.vehicle_documents.verification_status == "verified" && ($db.vehicle_documents.valid_from == null || $db.vehicle_documents.valid_from <= $today) && ($db.vehicle_documents.valid_until == null || $db.vehicle_documents.valid_until >= $today)
              return = {type: "single"}
            } as $fitness

            precondition ($vendor_account != null && $vendor_account.status == "active" && $driver_account != null && $driver_account.status == "active" && $driver_role != null && $association != null && $insurance != null && $fitness != null && $vehicle.status == "approved" && $driver.eligibility_status == "approved" && $vendor.eligibility_status == "approved" && $model.active && $vehicle.approved_by_account_id != null && $vehicle.approved_at != null && $input.cargo_weight_kg <= $model.capacity_kg && ($input.body_type|trim|to_lower) == ($model.body_type|trim|to_lower)) {
              error_type = "accessdenied"
              error = "Provider eligibility failed"
            }

            db.query trip_assignments {
              where = $db.trip_assignments.platform_id == $identity.platform_id && $db.trip_assignments.released_at == null && ($db.trip_assignments.vehicle_id == $vehicle.vehicle_id || $db.trip_assignments.driver_profile_id == $driver.driver_profile_id)
              return = {type: "count"}
            } as $busy

            conditional {
              if ($busy > 0) {
                var.update $result {
                  value = {code: "RESOURCE_BUSY", http_status: 409}
                }
              }

              else {
                db.add idempotency_records {
                  data = {
                    platform_id          : $identity.platform_id
                    idempotency_record_id: $ids[19]
                    operation_scope      : $scope
                    idempotency_key      : $input.idempotency_key
                    request_hash_sha256  : $fingerprint
                    status               : "processing"
                    correlation_id       : $ids[31]
                    expires_at           : now|add_secs_to_timestamp:86400
                  }
                } as $claim

                db.add quotes {
                  data = {
                    platform_id          : $identity.platform_id
                    quote_id             : $ids[0]
                    customer_profile_id  : $identity.customer.customer_profile_id
                    policy_version       : "test-m3-v1"
                    input_hash_sha256    : $fingerprint
                    input_evidence       : $business
                    amount               : $pricing.amount
                    currency_code        : "INR"
                    expires_at           : now|add_secs_to_timestamp:3600
                    created_by_account_id: $identity.account_id
                  }
                } as $row

                db.add orders {
                  data = {
                    platform_id                : $identity.platform_id
                    order_id                   : $ids[1]
                    booking_customer_profile_id: $identity.customer.customer_profile_id
                    quote_id                   : $ids[0]
                    status                     : "pending"
                    cargo_description          : $input.cargo_description
                    cargo_weight_kg            : $input.cargo_weight_kg
                    version                    : 1
                    created_by_account_id      : $identity.account_id
                    correlation_id             : $ids[31]
                  }
                } as $order

                conditional {
                  if ($input.fault == "application_after_order") {
                    throw {
                      name = "inputerror"
                      value = "M1_APPLICATION_AFTER_ORDER"
                    }
                  }
                }

                conditional {
                  if ($input.fault == "after_order") {
                    db.direct_query {
                      sql = "SELECT 1 / 0 AS injected_after_order"
                      response_type = "single"
                    } as $injected
                  }
                }

                db.add order_stops {
                  data = {
                    platform_id          : $identity.platform_id
                    order_stop_id        : $ids[2]
                    order_id             : $ids[1]
                    stop_sequence        : 1
                    stop_kind            : "pickup"
                    address_text         : "Synthetic pickup"
                    latitude             : 18.5204
                    longitude            : 73.8567
                    source               : "synthetic_test"
                    created_by_account_id: $identity.account_id
                  }
                } as $row

                db.add order_stops {
                  data = {
                    platform_id          : $identity.platform_id
                    order_stop_id        : $ids[3]
                    order_id             : $ids[1]
                    stop_sequence        : 2
                    stop_kind            : "delivery"
                    address_text         : "Synthetic delivery"
                    latitude             : 19.076
                    longitude            : 72.8777
                    source               : "synthetic_test"
                    created_by_account_id: $identity.account_id
                  }
                } as $row

                db.add dispatch_requirements {
                  data = {
                    platform_id            : $identity.platform_id
                    dispatch_requirement_id: $ids[20]
                    order_id               : $ids[1]
                    required_body_type     : $input.body_type
                    created_by_account_id  : $identity.account_id
                    correlation_id         : $ids[31]
                  }
                } as $row

                db.add transaction_participants {
                  data = {
                    platform_id               : $identity.platform_id
                    transaction_participant_id: $ids[4]
                    order_id                  : $ids[1]
                    participant_role          : "customer"
                    customer_profile_id       : $identity.customer.customer_profile_id
                  }
                } as $row

                db.add transaction_participants {
                  data = {
                    platform_id               : $identity.platform_id
                    transaction_participant_id: $ids[21]
                    order_id                  : $ids[1]
                    participant_role          : "vendor"
                    vendor_profile_id         : $vendor.vendor_profile_id
                  }
                } as $row

                db.add service_commitments {
                  data = {
                    platform_id          : $identity.platform_id
                    service_commitment_id: $ids[5]
                    order_id             : $ids[1]
                    commitment_type      : "pickup"
                    committed_at         : "2030-01-02T10:00:00+05:30"
                    policy_version       : "test-slice1-v1"
                  }
                } as $row

                db.add dispatch_offers {
                  data = {
                    platform_id          : $identity.platform_id
                    dispatch_offer_id    : $ids[9]
                    order_id             : $ids[1]
                    vendor_profile_id    : $vendor.vendor_profile_id
                    vehicle_id           : $vehicle.vehicle_id
                    driver_profile_id    : $driver.driver_profile_id
                    status               : "accepted"
                    scoring_input_version: "synthetic-explicit-candidate-v1"
                    idempotency_key      : $input.idempotency_key
                    expires_at           : now|add_secs_to_timestamp:3600
                    responded_at         : now
                  }
                } as $row

                db.add trips {
                  data = {
                    platform_id: $identity.platform_id
                    trip_id    : $ids[8]
                    order_id   : $ids[1]
                    status     : "assigned"
                  }
                } as $row

                db.add trip_assignments {
                  data = {
                    platform_id           : $identity.platform_id
                    trip_assignment_id    : $ids[10]
                    trip_id               : $ids[8]
                    dispatch_offer_id     : $ids[9]
                    vendor_profile_id     : $vendor.vendor_profile_id
                    vehicle_id            : $vehicle.vehicle_id
                    driver_profile_id     : $driver.driver_profile_id
                    assigned_by_account_id: $identity.account_id
                    correlation_id        : $ids[31]
                  }
                } as $row

                db.add order_state_transitions {
                  data = {
                    platform_id              : $identity.platform_id
                    order_state_transition_id: $ids[11]
                    order_id                 : $ids[1]
                    from_status              : "pending"
                    to_status                : "quoted"
                    actor_account_id         : $identity.account_id
                    reason                   : "Synthetic coordinator explicit assignment"
                    idempotency_key          : $input.idempotency_key ~ ":quoted"
                    correlation_id           : $ids[31]
                  }
                } as $row

                db.add order_state_transitions {
                  data = {
                    platform_id              : $identity.platform_id
                    order_state_transition_id: $ids[12]
                    order_id                 : $ids[1]
                    from_status              : "quoted"
                    to_status                : "confirmed"
                    actor_account_id         : $identity.account_id
                    reason                   : "Synthetic coordinator explicit assignment"
                    idempotency_key          : $input.idempotency_key ~ ":confirmed"
                    correlation_id           : $ids[31]
                  }
                } as $row

                db.add order_state_transitions {
                  data = {
                    platform_id              : $identity.platform_id
                    order_state_transition_id: $ids[13]
                    order_id                 : $ids[1]
                    from_status              : "confirmed"
                    to_status                : "assigned"
                    actor_account_id         : $identity.account_id
                    reason                   : "Synthetic coordinator explicit assignment"
                    idempotency_key          : $input.idempotency_key ~ ":assigned"
                    correlation_id           : $ids[31]
                  }
                } as $row

                db.edit orders {
                  field_name = "id"
                  field_value = $order.id
                  data = {status: "assigned", version: 4, updated_at: now}
                } as $edited

                db.add operational_events {
                  data = {
                    platform_id         : $identity.platform_id
                    operational_event_id: $ids[14]
                    aggregate_type      : "order"
                    aggregate_id        : $ids[1]
                    aggregate_version   : 1
                    event_type          : "order_created"
                    event_data          : {
                    synthetic : true
                    run       : "61aa324d"
                    vehicle_id: $vehicle.vehicle_id
                  }
                    actor_account_id    : $identity.account_id
                    correlation_id      : $ids[31]
                  }
                } as $row

                db.add operational_events {
                  data = {
                    platform_id         : $identity.platform_id
                    operational_event_id: $ids[15]
                    aggregate_type      : "order"
                    aggregate_id        : $ids[1]
                    aggregate_version   : 2
                    event_type          : "order_quoted"
                    event_data          : {
                    synthetic : true
                    run       : "61aa324d"
                    vehicle_id: $vehicle.vehicle_id
                  }
                    actor_account_id    : $identity.account_id
                    correlation_id      : $ids[31]
                  }
                } as $row

                db.add operational_events {
                  data = {
                    platform_id         : $identity.platform_id
                    operational_event_id: $ids[16]
                    aggregate_type      : "order"
                    aggregate_id        : $ids[1]
                    aggregate_version   : 3
                    event_type          : "order_confirmed"
                    event_data          : {
                    synthetic : true
                    run       : "61aa324d"
                    vehicle_id: $vehicle.vehicle_id
                  }
                    actor_account_id    : $identity.account_id
                    correlation_id      : $ids[31]
                  }
                } as $row

                db.add operational_events {
                  data = {
                    platform_id         : $identity.platform_id
                    operational_event_id: $ids[17]
                    aggregate_type      : "order"
                    aggregate_id        : $ids[1]
                    aggregate_version   : 4
                    event_type          : "order_assigned"
                    event_data          : {
                    synthetic : true
                    run       : "61aa324d"
                    vehicle_id: $vehicle.vehicle_id
                  }
                    actor_account_id    : $identity.account_id
                    correlation_id      : $ids[31]
                  }
                } as $row

                db.add audit_events {
                  data = {
                    platform_id      : $identity.platform_id
                    audit_event_id   : $ids[18]
                    actor_account_id : $identity.account_id
                    actor_type       : "account"
                    action           : "synthetic_create_and_assign"
                    entity_type      : "order"
                    entity_id        : $ids[1]
                    after_hash_sha256: $fingerprint
                    reason           : "Owner-authorized bounded synthetic transaction proof"
                    correlation_id   : $ids[31]
                  }
                } as $row

                db.add durable_tasks {
                  data = {
                    platform_id      : $identity.platform_id
                    durable_task_id  : $ids[6]
                    task_type        : "synthetic_order_assignment"
                    aggregate_type   : "order"
                    aggregate_id     : $ids[1]
                    payload_reference: $ids[1]
                    idempotency_key  : $input.idempotency_key
                    status           : "succeeded"
                    attempt_count    : 1
                    max_attempts     : 3
                    correlation_id   : $ids[31]
                  }
                } as $row

                db.add event_outbox {
                  data = {
                    platform_id      : $identity.platform_id
                    outbox_event_id  : $ids[7]
                    aggregate_type   : "order"
                    aggregate_id     : $ids[1]
                    aggregate_version: 4
                    event_type       : "order_assigned"
                    destination      : "synthetic:test_sink"
                    payload          : {
                    order_id  : $ids[1]
                    vehicle_id: $vehicle.vehicle_id
                    synthetic : true
                  }
                    idempotency_key  : $input.idempotency_key
                    correlation_id   : $ids[31]
                  }
                } as $row

                conditional {
                  if ($input.fault == "application_after_assignment") {
                    throw {
                      name = "inputerror"
                      value = "M1_APPLICATION_AFTER_ASSIGNMENT"
                    }
                  }
                }

                conditional {
                  if ($input.fault == "after_assignment") {
                    db.direct_query {
                      sql = "SELECT 1 / 0 AS injected_after_assignment"
                      response_type = "single"
                    } as $injected
                  }
                }

                db.edit idempotency_records {
                  field_name = "id"
                  field_value = $claim.id
                  data = {
                    status            : "succeeded"
                    response_code     : 202
                    response_reference: $ids[1]
                    completed_at      : now
                  }
                } as $edited

                var.update $result {
                  value = {
                    code              : "CREATED"
                    http_status       : 202
                    order_id          : $ids[1]
                    trip_id           : $ids[8]
                    workflow_id       : $ids[6]
                    correlation_id    : $ids[31]
                    idempotency_replay: false
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  response = $result
    |set:"lock_wait_ms":$lock_acquired.ms - $lock_started.ms
    |set:"db_pid":$lock_acquired.pid
    |set:"lock_started_ms":$lock_started.ms
    |set:"lock_acquired_ms":$lock_acquired.ms
  tags = ["synthetic:slice1", "reference:new-logistic"]
  guid = "UeauMIZG4Sku7EdUiD4qURaK8fs"
}
