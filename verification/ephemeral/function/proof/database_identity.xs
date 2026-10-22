// Read-only identity probe. No fixtures, credentials or external calls.
function "Proof/database_identity" {
  input {
  }

  stack {
    db.direct_query {
      sql = "SELECT current_database() AS database"
      response_type = "single"
    } as $identity
  }

  response = $identity

  test "isolated ephemeral database identity" {
    expect.to_equal ($response.database) {
      value = "e9aa-vgbb-7f5c"
    }
  }

  guid = "H6WVk-rDyl-jYJTTmZKyLxIsPRo"
}
