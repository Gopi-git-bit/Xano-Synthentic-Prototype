workflow_test "Slice1 discarded response retry" {
  stack {
    function.call "Slice1/setup" as $setup
    function.call "Slice1/acceptance" {
      input = {
        site          : "a"
        claimed_site  : "a"
        resource_site : "a"
        asset         : 8
        key           : "lost-response"
        action        : "execute"
        weight        : 20
        body_type     : "closed"
        fault         : "none"
        hold_seconds  : 2
        expect_failure: false
        variant       : ""
      }
    } as $discarded
  
    function.call "Slice1/acceptance" {
      input = {
        site          : "a"
        claimed_site  : "a"
        resource_site : "a"
        asset         : 8
        key           : "lost-response"
        action        : "inspect"
        weight        : 20
        body_type     : "closed"
        fault         : "none"
        hold_seconds  : 0
        expect_failure: false
        variant       : ""
      }
    } as $state
  
    expect.to_be_true ($state.complete)
    function.call "Slice1/acceptance" {
      input = {
        site          : "a"
        claimed_site  : "a"
        resource_site : "a"
        asset         : 8
        key           : "lost-response"
        action        : "execute"
        weight        : 20
        body_type     : "closed"
        fault         : "none"
        hold_seconds  : 0
        expect_failure: false
        variant       : ""
      }
    } as $retry
  
    expect.to_equal ($retry.code) {
      value = "REPLAY"
    }
  
    expect.to_be_true ($retry.complete)
    expect.to_equal ($retry.order_count) {
      value = 1
    }
  
    expect.to_equal ($retry.idem_count) {
      value = 1
    }
  }

  tags = ["synthetic:slice1", "retry:discarded-response"]
  guid = "mcjVB1dKpvedyR69UHQAuhnxyUw"
}