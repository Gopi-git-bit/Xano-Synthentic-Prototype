workflow_test "Slice1 transactional acceptance" {
  stack {
    function.call "Slice1/setup" as $setup
    function.call "Slice1/acceptance" {
      input = {
        site          : "a"
        claimed_site  : "a"
        resource_site : "a"
        asset         : 0
        key           : "basic"
        action        : "execute"
        weight        : 20
        body_type     : "closed"
        fault         : "none"
        hold_seconds  : 0
        expect_failure: false
        variant       : ""
      }
    } as $result
  
    expect.to_equal ($result.code) {
      value = "CREATED"
    }
  
    expect.to_equal ($result.complete) {
      value = true
    }
  
    expect.to_equal ($result.order_count) {
      value = 1
    }
  
    expect.to_equal ($result.idem_count) {
      value = 1
    }
  
    function.call "Slice1/acceptance" {
      input = {
        site          : "a"
        claimed_site  : "a"
        resource_site : "a"
        asset         : 0
        key           : "basic"
        action        : "execute"
        weight        : 20
        body_type     : "closed"
        fault         : "none"
        hold_seconds  : 0
        expect_failure: false
        variant       : ""
      }
    } as $result
  
    expect.to_equal ($result.code) {
      value = "REPLAY"
    }
  
    expect.to_equal ($result.complete) {
      value = true
    }
  
    expect.to_equal ($result.order_count) {
      value = 1
    }
  
    expect.to_equal ($result.idem_count) {
      value = 1
    }
  
    function.call "Slice1/acceptance" {
      input = {
        site          : "a"
        claimed_site  : "a"
        resource_site : "a"
        asset         : 0
        key           : "basic"
        action        : "execute"
        weight        : 20
        body_type     : "closed"
        fault         : "none"
        hold_seconds  : 0
        expect_failure: false
        variant       : " changed"
      }
    } as $result
  
    expect.to_equal ($result.code) {
      value = "IDEMPOTENCY_CONFLICT"
    }
  
    expect.to_equal ($result.order_count) {
      value = 1
    }
  
    expect.to_equal ($result.idem_count) {
      value = 1
    }
  
    function.call "Slice1/acceptance" {
      input = {
        site          : "a"
        claimed_site  : "a"
        resource_site : "a"
        asset         : 0
        key           : "basic"
        action        : "inspect"
        weight        : 20
        body_type     : "closed"
        fault         : "none"
        hold_seconds  : 0
        expect_failure: false
        variant       : ""
      }
    } as $result
  
    expect.to_equal ($result.complete) {
      value = true
    }
  
    expect.to_equal ($result.order_count) {
      value = 1
    }
  
    expect.to_equal ($result.idem_count) {
      value = 1
    }
  
    function.call "Slice1/acceptance" {
      input = {
        site          : "a"
        claimed_site  : "b"
        resource_site : "a"
        asset         : 0
        key           : "tenant-claim"
        action        : "execute"
        weight        : 20
        body_type     : "closed"
        fault         : "none"
        hold_seconds  : 0
        expect_failure: true
        variant       : ""
      }
    } as $result
  
    expect.to_equal ($result.caught) {
      value = true
    }
  
    expect.to_be_true ($result.rollback_clean)
    expect.to_equal ($result.order_count) {
      value = 0
    }
  
    expect.to_equal ($result.idem_count) {
      value = 0
    }
  
    function.call "Slice1/acceptance" {
      input = {
        site          : "a"
        claimed_site  : "a"
        resource_site : "b"
        asset         : 0
        key           : "tenant-resource"
        action        : "execute"
        weight        : 20
        body_type     : "closed"
        fault         : "none"
        hold_seconds  : 0
        expect_failure: true
        variant       : ""
      }
    } as $result
  
    expect.to_equal ($result.caught) {
      value = true
    }
  
    expect.to_be_true ($result.rollback_clean)
    expect.to_equal ($result.order_count) {
      value = 0
    }
  
    expect.to_equal ($result.idem_count) {
      value = 0
    }
  
    function.call "Slice1/acceptance" {
      input = {
        site          : "b"
        claimed_site  : "b"
        resource_site : "b"
        asset         : 0
        key           : "tenant-b"
        action        : "execute"
        weight        : 20
        body_type     : "closed"
        fault         : "none"
        hold_seconds  : 0
        expect_failure: false
        variant       : ""
      }
    } as $result
  
    expect.to_equal ($result.code) {
      value = "CREATED"
    }
  
    expect.to_equal ($result.complete) {
      value = true
    }
  
    function.call "Slice1/acceptance" {
      input = {
        site          : "a"
        claimed_site  : "a"
        resource_site : "a"
        asset         : 4
        key           : "overweight"
        action        : "execute"
        weight        : 1000.001
        body_type     : "closed"
        fault         : "none"
        hold_seconds  : 0
        expect_failure: true
        variant       : ""
      }
    } as $result
  
    expect.to_equal ($result.caught) {
      value = true
    }
  
    expect.to_be_true ($result.rollback_clean)
    expect.to_equal ($result.order_count) {
      value = 0
    }
  
    expect.to_equal ($result.idem_count) {
      value = 0
    }
  
    function.call "Slice1/acceptance" {
      input = {
        site          : "a"
        claimed_site  : "a"
        resource_site : "a"
        asset         : 5
        key           : "body"
        action        : "execute"
        weight        : 20
        body_type     : "open"
        fault         : "none"
        hold_seconds  : 0
        expect_failure: true
        variant       : ""
      }
    } as $result
  
    expect.to_equal ($result.caught) {
      value = true
    }
  
    expect.to_be_true ($result.rollback_clean)
    expect.to_equal ($result.order_count) {
      value = 0
    }
  
    expect.to_equal ($result.idem_count) {
      value = 0
    }
  
    function.call "Slice1/acceptance" {
      input = {
        site          : "a"
        claimed_site  : "a"
        resource_site : "a"
        asset         : 6
        key           : "fault-order"
        action        : "execute"
        weight        : 20
        body_type     : "closed"
        fault         : "after_order"
        hold_seconds  : 0
        expect_failure: true
        variant       : ""
      }
    } as $result
  
    expect.to_equal ($result.caught) {
      value = true
    }
  
    expect.to_be_true ($result.rollback_clean)
    expect.to_equal ($result.order_count) {
      value = 0
    }
  
    expect.to_equal ($result.idem_count) {
      value = 0
    }
  
    expect.to_equal ($result.asset_assignments) {
      value = 0
    }
  
    function.call "Slice1/acceptance" {
      input = {
        site          : "a"
        claimed_site  : "a"
        resource_site : "a"
        asset         : 6
        key           : "fault-order"
        action        : "execute"
        weight        : 20
        body_type     : "closed"
        fault         : "none"
        hold_seconds  : 0
        expect_failure: false
        variant       : ""
      }
    } as $result
  
    expect.to_equal ($result.code) {
      value = "CREATED"
    }
  
    expect.to_equal ($result.complete) {
      value = true
    }
  
    expect.to_equal ($result.order_count) {
      value = 1
    }
  
    expect.to_equal ($result.idem_count) {
      value = 1
    }
  
    function.call "Slice1/acceptance" {
      input = {
        site          : "a"
        claimed_site  : "a"
        resource_site : "a"
        asset         : 7
        key           : "fault-assignment"
        action        : "execute"
        weight        : 20
        body_type     : "closed"
        fault         : "after_assignment"
        hold_seconds  : 0
        expect_failure: true
        variant       : ""
      }
    } as $result
  
    expect.to_equal ($result.caught) {
      value = true
    }
  
    expect.to_be_true ($result.rollback_clean)
    expect.to_equal ($result.order_count) {
      value = 0
    }
  
    expect.to_equal ($result.idem_count) {
      value = 0
    }
  
    expect.to_equal ($result.asset_assignments) {
      value = 0
    }
  
    function.call "Slice1/acceptance" {
      input = {
        site          : "a"
        claimed_site  : "a"
        resource_site : "a"
        asset         : 7
        key           : "fault-assignment"
        action        : "execute"
        weight        : 20
        body_type     : "closed"
        fault         : "none"
        hold_seconds  : 0
        expect_failure: false
        variant       : ""
      }
    } as $result
  
    expect.to_equal ($result.code) {
      value = "CREATED"
    }
  
    expect.to_equal ($result.complete) {
      value = true
    }
  
    expect.to_equal ($result.order_count) {
      value = 1
    }
  
    expect.to_equal ($result.idem_count) {
      value = 1
    }
  }

  tags = ["synthetic:slice1"]
  guid = "OtKo1Nslxp3an5N17f6bZcm1Opo"
}