workflow_test "Slice1 fixture diagnostic" {
  stack {
    function.call "Slice1/setup" as $setup
    function.call "Slice1/acceptance" {
      input = {key: "basic"}
    } as $result
  
    expect.to_equal ($result.code) {
      value = "CREATED"
    }
  
    expect.to_be_true ($result.complete)
    expect.to_equal ($result.counts.audit) {
      value = 1
    }
  
    expect.to_equal ($result.idem_count) {
      value = 1
    }
  }

  tags = ["synthetic:slice1", "diagnostic:positive-control"]
  guid = "uJxE2Iu8UUQOR-SqjYLCPM34WCU"
}