function "Slice1/fixture_probe" {
  input {
  }

  stack {
    db.query user {
      where = $db.user.email == "s1-61aa324d-a@example.invalid"
      return = {type: "count"}
    } as $users
  
    db.query platforms {
      where = $db.platforms.platform_id == "87c1d523-8ba6-4e16-849e-0ca819e572ad"
      return = {type: "count"}
    } as $platforms
  }

  response = {users: $users, platforms: $platforms}

  test "fixture persistence diagnostic" {
    expect.to_equal ($response) {
      value = {users: 0, platforms: 0}
    }
  }

  guid = "2tU3CXzjhoAxCLdLGAeoo56Y3wc"
}