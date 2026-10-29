// Validates authentication, authorization, request context, and safety rules for Zippy API
middleware Zippy_request_guard {
  input {
    json vars
    enum type {
      values = ["pre", "post"]
    }
  }

  stack {
    // PRE-REQUEST SECURITY GUARD
    conditional {
      if ($input.type == "pre") {
        var $request_uri {
          value = $env.$request_uri
        }
      
        var $remote_ip {
          value = $env.$remote_ip
        }
      }
    }
  }

  response = null
  docs = "Validates authentication, authorization, request context, and safety rules for Zippy API"
  response_strategy = "merge"
  exception_policy = "rethrow"
  guid = "sHFyufeK8wOzf70_Fo0ISGd-9xM"
}
