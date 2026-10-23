// State-dependent acceptance cases are workflow tests, not isolated unit tests.
function "Slice1/acceptance" {
  input {
    enum site?=a {
      values = ["a", "b"]
    }

    enum claimed_site?=a {
      values = ["a", "b"]
    }

    enum resource_site?=a {
      values = ["a", "b"]
    }

    int asset? filters=min:0|max:11
    int driver_asset? filters=min:0|max:11
    text key
    enum action?=execute {
      values = ["execute", "inspect"]
    }

    decimal weight?=20
    text body_type?=closed
    enum fault?=none {
      values = ["none", "after_order", "after_assignment", "application_after_order", "application_after_assignment"]
    }

    decimal hold_seconds?
    bool expect_failure?
    text variant?
  }

  stack {
    var $sites {
      value = {
        a: {
        "platform":"87c1d523-8ba6-4e16-849e-0ca819e572ad","account":"e8066938-21c9-4732-b9bd-7b2ec3c3a180","customer":"46abb6ab-64aa-4b17-81fc-bc746e0cb8fb","vendor_account":"110bf847-bde2-4a8c-a0f5-b6fb1f216609","vendor":"8f88539e-5bf7-484e-acc2-ea3a3d9e30e8","model":"4cf690b2-80d4-4f05-b04a-558b7bf260b4","email":"s1-61aa324d-a@example.invalid","assets":[{
        "vehicle":"24ca1b5c-c369-4fdd-ab4e-e5dd19a1e90d","driver":"622b382a-ca58-4789-ada3-d82786d69651","driver_account":"a0d537e9-e131-4ec5-a942-509f16815e39","association":"e234b486-f497-4ee6-bf8c-bee5bd2cbe65","insurance":"b33dbeab-6151-44d4-887b-fe269c3aef30","fitness":"189745ff-ca14-49ec-8f83-0d9edab572a8","driver_membership":"26b1a03d-18cc-4b9e-8cc2-943db8341885"
        },{
        "vehicle":"1684d32d-34c6-4252-bd04-6833615d8e7d","driver":"a6e3218d-deb4-4e76-81b7-cbdc5bf8b643","driver_account":"1bdfd378-a86e-40af-ad7a-8121f81d19f2","association":"048c6352-7237-4c19-bb2b-c2cac72c55b5","insurance":"f90d0211-ca0a-488e-91e5-a115799eb9b2","fitness":"8cd237a0-d92d-47d7-8049-7bcb0402d270","driver_membership":"d6647789-88d7-426c-a5fe-4f7822b66efc"
        },{
        "vehicle":"1dfda5ef-79c4-4b51-817c-dfcd70c1d926","driver":"7dd95ea7-b37c-49d3-ac87-9f93fa44bdd2","driver_account":"3cd6561d-706a-401f-a9b8-1ffd144a172a","association":"26dc1168-1ad9-4359-85fe-06e12e9e0620","insurance":"47678bb6-be18-4129-8f32-d532aa8704d2","fitness":"e958e1b5-bd12-4ede-8ef6-843b98f40a69","driver_membership":"8ec15f37-de5f-406c-b1e9-a9bb5fec0f68"
        },{
        "vehicle":"eb7d070b-d6ce-4b83-b9ca-196e8e057480","driver":"d1a80ab3-e471-41e4-a37d-0b6f4412a328","driver_account":"2cc7c754-b201-421a-a0be-f921774c2644","association":"7f2383ef-8bed-4a58-af30-0d4c8505fd10","insurance":"8e9997af-3261-4823-81de-731bc6051f79","fitness":"719f8350-e809-42c9-8e6c-7274caaddf1d","driver_membership":"5b7ca0be-1c11-49f1-b10e-68cb31e12b1e"
        },{
        "vehicle":"d4dddae9-811a-45ea-b69c-39d96dd54ada","driver":"1bb61fb7-8cf3-4bab-98d6-ba7e4044f7e1","driver_account":"5281b486-9c3b-4204-919b-f689a6fc0997","association":"cb066413-655e-4f57-85b8-5a6ccf7acf80","insurance":"c7ebbcd2-ae87-492b-b2e2-bc370637e1ca","fitness":"3b4e8f8a-30e3-4efb-8518-7e8370f8255e","driver_membership":"642f2bb0-bc79-4393-b4d4-0084dcc8f625"
        },{
        "vehicle":"f152ade6-0801-4c46-8d32-7005b12fe973","driver":"f2825860-a636-48b7-9971-4445ea421eea","driver_account":"9c43c1ef-87a2-4856-9dfa-9a723407d109","association":"b8a0d3be-fd6b-4e12-8eb8-cde81c61b97b","insurance":"586b72fc-57c4-4dcd-84e5-0f14cf29758e","fitness":"22c94ad2-cdb4-43fe-8ac8-1752ade55474","driver_membership":"4605d7cb-fa16-47ff-8ac6-bde3820b6d3d"
        },{
        "vehicle":"ae583565-f2f8-4dab-845d-74c58904d7d8","driver":"86a21c28-18e6-44bd-a4c9-c9be697f84c4","driver_account":"ec2a6362-c4ca-4efd-9213-df5ec4d8fe7a","association":"33f86110-1e4d-48bc-820a-96f3a5adc4d4","insurance":"6a67aad3-94e7-456c-838f-54bc7adf65a9","fitness":"02715014-adb2-4a9a-ab91-a6fd3487cd86","driver_membership":"6a366b66-2f2c-4c81-8c3e-4c1eb6d2ae36"
        },{
        "vehicle":"05c12f89-6e48-4697-9c53-39487a156757","driver":"62c65079-5dc0-4c4e-b157-132d58a5bc66","driver_account":"d7f93cae-1ccd-4fe6-990e-711c73d9d6bd","association":"90feec82-2c97-409b-8f05-b5e56c2fe054","insurance":"d60fac4d-1250-4377-8d87-2dd29143e3e9","fitness":"7380eae9-01fb-4780-bdd9-5c0f6f634f5c","driver_membership":"e92cd611-4810-41c4-87a9-e85144f0cf02"
        },{
        "vehicle":"a2fea98a-2819-4c26-b43b-ad3c94929bad","driver":"3f432245-a64e-4537-a07d-1dacd4a86d95","driver_account":"145bc363-cdb1-4d4f-9259-2bd4afc4623e","association":"cdfb2038-4b5c-427b-a776-652630462cd7","insurance":"647503df-c11e-4377-a550-861818eaa9d0","fitness":"54a35614-2c54-4f5a-9289-fb5888fd832b","driver_membership":"44479c27-6dd8-4391-877d-4fb35bd5073b"
        },{
        "vehicle":"48a72e7a-5fc0-4dad-8680-cc1cf20a1982","driver":"dbc383bb-66ee-4ebe-82aa-c80e19286e1a","driver_account":"a86a437a-6936-4bcf-bc58-ed6d7af79e69","association":"d8acbdfc-c10a-4e24-8528-06c226171fb6","insurance":"887cf471-7b85-44dd-b89f-0cb4271de85c","fitness":"ee956a2f-c9b3-42af-a47c-f13a5ed117d4","driver_membership":"5faebee2-ec7c-40b3-bac2-8d1b893b3b8e"
        },{
        "vehicle":"501b62df-0c88-4511-bd7a-9998f08276a5","driver":"691375bd-3af9-48b6-aa6c-21d2259cab45","driver_account":"ff422525-7b2b-4bab-90a4-2e6bfdb518d0","association":"7ce770df-e469-4e68-8d47-3807e2dcae99","insurance":"75921383-4d4a-4259-8aba-9f4204f085ba","fitness":"182e1a09-45a2-470f-a162-9862b710a25c","driver_membership":"c44c9435-f8d5-4ba8-babc-c702adec488d"
        },{
        "vehicle":"1a4e1dcd-0dc6-4658-a8d1-1162e0f3501c","driver":"3839cf52-800d-42d7-b4f4-137fe66dd815","driver_account":"33e2ed10-8c3f-4b28-b49d-04878705985f","association":"8987bd96-1da2-45a1-9896-b4cabfe96286","insurance":"949ffa1e-7e5f-4be8-b9fb-c14cc664024f","fitness":"fb0da14f-c51f-4817-85f5-df20134a064d","driver_membership":"e66717b6-1a8a-4e2a-bfc9-f8092bf5ef51"
        }],"memberships":["4b7f0ef4-883c-470e-9db9-9b59f94886ab","6de16a10-76a1-4e20-a021-cd5e75a16331","419e7ded-ad1d-4601-823f-6a15e613a730"]
        }
        b: {
        "platform":"809fab1c-e8aa-4b87-af06-9b54bff92048","account":"0a8b27fe-7be9-4bc6-aab1-1a8afdc71d13","customer":"95ca8b7d-9abb-4f51-8a85-e9d05129a194","vendor_account":"67b78c27-3de0-4d5f-99c6-9eb5ae2d14e8","vendor":"45545cd6-ae82-4f24-87eb-e57ccf39fbe6","model":"0d2a33f6-3493-4295-974a-2fc471d6658e","email":"s1-61aa324d-b@example.invalid","assets":[{
        "vehicle":"9ec3b1c4-d077-4851-8279-49ae088f1a8d","driver":"a72dba53-0a28-4728-8d93-eb6a80cb4ef0","driver_account":"be5dc56b-abf5-4219-8182-fe38ff10495e","association":"9f7b0d36-8459-4c02-b308-33ba62d1f1dd","insurance":"a94f1f3b-95bc-4c48-aa47-148c2c1516e8","fitness":"89986ef3-2d5f-446f-8c70-bc437a581fe3","driver_membership":"e8e755f7-d241-4218-b135-84685be6c7b4"
        },{
        "vehicle":"363d3393-83b4-4746-af9f-c31b8ea5b04a","driver":"4a117d8a-f08e-436d-afe2-89bad911ab06","driver_account":"62b4766a-398d-49ca-999b-c1f772757cde","association":"52f6d17f-d907-45e7-891a-549fe7d45134","insurance":"42f4a170-4310-4195-a308-2e9859eabb92","fitness":"52be73d1-76d7-4709-9f77-624dab6e9e42","driver_membership":"e2edd993-52d9-4f12-a621-b49039b7613c"
        }],"memberships":["00f6452a-12a7-47a8-8887-f1bf3d968dc6","11cbad8b-de65-4896-9069-62ff1ea15e10","c29d5a4e-5835-4d93-a125-599286f4a621"]
        }
      }
    }

    var $site {
      value = $sites|get:$input.site
    }

    var $resource_site {
      value = $sites|get:$input.resource_site
    }

    var $claimed_site {
      value = $sites|get:$input.claimed_site
    }

    var $asset {
      value = $resource_site.assets[$input.asset]
    }

    var $driver_asset {
      value = $asset
    }

    conditional {
      if ($input.driver_asset != null) {
        var.update $driver_asset {
          value = $resource_site.assets[$input.driver_asset]
        }
      }
    }

    var $description {
      value = "Synthetic 61aa324d:" ~ $input.key
    }

    var $cargo_description {
      value = $description ~ $input.variant
    }

    db.get user {
      field_name = "email"
      field_value = $site.email
      output = ["id"]
    } as $actor

    precondition ($actor != null) {
      error = "Synthetic fixture user missing"
    }

    var $outcome {
      value = {code: "INSPECT"}
    }

    var $caught {
      value = false
    }

    db.query idempotency_records {
      where = $db.idempotency_records.platform_id == $site.platform
      return = {type: "count"}
    } as $before_idempotency_records

    db.query quotes {
      where = $db.quotes.platform_id == $site.platform
      return = {type: "count"}
    } as $before_quotes

    db.query orders {
      where = $db.orders.platform_id == $site.platform
      return = {type: "count"}
    } as $before_orders

    db.query order_stops {
      where = $db.order_stops.platform_id == $site.platform
      return = {type: "count"}
    } as $before_order_stops

    db.query dispatch_requirements {
      where = $db.dispatch_requirements.platform_id == $site.platform
      return = {type: "count"}
    } as $before_dispatch_requirements

    db.query transaction_participants {
      where = $db.transaction_participants.platform_id == $site.platform
      return = {type: "count"}
    } as $before_transaction_participants

    db.query service_commitments {
      where = $db.service_commitments.platform_id == $site.platform
      return = {type: "count"}
    } as $before_service_commitments

    db.query dispatch_offers {
      where = $db.dispatch_offers.platform_id == $site.platform
      return = {type: "count"}
    } as $before_dispatch_offers

    db.query trips {
      where = $db.trips.platform_id == $site.platform
      return = {type: "count"}
    } as $before_trips

    db.query trip_assignments {
      where = $db.trip_assignments.platform_id == $site.platform
      return = {type: "count"}
    } as $before_trip_assignments

    db.query order_state_transitions {
      where = $db.order_state_transitions.platform_id == $site.platform
      return = {type: "count"}
    } as $before_order_state_transitions

    db.query operational_events {
      where = $db.operational_events.platform_id == $site.platform
      return = {type: "count"}
    } as $before_operational_events

    db.query audit_events {
      where = $db.audit_events.platform_id == $site.platform
      return = {type: "count"}
    } as $before_audit_events

    db.query durable_tasks {
      where = $db.durable_tasks.platform_id == $site.platform
      return = {type: "count"}
    } as $before_durable_tasks

    db.query event_outbox {
      where = $db.event_outbox.platform_id == $site.platform
      return = {type: "count"}
    } as $before_event_outbox

    conditional {
      if ($input.action == "execute") {
        conditional {
          if ($input.expect_failure) {
            try_catch {
              try {
                function.run "Slice1/create_and_assign" {
                  input = {
                    user_id             : $actor.id
                    expected_platform_id: $claimed_site.platform
                    vehicle_id          : $asset.vehicle
                    driver_profile_id   : $driver_asset.driver
                    idempotency_key     : $input.key
                    cargo_description   : $cargo_description
                    cargo_weight_kg     : $input.weight
                    body_type           : $input.body_type
                    fault               : $input.fault
                    hold_seconds        : $input.hold_seconds
                  }
                } as $outcome
              }

              catch {
                var.update $caught {
                  value = true
                }
              }
            }
          }

          else {
            function.run "Slice1/create_and_assign" {
              input = {
                user_id             : $actor.id
                expected_platform_id: $claimed_site.platform
                vehicle_id          : $asset.vehicle
                driver_profile_id   : $driver_asset.driver
                idempotency_key     : $input.key
                cargo_description   : $cargo_description
                cargo_weight_kg     : $input.weight
                body_type           : $input.body_type
                fault               : $input.fault
                hold_seconds        : $input.hold_seconds
              }
            } as $outcome
          }
        }
      }
    }

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
      where = $db.idempotency_records.platform_id == $site.platform && $db.idempotency_records.operation_scope == ("slice1:create_assign:" ~ $site.account) && $db.idempotency_records.idempotency_key == $input.key
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
      value = ($order_count == 1 && $idem_count == 1 && $order.status == "assigned" && $order.version == 4 && $counts.offers == 1 && $counts.quotes == 1 && $counts.requirements == 1 && $counts.commitments == 1 && $counts.stops == 2 && $counts.participants == 2 && $counts.transitions == 3 && $counts.events == 4 && $counts.audit == 1 && $counts.tasks == 1 && $counts.outbox == 1 && $counts.trips == 1 && $counts.assignments == 1 )
    }

    db.query idempotency_records {
      where = $db.idempotency_records.platform_id == $site.platform
      return = {type: "count"}
    } as $after_idempotency_records

    db.query quotes {
      where = $db.quotes.platform_id == $site.platform
      return = {type: "count"}
    } as $after_quotes

    db.query orders {
      where = $db.orders.platform_id == $site.platform
      return = {type: "count"}
    } as $after_orders

    db.query order_stops {
      where = $db.order_stops.platform_id == $site.platform
      return = {type: "count"}
    } as $after_order_stops

    db.query dispatch_requirements {
      where = $db.dispatch_requirements.platform_id == $site.platform
      return = {type: "count"}
    } as $after_dispatch_requirements

    db.query transaction_participants {
      where = $db.transaction_participants.platform_id == $site.platform
      return = {type: "count"}
    } as $after_transaction_participants

    db.query service_commitments {
      where = $db.service_commitments.platform_id == $site.platform
      return = {type: "count"}
    } as $after_service_commitments

    db.query dispatch_offers {
      where = $db.dispatch_offers.platform_id == $site.platform
      return = {type: "count"}
    } as $after_dispatch_offers

    db.query trips {
      where = $db.trips.platform_id == $site.platform
      return = {type: "count"}
    } as $after_trips

    db.query trip_assignments {
      where = $db.trip_assignments.platform_id == $site.platform
      return = {type: "count"}
    } as $after_trip_assignments

    db.query order_state_transitions {
      where = $db.order_state_transitions.platform_id == $site.platform
      return = {type: "count"}
    } as $after_order_state_transitions

    db.query operational_events {
      where = $db.operational_events.platform_id == $site.platform
      return = {type: "count"}
    } as $after_operational_events

    db.query audit_events {
      where = $db.audit_events.platform_id == $site.platform
      return = {type: "count"}
    } as $after_audit_events

    db.query durable_tasks {
      where = $db.durable_tasks.platform_id == $site.platform
      return = {type: "count"}
    } as $after_durable_tasks

    db.query event_outbox {
      where = $db.event_outbox.platform_id == $site.platform
      return = {type: "count"}
    } as $after_event_outbox

    var $rollback_clean {
      value = $before_idempotency_records == $after_idempotency_records && $before_quotes == $after_quotes && $before_orders == $after_orders && $before_order_stops == $after_order_stops && $before_dispatch_requirements == $after_dispatch_requirements && $before_transaction_participants == $after_transaction_participants && $before_service_commitments == $after_service_commitments && $before_dispatch_offers == $after_dispatch_offers && $before_trips == $after_trips && $before_trip_assignments == $after_trip_assignments && $before_order_state_transitions == $after_order_state_transitions && $before_operational_events == $after_operational_events && $before_audit_events == $after_audit_events && $before_durable_tasks == $after_durable_tasks && $before_event_outbox == $after_event_outbox
    }
  }

  response = {
    table_counts        : {
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
    before_table_counts: {
      idempotency_records: $before_idempotency_records
      quotes: $before_quotes
      orders: $before_orders
      order_stops: $before_order_stops
      dispatch_requirements: $before_dispatch_requirements
      transaction_participants: $before_transaction_participants
      service_commitments: $before_service_commitments
      dispatch_offers: $before_dispatch_offers
      trips: $before_trips
      trip_assignments: $before_trip_assignments
      order_state_transitions: $before_order_state_transitions
      operational_events: $before_operational_events
      audit_events: $before_audit_events
      durable_tasks: $before_durable_tasks
      event_outbox: $before_event_outbox
    }
    after_table_counts: {
      idempotency_records: $after_idempotency_records
      quotes: $after_quotes
      orders: $after_orders
      order_stops: $after_order_stops
      dispatch_requirements: $after_dispatch_requirements
      transaction_participants: $after_transaction_participants
      service_commitments: $after_service_commitments
      dispatch_offers: $after_dispatch_offers
      trips: $after_trips
      trip_assignments: $after_trip_assignments
      order_state_transitions: $after_order_state_transitions
      operational_events: $after_operational_events
      audit_events: $after_audit_events
      durable_tasks: $after_durable_tasks
      event_outbox: $after_event_outbox
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
    rollback_clean      : $rollback_clean
    counts              : $counts
    acceptable          : ($outcome.code == "CREATED" || $outcome.code == "RESOURCE_BUSY")
    duplicate_acceptable: ($outcome.code == "CREATED" || $outcome.code == "REPLAY")
  }

  tags = ["synthetic:slice1", "acceptance:database"]
  guid = "bGJf-ZVatKmxx8Rf-gW3Vzz7gOY"
}
