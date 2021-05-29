```
node ./example/standalone.js
```

code flow with refresh tokens node-oidc-provider:

```
module.exports = {
clients: [
{
    client_id: 'angularPar',
    token_endpoint_auth_method: 'none',
    application_type: 'web',
    grant_types: ['refresh_token', 'authorization_code'],
    response_types: ['code'],
    redirect_uris: ['https://localhost:4207'],
    scope: 'openid offline_access profile email'
},
```

# Links

https://github.com/panva/node-oidc-provider#get-started

https://www.connect2id.com/products/server/docs/api/par

https://devcenter.heroku.com/articles/heroku-cli

OAuth 2.1 rar (rich authorization request) authorization_details

https://tools.ietf.org/html/draft-ietf-oauth-rar-01

OAuth 2.1 par (push authorization request) request_uri

https://tools.ietf.org/html/draft-ietf-oauth-par-06

OAuth 2.1 jar (signed authorize request) replaces query params , request

https://op.panva.cz/.well-known/openid-configuration
