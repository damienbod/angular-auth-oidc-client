# Public API

TBD

```
   this.configuration = this.oidcSecurityService.configuration;
        this.userData$ = this.oidcSecurityService.userData$;
        this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
        this.isModuleSetUp$ = this.oidcSecurityService.moduleSetup$;
```

## get configuration()

## get userData\$()

## get isAuthenticated\$()

## get checkSessionChanged\$()

## get moduleSetup\$()

## get stsCallback\$()

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
