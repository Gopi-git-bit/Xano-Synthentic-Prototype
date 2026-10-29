// Exchanges magic token for auth token with atomic token invalidation
query "reset/magic-link-login" verb=POST {
  api_group = "Authentication"

  input {
    text magic_token? filters=trim
    text email? filters=trim
  }

  stack {
    // Check to make sure the magic token exists
    precondition ($input.magic_token != null) {
      error = "magic_token is required but was not provided."
    }
  
    // Check to make sure the email exists
    precondition ($input.email != null) {
      error = "email is required but not provided"
    }
  
    // Get the user record with the email from the URL
    db.get user {
      field_name = "email"
      field_value = $input.email
      output = [
        "id"
        "created_at"
        "name"
        "email"
        "role"
        "system_role"
        "active_organization_id"
        "password_reset.token"
        "password_reset.expiration"
        "password_reset.used"
      ]
    } as $user
  
    // Check user exists
    precondition ($user != null) {
      error_type = "unauthorized"
      error = "Invalid or expired reset token."
    }
  
    // Check that the password reset has not been used
    precondition ($user.password_reset.used == false) {
      error_type = "unauthorized"
      error = "This magic link has already been used. Please request another one."
    }
  
    // Check that the password reset token has not expired
    precondition ($user.password_reset.expiration > now) {
      error_type = "unauthorized"
      error = "Magic token has expired. Please request another one."
    }
  
    // Validate the token matches the hashed value
    security.check_password {
      text_password = $input.magic_token
      hash_password = $user.password_reset.token
    } as $verify_token
  
    // Verify the validation is true
    precondition ($verify_token) {
      error_type = "unauthorized"
      error = "The token did not match."
    }
  
    // ATOMIC CONSUME FIRST: Update the user record marking reset token used before issuing token
    db.edit user {
      field_name = "id"
      field_value = $user.id
      data = {
        password_reset: {
        token     : $user.password_reset.token
        expiration: $user.password_reset.expiration
        used      : true
      }
      }
    } as $user1
  
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
    } as $auth_token
  
    // Create a sanitized event log for password reset login (never pass token hashes)
    function.run "Quick Start/log_event" {
      input = {
        user_id : $user.id
        action  : "login_for_password_reset"
        metadata: {user_id: $user.id, email: $user.email}
      }
    } as $event_log
  }

  response = {authToken: $auth_token, user_id: $user1.id}
  tags = ["xano:quick-start"]
  guid = "LUqjgYQsN5-IAoQS3U2LC1C5WXQ"
}
