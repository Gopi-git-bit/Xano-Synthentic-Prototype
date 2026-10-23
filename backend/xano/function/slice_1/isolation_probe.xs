function "Slice1/isolation_probe" {
  input {
  }

  stack {
    db.direct_query {
      sql = "SELECT current_database() AS database, (SELECT count(*)::int FROM information_schema.tables WHERE table_schema='public' AND table_name LIKE 'mvpw%') AS physical_table_count, EXISTS (SELECT 1 FROM pg_proc WHERE proname='pg_advisory_xact_lock') AS advisory_lock_available"
      response_type = "single"
    } as $probe
  }

  response = $probe
  tags = ["synthetic:slice1", "diagnostic:metadata-only"]

  test "sandbox database identity confirmed" {
    expect.to_equal ($response) {
      value = {
        database               : "sn9m-aat6-200c"
        physical_table_count   : 51
        advisory_lock_available: true
      }
    }
  }

  guid = "FxKQ_CkbLMV0yp5DuP8DiLG5W3A"
}