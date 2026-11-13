// Xano auth adapter: external_subject must be provisioned as xano:<authenticated user id>.
// Source: docs/PRD-backend.md and current CoreRepository.resolve_identity.
// The user table's starter role and client-supplied role/platform fields are never used.
function "Logistics/resolve_identity" {
  input {
    int user_id filters=min:1
  }

  stack {
    var $subject {
      value = "xano:" ~ $input.user_id
    }
  
    db.query accounts {
      where = $db.accounts.external_subject == $subject
      return = {type: "list"}
    } as $account_rows
  
    var $accounts {
      value = $account_rows
    }
  
    precondition (($accounts|count) == 1) {
      error_type = "accessdenied"
      error = "Actor is not authorized"
    }
  
    var $account {
      value = $accounts|first
    }
  
    precondition ($account.status == "active") {
      error_type = "accessdenied"
      error = "Actor is not authorized"
    }
  
    db.query account_role_memberships {
      where = $db.account_role_memberships.platform_id == $account.platform_id && $db.account_role_memberships.account_id == $account.account_id && $db.account_role_memberships.valid_from <= now && ($db.account_role_memberships.valid_until == null || $db.account_role_memberships.valid_until > now)
      return = {type: "list"}
    } as $membership_rows
  
    var $memberships {
      value = $membership_rows
    }
  
    precondition (($memberships|count) > 0) {
      error_type = "accessdenied"
      error = "Actor is not authorized"
    }
  
    var $roles {
      value = []
    }
  
    foreach ($memberships) {
      each as $membership {
        array.push $roles {
          value = $membership.role_code
        }
      }
    }
  
    db.query customer_profiles {
      where = $db.customer_profiles.platform_id == $account.platform_id && $db.customer_profiles.account_id == $account.account_id
      return = {type: "list"}
    } as $profile_rows
  
    var $customer_profiles {
      value = $profile_rows
    }
  
    var $customer {
      value = $customer_profiles|first
    }
  }

  response = {
    platform_id   : $account.platform_id
    account_id    : $account.account_id
    account_status: $account.status
    roles         : $roles
    customer      : $customer
  }

  tags = ["zippy:prototype", "zippy:authorization"]
  guid = "bbXjm9yBmsePUjxSIifsd18TMIU"
}