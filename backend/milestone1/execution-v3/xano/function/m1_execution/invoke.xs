function "M1Execution/invoke" {
  input {
    enum case_id { values = ["identity-missing_account","identity-duplicate_account","identity-blocked_account","identity-suspended_account","identity-no_membership","identity-expired_membership","identity-future_membership","identity-starter_admin_only","identity-missing_customer_profile","identity-duplicate_customer_profile","identity-foreign_tenant_claim","identity-foreign_resource","identity-foreign_owner","identity-overweight","identity-wrong_body","identity-unverified_document","identity-expired_document","identity-inactive_vendor","identity-inactive_driver","positive-a","positive-b","same-key-race","same-vehicle-race","same-driver-race","database-after_order","database-after_assignment","application-after_order","application-after_assignment","discarded-result","proof-vehicle","proof-driver","changed-payload","expired-key"] }
    int index? filters=min:0|max:3
    bool recover?
  }
  stack {
    db.direct_query { sql = "SELECT current_database() AS database" response_type = "single" } as $database
    precondition ($database.database == "sn9m-aat6-200c") { error_type = "accessdenied" error = "ISOLATED_SANDBOX_REQUIRED" }
    function.run "M1Execution/plan" { input = {case_id: $input.case_id} } as $plan

    var $request { value = $plan.requests[$input.index] }
    precondition ($request != null) { error = "REQUEST_INDEX_OUTSIDE_PLAN" }
    db.get user { field_name = "email" field_value = $plan.email output = ["id"] } as $actor
    precondition ($actor != null) { error = "RUN_FIXTURE_MISSING" }
    var $fault { value = $request.fault }
    conditional { if ($input.recover) { var.update $fault { value = "none" } } }
    var $outcome { value = null }
    try_catch { try {
      conditional {
        if ($input.case_id == "proof-vehicle" || $input.case_id == "proof-driver") {
          function.run "M1Execution/contention_command" { input = $request|set:"user_id":$actor.id|set:"fault":$fault } as $outcome
        } else {
          function.run "Slice1/create_and_assign" { input = $request|set:"user_id":$actor.id|set:"fault":$fault } as $outcome
        }
      }
    } catch {
      var.update $outcome { value = {code: "NATIVE_FAILURE", native_error: $error, requested_fault: $fault} }
    } }
  }
  response = $outcome
  tags = ["m1:execution-preparation"]
}
