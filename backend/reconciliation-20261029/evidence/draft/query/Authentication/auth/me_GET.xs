// Get the user record belonging to the authentication token
query "auth/me" verb=GET {
  api_group = "Authentication"
  auth = "user"

  input {
  }

  stack {
    // Get the user record based on the auth ID (side-effect-free pure read)
    db.get user {
      field_name = "id"
      field_value = $auth.id
      output = [
        "id"
        "created_at"
        "name"
        "email"
        "phone"
        "role"
        "system_role"
        "active_organization_id"
        "status"
      ]
    } as $user
  
    // Verify user exists
    precondition ($user != null) {
      error_type = "notfound"
      error = "User not found."
    }
  }

  response = $user
  tags = ["xano:quick-start"]
  guid = "dhAy6uzAP6VInZUo3NUpseXZVUk"
}
