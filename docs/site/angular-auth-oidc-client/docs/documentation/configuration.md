---
sidebar_label: Configuration
sidebar_position: 2
---

# Configuration

Prior to using the library, you must configure it with the appropriate values for your environment. You can either configure the application statically, by providing the configuration values at design-time, or you can fetch the configuration from an HTTP endpoint. Configurations loaded from an HTTP endpoint must be mapped to the format the library expects.

## Configure with static config

You can pass the static config with the `config` property into the `forRoot()` method like this

```ts
import { NgModule } from '@angular/core';
import { AuthModule } from 'angular-auth-oidc-client';

@NgModule({
  imports: [
    AuthModule.forRoot({
      config: {
        /* Your config here */
      },
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
```

### Using multiple configs

You can pass an array of configs into the `forRoot()` method. Each config will get an `configId` automatically if you do not set it for yourself.

```ts
@NgModule({
  imports: [
    AuthModule.forRoot({
      config: [
        {
          // config1...
        },
        {
          // config2...
        },
        {
          // config3...
        },
        //...
      ],
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
```

## Load config from HTTP

If you want to load the config from HTTP and then map it to the interface the library provides you can use the `StsConfigHttpLoader` and pass it with the `loader` property

```ts
import { AuthModule, StsConfigHttpLoader, StsConfigLoader } from 'angular-auth-oidc-client';

export const httpLoaderFactory = (httpClient: HttpClient) => {
  const config$ = httpClient
    .get<any>(`https://...`)
    .pipe(
      map((customConfig: any) => {
        return {
          authority: customConfig.authority,
          /* Your config mapping here */
        };
      })
    )
    .toPromise();

  return new StsConfigHttpLoader(config$);
};

@NgModule({
  imports: [
    AuthModule.forRoot({
      loader: {
        provide: StsConfigLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
```

### Using multiple http configs

Also the http loader supports multiple configs.

```ts
import { AuthModule, StsConfigHttpLoader, StsConfigLoader } from 'angular-auth-oidc-client';

export const httpLoaderFactory = (httpClient: HttpClient) => {
  const config1$ = httpClient
    .get<any>(`https://...`)
    .pipe(
      map((customConfig: any) => {
        return {
          authority: customConfig.authority,
          /* Your config mapping here */
        };
      })
    )
    .toPromise();

  const config2$ = httpClient
    .get<any>(`https://...`)
    .pipe(
      map((customConfig: any) => {
        return {
          authority: customConfig.authority,
          /* Your config mapping here */
        };
      })
    )
    .toPromise();

  return new StsConfigHttpLoader([config1$, config2$]);
};

@NgModule({
  imports: [
    AuthModule.forRoot({
      loader: {
        provide: StsConfigLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
```

## Config Values

### `configId`

- Type: string
- Required: false

To identify a configuration a new parameter called `configId` was introduced. If you do not explicitly set this value, the library will generate and assign the value for you. If set, the configured value is used. The value is optional.

### `authority`

- Type: string
- Required: true

This is the authority or the secure token server (URL). This must be set.

### `authWellknownEndpointUrl`

- Type: string
- Required: false

A different well known endpoint can be defined instead of the authority domain, with the standard well known endpoints postfix. This is only required if the well known endpoint URL is not implemented in a standard way on the secure token service.

### `authWellknownEndpoints`

- Type: object
- Required: false

TBD

### `redirectUrl`

- Type: string
- Required: false

This is the redirect_url which was configured on the security token service (STS)

### `clientId`

- Type: string
- Required: false

The client MUST validate that the aud (audience) claim contains its client_id value registered at the Issuer identified by the iss (issuer) Claim as an audience. The id token MUST be rejected if the id token does not list the Client as a valid audience, or if it contains additional audiences not trusted by the Client.

### `responseType`

- Type: string
- Required: false

'code', 'id_token token' or 'id_token' Name of the flow which can be configured. <br/> You must use the 'id_token token' flow, if you want to access an API or get user data from the server. <br/> The `access_token` is required for this, and only returned with this flow.

### `scope`

- Type: string
- Required: false

This is this scopes which are requested from the server from this client. This must match the secure token server configuration for the client you use.

### `hdParam`

- Type: string
- Required: false

Optional hd parameter for Google Auth with particular G Suite domain, see https://developers.google.com/identity/protocols/OpenIDConnect#hd-param

### `postLogoutRedirectUri`

- Type: string
- Required: false

URL after a server logout if using the end session API.

### `startCheckSession`

- Type: boolean
- Required: false

Starts the OpenID session management for this client.

### `silentRenew`

- Type: boolean
- Required: false

Renews the client tokens, once the token_id expires. Can use the iframes, or the refresh tokens.

### `silentRenewUrl`

- Type: string
- Required: false

URL which can be used for a lightweight renew callback. See silent renew.

### `silentRenewTimeoutInSeconds`

- Type: number
- Required: false

Sets the maximum waiting time for silent renew process. If this time is exceeded, the silent renew state will be reset. Default = <em>20</em>

### `renewTimeBeforeTokenExpiresInSeconds`

- Type: number
- Required: false

Makes it possible to add an offset to the silent renew check in seconds. By entering a value, you can renew the tokens, before the tokens expire.

### `useRefreshToken`

- Type: boolean
- Required: false

Default set to false. Standard silent renew mode used per default. Refresh tokens can be activated.

### `ignoreNonceAfterRefresh`

- Type: boolean
- Required: false

A token obtained by using a refresh token normally doesn't contain a nonce value. The library checks it is not there. However some oidc endpoint implementations do send one. Setting ignoreNonceAfterRefresh to true disables the check if a nonce is present. Please note that the nonce value, if present, will not be verified. Default is false.

### `postLoginRoute`

- Type: string
- Required: false

The default Angular route which is used after a successful login, if not using the `triggerAuthorizationResultEvent`.

### `forbiddenRoute`

- Type: string
- Required: false

Route, if the server returns a 403. This is an Angular route. HTTP 403.

### `unauthorizedRoute`

- Type: string
- Required: false

Route, if the server returns a 401. This is an Angular route. HTTP 401.

### `autoUserInfo`

- Type: boolean
- Required: false

Automatically get user info after authentication.

### `renewUserInfoAfterTokenRenew`

- Type: boolean
- Required: false

Automatically get user info after token renew.

### `autoCleanStateAfterAuthentication`

- Type: boolean
- Required: false

Can be used for custom state logic handling, the state is not automatically reset, when set to false.

### `triggerAuthorizationResultEvent`

- Type: boolean
- Required: false

This can be set to `true` which emits an event instead of an angular route change. Instead of forcing the application consuming this library to automatically redirect to one of the 3 hard-configured routes (start, unauthorized, forbidden), this modification will add an extra configuration option to override such behavior and trigger an event that will allow to subscribe to it and let the application perform other actions. This would be useful to allow the application to save an initial return url so that the user is redirected to it after a successful login on the secure token server (ie: saving the return url previously on sessionStorage and then retrieving it during the triggering of the event).

### `logLevel`

- Type: `LogLevel`
- Required: false

Can be used to set the log level displayed in the console.

### `issValidationOff`

- Type: boolean
- Required: false

Make it possible to turn the iss validation off per configuration. You should not turn this off!

### `historyCleanupOff`

- Type: boolean
- Required: false

If this is active, the history is not cleaned up at an authorize callback. This can be used, when the application needs to preserve the history.

### `maxIdTokenIatOffsetAllowedInSeconds`

- Type: number
- Required: false

Amount of offset allowed between the server creating the token, and the client app receiving the id_token. The diff in time between the server time and client time is also important in validating this value. All times are in UTC.

### `disableIatOffsetValidation`

- Type: boolean
- Required: false

This allows the application to disable the iat offset validation check. The iat Claim can be used to reject tokens that were issued too far away from the current time, limiting the amount of time that nonces need to be stored to prevent attacks.The acceptable range is client specific.

### `customParamsAuthRequest`

- Type: Object
- Required: false

Extra parameters can be added to the authorization URL request.

### `customParamsRefreshTokenRequest`

- Type: Object
- Required: false

Extra parameters to add to the refresh token request body.

### `customParamsEndSessionRequest`

- Type: Object
- Required: false

Extra parameters to add to the end session request body.

### `customParamsCodeRequest`

- Type: Object
- Required: false

Extra parameters can be added to the token URL request.

### `disableRefreshIdTokenAuthTimeValidation`

- Type: boolean
- Required: false

disables the auth_time validation for id_tokens in a refresh due to Azure incorrect implementation

### `enableIdTokenExpiredValidationInRenew`

- Type: boolean
- Required: false

enables the id_token validation, default value is true. You can disable this validation if you would like to ignore the expired value in the renew process. If no id_token is returned in using refresh tokens, set this to false.

### `eagerLoadAuthWellKnownEndpoints`

- Type: boolean
- Required: false

Tells if the AuthWellKnownEndpoints should be loaded on start or when the user calls the `authorize` method

### `tokenRefreshInSeconds`

- Type: number
- Required: false

Controls the periodic check time interval in seconds, default = 3

### `secureRoutes`

- Type: `string[]`
- Required: false

Array of secure urls on which the token should be send if the interceptor is added to the HTTP_INTERCEPTORS see [Http Interceptor](./using-access-tokens.md/#http-interceptor)

### `usePushedAuthorisationRequests`

- Type: boolean
- Required: false

activates Pushed Authorisation Requests for login and popup login (Iframe renew not supported)

### `refreshTokenRetryInSeconds`

- Type: number
- Required: false

Controls the periodic retry time interval for retrieving new tokens in seconds, default = 3. `silentRenewTimeoutInSeconds` and `tokenRefreshInSeconds` are upper bounds for this value.

### `ngswBypass`

- Type: boolean
- Required: false

Adds the `ngsw-bypass` param to all requests ([Angular Docu](https://angular.io/guide/service-worker-devops#bypassing-the-service-worker)).
