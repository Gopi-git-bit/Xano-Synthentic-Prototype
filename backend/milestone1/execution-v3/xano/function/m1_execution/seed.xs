// Generated fixed fixtures; native validation pending. No caller-supplied rows.
function "M1Execution/seed" {
  input {
    enum case_id { values = ["identity-missing_account","identity-duplicate_account","identity-blocked_account","identity-suspended_account","identity-no_membership","identity-expired_membership","identity-future_membership","identity-starter_admin_only","identity-missing_customer_profile","identity-duplicate_customer_profile","identity-foreign_tenant_claim","identity-foreign_resource","identity-foreign_owner","identity-overweight","identity-wrong_body","identity-unverified_document","identity-expired_document","identity-inactive_vendor","identity-inactive_driver","positive-a","positive-b","same-key-race","same-vehicle-race","same-driver-race","database-after_order","database-after_assignment","application-after_order","application-after_assignment","discarded-result","proof-vehicle","proof-driver","changed-payload","expired-key"] }
  }
  stack {
    db.direct_query { sql = "SELECT current_database() AS database" response_type = "single" } as $database
    precondition ($database.database == "sn9m-aat6-200c") { error_type = "accessdenied" error = "ISOLATED_SANDBOX_REQUIRED" }
    function.run "M1Execution/plan" { input = {case_id: $input.case_id} } as $plan

    precondition ($plan.seed == $input.case_id) { error = "REUSE_EXISTING_RUN_FIXTURE" }
    db.query user { where = $db.user.email == $plan.email return = {type: "count"} } as $existing
    precondition ($existing == 0) { error = "FIXTURE_ALREADY_EXISTS_DO_NOT_RETRY" }
    var $actor { value = null }
    var $outcome { value = {code: "SEEDED"} }
    try_catch { try {
    db.transaction { stack {
      db.add user { data = {name: $plan.email, email: $plan.email, password: null, role: $plan.starter_role} } as $actor
      foreach ($plan.rows) { each as $row {
        var $subject { value = $row.data.external_subject }
        conditional { if ($subject == "__ACTOR__") { var.update $subject { value = "xano:" ~ $actor.id } } }
        conditional { if ($row.table == "customer_profiles") {
          db.add customer_profiles { data = {account_id: $row.data.account_id, customer_profile_id: $row.data.customer_profile_id, platform_id: $row.data.platform_id, verification_status: $row.data.verification_status} } as $added
        } }
        conditional { if ($row.table == "account_role_memberships") {
          db.add account_role_memberships { data = {account_id: $row.data.account_id, correlation_id: $row.data.correlation_id, membership_id: $row.data.membership_id, platform_id: $row.data.platform_id, role_code: $row.data.role_code, valid_from: $row.data.valid_from, valid_until: $row.data.valid_until} } as $added
        } }
        conditional { if ($row.table == "accounts") {
          db.add accounts { data = {account_id: $row.data.account_id, email_normalized: $row.data.email_normalized, external_subject: $subject, platform_id: $row.data.platform_id, status: $row.data.status} } as $added
        } }
        conditional { if ($row.table == "vendor_profiles") {
          db.add vendor_profiles { data = {account_id: $row.data.account_id, eligibility_status: $row.data.eligibility_status, platform_id: $row.data.platform_id, vendor_profile_id: $row.data.vendor_profile_id} } as $added
        } }
        conditional { if ($row.table == "vehicle_models") {
          db.add vehicle_models { data = {active: $row.data.active, approved_at: $row.data.approved_at, approved_by_account_id: $row.data.approved_by_account_id, body_type: $row.data.body_type, capacity_kg: $row.data.capacity_kg, display_name: $row.data.display_name, model_code: $row.data.model_code, platform_id: $row.data.platform_id, source_version: $row.data.source_version, vehicle_model_id: $row.data.vehicle_model_id} } as $added
        } }
        conditional { if ($row.table == "driver_profiles") {
          db.add driver_profiles { data = {account_id: $row.data.account_id, driver_profile_id: $row.data.driver_profile_id, eligibility_status: $row.data.eligibility_status, licence_reference: $row.data.licence_reference, platform_id: $row.data.platform_id} } as $added
        } }
        conditional { if ($row.table == "vehicles") {
          db.add vehicles { data = {approved_at: $row.data.approved_at, approved_by_account_id: $row.data.approved_by_account_id, platform_id: $row.data.platform_id, registration_number: $row.data.registration_number, status: $row.data.status, vehicle_id: $row.data.vehicle_id, vehicle_model_id: $row.data.vehicle_model_id, vendor_profile_id: $row.data.vendor_profile_id} } as $added
        } }
        conditional { if ($row.table == "vehicle_documents") {
          db.add vehicle_documents { data = {checksum_sha256: $row.data.checksum_sha256, document_type: $row.data.document_type, object_key: $row.data.object_key, platform_id: $row.data.platform_id, valid_from: $row.data.valid_from, valid_until: $row.data.valid_until, vehicle_document_id: $row.data.vehicle_document_id, vehicle_id: $row.data.vehicle_id, verification_status: $row.data.verification_status} } as $added
        } }
        conditional { if ($row.table == "driver_associations") {
          db.add driver_associations { data = {driver_association_id: $row.data.driver_association_id, driver_profile_id: $row.data.driver_profile_id, platform_id: $row.data.platform_id, valid_from: $row.data.valid_from, valid_until: $row.data.valid_until, vendor_profile_id: $row.data.vendor_profile_id} } as $added
        } }
      } }
    } }
    } catch { var.update $outcome { value = {code: "NATIVE_FAILURE", native_error: $error} } } }
  }
  response = $outcome|set:"user_id":$actor.id|set:"case_id":$input.case_id|set:"email":$plan.email|set:"rows":($plan.rows|count)
  tags = ["m1:execution-preparation"]
}
