// chatgpt work connection
query chatgpt verb=POST {
  api_group = "Authentication"
  auth = "user"

  input {
  }

  stack {
    api.request {
      url = "https://chatgpt.com/oauth/client.json"
      method = "GET"
    } as $api1
  }

  response_type = "stream"
  guid = "CVYDEFmwe1moAZLpXlOHOaBsAgo"
}
