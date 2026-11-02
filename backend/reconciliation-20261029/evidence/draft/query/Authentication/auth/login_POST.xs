// Login and retrieve an authentication token
query "auth/login" verb=POST {
  api_group = "Authentication"
  auth = "user"

  input {
    email email filters=trim|lower
    text password {
      sensitive = true
    }
  }

  stack {
    db.get user {
      field_name = "email"
      field_value = $input.email
      output = ["id", "password", "status"]
    } as $user
  
    precondition ($user != null) {
      error_type = "unauthorized"
      error = "Invalid credentials or unavailable account."
    }
  
    security.check_password {
      text_password = $input.password
      hash_password = $user.password
    } as $password_valid
  
    precondition ($password_valid && $user.status == "active") {
      error_type = "unauthorized"
      error = "Invalid credentials or unavailable account."
    }
  
    function.run "security/resolve_context" {
      input = {user_id: $user.id}
    } as $context
  
    security.create_auth_token {
      table = "user"
      extras = {}
      expiration = 86400
      id = $user.id
    } as $auth_token
  
    function.run "Quick Start/log_event" {
      input = {user_id: $user.id, action: "login"}
    } as $event
  }

  response = {authToken: $auth_token, user_id: $user.id}
  tags = ["xano:quick-start"]
  guid = "aX_q_Dc3znjBWbI9fI6uRwX9rUw"
}
