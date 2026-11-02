// Signup and retrieve an authentication token
query "auth/signup" verb=POST {
  api_group = "Authentication"
  auth = "user"

  input {
    text name? filters=trim
    email email? filters=trim|lower
    password password? filters=min:8|minAlpha:1|minDigit:1
    enum? system_role?=customer_member {
      values = [
        "customer_admin"
        "customer_member"
        "vendor_admin"
        "fleet_manager"
        "driver"
      ]
    }
  }

  stack {
    // Check if a user record with that email exists
    db.get user {
      field_name = "email"
      field_value = $input.email
    } as $existing_user
  
    // Verify that the email being used to sign up is unique
    precondition ($existing_user == null) {
      error_type = "accessdenied"
      error = "An account with this email already exists."
    }
  
    // Create a new user record
    db.add user {
      data = {
        created_at : "now"
        name       : $input.name
        email      : $input.email
        password   : $input.password
        role       : "member"
        system_role: $input.system_role
        status     : "active"
      }
    } as $user
  
    // Create an authentication token
    security.create_auth_token {
      table = "user"
      extras = {
        role                  : $user.role
        system_role           : $user.system_role
        active_organization_id: $user.active_organization_id
      }
    
      expiration = 86400
      id = $user.id
    } as $authToken
  
    // Create a sanitized event log for signup (exclude password)
    function.run "Quick Start/log_event" {
      input = {
        user_id : $user.id
        action  : "signup"
        metadata: {
        id         : $user.id
        name       : $user.name
        email      : $user.email
        role       : $user.role
        system_role: $user.system_role
      }
      }
    } as $event_log
  }

  response = {
    authToken: $authToken
    user     : ```
      {
        id         : $user.id
        name       : $user.name
        email      : $user.email
        role       : $user.role
        system_role: $user.system_role
      }
      ```
  }

  tags = ["xano:quick-start"]
  guid = "uzsWxrwZyIQ2P4VGhcKoUujQOVw"
}
