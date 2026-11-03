table ZIPPY_DB_CROSSWALK_49_TO_XANO33 {
  auth = false

  schema {
    int id
    text postgres_table?
    text xano_candidate_or_equivalent?
    text classification?
    text priority?
    text verification_required?
  }

  index = [{type: "primary", field: [{name: "id"}]}]
  guid = "6GghiE_O8XN-0u5eNsh_8UZxY_Y"
}
