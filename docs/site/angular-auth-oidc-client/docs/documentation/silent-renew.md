---
sidebar_label: Working with Silent Renew
sidebar_position: 12
---

# Working with Silent Renew

The tokens can be renewed in two ways:

1. Using silent renew with refresh tokens or
2. Using silent renew with iframes.

Both of these approaches are not perfect and bring some disadvantages. The security best practices for the renew process should be applied as much as possible. See the latest OAuth specs, drafts and recommendations for further information.

## Silent Renew Code Flow with PKCE using refresh tokens

For session renewal with the PKCE flow and `useRefreshToken: true`, no iframes are used. Instead, a refresh token is used to obtain a new access token from the auth server. Thus, only `useRefreshToken: true` and `silentRenew: true` need to be set in the configuration. Some servers require the `offline_access` scope for this to work which is defined in the OIDC specifications. Other servers do not require this. If the scope is missing, the library logs a warning, which you can suppress with [`disableRefreshTokenOfflineAccessScopeWarning`](./configuration#disablerefreshtokenofflineaccessscopewarning).

Refresh tokens should be rotated and the refresh token should be revoked on a logout using the revocation endpoint.

### Refresh tokens with multiple tabs

With rotating refresh tokens, two browser tabs refreshing at the same time can invalidate each other's refresh token. Set [`useRefreshTokenLock`](./configuration#userefreshtokenlock) to `true` to serialize the refreshes across tabs with the [Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API). Only one tab calls the token endpoint at a time, and a tab that waited reuses the tokens the other tab has stored. In browsers without `navigator.locks` the option has no effect.

```ts
provideAuth({
  config: {
    // ...
    silentRenew: true,
    useRefreshToken: true,
    useRefreshTokenLock: true,
  },
}),
```

## Silent Renew Code Flow with PKCE using refresh tokens and no id_token returned in the refresh

When an identity provider does not return an id_token in the refresh, the nonce cannot be validated in the id_token as it is not returned and needs to be deactivated. The following configuration should work for servers not returning an id_token in the refresh.

### Configuration

```ts
import { LogLevel } from 'angular-auth-oidc-client';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAuth({
      config: {
        authority: '--idp--',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: '--client_id--',
        scope: 'openid profile offline_access',
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        ignoreNonceAfterRefresh: true, // this is required if the id_token is not returned
        triggerRefreshWhenIdTokenExpired: false, // required when refreshing the browser if id_token is not updated after the first authentication
        // allowUnsafeReuseRefreshToken: true, // this is required if the refresh token is not rotated
        autoUserInfo: false, // if the user endpoint is not supported
        logLevel: LogLevel.Debug,
      },
    }),
  ],
};
```

### NgModule Configuration

```typescript
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';

@NgModule({
  imports: [
    AuthModule.forRoot({
      config: {
        authority: '--idp--',
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: '--client_id--',
        scope: 'openid profile offline_access',
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        ignoreNonceAfterRefresh: true, // this is required if the id_token is not returned
        triggerRefreshWhenIdTokenExpired: false, // required when refreshing the browser if id_token is not updated after the first authentication
        // allowUnsafeReuseRefreshToken: true, // this is required if the refresh token is not rotated
        autoUserInfo: false, // if the user endpoint is not supported
        logLevel: LogLevel.Debug,
      },
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
```

## Silent Renew (iframe)

When an iframe renew starts, the library listens on the application's host window for the `oidc-silent-renew-message` event. The event is a `CustomEvent` whose `detail` field contains `{ url, srcFrameId }`: the callback URL returned from the OAuth server (code flow) or its fragment (implicit flow), and the id of the iframe. A plain string in `detail` is still accepted for backward compatibility. The event handler sends the callback to the authorization callback handling and completes the validation.

Point the `silentRenewUrl` property to an HTML file which contains the following script element to enable authorization.

The `renewTimeBeforeTokenExpiresInSeconds` property can be used to start the renew process n-seconds before the tokens expired.

Every `tokenRefreshInSeconds` (default 4) the library checks whether the access token (if it has an expiry) or the id_token (only if `triggerRefreshWhenIdTokenExpired` is `true`) has expired, and if so starts a renew. A renew is only started if an id_token and user data are in the storage, and no other renew or code flow is running. This applies to iframes and refresh tokens alike.

Pushed authorization requests (`usePushedAuthorisationRequests`) cannot be combined with the iframe renew. Use refresh tokens instead.

### Silent Renew Code Flow with PKCE (iframe)

```javascript
<script>
window.onload = function () {
  /* The parent window hosts the Angular application */
  const parent = window.parent;
  
  /* Send the id_token information to the oidc message handler */
  const event = new CustomEvent('oidc-silent-renew-message', { 
    detail: {
      url: window.location,
      srcFrameId: window.frameElement?.id
    }
  });
  parent.dispatchEvent(event);
};
</script>
```

**Note:** When using multiple authentication configurations, each iframe is created with a unique identifier that includes the configId. The silent-renew.html script includes the iframe's id in the event as `srcFrameId`, allowing the library to extract the configId and correctly route the authentication response to the appropriate configuration.

If you are working with the [Angular CLI](https://angular.io/cli) make sure you add the `silent-renew.html` file to the assets configuration in your `angular.json`. This has already been done for you if you used the `ng add` schematics to install and setup the library.

```json
"assets": [
  "projects/<your-project-here>/src/silent-renew.html",
],
```

### Silent Renew Implicit Flow (iframe)

```javascript
<script>
window.onload = function () {
  /* The parent window hosts the Angular application */
  const parent = window.parent;
  
  /* Send the id_token information to the oidc message handler */
  const event = new CustomEvent('oidc-silent-renew-message', { 
    detail: {
      url: window.location.hash.substr(1),
      srcFrameId: window.frameElement?.id
    }
  });
  parent.dispatchEvent(event);
};
</script>
```

## Timeouts and errors

A renew is aborted after [`silentRenewTimeoutInSeconds`](./configuration#silentrenewtimeoutinseconds) (default 20). If a refresh token request fails because of a network error, it is retried every [`refreshTokenRetryInSeconds`](./configuration#refreshtokenretryinseconds) (default 3).

With refresh tokens, network errors and timeouts keep the current session. Any other error (e.g. `invalid_grant`) clears the local session and stops the periodic renew. With iframes, an error returned by the identity provider (e.g. `login_required`) clears the local session, publishes the auth state with `ValidationResult.LoginRequired` and stops the periodic renew.

Every failure fires the `SilentRenewFailed` [event](./public-events). If an iframe renew started with [`forceRefreshSession()`](./public-api) fails, the method returns `isAuthenticated: false` with the `error` of the identity provider in `errorMessage` and, if one was sent, its `error_description` in `errorDescription`. With refresh tokens, a failed `forceRefreshSession()` errors the returned observable.

## Security Token Service CSP and CORS

`checkAuth()` only reads the stored tokens. Use `checkAuthIncludingServer()` to also try a silent renew when the user is not authenticated locally.
This allows the application to authorize a user, that is already authenticated on the Security Token Service, without performing redirects.

Silent renew requires CSP configuration on the server to allow iframes and also CORS.
