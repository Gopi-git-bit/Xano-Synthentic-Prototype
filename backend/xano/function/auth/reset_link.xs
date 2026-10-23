function "Auth/reset_link" {
  input {
    text base_url?
    text email?
    text token?
  }

  stack {
    api.lambda {
      code = """
        try {
          const u = new URL($input.base_url);
          if (u.protocol !== 'https:' || u.username || u.password || u.hash || u.search || !$input.email || !$input.token) return {valid:false,url:null};
          u.searchParams.set('magic_token', $input.token);
          u.searchParams.set('email', $input.email);
          return {valid:true,url:u.toString()};
        } catch { return {valid:false,url:null}; }
        """
      timeout = 10
    } as $link
  }

  response = $link
  tags = ["synthetic:slice1", "auth:security"]

  test "encoded independent query parameters" {
    input = {
      base_url: "https://auth.example.invalid/reset-password"
      email   : "a+tag@example.invalid"
      token   : "synthetic-token"
    }
  
    expect.to_equal ($response.url) {
      value = "https://auth.example.invalid/reset-password?magic_token=synthetic-token&email=a%2Btag%40example.invalid"
    }
  }

  test "missing frontend fails closed" {
    input = {
      base_url: ""
      email   : "test@example.invalid"
      token   : "synthetic-token"
    }
  
    expect.to_be_false ($response.valid)
  }

  test "unsafe frontend denied" {
    input = {
      base_url: "http://auth.example.invalid/reset-password"
      email   : "test@example.invalid"
      token   : "synthetic-token"
    }
  
    expect.to_be_false ($response.valid)
  }

  guid = "r4qojYDrQeHTIiWXsff9FRcdNwA"
}