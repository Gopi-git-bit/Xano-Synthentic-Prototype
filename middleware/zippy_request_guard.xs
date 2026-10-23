// Validates authentication, authorization, request context, and safety rules for Zippy API
middleware Zippy_request_guard {
  input {
    json vars
    enum type {
      values = ["pre", "post"]
    }
  }

  stack {
  }

  response = null
  docs = "Describe middleware purpose, scope, inputs, outputs, and failue behaviour"
  response_strategy = "merge"
  exception_policy = "silent"
}