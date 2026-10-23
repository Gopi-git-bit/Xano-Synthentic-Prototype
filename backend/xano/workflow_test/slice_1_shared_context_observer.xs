workflow_test "Slice1 shared context observer" {
  stack {
    db.query platforms {
      where = $db.platforms.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
      return = {type: "count"}
    } as $count
  
    expect.to_equal ($count) {
      value = 0
    }
  }

  guid = "LXvMamMHDu0LGrjtafxIDM6VCBY"
}