workspace "Zippy Synthetic Prototype_1" {
  acceptance = {ai_terms: true}
  preferences = {
    internal_docs    : true
    track_performance: true
    sql_names        : false
    sql_columns      : true
  }
}
---
// Stores user information and allows the user to authenticate against
table user {
  auth = true

  schema {
    int id
    timestamp created_at?=now
    text name filters=trim
    email? email filters=trim|lower
    password? password filters=min:8|minAlpha:1|minDigit:1
  
    // The role of the user within their company (e.g., 'admin', 'member').
    enum role? {
      values = ["admin", "member"]
    }
  
    object password_reset? {
      schema {
        password token?
        timestamp? expiration?
        bool used?
      }
    }
  
    // Mobile phone number for SMS notifications and dispatch alerts
    text? phone filters=trim
  
    // Platform-wide Zippy authorization persona
    enum? system_role?=customer_member {
      values = [
        "super_admin"
        "operations_admin"
        "support_agent"
        "customer_admin"
        "customer_member"
        "vendor_admin"
        "fleet_manager"
        "driver"
        "autonomous_agent"
      ]
    
    }
  
    // Account active standing
    enum? status?=active {
      values = ["active", "suspended", "pending_verification"]
    }
  
    // Active / primary organization context
    int? active_organization_id {
      table = "organization"
    }
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "created_at", op: "desc"}]}
    {type: "btree|unique", field: [{name: "email", op: "asc"}]}
    {type: "btree", field: [{name: "system_role"}]}
    {type: "btree", field: [{name: "active_organization_id"}]}
  ]

  tags = ["xano:quick-start"]
  guid = "hqdzoIV_nlTN8xTQwQMkOZ4kJ0Q"
}
---
// Stores logs of user activities and events within the application.
table event_log {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Reference to the user who performed the action.
    int user_id? {
      table = "user"
    }
  
    // A description of the action performed by the user (e.g., 'login', 'created_invoice', 'updated_profile').
    text action? filters=trim
  
    // Additional data related to the event, such as resource IDs, old/new values, or other contextual information.
    json metadata?
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "created_at", op: "desc"}]}
  ]

  tags = ["xano:quick-start"]
  guid = "1TVI0UZUEBKqEeaj1sqcQfOzHjc"
}
---
// Master migration manifest, relational dependency sequence, and schema reconciliation catalog
table table_index {
  auth = false

  schema {
    int id
  
    // Relational dependency load sequence (1, 2, 3...)
    int import_order?
  
    // Target Xano table name
    text table_name? filters=trim
  
    // Source CSV file name if populated from data import
    text csv_file? filters=trim
  
    // System origin: core_schema, synthetic_prototype, legacy_odoo, legacy_temporal
    text origin? filters=trim
  
    // Reference section in architectural specification or PRD
    text spec_sql_section? filters=trim
  
    // Foreign keys and relationship column mapping specification
    text relationship_columns? filters=trim
  
    // Migration & reconciliation status: reconciled, pending, deprecated
    text reconciliation_status? filters=trim
  
    // Technical architecture notes and integrity constraints
    text notes? filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "table_name"}]}
    {type: "btree", field: [{name: "import_order"}]}
    {type: "btree", field: [{name: "reconciliation_status"}]}
  ]

  guid = "oYas5-2mxXMyMgMgrzYJE7LMlak"
}
---
// Exclusive active assignment reservation claims preventing double-booking of vehicles and drivers
table active_assignment_reservations {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique reservation claim UUID
    uuid claim_id
  
    // Freight order locked for dispatch
    int order_id {
      table = "customer_booking"
    }
  
    // Vehicle claimed for this assignment
    int vehicle_id {
      table = "vehicle"
    }
  
    // Driver claimed for this assignment
    int driver_id {
      table = "driver_profile"
    }
  
    // High-entropy random claim token held by winning offer session
    text claim_token filters=trim
  
    // Reservation standing
    enum status?=active {
      values = ["active", "confirmed", "expired", "released"]
    }
  
    // Short-lived lease expiration timestamp
    timestamp expires_at
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "claim_id"}]}
    {type: "btree", field: [{name: "order_id"}]}
    {type: "btree", field: [{name: "vehicle_id"}]}
    {type: "btree", field: [{name: "driver_id"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree", field: [{name: "expires_at"}]}
  ]

  guid = "AZ158Fo2BpTszdZ1LGX59PPF7r8"
}
---
// Granular rationales, candidate scoring, and decisions made by autonomous freight agents
table agent_decision {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Parent agent run execution
    int execution_id {
      table = "agent_execution"
    }
  
    // Autonomous agent making the decision
    enum agent_name {
      values = [
        "booking_ingestion_agent"
        "matching_dispatch_agent"
        "tracking_telemetry_agent"
        "exception_incident_agent"
        "settlement_reconciliation_agent"
      ]
    
    }
  
    // Operational decision category
    text decision_type filters=trim
  
    // Entity type affected (e.g., trip, customer_booking, vehicle)
    text? entity_type filters=trim
  
    // Entity record ID
    int? entity_id
  
    // Algorithmic / LLM confidence score (0.00 to 1.00)
    decimal? confidence_score
  
    // Plain-language rationale for transparency & auditability
    text decision_rationale filters=trim
  
    // Candidate evaluation matrix considered
    json? candidate_options
  
    // Winning chosen option details
    json? selected_option
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "execution_id"}]}
    {type: "btree", field: [{name: "agent_name"}]}
    {type: "btree", field: [{name: "decision_type"}]}
    {type: "btree", field: [{name: "created_at", op: "desc"}]}
  ]

  guid = "9Igxj4T8-_vOqrieONIJYIHjuLU"
}
---
// Autonomous agent runtime execution log, performance metrics, and workflow telemetry
table agent_execution {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Autonomous agent identity
    enum agent_name {
      values = [
        "booking_ingestion_agent"
        "matching_dispatch_agent"
        "tracking_telemetry_agent"
        "exception_incident_agent"
        "settlement_reconciliation_agent"
      ]
    
    }
  
    // Triggering event source (e.g., webhook, cron_task, database_trigger)
    text trigger_source filters=trim
  
    // End-to-end tracing correlation identifier
    text? correlation_id filters=trim
  
    // Execution outcome status
    enum status?=running {
      values = ["running", "completed", "failed", "requires_approval"]
    }
  
    // Total execution runtime in milliseconds
    int execution_duration_ms? filters=min:0
  
    // Agent contextual input parameters
    json? input_context
  
    // Resulting agent synthesis or task output
    json? output_result
  
    // Failure stack trace or error message
    text? error_message filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "agent_name"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree", field: [{name: "created_at", op: "desc"}]}
    {type: "btree", field: [{name: "correlation_id"}]}
  ]

  guid = "K99-MMr1vz3txlBdgzAhoP8fxCE"
}
---
// Human-in-the-loop governance queue for high-stakes decisions requiring manual officer authorization
table approval_request {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Originating agent execution if generated by an autonomous agent
    int? execution_id {
      table = "agent_execution"
    }
  
    // Governance category requiring human sign-off
    enum request_type {
      values = [
        "refund_approval"
        "carrier_dispatch_override"
        "dispute_settlement"
        "kyb_compliance_override"
        "rate_exception"
      ]
    
    }
  
    // Domain entity type (e.g., refund_request, customer_booking, settlement, trip)
    text entity_type filters=trim
  
    // Entity record ID
    int entity_id
  
    // Human-readable summary of requested action and justification
    text description filters=trim
  
    // Snapshot of evaluation context, quotes, or disputed claims
    json? context_data
  
    // Human approval workflow standing
    enum status?=pending {
      values = ["pending", "approved", "rejected", "expired"]
    }
  
    // Authorized human user who reviewed and decided
    int? reviewed_by_user_id {
      table = "user"
    }
  
    // Timestamp of human officer review
    timestamp? reviewed_at
  
    // Human officer remarks or conditions
    text? reviewer_comment filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "request_type"}]}
    {type: "btree", field: [{name: "status"}]}
    {
      type : "btree"
      field: [{name: "entity_type"}, {name: "entity_id"}]
    }
    {type: "btree", field: [{name: "created_at", op: "desc"}]}
  ]

  guid = "OhPns22vsqvm9WRkLWMNc0Psvn0"
}
---
// Immutable compliance audit ledger capturing every critical financial and operational state transition
table audit_log {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Domain entity type (e.g., payment_transaction, refund_request, settlement, trip, customer_booking)
    text entity_type filters=trim
  
    // Primary key identifier of audited record
    int entity_id
  
    // Specific operational action executed (e.g., status_transition, refund_approved, driver_assigned)
    text action filters=trim
  
    // Actor initiating event: user, driver, system, autonomous_agent
    enum actor_type?=system {
      values = ["user", "driver", "system", "autonomous_agent"]
    }
  
    // User account ID of actor if authenticated human
    int? actor_id {
      table = "user"
    }
  
    // IP address of caller
    text? ip_address filters=trim
  
    // Pre-transition state snapshot
    json? previous_state
  
    // Post-transition state snapshot
    json? new_state
  
    // Audit notes, reason, or agent rationale
    text? reason filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree"
      field: [{name: "entity_type"}, {name: "entity_id"}]
    }
    {type: "btree", field: [{name: "created_at", op: "desc"}]}
    {type: "btree", field: [{name: "actor_id"}]}
    {type: "btree", field: [{name: "action"}]}
  ]

  guid = "1U2ioedvljORPrfArMQPgW6ytB4"
}
---
// Detailed cargo itemization, physical dimensions, and hazardous material classification per booking
table cargo_detail {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Parent freight booking
    int booking_id {
      table = "customer_booking"
    }
  
    // Commodity item description
    text cargo_description filters=trim
  
    // Commercial freight classification category
    enum commodity_type {
      values = [
        "general_merchandise"
        "perishable"
        "hazardous"
        "fragile"
        "heavy_machinery"
        "automotive"
        "electronics"
        "pharmaceutical"
      ]
    
    }
  
    // Total cargo weight in kilograms
    decimal weight_kg filters=min:0.1
  
    // Total volumetric space occupied in cubic meters (CBM)
    decimal? volume_cbm filters=min:0
  
    // Package or unit count
    int package_count filters=min:1
  
    // Standard freight packaging format
    enum packaging_type?=pallet {
      values = ["pallet", "box", "crate", "drum", "bundle", "loose"]
    }
  
    // Hazardous materials (HAZMAT) flag
    bool is_hazardous?
  
    // United Nations hazardous substance identifier (e.g., UN1203)
    text? un_number filters=trim
  
    // Reefer / cold-chain requirement flag
    bool requires_temperature_control?
  
    // Minimum allowable cargo storage temperature in Celsius
    decimal? min_temperature_c
  
    // Maximum allowable cargo storage temperature in Celsius
    decimal? max_temperature_c
  
    // Declared monetary value for freight cargo insurance
    decimal? declared_value filters=min:0
  
    // Cargo transit insurance policy elected
    bool insurance_opted?
  
    // Item length in centimeters for exact volumetric calculation
    decimal? length_cm filters=min:0
  
    // Item width in centimeters for exact volumetric calculation
    decimal? width_cm filters=min:0
  
    // Item height in centimeters for exact volumetric calculation
    decimal? height_cm filters=min:0
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "booking_id"}]}
    {type: "btree", field: [{name: "commodity_type"}]}
    {type: "btree", field: [{name: "is_hazardous"}]}
  ]

  guid = "lRnsiRDlAjK89gV9AnFGpeiPTSE"
}
---
// Regulatory compliance and verification documents for drivers, carriers, and fleet vehicles
table compliance_documents {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique document UUID
    uuid document_id
  
    // Owning resource category
    enum owner_type {
      values = ["driver", "organization", "vehicle"]
    }
  
    // Record ID of the owning entity
    int owner_id
  
    // Regulatory document category (e.g., CDL, INSURANCE, FITNESS, RC_BOOK, GSTIN, PAN)
    text document_type filters=trim
  
    // Official government certificate / document registration number
    text? document_reference_number filters=trim
  
    // Private encrypted storage key
    text private_storage_key filters=trim
  
    // SHA-256 integrity checksum
    text checksum_sha256 filters=trim
  
    // Document validity issuance date
    date? valid_from
  
    // Document regulatory expiration date
    date valid_until
  
    // Compliance officer verification status
    enum verification_status?=pending {
      values = ["pending", "verified", "rejected", "expired"]
    }
  
    // Officer user who verified compliance
    int? verified_by_user_id {
      table = "user"
    }
  
    // Verification timestamp
    timestamp? verified_at
  
    // Rejection reason if illegible or invalid
    text? rejection_reason filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "document_id"}]}
    {
      type : "btree"
      field: [{name: "owner_type"}, {name: "owner_id"}]
    }
    {type: "btree", field: [{name: "document_type"}]}
    {type: "btree", field: [{name: "verification_status"}]}
    {type: "btree", field: [{name: "valid_until"}]}
  ]

  guid = "i9Lix-ircSPEBGZDh77ppKrDgtA"
}
---
// Freight shipment bookings and transport orders initiated by customer shippers
table customer_booking {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Human-readable unique booking reference code (e.g., ZIP-BK-2025-0001)
    text booking_reference filters=trim|upper
  
    // Shipper customer organization placing the booking
    int customer_organization_id {
      table = "organization"
    }
  
    // Individual user who created this freight booking
    int booked_by_user_id {
      table = "user"
    }
  
    // Freight order operational lifecycle state
    enum status?=draft {
      values = [
        "draft"
        "quoted"
        "booked"
        "assigned"
        "in_transit"
        "delivered"
        "completed"
        "cancelled"
      ]
    
    }
  
    // Primary pickup hub / city
    text pickup_city filters=trim
  
    // Structured pickup address & geocode: {street, city, state, postal_code, lat, lng}
    json pickup_address
  
    // Scheduled pickup window start
    timestamp pickup_window_start
  
    // Scheduled pickup window deadline
    timestamp pickup_window_end
  
    // Primary drop-off hub / destination city
    text delivery_city filters=trim
  
    // Structured delivery address & geocode: {street, city, state, postal_code, lat, lng}
    json delivery_address
  
    // Scheduled delivery window start
    timestamp delivery_window_start
  
    // Scheduled delivery window deadline
    timestamp delivery_window_end
  
    // Estimated route distance calculated via MapMyIndia
    decimal estimated_distance_km filters=min:0
  
    // Initial dynamic price quote amount
    decimal quote_amount filters=min:0
  
    // Final confirmed freight billing amount
    decimal total_amount filters=min:0
  
    // Transaction currency ISO code
    text currency?=INR filters=trim|upper
  
    // Synchronized financial payment standing
    enum payment_status?=pending {
      values = [
        "pending"
        "authorized"
        "paid_escrow"
        "settled"
        "refunded"
        "failed"
      ]
    
    }
  
    // Autonomous matching engine standing
    enum matching_status?=unmatched {
      values = ["unmatched", "searching", "matched", "accepted", "rejected"]
    }
  
    // Shipper special handling & gate pass instructions
    text? special_instructions filters=trim
  
    // Server-managed aggregate version for optimistic concurrency control
    int version?=1 filters=min:1
  
    // Selected payment mode for freight haulage
    enum payment_mode?=prepaid {
      values = ["prepaid", "topay", "credit"]
    }
  
    // UUID of the accepted and active booking_quote
    uuid? active_quote_id
  
    // Structured consignee contact & recipient details for ToPay/delivery
    json? consignee_details
  
    // Reason narrative if booking was aborted or cancelled
    text? cancellation_reason filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "booking_reference"}]}
    {type: "btree", field: [{name: "customer_organization_id"}]}
    {type: "btree", field: [{name: "booked_by_user_id"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree", field: [{name: "payment_status"}]}
    {type: "btree", field: [{name: "matching_status"}]}
    {type: "btree", field: [{name: "pickup_window_start"}]}
    {type: "btree", field: [{name: "delivery_window_end"}]}
    {type: "btree", field: [{name: "version"}]}
  ]

  guid = "uDlEjr1xlp2p9_CVdrJLfdgS9D0"
}
---
// Extended credentials, compliance documents, and duty status for commercial freight drivers
table driver_profile {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Authenticated user account for this driver
    int user_id {
      table = "user"
    }
  
    // Carrier / Vendor transport organization employing or contracting this driver
    int organization_id {
      table = "organization"
    }
  
    // Commercial Driver License (CDL) number
    text license_number filters=trim
  
    // CDL expiration date
    date license_expiry
  
    // Real-time duty standing
    enum duty_status?=off_duty {
      values = ["off_duty", "on_duty", "driving", "resting"]
    }
  
    // Identity & background verification status
    bool kyc_verified?
  
    // Verified mobile contact for dispatch & SMS updates
    text? phone filters=trim
  
    // Emergency contact name & phone
    text? emergency_contact filters=trim
  
    // Last reported GPS telemetry snippet: {lat, lng, speed, updated_at}
    json? current_location
  
    // Immediate availability to accept new transport trip assignments
    bool is_available?=true
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "user_id"}]}
    {type: "btree", field: [{name: "organization_id"}]}
    {type: "btree|unique", field: [{name: "license_number"}]}
    {type: "btree", field: [{name: "duty_status"}]}
    {type: "btree", field: [{name: "is_available"}]}
  ]

  guid = "GYW4a5nhCS6CWkyHfoVo2_O-2yg"
}
---
// Durable background tasks and asynchronous reliability queue with worker fencing and leasing
table durable_tasks {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique durable task UUID
    uuid task_id
  
    // Task handler category (e.g., reconcile_unmatched_payments, sweep_expired_reservations, process_outbox)
    text task_type filters=trim
  
    // Aggregate category if bound to an entity
    text? aggregate_type filters=trim
  
    // Entity record ID
    int? aggregate_id
  
    // Task input parameters
    json? payload
  
    // Idempotency deduplication key
    text? idempotency_key filters=trim
  
    // Task worker standing
    enum status?=pending {
      values = ["pending", "leased", "completed", "failed", "dead_letter"]
    }
  
    // Execution retry count
    int attempt_count? filters=min:0
  
    // Maximum allowable attempts
    int max_attempts?=5 filters=min:1
  
    // Earliest timestamp for next scheduled attempt
    timestamp? next_attempt_at
  
    // Identity of the worker executing this task
    text? lease_owner filters=trim
  
    // Expiration timestamp of execution lease
    timestamp? lease_expires_at
  
    // Failure stack trace or error message
    text? last_error filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "task_id"}]}
    {type: "btree", field: [{name: "task_type"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree", field: [{name: "next_attempt_at"}]}
  ]

  guid = "6hRBZMFhfDrvonnahl2J5C8TKjA"
}
---
// Transactional outbox ledger guaranteeing at-least-once asynchronous event delivery to external providers
table event_outbox {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique outbox event UUID
    uuid outbox_event_id
  
    // Aggregation root category (e.g., customer_booking, trip, payment_transaction)
    text aggregate_type filters=trim
  
    // Primary key identifier of aggregate root
    int aggregate_id
  
    // Version of aggregate when event was produced
    int aggregate_version?=1
  
    // Domain event type (e.g., order.confirmed, trip.assigned, pod.verified)
    text event_type filters=trim
  
    // Target external system or dispatcher worker (e.g., telnyx_email, telnyx_sms, zoho_sync)
    text destination filters=trim
  
    // Structured JSON message payload
    json payload
  
    // Upstream idempotency deduplication key
    text? idempotency_key filters=trim
  
    // Delivery queue lifecycle state
    enum status?=queued {
      values = ["queued", "leased", "published", "failed"]
    }
  
    // Dispatch retry count
    int attempt_count? filters=min:0
  
    // Maximum allowable delivery attempts before dead-lettering
    int max_attempts?=5 filters=min:1
  
    // Earliest timestamp for next retry attempt (exponential backoff)
    timestamp? next_attempt_at
  
    // Worker instance holding the current execution lease
    text? lease_owner filters=trim
  
    // Lease expiration timestamp after which an abandoned event can be reclaimed
    timestamp? lease_expires_at
  
    // Timestamp when external delivery was successfully acknowledged
    timestamp? published_at
  
    // Failure diagnostic error string
    text? last_error filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "outbox_event_id"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree", field: [{name: "destination"}]}
    {type: "btree", field: [{name: "next_attempt_at"}]}
    {
      type : "btree"
      field: [{name: "aggregate_type"}, {name: "aggregate_id"}]
    }
  ]

  guid = "OSt4uREt2QDWmE1p4NeX04YUTq0"
}
---
// Request deduplication ledger preventing duplicate payments, double assignments, and repeated callbacks
table idempotency_key {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique idempotency key supplied in client header or webhook payload
    text key filters=trim
  
    // Targeted resource domain (e.g., payment_webhook, dispatch_assignment, refund_execution)
    text target_resource filters=trim
  
    // Cryptographic hash of incoming request body to detect payload tampering
    text request_hash filters=trim
  
    // Execution processing standing
    enum status?=processing {
      values = ["processing", "completed", "failed"]
    }
  
    // Cached response body returned for repeated idempotent calls
    json? cached_response
  
    // Expiration timestamp after which key can be garbage collected
    timestamp expires_at
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "key"}]}
    {type: "btree", field: [{name: "target_resource"}]}
    {type: "btree", field: [{name: "expires_at"}]}
  ]

  guid = "pti1yaXaLxrcRcU1my9K1dzvZT0"
}
---
// Operational transit exceptions, vehicle breakdowns, cargo damage, and insurance claims
table incident_dispute {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Freight trip where the incident occurred
    int trip_id {
      table = "trip"
    }
  
    // Customer booking affected
    int? booking_id {
      table = "customer_booking"
    }
  
    // User who flagged or reported the incident (driver, customer, or agent)
    int reported_by_user_id {
      table = "user"
    }
  
    // Operational incident categorization
    enum incident_type {
      values = [
        "vehicle_breakdown"
        "route_delay"
        "cargo_damage"
        "accident"
        "theft_pilferage"
        "wrong_destination"
        "consignee_refusal"
        "other"
      ]
    
    }
  
    // Urgency and risk severity level
    enum severity?=medium {
      values = ["low", "medium", "high", "critical"]
    }
  
    // Resolution workflow state
    enum status?=reported {
      values = [
        "reported"
        "investigating"
        "resolution_proposed"
        "resolved"
        "closed"
      ]
    
    }
  
    // Narrative details of the incident
    text description filters=trim
  
    // Array of incident photos / survey reports
    json? evidence_photos
  
    // Disputed or claimed monetary loss amount
    decimal? claim_amount filters=min:0
  
    // Official resolution and corrective action documentation
    text? resolution_notes filters=trim
  
    // Support officer or operations admin who authorized resolution
    int? resolved_by_user_id {
      table = "user"
    }
  
    // Timestamp when dispute was formally settled
    timestamp? resolved_at
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "trip_id"}]}
    {type: "btree", field: [{name: "booking_id"}]}
    {type: "btree", field: [{name: "incident_type"}]}
    {type: "btree", field: [{name: "severity"}]}
    {type: "btree", field: [{name: "status"}]}
  ]

  guid = "GH6sqmzdcbKHlvWcPbdZ7rYxCD4"
}
---
// Independent domain holds blocking order progression, dispatch, or settlement
table order_holds {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique hold UUID
    uuid hold_id
  
    // Booking order placed on hold
    int order_id {
      table = "customer_booking"
    }
  
    // Domain scope affected by this hold
    enum scope {
      values = ["operational", "payment", "settlement", "compliance", "customs"]
    }
  
    // Machine-readable reason code (e.g., PAYMENT_FAILED, DOCUMENT_EXPIRED, ADDRESS_AMBIGUOUS)
    text reason_code filters=trim
  
    // Plain-language hold narrative
    text? description filters=trim
  
    // User or operator who initiated the hold
    int opened_by_user_id {
      table = "user"
    }
  
    // Hold placement timestamp
    timestamp opened_at?=now
  
    // Authorized operator who approved release of hold
    int? released_by_user_id {
      table = "user"
    }
  
    // Release timestamp
    timestamp? released_at
  
    // Documentary evidence justifying release of hold
    text? release_evidence filters=trim
  
    // Order state before hold was engaged (restored upon legal release)
    text prior_state filters=trim
  
    // Active hold flag (true until released)
    bool is_active?=true
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "hold_id"}]}
    {type: "btree", field: [{name: "order_id"}]}
    {type: "btree", field: [{name: "scope"}]}
    {type: "btree", field: [{name: "is_active"}]}
  ]

  guid = "1RyofPd40KbIkVVl3BKjRm1Q80k"
}
---
// Maps authenticated users to organizations with company-specific permissions and roles
table organization_member {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Organization the user belongs to
    int organization_id {
      table = "organization"
    }
  
    // User associated with the organization
    int user_id {
      table = "user"
    }
  
    // Member role within this specific organization
    enum member_role?=member {
      values = ["owner", "admin", "dispatcher", "billing", "driver", "member"]
    }
  
    // Primary organization indicator for multi-org users
    bool is_primary?
  
    // Active membership standing
    bool is_active?=true
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "organization_id"}]}
    {type: "btree", field: [{name: "user_id"}]}
    {
      type : "btree|unique"
      field: [{name: "organization_id"}, {name: "user_id"}]
    }
  ]

  guid = "i3feB0lhXFnQ72k7yfjpHtcyY6Q"
}
---
// Legal business entity participating as a shipper (customer), carrier (vendor), or both
table organization {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
    text name filters=trim
  
    // Organization participation role: customer, vendor, both, or internal operator
    enum type {
      values = ["customer", "vendor", "both", "operator"]
    }
  
    // Current verification and operational standing
    enum status?=active {
      values = ["pending_verification", "active", "suspended", "inactive"]
    }
  
    // Legal registration / Tax ID (e.g., GSTIN, PAN, EIN)
    text? tax_id filters=trim
  
    // Primary contact phone
    text? phone filters=trim
  
    // Primary operational contact email
    email? contact_email filters=trim|lower
  
    // Structured physical address: street, city, state, postal_code, country
    json? address
  
    // Business verification status flag
    bool kyb_verified?
  
    // Payment terms, credit limit, and bank details
    json? billing_details
  
    // Additional domain-specific configuration and tags
    json? metadata
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "type"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree|unique", field: [{name: "tax_id"}]}
  ]

  guid = "aUUAzTNAD9bTwpTtB2WxTozxVB0"
}
---
// Atomic single-use OTP challenges bound to specific security and operational purposes
table otp_challenges {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique challenge UUID identifier
    uuid challenge_id
  
    // Purpose binding: phone login, ToPay consent, POD verification, etc.
    enum purpose {
      values = [
        "phone_login"
        "topay_consent"
        "pod_verification"
        "driver_onboarding"
        "payout_authorization"
      ]
    
    }
  
    // Target domain entity type
    text subject_type filters=trim
  
    // Domain entity primary key
    int subject_id
  
    // Cryptographic SHA-256 hash of recipient contact to protect PII
    text recipient_hash filters=trim
  
    // Hashed OTP verification token
    text code_hash filters=trim
  
    // Failed verification attempt counter
    int attempts? filters=min:0
  
    // Maximum allowable attempts before challenge is locked
    int max_attempts?=5 filters=min:1
  
    // Challenge expiration timestamp
    timestamp expires_at
  
    // Atomic consumption timestamp
    timestamp? consumed_at
  
    // Single-use consumed flag
    bool is_consumed?
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "challenge_id"}]}
    {type: "btree", field: [{name: "purpose"}]}
    {
      type : "btree"
      field: [{name: "subject_type"}, {name: "subject_id"}]
    }
    {type: "btree", field: [{name: "expires_at"}]}
    {type: "btree", field: [{name: "is_consumed"}]}
  ]

  guid = "BoLiiFvGq5-2gyzd-isoY-sup0E"
}
---
// Financial payment records, gateway transactions (Razorpay/Stripe), escrow, and status tracking
table payment_transaction {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Unique payment transaction reference code (e.g., ZIP-TXN-2025-0001)
    text transaction_reference filters=trim|upper
  
    // Customer freight booking linked to this transaction
    int booking_id {
      table = "customer_booking"
    }
  
    // Customer organization remitting payment
    int customer_organization_id {
      table = "organization"
    }
  
    // Monetary transaction amount
    decimal amount filters=min:0.01
  
    // ISO currency code
    text currency?=INR filters=trim|upper
  
    // Granular transaction lifecycle state
    enum status?=initiated {
      values = ["initiated", "authorized", "captured", "failed", "refunded"]
    }
  
    // Payment method used
    enum payment_method?=gateway {
      values = [
        "gateway"
        "net_banking"
        "upi"
        "card"
        "bank_transfer"
        "credit_line"
      ]
    
    }
  
    // Upstream gateway order identifier (e.g., Razorpay order_id)
    text? gateway_order_id filters=trim
  
    // Upstream gateway payment identifier (e.g., Razorpay pay_id)
    text? gateway_payment_id filters=trim
  
    // Gateway cryptographic verification signature
    text? gateway_signature filters=trim
  
    // Full JSON payload returned by payment gateway webhook/API
    json? gateway_response
  
    // Exact timestamp when funds were captured into escrow
    timestamp? captured_at
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "transaction_reference"}]
    }
    {type: "btree", field: [{name: "booking_id"}]}
    {type: "btree", field: [{name: "customer_organization_id"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree", field: [{name: "gateway_payment_id"}]}
    {type: "btree", field: [{name: "gateway_order_id"}]}
  ]

  guid = "XYqPw1tXZyqSLVprpdfo93X8eRw"
}
---
// Approved deterministic corridor pricing policies, cost floors, and volumetric calculation divisors
table pricing_policies {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique policy UUID
    uuid policy_id
  
    // Policy version string (e.g., v1.0, v1.1)
    text version filters=trim
  
    // Corridor lane code (e.g., TIR_CHE for Tiruppur to Chennai)
    text corridor_code filters=trim|upper
  
    // Fleet vehicle class / body type
    text vehicle_type filters=trim
  
    // Base freight booking fee in minor currency units (paise/cents)
    decimal base_rate_minor filters=min:0
  
    // Rate per kilometer in minor currency units
    decimal per_km_rate_minor filters=min:0
  
    // Volumetric weight conversion divisor (e.g., 5000 for standard road freight)
    decimal volumetric_divisor?=5000 filters=min:1
  
    // Hard minimum cost floor; no discount or coupon may price below this floor
    decimal cost_floor_minor filters=min:0
  
    // Maximum commercial discount percentage allowable
    decimal max_discount_pct? filters=min:0
  
    // Policy active window start
    timestamp effective_from
  
    // Policy active window end
    timestamp effective_until
  
    // Finance administrator who authorized this tariff policy
    int approved_by_user_id {
      table = "user"
    }
  
    // Active policy standing flag
    bool is_active?=true
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "policy_id"}]}
    {type: "btree", field: [{name: "corridor_code"}]}
    {type: "btree", field: [{name: "vehicle_type"}]}
    {type: "btree", field: [{name: "is_active"}]}
    {type: "btree", field: [{name: "effective_from"}]}
  ]

  guid = "ZEXezqyQZGzDxBLN8N0tLmUBsPA"
}
---
// Proof of Delivery (POD) documents, signatures, OTP verifications, and consignee sign-offs
table proof_of_delivery {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Freight trip fulfilled
    int trip_id {
      table = "trip"
    }
  
    // Specific delivery stop verified
    int stop_id {
      table = "trip_stop"
    }
  
    // Driver submitting POD evidence
    int driver_id {
      table = "driver_profile"
    }
  
    // POD review and approval status (must be approved before carrier settlement)
    enum status?=submitted {
      values = ["pending", "submitted", "under_review", "approved", "rejected"]
    }
  
    // Consignee receiver authorized representative name
    text? consignee_name filters=trim
  
    // Consignee contact phone
    text? consignee_phone filters=trim
  
    // Storage URL / key for digital receiver signature
    text? signature_image_url filters=trim
  
    // Storage URL / key for stamped bill of lading / delivery note photo
    text? document_image_url filters=trim
  
    // One-Time Password (OTP) dispatched to consignee mobile
    text? otp_code filters=trim
  
    // OTP verification confirmation flag
    bool otp_verified?
  
    // Verification timestamp
    timestamp? verified_at
  
    // Operations agent or customer user who reviewed POD
    int? reviewed_by_user_id {
      table = "user"
    }
  
    // Rejection explanation if POD document was illegible or disputed
    text? rejection_reason filters=trim
  
    // GPS geostamp at exact moment of POD capture: {lat, lng, accuracy_meters}
    json? delivery_geostamp
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "trip_id"}]}
    {type: "btree", field: [{name: "stop_id"}]}
    {type: "btree", field: [{name: "driver_id"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree", field: [{name: "otp_verified"}]}
  ]

  guid = "vCm4J72gGd0NgE0dOb4II9KMFWg"
}
---
// Customer refund claims requiring mandatory explicit human officer approval before gateway execution
table refund_request {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Unique refund claim reference code (e.g., ZIP-RFD-2025-0001)
    text refund_reference filters=trim|upper
  
    // Original payment transaction being refunded
    int payment_transaction_id {
      table = "payment_transaction"
    }
  
    // Customer freight booking associated with refund
    int booking_id {
      table = "customer_booking"
    }
  
    // Monetary amount requested to be refunded
    decimal refund_amount filters=min:0.01
  
    // Refund currency
    text currency?=INR filters=trim|upper
  
    // Justification for refund claim
    text reason filters=trim
  
    // Strict governance status (cannot proceed to 'processing' without explicit human officer approval)
    enum status?=pending_approval {
      values = [
        "pending_approval"
        "approved"
        "rejected"
        "processing"
        "completed"
        "failed"
      ]
    
    }
  
    // Originating actor category initiating claim
    enum requested_by_actor_type?=customer {
      values = ["customer", "agent", "support_admin"]
    }
  
    // User who initiated the refund claim
    int? requested_by_user_id {
      table = "user"
    }
  
    // MANDATORY HUMAN APPROVAL: Platform finance administrator who approved refund
    int? approved_by_user_id {
      table = "user"
    }
  
    // Timestamp when authorized human sign-off occurred
    timestamp? approved_at
  
    // Officer approval or rejection notes
    text? approval_notes filters=trim
  
    // Upstream gateway refund identifier (e.g., Razorpay rfd_id)
    text? gateway_refund_id filters=trim
  
    // Timestamp when payment gateway confirmed refund completion
    timestamp? completed_at
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "refund_reference"}]}
    {type: "btree", field: [{name: "payment_transaction_id"}]}
    {type: "btree", field: [{name: "booking_id"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree", field: [{name: "approved_by_user_id"}]}
  ]

  guid = "os7QpjrtEAuD9mpk3T3e3ZpAInQ"
}
---
// Caches verified MapMyIndia distance matrices and routing profiles to optimize quote response times
table route_cache {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Normalized SHA-256 hash of coordinates, vehicle profile, and routing options
    text request_hash filters=trim
  
    // Origin latitude
    decimal origin_lat
  
    // Origin longitude
    decimal origin_lng
  
    // Destination latitude
    decimal dest_lat
  
    // Destination longitude
    decimal dest_lng
  
    // Calculated route distance in kilometers
    decimal distance_km filters=min:0
  
    // Estimated transit driving duration in minutes
    int duration_minutes filters=min:0
  
    // Upstream routing engine provider
    text provider?=mappls filters=trim
  
    // Cached route geometry summary and toll metadata
    json? route_summary
  
    // Cache entry expiration timestamp
    timestamp expires_at
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "request_hash"}]}
    {type: "btree", field: [{name: "expires_at"}]}
  ]

  guid = "bxYtPke4FRJZ4zp1wXfCdKn-GDM"
}
---
// Carrier vendor payout settlements, platform commission deduction, TDS taxes, and disbursement records
table settlement {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Unique settlement reference code (e.g., ZIP-SET-2025-0001)
    text settlement_reference filters=trim|upper
  
    // Completed freight transport trip
    int trip_id {
      table = "trip"
    }
  
    // Carrier vendor organization receiving disbursement
    int vendor_organization_id {
      table = "organization"
    }
  
    // Gross freight rate agreed for haul
    decimal gross_carrier_amount filters=min:0
  
    // Zippy platform brokerage / matchmaking commission fee
    decimal platform_fee filters=min:0
  
    // Tax Deducted at Source (TDS) or legal statutory withholding
    decimal tax_tds filters=min:0
  
    // Net disbursement amount payable to vendor bank account
    decimal net_payout_amount filters=min:0
  
    // Settlement currency
    text currency?=INR filters=trim|upper
  
    // Carrier payout lifecycle standing (POD verification required before processing)
    enum status?=pending {
      values = [
        "pending"
        "pod_verified"
        "processing"
        "paid"
        "on_hold"
        "failed"
      ]
    
    }
  
    // Masked bank account / UPI VPA for settlement transfer
    text? bank_account_mask filters=trim
  
    // Banking payout batch / UTR transaction number
    text? payout_batch_reference filters=trim
  
    // Exact timestamp when funds were remitted to vendor bank
    timestamp? paid_at
  
    // Finance officer who authorized disbursement
    int? approved_by_user_id {
      table = "user"
    }
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "settlement_reference"}]
    }
    {type: "btree", field: [{name: "trip_id"}]}
    {type: "btree", field: [{name: "vendor_organization_id"}]}
    {type: "btree", field: [{name: "status"}]}
  ]

  guid = "U6aetTkkDRNx1frAIpTIbNLiXHI"
}
---
// Immutable ToPay freight payment consent attempts and decisions by consignees
table topay_consent_attempts {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique consent attempt UUID
    uuid consent_attempt_id
  
    // Customer booking freight order
    int order_id {
      table = "customer_booking"
    }
  
    // Hashed contact reference of the consignee / payer
    text payer_identifier_hash filters=trim
  
    // Freight charge amount in minor integer units (paise/cents)
    decimal amount_minor filters=min:1
  
    // ISO currency code
    text currency?=INR filters=trim|upper
  
    // Hash of accepted quote snapshot; consent is invalid if quote changes
    text quote_hash filters=trim
  
    // Explicit consent decision
    enum decision?=pending {
      values = ["pending", "accepted", "denied", "expired"]
    }
  
    // Timestamp when payer confirmed or declined consent
    timestamp? decided_at
  
    // Reason given if payer denied freight charges
    text? denial_reason filters=trim
  
    // Previous attempt ID if re-attempted after amendment
    uuid? supersedes_id
  
    // Expiration timestamp of this consent challenge window
    timestamp? expires_at
  
    // Bound OTP challenge ID if verified via SMS/WhatsApp code
    uuid? challenge_id
  
    // Scoped capability token for consignee decision verification
    text? capability_token filters=trim
  
    // Audit proof snapshot (client IP, user agent, timestamp)
    json? evidence
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "consent_attempt_id"}]}
    {type: "btree", field: [{name: "order_id"}]}
    {type: "btree", field: [{name: "decision"}]}
    {type: "btree", field: [{name: "capability_token"}]}
  ]

  guid = "aL2dGQ2TwUB2IvL9zPPRNh44CJ0"
}
---
// Real-time telematics, IoT GPS pings, geofence events, and driver telemetry
table tracking_event {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Active trip being monitored
    int trip_id {
      table = "trip"
    }
  
    // Transmitting fleet vehicle
    int vehicle_id {
      table = "vehicle"
    }
  
    // Logged driver at timestamp
    int? driver_id {
      table = "driver_profile"
    }
  
    // Geographic latitude in decimal degrees
    decimal latitude
  
    // Geographic longitude in decimal degrees
    decimal longitude
  
    // Vehicle speed in km/h
    decimal? speed_kmh filters=min:0
  
    // Compass heading / bearing in degrees (0-360)
    decimal? heading_degrees
  
    // Device battery percentage or vehicle voltage
    decimal? battery_level
  
    // Telematics event trigger category
    enum event_type?=periodic_ping {
      values = [
        "periodic_ping"
        "geofence_entry"
        "geofence_exit"
        "speeding_alert"
        "harsh_braking"
        "engine_idle"
        "sos_alert"
        "manual_checkin"
      ]
    
    }
  
    // Unprocessed raw IoT / mobile telemetry packet
    json? raw_payload
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "trip_id"}]}
    {type: "btree", field: [{name: "vehicle_id"}]}
    {type: "btree", field: [{name: "created_at", op: "desc"}]}
    {type: "btree", field: [{name: "event_type"}]}
  ]

  guid = "X0PmT00LrEAXqSlNYulQRODOUCs"
}
---
// Ordered pickup, transit waypoint, border/customs checkpoint, and delivery stops for a trip
table trip_stop {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Parent freight transport trip
    int trip_id {
      table = "trip"
    }
  
    // Execution sequence order index (1 = first pickup, etc.)
    int stop_sequence filters=min:1
  
    // Functional category of stop
    enum stop_type {
      values = ["pickup", "waypoint", "fuel", "customs_checkpoint", "delivery"]
    }
  
    // Hub, warehouse, or facility name
    text facility_name filters=trim
  
    // Stop geocode and address: {street, city, state, postal_code, lat, lng}
    json address
  
    // Scheduled arrival time
    timestamp scheduled_arrival
  
    // Actual driver arrival timestamp recorded at gate
    timestamp? actual_arrival
  
    // Actual departure timestamp recorded after loading/unloading
    timestamp? actual_departure
  
    // Stop completion lifecycle standing
    enum status?=pending {
      values = ["pending", "arrived", "in_progress", "completed", "skipped"]
    }
  
    // On-site gate or dispatch contact person
    text? contact_person filters=trim
  
    // On-site gate contact phone number
    text? contact_phone filters=trim
  
    // Driver or facility instructions
    text? notes filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "trip_id"}]}
    {type: "btree", field: [{name: "stop_sequence"}]}
    {type: "btree", field: [{name: "status"}]}
    {
      type : "btree|unique"
      field: [{name: "trip_id"}, {name: "stop_sequence"}]
    }
  ]

  guid = "Rd1bI6BdyuEn2s2gEhOjFq3AnuE"
}
---
// Physical freight haul execution entity connecting vehicle, driver, carrier vendor, and customer booking
table trip {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Human-readable unique trip code (e.g., ZIP-TR-2025-0001)
    text trip_code filters=trim|upper
  
    // Associated customer booking
    int booking_id {
      table = "customer_booking"
    }
  
    // Carrier vendor organization executing the haul
    int vendor_organization_id {
      table = "organization"
    }
  
    // Dispatched fleet vehicle
    int vehicle_id {
      table = "vehicle"
    }
  
    // Dispatched commercial driver
    int driver_id {
      table = "driver_profile"
    }
  
    // Detailed granular TMS trip state machine
    enum status?=assigned {
      values = [
        "assigned"
        "driver_en_route_pickup"
        "arrived_pickup"
        "loading"
        "in_transit"
        "arrived_delivery"
        "unloading"
        "pod_pending"
        "completed"
        "cancelled"
      ]
    
    }
  
    // Timestamp when driver commenced transport
    timestamp? started_at
  
    // Timestamp when transport was successfully finished and cargo handed over
    timestamp? completed_at
  
    // Agreed carrier freight payout compensation
    decimal carrier_payout_amount filters=min:0
  
    // Starting vehicle odometer reading in km
    decimal? start_odometer_km
  
    // Final vehicle odometer reading in km
    decimal? end_odometer_km
  
    // MapMyIndia route geometry polyline and waypoint metadata
    json? route_geometry
  
    // Cancellation reason if aborted
    text? cancellation_reason filters=trim
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "trip_code"}]}
    {type: "btree", field: [{name: "booking_id"}]}
    {type: "btree", field: [{name: "vendor_organization_id"}]}
    {type: "btree", field: [{name: "vehicle_id"}]}
    {type: "btree", field: [{name: "driver_id"}]}
    {type: "btree", field: [{name: "status"}]}
  ]

  guid = "CmwzYaR0YlIJSB8OZI2rlxDtfaE"
}
---
// Real-time dispatch availability windows, home-base, and geographic constraints for fleet matching
table vehicle_availability {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Available vehicle resource
    int vehicle_id {
      table = "vehicle"
    }
  
    // Carrier vendor organization offering this capacity
    int organization_id {
      table = "organization"
    }
  
    // Availability window start timestamp
    timestamp available_from
  
    // Availability window end timestamp
    timestamp available_until
  
    // Origin base / hub city
    text? current_city filters=trim
  
    // Geographic coordinate of origin base: {lat, lng}
    json? current_geo_point
  
    // Maximum operating radius from base in kilometers
    decimal? preferred_radius_km
  
    // Preferred destination cities / corridors
    json? destination_preferences
  
    // Active schedule flag
    bool is_active?=true
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "vehicle_id"}]}
    {type: "btree", field: [{name: "organization_id"}]}
    {type: "btree", field: [{name: "available_from"}]}
    {type: "btree", field: [{name: "available_until"}]}
    {type: "btree", field: [{name: "is_active"}]}
  ]

  guid = "br93n-NiOtf_voL1dXKoSVjK6TE"
}
---
// Commercial fleet vehicles owned or operated by vendor carrier organizations
table vehicle {
  auth = false

  schema {
    int id
    timestamp created_at?=now
    timestamp updated_at?
  
    // Carrier vendor organization owning/operating this vehicle
    int organization_id {
      table = "organization"
    }
  
    // Dedicated primary driver assigned to this vehicle
    int? assigned_driver_id {
      table = "driver_profile"
    }
  
    // Vehicle registration / license plate number
    text registration_number filters=trim|upper
  
    // Vehicle Identification Number (VIN)
    text? vin filters=trim|upper
  
    // Vehicle manufacturer / make
    text make filters=trim
  
    // Vehicle model
    text model filters=trim
  
    // Manufacturing year
    int? year
  
    // Commercial freight body type
    enum vehicle_type {
      values = ["flatbed", "reefer", "dry_van", "container", "box_truck", "tanker"]
    }
  
    // Maximum legal carrying payload capacity in kilograms
    decimal max_payload_kg filters=min:0
  
    // Cargo volumetric capacity in cubic meters (CBM)
    decimal? max_volume_cbm filters=min:0
  
    // Operational dispatch status (synchronized with trip lifecycle)
    enum status?=available {
      values = ["available", "assigned", "in_transit", "maintenance", "offline"]
    }
  
    // Hardware IoT GPS telemetry capability flag
    bool gps_enabled?=true
  
    // IoT GPS device / OBD tracker identifier
    text? tracker_device_id filters=trim
  
    // Commercial vehicle insurance policy details
    json? insurance_details
  
    // Commercial fitness certificate & inspection expiration
    json? fitness_certificate
  
    // Last reported location telemetry: {lat, lng, heading, speed, updated_at}
    json? current_location
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {
      type : "btree|unique"
      field: [{name: "registration_number"}]
    }
    {type: "btree", field: [{name: "organization_id"}]}
    {type: "btree", field: [{name: "assigned_driver_id"}]}
    {type: "btree", field: [{name: "status"}]}
    {type: "btree", field: [{name: "vehicle_type"}]}
  ]

  guid = "1HYTz6CP3KkGf4bzbJVAQVz23HA"
}
---
// Immutable pricing quotes generated for customer bookings, capturing policy version and route evidence
table booking_quote {
  auth = false

  schema {
    int id
    timestamp created_at?=now
  
    // Unique quote UUID
    uuid quote_id
  
    // Freight booking this quote was generated for
    int booking_id {
      table = "customer_booking"
    }
  
    // Booking aggregate version at time of quote generation
    int booking_version?=1
  
    // SHA-256 hash of normalized input parameters (route, cargo weight, dimensions, service)
    text input_hash filters=trim
  
    // Pricing policy version applied (e.g. v1.0)
    text policy_version filters=trim
  
    // Corridor lane code (e.g. TIR_CHE)
    text corridor_code filters=trim|upper
  
    // Required vehicle body/class
    text vehicle_type filters=trim
  
    // Actual total weight in kg
    decimal actual_weight_kg filters=min:0
  
    // Volumetric weight calculated using policy divisor
    decimal volumetric_weight_kg filters=min:0
  
    // Chargeable weight: max(actual_weight, volumetric_weight)
    decimal chargeable_weight_kg filters=min:0
  
    // Route distance in km from verified route cache or provider
    decimal distance_km filters=min:0
  
    // Base corridor tariff in minor currency units (paise)
    decimal base_rate_minor filters=min:0
  
    // Distance freight rate in minor currency units
    decimal distance_rate_minor filters=min:0
  
    // Gross freight quote amount before adjustments
    decimal gross_amount_minor filters=min:0
  
    // Commercial discount amount applied in minor units (bounded by cost floor)
    decimal discount_minor? filters=min:0
  
    // Final net freight charge in minor units
    decimal net_amount_minor filters=min:0
  
    // Converted decimal representation for display/billing (net_amount_minor / 100)
    decimal total_amount filters=min:0
  
    // Currency code
    text currency?=INR filters=trim|upper
  
    // Itemized fee, tax, and discount breakdown
    json breakdown
  
    // Routing provenance evidence (source, duration, polyline/cache hash)
    json route_evidence
  
    // Quote validity expiration timestamp
    timestamp expires_at
  
    // Acceptance flag
    bool is_accepted?
  
    // Timestamp when customer accepted this quote
    timestamp? accepted_at
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "quote_id"}]}
    {type: "btree", field: [{name: "booking_id"}]}
    {type: "btree", field: [{name: "expires_at"}]}
    {type: "btree", field: [{name: "is_accepted"}]}
  ]

  guid = "CyOM1DPNdMHUvltp4n3Ld7LeWhs"
}
---
// Validates authentication, authorization, request context, and safety rules for Zippy API
middleware Zippy_request_guard {
  input {
    json vars
    enum type {
      values = ["pre", "post"]
    }
  }

  stack {
  }

  response = null
  docs = "Describe middleware purpose, scope, inputs, outputs, and failue behaviour"
  response_strategy = "merge"
  exception_policy = "silent"
  guid = "sHFyufeK8wOzf70_Fo0ISGd-9xM"
}
---
// Minimal audit entry: no caller-supplied metadata is persisted.
function "Quick Start/log_event" {
  input {
    int user_id
    text action
    json metadata?
  }

  stack {
    var $safe_action {
      value = "event"
    }
  
    conditional {
      if ($input.action == "login" || $input.action == "signup" || $input.action == "get_auth_user" || $input.action == "reset_password" || $input.action == "login_for_password_reset" || $input.action == "welcome_email_queued") {
        var.update $safe_action {
          value = $input.action
        }
      }
    }
  
    db.add event_log {
      data = {
        created_at: "now"
        user_id   : $input.user_id
        action    : $safe_action
        metadata  : {}
      }
    } as $event
  }

  response = null
  tags = ["xano:quick-start"]
  guid = "KcbNfC-kH9IWL9sKX1YYDBIaz9k"
}
---
// This function generates a magic token with a 60 minute expiration date.
function "Quick Start/generate_magic_link" {
  input {
    email email?
  }

  stack {
    // Checks that the email input is not empty
    precondition ($input.email != null) {
      error = "email is required but was not suppiled. "
    }
  
    // Gets the user record by email
    db.query user {
      where = $db.user.email == $input.email
      return = {type: "single"}
    } as $user
  
    // Verifies that the user record exists
    precondition ($user != null) {
      error_type = "notfound"
      error = "No user found for that email."
    }
  
    // Creates a unique UUID as token
    security.create_uuid as $token
  
    // Builds the password reset object
    var $password_reset {
      value = {}
        |set:"token":$token
        |set:"expiration":(now
          |add_secs_to_timestamp:(3600|to_int)
        )
        |set:"used":false
    }
  
    // Updates the user record with the password reset object
    db.edit user {
      field_name = "id"
      field_value = $user|get:"id":0
      data = {password_reset: $password_reset}
    } as $updated_password_reset
  }

  response = {token: $token, email: $updated_password_reset.email}
  tags = ["xano:quick-start"]
  guid = "aSN69WB_2P6HmOpeaPtZhxFWyeo"
}
---
// Checks that a user has the appropriate role level. This example sets a hierarchy of roles, and a user must pass the minimum level to execute.
function "Quick Start/enforce_role" {
  input {
    // The ID of the user to check the role for.
    int user_id
  
    // The role required to perform the action.
    text required_role
  }

  stack {
    // Defines a hierarchy of roles with numerical levels.
    var $role_hierarchy {
      value = {admin: 2, member: 1}
    }
  
    // Retrieve the user's role from the database.
    db.get user {
      field_name = "id"
      field_value = $input.user_id
      output = ["role"]
    } as $user
  
    // Ensure the user exists
    precondition ($user != null) {
      error_type = "inputerror"
      error = "User not found with the provided ID."
    }
  
    // Extract the user's role from the retrieved user data.
    var $user_role {
      value = $user.role
    }
  
    // Get the numerical level of the user's role. Defaults to 0 if not defined.
    var $user_role_level {
      value = $role_hierarchy|get:$user_role
    }
  
    // Get the numerical level of the required role. Defaults to 0 if not defined.
    var $required_role_level {
      value = $role_hierarchy|get:$input.required_role
    }
  
    // Ensure the required role is a valid, defined role in the hierarchy.
    precondition ($required_role_level > 0) {
      error_type = "inputerror"
      error = "Invalid required role specified: " ~ $input.required_role
    }
  
    // Check if the user's role level is sufficient for the required role.
    conditional {
      if ($user_role_level < $required_role_level) {
        throw {
          name = "accessdenied"
          value = "User does not have the required role to perform this action. Required: " ~ $input.required_role ~ ", Actual: " ~ $user_role
        }
      }
    }
  }

  response = null
  tags = ["xano:quick-start"]
  guid = "wLUicquNUSWqTUQkbOLH-D6NG28"
}
---
// Enforces server-side tenant isolation, active membership verification, and action-specific RBAC permissions
function "security/authorize_resource" {
  input {
    // Authenticated caller user ID
    int caller_user_id {
      table = "user"
    }
  
    // Organization ID owning the target resource
    int resource_organization_id {
      table = "organization"
    }
  
    // Operation being attempted
    text action_name?=read filters=trim
  
    // Optional organization selector to check
    int? requested_org_id?
  }

  stack {
    // 1. Resolve caller security context from database
    function.run "security/resolve_context" {
      input = {
        user_id         : $input.caller_user_id
        requested_org_id: $input.requested_org_id
      }
    } as $caller_ctx
  
    // 2. Validate action name against permitted whitelist
    var $allowed_actions {
      value = [
        "read"
        "create"
        "update"
        "quote"
        "accept"
        "confirm"
        "hold"
        "release_hold"
        "resume"
        "cancel"
      ]
    }
  
    var $is_valid_action {
      value = false
    }
  
    foreach ($allowed_actions) {
      each as $act {
        conditional {
          if ($act == $input.action_name) {
            var.update $is_valid_action {
              value = true
            }
          }
        }
      }
    }
  
    precondition ($is_valid_action) {
      error_type = "accessdenied"
      error = "Denied: Unknown or unsupported action: " ~ $input.action_name
    }
  
    // Customer read access cannot inherit the platform-operator bypass below.
    conditional {
      if ($input.action_name == "read") {
        precondition ($caller_ctx.can_read_bookings && $caller_ctx.organization_id == $input.resource_organization_id) {
          error_type = "accessdenied"
          error = "Customer booking scope required."
        }
      }
    }
  
    // 3. Existing non-read permissions are outside this release candidate.
    conditional {
      // Platform operators have operational oversight for read, holds, and resumes
      if ($caller_ctx.is_platform_admin) {
        // Platform operators permitted for administrative oversight
        var $authorized {
          value = true
        }
      }
    
      else {
        // Enforce tenant boundary: caller must have active membership in the resource organization
        precondition ($caller_ctx.organization_id != null) {
          error_type = "accessdenied"
          error = "Active organization membership is required to access freight resources."
        }
      
        precondition ($caller_ctx.organization_id == $input.resource_organization_id) {
          error_type = "accessdenied"
          error = "Unauthorized cross-tenant resource access attempted."
        }
      
        // Action-specific role restrictions
        conditional {
          // Booking actions require customer or dual-role organization and booking privilege
          if ($input.action_name == "create" || $input.action_name == "update" || $input.action_name == "quote" || $input.action_name == "accept" || $input.action_name == "confirm") {
            precondition ($caller_ctx.can_book) {
              error_type = "accessdenied"
              error = "Organization does not have customer booking privileges or account is pending verification."
            }
          }
        
          // Administrative actions like hold or release require company admin role
          elseif ($input.action_name == "hold" || $input.action_name == "release_hold" || $input.action_name == "resume") {
            precondition ($caller_ctx.is_org_admin) {
              error_type = "accessdenied"
              error = "Only organization administrators can manage freight holds."
            }
          }
        }
      
        var $authorized {
          value = true
        }
      }
    }
  }

  response = {
    authorized     : true
    caller_ctx     : $caller_ctx
    resource_org_id: $input.resource_organization_id
    action         : $input.action_name
  }

  guid = "2LbK9uCTM0nMFZPMy_om6EDR0Gs"
}
---
// Resolves caller authentication identity to active organization and effective tenant permissions
function "security/resolve_context" {
  input {
    // Authenticated user ID to resolve
    int user_id {
      table = "user"
    }
  
    // Optional untrusted organization selector to validate membership against
    int? requested_org_id?
  }

  stack {
    // 1. Fetch authenticated user profile
    db.get user {
      field_name = "id"
      field_value = $input.user_id
      output = [
        "id"
        "name"
        "email"
        "phone"
        "role"
        "system_role"
        "active_organization_id"
        "status"
      ]
    } as $user
  
    // Precondition: user must exist
    precondition ($user != null) {
      error_type = "unauthorized"
      error = "Authenticated user not found."
    }
  
    // Only explicitly active accounts may resolve an operational context.
    precondition ($user.status == "active") {
      error_type = "accessdenied"
      error = "Active account required."
    }
  
    // Identity comes from the database, never caller role fields or token extras.
    precondition ($user.system_role == "super_admin" || $user.system_role == "operations_admin" || $user.system_role == "customer_admin" || $user.system_role == "customer_member" || $user.system_role == "vendor_admin" || $user.system_role == "fleet_manager" || $user.system_role == "driver") {
      error_type = "accessdenied"
      error = "Unsupported account identity."
    }
  
    var $is_pending_verification {
      value = ($user.status == "pending_verification")
    }
  
    // Determine platform administration capability
    var $is_platform_admin {
      value = ($user.system_role == "super_admin" || $user.system_role == "operations_admin")
    }
  
    // 2. Candidate organization evaluation
    var $candidate_org_id {
      value = null
    }
  
    conditional {
      if ($input.requested_org_id != null) {
        var.update $candidate_org_id {
          value = $input.requested_org_id
        }
      }
    
      elseif ($user.active_organization_id != null) {
        var.update $candidate_org_id {
          value = $user.active_organization_id
        }
      }
    }
  
    var $resolved_org_id {
      value = null
    }
  
    var $resolved_org_type {
      value = null
    }
  
    var $resolved_member_role {
      value = null
    }
  
    var $is_org_admin {
      value = false
    }
  
    // 3. Resolve active organization ONLY if active membership exists
    conditional {
      if ($candidate_org_id != null) {
        db.get organization {
          field_name = "id"
          field_value = $candidate_org_id
          output = ["id", "name", "type", "status"]
        } as $org
      
        conditional {
          if ($org != null && $org.status == "active") {
            // Verify active membership record in organization_member table
            db.query organization_member {
              where = $db.organization_member.organization_id == $candidate_org_id && $db.organization_member.user_id == $user.id
              return = {type: "single"}
              output = ["member_role", "is_active"]
            } as $membership
          
            conditional {
              if ($membership != null && $membership.is_active) {
                var.update $resolved_org_id {
                  value = $org.id
                }
              
                var.update $resolved_org_type {
                  value = $org.type
                }
              
                var.update $resolved_member_role {
                  value = $membership.member_role
                }
              
                var.update $is_org_admin {
                  value = ($membership.member_role == "owner" || $membership.member_role == "admin")
                }
              }
            }
          }
        }
      }
    }
  
    // An explicit organization selector must never silently fall back.
    precondition ($input.requested_org_id == null || ($resolved_org_id != null && $resolved_org_id == $input.requested_org_id)) {
      error_type = "accessdenied"
      error = "Active organization membership required."
    }
  
    precondition ($is_platform_admin || $resolved_org_id != null) {
      error_type = "accessdenied"
      error = "Active organization membership required."
    }
  
    // These APIs expose customer reads only; driver and operator oversight are separate contracts.
    var $can_read_bookings {
      value = (($user.system_role == "customer_admin" || $user.system_role == "customer_member") && $resolved_org_id != null && ($resolved_org_type == "customer" || $resolved_org_type == "both") && ($resolved_member_role == "owner" || $resolved_member_role == "admin" || $resolved_member_role == "dispatcher" || $resolved_member_role == "billing" || $resolved_member_role == "member"))
    }
  
    var $can_book {
      value = $can_read_bookings
    }
  
    // 4. Construct resolved caller security context
    var $context {
      value = {
        user_id                : $user.id
        name                   : $user.name
        email                  : $user.email
        system_role            : $user.system_role
        user_status            : $user.status
        is_pending_verification: $is_pending_verification
        is_platform_admin      : $is_platform_admin
        organization_id        : $resolved_org_id
        organization_type      : $resolved_org_type
        member_role            : $resolved_member_role
        is_org_admin           : $is_org_admin
        can_book               : $can_book
        can_read_bookings      : $can_read_bookings
      }
    }
  }

  response = $context
  guid = "wZwblzdLzpQhs7Dm4uTsNjuVq7Y"
}
---
function "security/validate_command" {
  input {
  }

  stack {
  }

  response = null
  guid = "RDOa_zKGK5GP5tq9gaVfRf4A-_M"
}
---
function "booking/accept_quote" {
  input {
  }

  stack {
  }

  response = null
  guid = "Kw-jyLRhP2gRoSLK_BT8N8S7z48"
}
---
function "booking/cancel_booking" {
  input {
  }

  stack {
  }

  response = null
  guid = "NsEpCNIuHsJO1ufuEl5zZV6jSmw"
}
---
function "booking/confirm_booking" {
  input {
  }

  stack {
  }

  response = null
  guid = "P9PG7pf127fKSqeDZpVmLT_hdLs"
}
---
function "booking/create_consent_attempt" {
  input {
  }

  stack {
  }

  response = null
  guid = "qpOJRSjf9gKpqqMy4j5hXDSO1eA"
}
---
function "booking/create_draft" {
  input {
  }

  stack {
  }

  response = null
  guid = "EpwQ_xNrTvFefJL0qKTz7HO62wM"
}
---
function "booking/invalidate_quotes" {
  input {
  }

  stack {
  }

  response = null
  guid = "cDyv2Os7uHvKFcfXxgCwql7_eaA"
}
---
function "booking/manage_hold" {
  input {
  }

  stack {
  }

  response = null
  guid = "K6khcEjMraeTCOuc_boKeXAzpbc"
}
---
function "booking/record_consent_decision" {
  input {
  }

  stack {
  }

  response = null
  guid = "ap1057RIDD2gZxZ3dUtutCH-ki8"
}
---
function "booking/resume_booking" {
  input {
  }

  stack {
  }

  response = null
  guid = "1sQLCnIOiOTv0RequwCOOZDqPcE"
}
---
function "booking/select_payment" {
  input {
  }

  stack {
  }

  response = null
  guid = "RfBtv_2R547Af0Lf2Px27LEgqZ8"
}
---
function "pricing/calculate_quote" {
  input {
  }

  stack {
  }

  response = null
  guid = "gdL49OitRIU9iGumfA6SMsghKV8"
}
---
function "security/complete_idempotency" {
  input {
  }

  stack {
  }

  response = null
  guid = "hthO2TYH9smLTd0iPJmpmnrFUSs"
}
---
function "tests/run_p2_suite" {
  input {
  }

  stack {
  }

  response = null
  guid = "AlTbpjQ0SbwLk_-cN4QFPYLcSwk"
}
---
// This group provides endpoints for user login, signup, and reset password, returning authentication tokens and user records.
api_group Authentication {
  canonical = "pofBqnrY"
  tags = ["xano:quick-start"]
  history = 0
  guid = "OyTxHleLinzGESW_6Rwkz0YCLdE"
}
---
// Contains API Endpoints for reports of event logs
api_group "Event Logs" {
  canonical = "h1FBhliB"
  tags = ["xano:quick-start"]
  history = 0
  guid = "QZfkATtPZw504U9j33Fg79m8YyA"
}
---
// Zippy Logistics V1 API Group for autonomous freight operations, booking, pricing, and ToPay consent
api_group Zippy_V1 {
  canonical = "zippy-v1"
  history = 0
  guid = "ql11o9xqTkMJSL196fBOBg6oGD0"
}
---
// Approved-account login; privilege and membership are resolved from current database state.
query "auth/login" verb=POST {
  api_group = "Authentication"

  input {
    email email filters=trim|lower
    text password {
      sensitive = true
    }
  }

  stack {
    db.get user {
      field_name = "email"
      field_value = $input.email
      output = ["id", "password", "status"]
    } as $user
  
    precondition ($user != null) {
      error_type = "unauthorized"
      error = "Invalid credentials or unavailable account."
    }
  
    security.check_password {
      text_password = $input.password
      hash_password = $user.password
    } as $password_valid
  
    precondition ($password_valid && $user.status == "active") {
      error_type = "unauthorized"
      error = "Invalid credentials or unavailable account."
    }
  
    function.run "security/resolve_context" {
      input = {user_id: $user.id}
    } as $context
  
    security.create_auth_token {
      table = "user"
      extras = {}
      expiration = 86400
      id = $user.id
    } as $auth_token
  
    function.run "Quick Start/log_event" {
      input = {user_id: $user.id, action: "login"}
    } as $event
  }

  response = {authToken: $auth_token, user_id: $user.id}
  tags = ["xano:quick-start"]
  guid = "aX_q_Dc3znjBWbI9fI6uRwX9rUw"
}
---
// Authoritative, side-effect-free identity; rechecks status and membership on every request.
query "auth/me" verb=GET {
  api_group = "Authentication"
  auth = "user"

  input {
  }

  stack {
    function.run "security/resolve_context" {
      input = {user_id: $auth.id}
    } as $context
  }

  response = {
    id                    : $context.user_id
    name                  : $context.name
    email                 : $context.email
    system_role           : $context.system_role
    status                : $context.user_status
    active_organization_id: $context.organization_id
  }

  tags = ["xano:quick-start"]
  guid = "dhAy6uzAP6VInZUo3NUpseXZVUk"
}
---
// Review candidate: onboarding/recovery remains unavailable pending an approved independent flow.
query "auth/signup" verb=POST {
  api_group = "Authentication"

  input {
  }

  stack {
    precondition (false) {
      error_type = "accessdenied"
      error = "Account onboarding or recovery is unavailable pending release review."
    }
  }

  response = null
  tags = ["xano:quick-start"]
  guid = "uzsWxrwZyIQ2P4VGhcKoUujQOVw"
}
---
// Customer-only tenant-scoped list. No operational, contact or financial detail projection.
query bookings verb=GET {
  api_group = "Zippy_V1"
  auth = "user"

  input {
    int page?=1 filters=min:1|max:10000
    int per_page?=20 filters=min:1|max:100
    enum? status? {
      values = [
        "draft"
        "quoted"
        "booked"
        "assigned"
        "in_transit"
        "delivered"
        "completed"
        "cancelled"
      ]
    }
  
    int? requested_org_id?
  }

  stack {
    function.run "security/resolve_context" {
      input = {
        user_id         : $auth.id
        requested_org_id: $input.requested_org_id
      }
    } as $context
  
    precondition ($context.can_read_bookings) {
      error_type = "accessdenied"
      error = "Customer booking scope required."
    }
  
    db.query customer_booking {
      where = $db.customer_booking.customer_organization_id == $context.organization_id && $db.customer_booking.status ==? $input.status
      sort = {created_at: "desc", id: "desc"}
      return = {
        type  : "list"
        paging: {
          page    : $input.page
          per_page: $input.per_page
          totals  : true
        }
      }
    
      output = [
        "curPage"
        "nextPage"
        "items.id"
        "items.booking_reference"
        "items.customer_organization_id"
        "items.status"
        "items.payment_status"
        "items.payment_mode"
        "items.pickup_city"
        "items.delivery_city"
        "items.version"
      ]
    } as $bookings
  }

  response = $bookings
  guid = "6GSLqxIQiJCrqkSCjCvpgWtlp74"
}
---
query bookings verb=POST {
  api_group = "Zippy_V1"

  input {
  }

  stack {
  }

  response = null
  guid = "YBEzcApCI-ywnoCzLNNmFhnaDGU"
}
---
// Resolve permissions before a tenant-scoped lookup; missing and foreign IDs have the same response.
query "bookings/{booking_id}" verb=GET {
  api_group = "Zippy_V1"
  auth = "user"

  input {
    int booking_id filters=min:1 {
      table = "customer_booking"
    }
  }

  stack {
    function.run "security/resolve_context" {
      input = {user_id: $auth.id}
    } as $context
  
    precondition ($context.can_read_bookings) {
      error_type = "accessdenied"
      error = "Customer booking scope required."
    }
  
    db.query customer_booking {
      where = $db.customer_booking.id == $input.booking_id && $db.customer_booking.customer_organization_id == $context.organization_id
      return = {type: "single"}
      output = [
        "id"
        "booking_reference"
        "customer_organization_id"
        "status"
        "payment_status"
        "payment_mode"
        "pickup_city"
        "delivery_city"
        "version"
      ]
    } as $booking
  
    precondition ($booking != null) {
      error_type = "notfound"
      error = "Booking not found."
    }
  
    function.run "security/authorize_resource" {
      input = {
        caller_user_id          : $auth.id
        resource_organization_id: $booking.customer_organization_id
        action_name             : "read"
      }
    } as $authorized
  
    db.query cargo_detail {
      where = $db.cargo_detail.booking_id == $booking.id
      return = {type: "list"}
      output = ["id"]
    } as $cargo
  
    db.query order_holds {
      where = $db.order_holds.order_id == $booking.id && $db.order_holds.is_active == true
      return = {type: "list"}
      output = ["id"]
    } as $holds
  }

  response = {
    booking         : $booking
    cargo           : $cargo
    active_holds    : $holds
    blocking_reasons: ["Booking commands are unavailable in this read-only release."]
    allowed_actions : []
  }

  guid = "TIM8wNAjymPpkdQFVbENQWCVzcQ"
}
---
query "bookings/{booking_id}" verb=PATCH {
  api_group = "Zippy_V1"

  input {
  }

  stack {
  }

  response = null
  guid = "eZJf-oxiWY24O97XjWNAAJ51m9s"
}
---
query "bookings/{booking_id}/cancel" verb=POST {
  api_group = "Zippy_V1"

  input {
  }

  stack {
  }

  response = null
  guid = "amImulgOuHcVz2mXWEP4WW-ajYA"
}
---
query "bookings/{booking_id}/confirm" verb=POST {
  api_group = "Zippy_V1"

  input {
  }

  stack {
  }

  response = null
  guid = "xuw6qoRLQSeXoAJ23Byz5sDWzis"
}
---
query "bookings/{booking_id}/consent-attempts" verb=POST {
  api_group = "Zippy_V1"

  input {
  }

  stack {
  }

  response = null
  guid = "-raPARoSzPQN1Eju67GxKXMjY68"
}
---
query "bookings/{booking_id}/holds" verb=POST {
  api_group = "Zippy_V1"

  input {
  }

  stack {
  }

  response = null
  guid = "ExxOI7aHk30DdUsNzYPgWhQbkog"
}
---
query "bookings/{booking_id}/holds/{hold_id}/release" verb=POST {
  api_group = "Zippy_V1"

  input {
  }

  stack {
  }

  response = null
  guid = "bNqFkRnsiEgmCKPa4I3BoRtLpL8"
}
---
query "bookings/{booking_id}/payment-selection" verb=POST {
  api_group = "Zippy_V1"

  input {
  }

  stack {
  }

  response = null
  guid = "PFhS_T9CwrY1YTAfEYAMC515ow8"
}
---
query "bookings/{booking_id}/quotes" verb=POST {
  api_group = "Zippy_V1"

  input {
  }

  stack {
  }

  response = null
  guid = "gmvLx0cis9Y9-SHdhdReeLEoPsU"
}
---
query "bookings/{booking_id}/quotes/{quote_id}/accept" verb=POST {
  api_group = "Zippy_V1"

  input {
  }

  stack {
  }

  response = null
  guid = "VmrJkp73XerYTSIYvnpY5rotaMs"
}
---
query "bookings/{booking_id}/resume" verb=POST {
  api_group = "Zippy_V1"

  input {
  }

  stack {
  }

  response = null
  guid = "iINhgTaUOWgnOGkcECxAK6jPrls"
}
---
// chatgpt work connection
query chatgpt verb=POST {
  api_group = "Authentication"
  auth = "user"

  input {
  }

  stack {
    api.request {
      url = "https://chatgpt.com/oauth/client.json"
      method = "GET"
    } as $api1
  }

  response_type = "stream"
  guid = "CVYDEFmwe1moAZLpXlOHOaBsAgo"
}
---
query "consent-attempts/{attempt_id}/decision" verb=POST {
  api_group = "Zippy_V1"

  input {
  }

  stack {
  }

  response = null
  guid = "KW_lQ0G930yx0BYgu5p3AAhT34E"
}
---
// Current active identity required. Never return historical metadata or arbitrary event names.
query "logs/user/my_events" verb=GET {
  api_group = "Event Logs"
  auth = "user"

  input {
    int page?=1 filters=min:1|max:10000
    int per_page?=25 filters=min:1|max:100
  }

  stack {
    function.run "security/resolve_context" {
      input = {user_id: $auth.id}
    } as $context
  
    db.query event_log {
      where = $db.event_log.user_id == $context.user_id && ($db.event_log.action == "login" || $db.event_log.action == "signup" || $db.event_log.action == "get_auth_user" || $db.event_log.action == "reset_password" || $db.event_log.action == "login_for_password_reset" || $db.event_log.action == "welcome_email_queued" || $db.event_log.action == "welcome_email_sent" || $db.event_log.action == "event")
      sort = {created_at: "desc", id: "desc"}
      return = {
        type  : "list"
        paging: {
          page    : $input.page
          per_page: $input.per_page
          totals  : true
        }
      }
    
      output = [
        "curPage"
        "nextPage"
        "items.id"
        "items.created_at"
        "items.action"
      ]
    } as $events
  }

  response = $events
  tags = ["xano:quick-start"]
  guid = "CcBtnd_m1N_eGR5EGBNVc-_16bg"
}
---
// Notifications are outside the approved-account read release; deny before any side effect.
query "message/send_welcome_email" verb=POST {
  api_group = "Authentication"
  auth = "user"

  input {
  }

  stack {
    precondition (false) {
      error_type = "accessdenied"
      error = "Account notifications are unavailable pending release review."
    }
  }

  response = null
  tags = ["xano:quick-start"]
  guid = "olPklXlkadDR393PX2WElLYb72A"
}
---
// Review candidate: onboarding/recovery remains unavailable pending an approved independent flow.
query "reset/magic-link-login" verb=POST {
  api_group = "Authentication"

  input {
  }

  stack {
    precondition (false) {
      error_type = "accessdenied"
      error = "Account onboarding or recovery is unavailable pending release review."
    }
  }

  response = null
  tags = ["xano:quick-start"]
  guid = "LUqjgYQsN5-IAoQS3U2LC1C5WXQ"
}
---
// Review candidate: onboarding/recovery remains unavailable pending an approved independent flow.
query "reset/request-reset-link" verb=GET {
  api_group = "Authentication"

  input {
  }

  stack {
    precondition (false) {
      error_type = "accessdenied"
      error = "Account onboarding or recovery is unavailable pending release review."
    }
  }

  response = null
  tags = ["xano:quick-start"]
  guid = "bYr4JVjrEejdcUEIsYdGAlUrVR0"
}
---
// Review candidate: onboarding/recovery remains unavailable pending an approved independent flow.
query "reset/update_password" verb=POST {
  api_group = "Authentication"
  auth = "user"

  input {
  }

  stack {
    precondition (false) {
      error_type = "accessdenied"
      error = "Account onboarding or recovery is unavailable pending release review."
    }
  }

  response = null
  tags = ["xano:quick-start"]
  guid = "uLSQq0yQAcWE0FXguLV-LXqLtk4"
}
---
addon user {
  input {
    int user_id? {
      table = "user"
    }
  }

  stack {
    db.query user {
      where = $db.user.id == $input.user_id
      return = {type: "single"}
    }
  }

  guid = "sicrxVNikAGX7qIf6NAmJJgYVWI"
}
---
//  The Xano Example Agent gets you started with a basic AI Agent to integrate into your workflows. You can easily build on top of it, connect tools, and adjust the prompt to adapt to your use case.
// 
//  It comes with a Tool connected to the Xano Documentation, which has context to the Xano Docs. To test the Baseline Agent, open the Demo API in the Authentication API Group.
agent "Xano Example Agent" {
  canonical = "oLD1pBfg"
  tags = ["xano:quick-start"]
  llm = {
    type            : "xano-free"
    system_prompt   : """
      You are a helpful and versatile AI assistant. Your core responsibility is to understand and respond to user inquiries by providing accurate, clear, and concise information or completing general tasks as requested.
      
      You rely solely on your general knowledge and reasoning abilities.
      
      Tools available:
      -You can Xano documentation with the tool SearchXanoDocs. This access the pages of the Xano documentation, which can be used to answer questions based on the search query.
      
      When responding:
      - Always strive to be helpful and provide accurate information.
      - If a task requires external information or capabilities you do not possess, clearly state your limitations.
      - Explain your reasoning or thought process when appropriate, especially for complex inquiries.
      - Provide clear and easy-to-understand responses.
      
      ### Dynamic Context
      You will receive the user's query or message as an argument.
      
      ### Output Expectations
      - Responses should be clear, concise, and directly address the user's query.
      - Output should be in a readable Markdown format if structuring information or providing lists.
      - Ensure the response completely answers the user's request based on the information available to you.
      """
    max_steps       : 5
    messages        : "{{ $args.messages|json_encode() }}"
    temperature     : 0
    search_grounding: false
    thinking_tokens : 0
    include_thoughts: false
    baseURL         : ""
    headers         : ""
    safety_settings : ""
    dynamic_retrival: ""
  }

  tools = [{name: "search_xano_docs"}]
  guid = "kxCGZ92Ujmzhz6NjmHN_4bfRYNY"
}
---
// Handles Razor payment gateway calling , mapmy india route optimization, user's authetication 
mcp_server "Xano-Synthetic-Prototype" {
  canonical = "onHwNkOs"
  instructions = """
    "Core Modules: Handles vehicle booking, shipping, Order Management (OMS), Inventory Management (IMS), and Transport Management (TMS).
    Communications: Automatically sends email and SMS status updates to all involved participants.
    Workflows: Manages driver invoice uploads during the loading phase and handles Proof of Delivery (POD) submissions once a shipment is completed."
    """
  tags = ["route optimization", "razor pay gateway", "email & sms "]
  tools = [{name: "search_xano_docs"}]
  guid = "O4-EdEahkSCI6RkO5jhYjXNt3vI"
}
---
// This tool connects to the Mintlify MCP Server, which accesses and searches the Xano Documentation based on a search query.
tool search_xano_docs {
  instructions = "This allows you to search the Xano Documentation and input a search query. It will return a pages of the Xano Documentation based on the search query. This can be used to answer and analyze questions around Xano and how to use it."

  input {
    text search? filters=trim
  }

  stack {
    ai.external.mcp.tool.run {
      url = "https://docs.xano.com/mcp"
      bearer_token = ""
      connection_type = "stream"
      tool = "SearchXanoDocumentation"
      args = {}|set:"query":$input.search
    } as $search_xano_docs
  }

  response = $search_xano_docs
  tags = ["xano:quick-start"]
  guid = "arBFYKEKEf2E79dk1D-2RVbb31M"
}