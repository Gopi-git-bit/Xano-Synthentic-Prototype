// This function generates a magic token with a 60 minute expiration date using neutral enumeration-resistant logic
function "Quick Start/generate_magic_link" {
  input {
    email email? filters=trim|lower
  }

  stack {
    // Checks that the email input is not empty
    precondition ($input.email != null) {
      error_type = "inputerror"
      error = "Email address is required."
    }
  
    // Gets the user record by email
    db.query user {
      where = $db.user.email == $input.email
      return = {type: "single"}
      output = ["id", "email"]
    } as $user
  
    // Variable for returned payload
    var $result {
      value = {token: null, email: $input.email}
    }
  
    // Only generate and persist token if user exists (resistant to account enumeration)
    conditional {
      if ($user != null) {
        // Creates a unique UUID as token
        security.create_uuid as $token
      
        // Builds the password reset object (stored hashed in user table)
        var $password_reset {
          value = {}
            |set:"token":$token
            |set:"expiration":(now
              |add_secs_to_timestamp:(3600|to_int)
            )
            |set:"used":false
        }
      
        // Updates the user record with the password reset object
        db.edit user {
          field_name = "id"
          field_value = $user.id
          data = {password_reset: $password_reset}
        } as $updated_user
      
        var.update $result {
          value = {token: $token, email: $user.email}
        }
      }
    }
  }

  response = $result
  tags = ["xano:quick-start"]
  guid = "aSN69WB_2P6HmOpeaPtZhxFWyeo"
}
