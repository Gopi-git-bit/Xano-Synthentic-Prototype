function "M1Execution/fixture_readback" {
  input {
    enum case_id { values = ["identity-missing_account","identity-duplicate_account","identity-blocked_account","identity-suspended_account","identity-no_membership","identity-expired_membership","identity-future_membership","identity-starter_admin_only","identity-missing_customer_profile","identity-duplicate_customer_profile","identity-foreign_tenant_claim","identity-foreign_resource","identity-foreign_owner","identity-overweight","identity-wrong_body","identity-unverified_document","identity-expired_document","identity-inactive_vendor","identity-inactive_driver","positive-a","positive-b","same-key-race","same-vehicle-race","same-driver-race","database-after_order","database-after_assignment","application-after_order","application-after_assignment","discarded-result","proof-vehicle","proof-driver","changed-payload","expired-key"] }
  }
  stack {
    db.direct_query { sql = "SELECT current_database() AS database" response_type = "single" } as $database
    precondition ($database.database == "sn9m-aat6-200c") { error_type = "accessdenied" error = "ISOLATED_SANDBOX_REQUIRED" }
    function.run "M1Execution/plan" { input = {case_id: $input.case_id} } as $plan

    db.get user { field_name = "email" field_value = $plan.email output = ["id","name","email","role"] } as $actor
    var $observed { value = [] }
    foreach ($plan.rows) { each as $row {
      conditional { if ($row.table == "accounts") {
        db.query accounts { where = $db.accounts.account_id == $row.data.account_id return = {type: "list"} } as $found
        array.push $observed { value = {table: "accounts", rows: $found} }
      } }
      conditional { if ($row.table == "customer_profiles") {
        db.query customer_profiles { where = $db.customer_profiles.customer_profile_id == $row.data.customer_profile_id return = {type: "list"} } as $found
        array.push $observed { value = {table: "customer_profiles", rows: $found} }
      } }
      conditional { if ($row.table == "vendor_profiles") {
        db.query vendor_profiles { where = $db.vendor_profiles.vendor_profile_id == $row.data.vendor_profile_id return = {type: "list"} } as $found
        array.push $observed { value = {table: "vendor_profiles", rows: $found} }
      } }
      conditional { if ($row.table == "driver_profiles") {
        db.query driver_profiles { where = $db.driver_profiles.driver_profile_id == $row.data.driver_profile_id return = {type: "list"} } as $found
        array.push $observed { value = {table: "driver_profiles", rows: $found} }
      } }
      conditional { if ($row.table == "vehicle_models") {
        db.query vehicle_models { where = $db.vehicle_models.vehicle_model_id == $row.data.vehicle_model_id return = {type: "list"} } as $found
        array.push $observed { value = {table: "vehicle_models", rows: $found} }
      } }
      conditional { if ($row.table == "vehicles") {
        db.query vehicles { where = $db.vehicles.vehicle_id == $row.data.vehicle_id return = {type: "list"} } as $found
        array.push $observed { value = {table: "vehicles", rows: $found} }
      } }
      conditional { if ($row.table == "vehicle_documents") {
        db.query vehicle_documents { where = $db.vehicle_documents.vehicle_document_id == $row.data.vehicle_document_id return = {type: "list"} } as $found
        array.push $observed { value = {table: "vehicle_documents", rows: $found} }
      } }
      conditional { if ($row.table == "driver_associations") {
        db.query driver_associations { where = $db.driver_associations.driver_association_id == $row.data.driver_association_id return = {type: "list"} } as $found
        array.push $observed { value = {table: "driver_associations", rows: $found} }
      } }
      conditional { if ($row.table == "account_role_memberships") {
        db.query account_role_memberships { where = $db.account_role_memberships.membership_id == $row.data.membership_id return = {type: "list"} } as $found
        array.push $observed { value = {table: "account_role_memberships", rows: $found} }
      } }
    } }
  }
  response = {actor: $actor, observed: $observed}
  tags = ["m1:execution-preparation"]
}
