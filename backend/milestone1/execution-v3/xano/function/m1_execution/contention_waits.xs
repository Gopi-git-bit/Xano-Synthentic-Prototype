// Read-only observer: never returns SQL text, payloads or credentials.
function "M1Execution/contention_waits" {
  input {}
  stack {
    db.direct_query { sql = "SELECT current_database() AS database" response_type = "single" } as $database
    precondition ($database.database == "sn9m-aat6-200c") { error_type = "accessdenied" error = "ISOLATED_SANDBOX_REQUIRED" }

    db.direct_query {
      sql = """
        SELECT json_build_object('database',current_database(),
          'ms',(extract(epoch FROM clock_timestamp()) * 1000)::bigint,
          'waits',(SELECT coalesce(json_agg(x),'[]'::json) FROM (
            SELECT pid,wait_event_type,wait_event,pg_blocking_pids(pid) AS blocking_pids
            FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock'
            ORDER BY pid
          ) x)) AS evidence
      """
      response_type = "single"
    } as $observed
  }
  response = $observed.evidence
  tags = ["m1:execution-preparation","read-only"]
}
