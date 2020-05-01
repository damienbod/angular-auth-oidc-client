# Public API

The most public accessible observables, properties and methods are placed in the `OidcSecurityService`. Below you can find the descirption of everys single one of them.

TBD

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

Is a `boolean` telling you if you are authenticated at the client or not.

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

## getToken(): string

## getIdToken(): string

## getRefreshToken(): string

## getPayloadFromIdToken(encode = false): any

## setState(state: string): void

## getState(): string

## authorize(urlHandler?: (url: string) => any)

Code Flow with PCKE or Implicit Flow

## logoffAndRevokeTokens(urlHandler?: (url: string) => any)

The refresh token and and the access token are revoked on the server. If the refresh token does not exist only the access token is revoked. Then the logout run.

## logoff(urlHandler?: (url: string) => any)

Logs out on the server and the local client. If the server state has changed, checksession, then only a local logout.

## logoffLocal()

## revokeAccessToken(accessToken?: any)

https://tools.ietf.org/html/rfc7009
revokes an access token on the STS. This is only required in the code flow with refresh tokens. If no token is provided, then the token from the storage is revoked. You can pass any token to revoke. This makes it possible to manage your own tokens.

## revokeRefreshToken(refreshToken?: any)

https://tools.ietf.org/html/rfc7009
revokes a refresh token on the STS. This is only required in the code flow with refresh tokens.
If no token is provided, then the token from the storage is revoked. You can pass any token to revoke.
This makes it possible to manage your own tokens.

## getEndSessionUrl(): string | null
