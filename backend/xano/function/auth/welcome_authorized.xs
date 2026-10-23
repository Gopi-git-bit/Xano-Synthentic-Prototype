function "Auth/welcome_authorized" {
  input {
    int requester_id?
    int target_id?
  }

  stack {
    var $allowed {
      value = $input.requester_id > 0 && $input.target_id > 0 && $input.requester_id == $input.target_id
    }
  }

  response = $allowed
  tags = ["synthetic:slice1", "auth:security"]

  test "self email allowed" {
    input = {requester_id: 17, target_id: 17}
  
    expect.to_be_true ($response)
  }

  test "cross user email denied" {
    input = {requester_id: 17, target_id: 18}
  
    expect.to_be_false ($response)
  }

  test "anonymous email denied" {
    input = {requester_id: 0, target_id: 17}
  
    expect.to_be_false ($response)
  }

  guid = "ir67ZADRXWg3id6myidcSPfiivY"
}