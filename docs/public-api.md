# Public API

The most public accessible observables, properties and methods are placed in the `OidcSecurityService`. Below you can find the descirption of everys single one of them.

```
   this.configuration = this.oidcSecurityService.configuration;
```

## get configuration()

## Userdata

The `userData$` observable provides the information about the user after he has logged in.

Example:

```ts
this.userData$ = this.oidcSecurityService.userData$;
```

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

## IsAuthenticated

Is an `Observable<boolean>` to receive authenticated events, either true or false.

```ts
this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
```

## CheckSessionChanged

Example:

```ts
this.checkSessionChanged$ = this.oidcSecurityService.checkSessionChanged$;
```

The `checkSessionChanged$` observable gets emitted values everytime the server comes back with a checksession and the value `changed`. If you want to get an information about when the CheckSession Event has been received generally take a look at the [public events](features.md#public-events).

## StsCallback

The `stsCallback$` observable gets emitted _after_ the library has handles the possible sts callback. You can perform initial setups and custom workflows inside your application when the STS redirects you back to your app.

Example:

```ts
this.checkSessionChanged$ = this.oidcSecurityService.stsCallback$;
```

## checkAuth(): Observable<boolean>

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

where you can pass a custom `urlHandler` which is getting called instead of the redirect and you can pass custom parameters which can maybe change everytime you want to login. See also [Custom parameters](features.md/#custom-parameters)

## logoffAndRevokeTokens(urlHandler?: (url: string) => any)

The refresh token and and the access token are revoked on the server. If the refresh token does not exist only the access token is revoked. Then the logout run.

## logoff(urlHandler?: (url: string) => any)

Logs out on the server and the local client. If the server state has changed, checksession, then only a local logout.

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

## getEndSessionUrl(): string | null

Creates the ens session URL which can be used to implement youe own custom server logout.

## forceRefreshSession(customParams?: { [key: string]: string | number | boolean }): Observable

Makes it possible to refresh the tokens at any time you require. You can pass custom parameters which can maybe change everytime you want to refresh session. See also [Custom parameters](features.md/#custom-parameters)

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
