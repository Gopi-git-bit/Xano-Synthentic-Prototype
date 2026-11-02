workflow_test "Slice1 shared context keeper" {
  stack {
    function.call "Slice1/setup" as $setup
    db.direct_query {
      sql = "SELECT 1 AS held FROM pg_sleep(8)"
      response_type = "single"
    } as $held
  
    expect.to_be_true ($setup.seeded)
  }

  guid = "iv3YXMT0mvXfocgDyvWKtSVifVk"
}