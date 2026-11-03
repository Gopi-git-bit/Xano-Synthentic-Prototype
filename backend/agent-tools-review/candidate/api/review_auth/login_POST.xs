// Verify a pre-seeded synthetic account password and issue an isolated user token.
query login verb=POST {
  api_group = "Review Authentication"
  input {
    email email filters=trim|lower
    text password { sensitive = true }
  }
  stack {
    db.get user {
      field_name = "email"
      field_value = $input.email
      output = ["id", "password", "status"]
    } as $user
    precondition ($user != null) {
      error_type = "accessdenied"
      error = "Invalid credentials."
    }
    security.check_password {
      text_password = $input.password
      hash_password = $user.password
    } as $valid
    precondition ($valid && $user.status == "active") {
      error_type = "accessdenied"
      error = "Invalid credentials."
    }
    security.create_auth_token {
      table = "user"
      id = $user.id
      extras = {}
      expiration = 3600
    } as $token
  }
  response = {authToken: $token}
  guid = "dl8AuwEzsEzT0bBH9i1cA4HV6jo"
}
