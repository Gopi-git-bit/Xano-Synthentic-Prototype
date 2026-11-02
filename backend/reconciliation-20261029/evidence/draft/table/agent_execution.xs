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
