function "M1Execution/expire_positive_a" {
  input {}
  stack {
    db.direct_query { sql = "SELECT current_database() AS database" response_type = "single" } as $database
    precondition ($database.database == "sn9m-aat6-200c") { error_type = "accessdenied" error = "ISOLATED_SANDBOX_REQUIRED" }

    db.get accounts { field_name = "account_id" field_value = "4c65416a-c4a9-5c41-9b60-ed81d61efacb" } as $account
    precondition ($account != null && $account.email_normalized == "m1x-20261024-prep01-positive-a@example.invalid") { error = "RUN_OWNERSHIP_REQUIRED" }
    db.query idempotency_records {
      where = $db.idempotency_records.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad" && $db.idempotency_records.operation_scope == "slice1:create_assign:4c65416a-c4a9-5c41-9b60-ed81d61efacb" && $db.idempotency_records.idempotency_key == "m1x-20261024-prep01:positive-a"
      return = {type: "list"}
    } as $matches
    precondition (($matches|count) == 1) { error = "ONE_OWNED_IDEMPOTENCY_RECORD_REQUIRED" }
    var $record { value = $matches|first }
    precondition ($record.status == "succeeded" && $record.expires_at > now) { error = "UNEXPIRED_SUCCESS_REQUIRED" }
    db.edit idempotency_records { field_name = "id" field_value = $record.id data = {expires_at: 1} } as $expired
  }
  response = {id: $expired.id, expires_at: $expired.expires_at, response_reference: $expired.response_reference}
  tags = ["m1:execution-preparation"]
}
