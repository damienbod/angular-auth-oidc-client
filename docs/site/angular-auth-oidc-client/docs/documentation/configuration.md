---
sidebar_label: Configuration
sidebar_position: 2
---

# Configuration

Prior to using the library, you must configure it with the appropriate values for your environment. You can either configure the application statically, by providing the configuration values at design-time, or you can fetch the configuration from an HTTP endpoint. Configurations loaded from an HTTP endpoint must be mapped to the format the library expects.

## Configure with static config

You can pass the static config with the `config` property into the `forRoot()` method like this

```ts
import { NgModule } from '@Angular/core';
import { AuthModule } from 'Angular-auth-oidc-client';

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

## Load config from HTTP

If you want to load the config from HTTP and then map it to the interface the library provides you can use the `StsConfigHttpLoader` and pass it with the `loader` property

```ts
import { AuthModule, StsConfigHttpLoader, StsConfigLoader } from 'Angular-auth-oidc-client';

export const httpLoaderFactory = (httpClient: HttpClient) => {
  const config$ = httpClient
    .get<any>(`https://...`)
    .pipe(
      map((customConfig: any) => {
        return {
          stsServer: customConfig.stsServer,
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

## Config Values

### `configId`

- Type: string
- Required: false

To identify a configuration, a new parameter called `configId` was introduced. If you do not explicitly set this value, the library will generate and assign the value for you. If set, the configured value is used. The value is optional.

### `stsServer`

- Type: string
- Required: true

This is the `redirect_url` which was configured on the security token service (STS) server.

### `authWellknownEndpointUrl`

- Type: string
- Required: false

A different well known endpoint can be defined instead of the used STS domain, with the standard postfix.

### `authWellknownEndpoints`

- Type: object
- Required: false

TBD

### `redirectUrl`

- Type: string
- Required: false

This is the `redirect_url` which was configured on the security token service (STS)

### `clientId`

- Type: string
- Required: false

The client **MUST** validate that the `aud` (audience) claim contains its `client_id` value registered at the Issuer identified by the `iss` (issuer) claim as an audience. The id token **MUST** be rejected if the id token does not list the Client as a valid audience, or if it contains additional audiences not trusted by the Client.

### `responseType`

- Type: string
- Required: false

The name of the flow which to be configured. Valid options are `code`, `id_token token`, or `id_token`. <br/>
If you want to access an API or get user data from the server, the `access_token` value returned by the `id_token` flow is required. You must use the `id_token` flow.

### `scope`

- Type: string
- Required: false

This contains the scopes that are requested from the server for this client, defined as a space-delimited list. This **MUST** match the STS server configuration.

### `hdParam`

- Type: string
- Required: false

An optional hd parameter for Google Auth, specifically for the G Suite domain, see https://developers.google.com/identity/protocols/OpenIDConnect#hd-param

### `postLogoutRedirectUri`

- Type: string
- Required: false

If you are using the end session API, this is the URL to redirect the client to after a server logout.

### `startCheckSession`

- Type: boolean
- Required: false

Starts the OpenID session management for this client.

### `silentRenew`

- Type: boolean
- Required: false

Indicates that the library should renew the client's tokens after the `token_id` expires. It can be configured to use iframes or refresh tokens.

### `silentRenewUrl`

- Type: string
- Required: false

If you are using the silent renew process and set this parameter, the supplied URL will be used for lightweight silent renew callbacks. See [Silent Renew](silent-renew.md).

### `silentRenewTimeoutInSeconds`

- Type: number
- Required: false

Sets the maximum wait time for the silent renew process. If this time is exceeded, the silent renew state will be reset. Default = *20*

### `renewTimeBeforeTokenExpiresInSeconds`

- Type: number
- Required: false

Makes it possible to add an offset to the silent renew check in seconds. By entering a value, you can renew the tokens before they expire.

### `useRefreshToken`

- Type: boolean
- Required: false

If set to true, refresh tokens will be used for the silent renew process instead of the default iframes. <br/>
Default = *false*

### `ignoreNonceAfterRefresh`

- Type: boolean
- Required: false

A token obtained by using a refresh token normally doesn't contain a nonce value. The library checks it is not there. However some oidc endpoint implementations do send one. Setting `ignoreNonceAfterRefresh` to true disables the check if a nonce is present. Please note that the nonce value, if present, will not be verified. Default is false.

### `postLoginRoute`

- Type: string
- Required: false

The default Angular route to use after a successful login, if not using the `triggerAuthorizationResultEvent`.

### `forbiddenRoute`

- Type: string
- Required: false

The Angular route to redirect the client to when the server returns an HTTP 403 response.

### `unauthorizedRoute`

- Type: string
- Required: false

The Angular route to redirect the client to when the server returns an HTTP 401 response.

### `autoUserInfo`

- Type: boolean
- Required: false

Denote if the library should automatically get user info after authentication.

### `renewUserInfoAfterTokenRenew`

- Type: boolean
- Required: false

Denotes if the library should automatically get user info after token renew.

### `autoCleanStateAfterAuthentication`

- Type: boolean
- Required: false

Denotes if the state should be reset after authentication. When set to false, the state is not automatically reset. This can be used for custom state logic handling.

### `triggerAuthorizationResultEvent`

- Type: boolean
- Required: false

This can be set to `true` which emits an event instead of an Angular route change. Instead of forcing the application consuming this library to automatically redirect to one of the 3 hard-configured routes (start, unauthorized, forbidden), this parameter will add an extra configuration option to override such behavior and trigger an event that will allow you to subscribe to it and let the application perform other actions. One useful application of this event is allowing the application to save an initial return url so that the user is redirected to it after a successful login on the STS (i.e., saving the return url in `sessionStorage` and then retrieving when the event is triggered).

### `logLevel`

- Type: `LogLevel`
- Required: false

Sets the log level displayed in the console.

### `issValidationOff`

- Type: boolean
- Required: false

Makes it possible to turn the `iss` validation off per configuration. **You should not turn this off!**

### `historyCleanupOff`

- Type: boolean
- Required: false

If this is active, the history is not cleaned up during an authorize callback. This can be used when the application needs to preserve the history.

### `maxIdTokenIatOffsetAllowedInSeconds`

- Type: number
- Required: false

The amount of offset allowed between the server creating the token, and the client app receiving the id_token. The diff in time between the server time and client time is also important in validating this value. All times are in UTC.

### `disableIatOffsetValidation`

- Type: boolean
- Required: false

This allows the application to disable the `iat` offset validation check. The `iat` Claim can be used to reject tokens that were issued too far away from the current time, limiting the amount of time that nonces need to be stored to prevent attacks. The acceptable range is client specific.

### `customParamsAuthRequest`

- Type: Object
- Required: false

Extra parameters that can be added to the authorization URL request.

### `customParamsRefreshTokenRequest`

- Type: Object
- Required: false

Extra parameters that can be added to the refresh token request body.

### `customParamsEndSessionRequest`

- Type: Object
- Required: false

Extra parameters that can be added to the end session request body.

### `customParamsCodeRequest`

- Type: Object
- Required: false

Extra parameters that can be added to the token URL request.

### `disableRefreshIdTokenAuthTimeValidation`

- Type: boolean
- Required: false

Disables the `auth_time` validation for `id_tokens` in a refresh due to Microsoft Azure's incorrect implementation.

### `enableIdTokenExpiredValidationInRenew`

- Type: boolean
- Required: false

Enables the `id_token` validation. You can disable this validation if you would like to ignore expired values during the renew process. If no `id_token` is returned while using refresh tokens, set this to false. <br/>
Default = *true*

### `eagerLoadAuthWellKnownEndpoints`

- Type: boolean
- Required: false

Denotes whether `AuthWellKnownEndpoints` should be loaded on start or when the user calls the `authorize` method.

### `tokenRefreshInSeconds`

- Type: number
- Required: false

Controls the periodic check time interval in seconds. <br/>
Default = *3*

### `secureRoutes`

- Type: `string[]`
- Required: false

An array of secure urls to which the token should be sent if the interceptor is added to the `HTTP_INTERCEPTORS`. <br/>
See [Http Interceptor](./using-access-tokens.md/#http-interceptor)

### `usePushedAuthorisationRequests`

- Type: boolean
- Required: false

Activates Pushed Authorisation Requests (PAR) for login and popup login. <br/> 
(iframe renew is not supported)

### `refreshTokenRetryInSeconds`

- Type: number
- Required: false

Controls the periodic retry time interval for retrieving new tokens in seconds. <br/>
Default = *3*. <br/>
`silentRenewTimeoutInSeconds` and `tokenRefreshInSeconds` are the upper bounds for this value.

### `ngswBypass`

- Type: boolean
- Required: false

Adds the `ngsw-bypass` param to all requests ([Angular Documentation](https://Angular.io/guide/service-worker-devops#bypassing-the-service-worker)).
