# Public API

The most public accessible observables, properties and methods are placed in the `OidcSecurityService`. Below you can find the description of every single one of them.

## userData$

The `userData$` observable provides the information about the user after he has logged in. In case you are running with one configuration it returns the user data as an object depending on what you get back from the sts as user data.
In case you have multiple configs running it returns a `ConfigUserDataResult[]` which holds the `configId` as well as the `userData` in an array.

Example:

```ts
this.userData$ = this.oidcSecurityService.userData$;
```

Single Config:

```json
{
  "sub": "...",
  "preferred_username": "john@doe.org",
  "name": "john@doe.org",
  "email": "john@doe.org",
  "email_verified": false,
  "given_name": "john@doe.org",
  "role": "user",
  "amr": "pwd"
}
```

Multiple Configs:

```json
[
  {
    "configId": "...",
    "userData": {
      "sub": "...",
      "preferred_username": "john@doe.org",
      "name": "john@doe.org",
      "email": "john@doe.org",
      "email_verified": false,
      "given_name": "john@doe.org",
      "role": "user",
      "amr": "pwd"
    }
  },
  {
    "configId": "...",
    "userData": { ... }
  }
]
```

## isAuthenticated$

This property returns an `Observable<boolean>` to receive authenticated events, either true or false if you run in a single config. If you run with multiple configs it returns an `ConfigAuthenticatedResult[]` holding the `configId` as well as a boolean to tell you if you are authenticated or not.

```ts
this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$; // true/false or...
```

Single Config

```json
true / false;
```

Multiple Configs

```json
[
  {
    "configId": "...",
    "isAuthenticated": true
  },
  {
    "configId": "...",
    "isAuthenticated": false
  }
]
```

## checkSessionChanged$

The `checkSessionChanged$` observable gets emitted values every time the server comes back with a check session and the value `changed`. If you want to get an information about when the CheckSession Event has been received generally take a look at the [public events](features.md#public-events).

Example:

```ts
this.checkSessionChanged$ = this.oidcSecurityService.checkSessionChanged$;
```

## stsCallback$

The `stsCallback$` observable gets emitted _after_ the library has handled the possible sts callback. You can perform initial setups and custom workflows inside your application when the STS redirects you back to your app.

Example:

```ts
this.stsCallback$ = this.oidcSecurityService.stsCallback$;
```

## getConfigurations()

This method returns all configurations you have configured as an `OpenIdConfiguration[]`. The config includes all your values merged with the ones the library created.

```ts
const allConfigs = this.oidcSecurityService.getConfigurations();
```

## getConfiguration(configId?: string)

This method returns one single configuration. If you pass the `configId` the specific config is being returned. If you do not pass it, the first one in case there are multiple or the only one in case you only have one configured is returned. Returns `null` otherwise.

```ts
// one config or the first one in case of multiple or null
const singleConfig = this.oidcSecurityService.getConfiguration();

// one config or null
const singleConfig = this.oidcSecurityService.getConfiguration('configId');
```

## getUserData(configId?: string)

This method returns the user data being used. If you pass the `configId` the specific user data for this config is being returned. If you do not pass it, the first one in case there are multiple or the only one in case you only have one configured is returned. Returns `null` otherwise.

```ts
// one config or the first one in case of multiple or null
const userData = this.oidcSecurityService.getUserData();

// user data for this specific config
const userData = this.oidcSecurityService.getUserData('configId');
```

## checkAuth

The `checkAuth()` method kicks off the complete setup flow, you can call it to start the whole authentication flow and get back if you are authenticated or not as an observable.

## getToken(): string

Returns the `accesstoken` for you login scenario.

## getIdToken(): string

Returns the `id_token` for you login scenario.

## getRefreshToken(): string

Returns the `refresh token` for you login scenario if there is one.

## getPayloadFromIdToken(encode = false): any

returns the payload from the id_token. This can be used to get claims from the token.

## setState(state: string): void

You can set the state value used for the authorize request, if you have the | `autoCleanStateAfterAuthentication` set to false. Can be used for custom state logic handling, the state is not automatically reset, when set to false.

## getState(): string

read to set state, helpful when implementing custom state logic.

## authorize(authOptions?: AuthOptions)

This method is being called when you want to redirect to the sts and login your user.

```typescript
login() {
    this.oidcSecurityService.authorize();
}
```

You can pass optional `AuthOptions`

```ts
export interface AuthOptions {
  customParams?: { [key: string]: string | number | boolean };
  urlHandler?(url: string): any;
}
```

where you can pass a custom `urlHandler` which is getting called instead of the redirect and you can pass custom parameters which can maybe change every time you want to login. See also [Custom parameters](features.md/#custom-parameters)

## logoffAndRevokeTokens(urlHandler?: (url: string) => any)

The refresh token and and the access token are revoked on the server. If the refresh token does not exist only the access token is revoked. Then the logout run.

## logoff(urlHandler?: (url: string) => any)

Logs out on the server and the local client. If the server state has changed, check session, then only a local logout.

## logoffLocal()

The `logoffLocal()` function is used to reset you local session in the browser, but not sending anything to the server.

## revokeAccessToken(accessToken?: any)

https://tools.ietf.org/html/rfc7009
revokes an access token on the STS. This is only required in the code flow with refresh tokens. If no token is provided, then the token from the storage is revoked. You can pass any token to revoke. This makes it possible to manage your own tokens.

## revokeRefreshToken(refreshToken?: any)

https://tools.ietf.org/html/rfc7009
revokes a refresh token on the STS. This is only required in the code flow with refresh tokens.
If no token is provided, then the token from the storage is revoked. You can pass any token to revoke.
This makes it possible to manage your own tokens.

## getEndSessionUrl(customParams?: { [key: string]: string | number | boolean }): string | null

Creates the ens session URL which can be used to implement your own custom server logout. You can pass custom params directly into the method.

## forceRefreshSession(customParams?: { [key: string]: string | number | boolean }): Observable

Makes it possible to refresh the tokens at any time you require. You can pass custom parameters which can maybe change every time you want to refresh session. See also [Custom parameters](features.md/#custom-parameters)

```typescript
refreshSession() {
        this.oidcSecurityService.forceRefreshSession()
          .subscribe((result) => console.log(result));
    }
```

## checkAuthIncludingServer(): Observable

The `checkAuthIncludingServer` can be used to check the server for an authenticated session using the iframe silent renew if not locally authenticated. This is useful when opening an APP in a new tab and you are already authenticated. This method ONLY works with iframe silent renew. It will not work with refresh tokens. With refresh tokens, you cannot do this, as consent is required.

```typescript
export class AppComponent implements OnInit {
  constructor(public oidcSecurityService: OidcSecurityService) {}

  ngOnInit() {
    this.oidcSecurityService.checkAuthIncludingServer().subscribe((isAuthenticated) => {
      console.log('app authenticated', isAuthenticated);
    });
  }
}
```
