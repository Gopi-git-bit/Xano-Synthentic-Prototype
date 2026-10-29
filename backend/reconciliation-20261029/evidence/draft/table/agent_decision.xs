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
