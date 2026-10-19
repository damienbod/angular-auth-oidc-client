---
sidebar_label: Configuration
sidebar_collapsed: false
sidebar_position: 2
---

# Configuration

Prior to using the library, you must configure it with the appropriate values for your environment. You can either configure the application statically, by providing the configuration values at design-time, or you can fetch the configuration from an HTTP endpoint. Configurations loaded from an HTTP endpoint must be mapped to the format the library expects.

## Configure with static config

You can pass the static config with the `config` property using the `provideAuth` function.

```ts
import { ApplicationConfig } from '@angular/core';
import { provideAuth } from 'angular-auth-oidc-client';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAuth({
      config: {
        /* Your config here */
      },
    }),
  ],
};
```

### Using multiple configs

You can pass an array of configs into the `provideAuth()` method. Each config will get a `configId` automatically if you do not set it for yourself.

```ts
import { ApplicationConfig } from '@angular/core';
import { provideAuth } from 'angular-auth-oidc-client';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAuth({
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
};
```

### Getting static config from a service (sync)

You can also get the static config from a service. In this case you can use the `StsConfigStaticLoader` passing the config in the constructor.

```ts
import { ApplicationConfig, Injectable } from '@angular/core';
import { OpenIdConfiguration, provideAuth, StsConfigLoader, StsConfigStaticLoader } from 'angular-auth-oidc-client';

@Injectable({ providedIn: 'root' })
export class ConfigService {
  getConfig(): OpenIdConfiguration {
    return {
      /* Your config here */
    };
  }
}

const authFactory = (configService: ConfigService) => {
  const config = configService.getConfig();
  return new StsConfigStaticLoader(config);
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideAuth({
      loader: {
        provide: StsConfigLoader,
        useFactory: authFactory,
        deps: [ConfigService],
      },
    }),
  ],
};
```

## Load config from HTTP (async)

If you want to load the config from HTTP and then map it to the interface the library provides you can use the `StsConfigHttpLoader` and pass it with the `loader` property. `StsConfigHttpLoader` accepts an `Observable<OpenIdConfiguration>`, an array of them, or an `Observable<OpenIdConfiguration[]>`.

`provideAuth` does not provide the `HttpClient`, so add `provideHttpClient()` to your providers.

```ts
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAuth, StsConfigHttpLoader, StsConfigLoader } from 'angular-auth-oidc-client';
import { map } from 'rxjs';

export const httpLoaderFactory = (httpClient: HttpClient) => {
  const config$ = httpClient.get<any>(`https://...`).pipe(
    map((customConfig: any) => {
      return {
        authority: customConfig.authority,
        /* Your config mapping here */
      };
    })
  );

  return new StsConfigHttpLoader(config$);
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideAuth({
      loader: {
        provide: StsConfigLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
};
```

### Using multiple HTTP configs

The HTTP loader also supports multiple configs.

```ts
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAuth, StsConfigHttpLoader, StsConfigLoader } from 'angular-auth-oidc-client';
import { map } from 'rxjs';

export const httpLoaderFactory = (httpClient: HttpClient) => {
  const config1$ = httpClient.get<any>(`https://...`).pipe(
    map((customConfig: any) => {
      return {
        authority: customConfig.authority,
        /* Your config mapping here */
      };
    })
  );

  const config2$ = httpClient.get<any>(`https://...`).pipe(
    map((customConfig: any) => {
      return {
        authority: customConfig.authority,
        /* Your config mapping here */
      };
    })
  );

  return new StsConfigHttpLoader([config1$, config2$]);
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideAuth({
      loader: {
        provide: StsConfigLoader,
        useFactory: httpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
};
```

### Using localstorage instead of default sessionstorage

The angular-auth-oidc-client uses session storage by default that gets cleared whenever you open the website in a new tab, if you want to change it to local storage then need to provide a different `AbstractSecurityStorage`.

```ts
import { ApplicationConfig } from '@angular/core';
import { provideAuth, DefaultLocalStorageService, AbstractSecurityStorage } from 'angular-auth-oidc-client';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAuth({
      config: {
        /* Your config here */
      },
    }),
    {
      provide: AbstractSecurityStorage,
      useClass: DefaultLocalStorageService,
    },
  ],
};
```

## OAuth Callbacks during Initialization

Additionally, you can use the feature function `withAppInitializerAuthCheck` to handle OAuth callbacks during app initialization phase. This replaces the need to manually call `OidcSecurityService.checkAuth(...)` or `OidcSecurityService.checkAuthMultiple(...)`.

```ts
import { ApplicationConfig } from '@angular/core';
import { provideAuth, withAppInitializerAuthCheck } from 'angular-auth-oidc-client';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAuth(
      {
        config: {
          /* Your config here */
        },
      },
      withAppInitializerAuthCheck()
    ),
  ],
};
```

If you prefer to manually check OAuth callback state, you can omit `withAppInitializerAuthCheck`. However, you then need to call `OidcSecurityService.checkAuth(...)` or `OidcSecurityService.checkAuthMultiple(...)` manually in your `app.component.ts` (or a similar code path that is called early in your app).

```ts
@Component()
export class AppComponent implements OnInit {
  private readonly oidcSecurityService = inject(OidcSecurityService);

  ngOnInit(): void {
    this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated, accessToken }) => {
      console.log('app authenticated', isAuthenticated);
      console.log(`Current access token is '${accessToken}'`);
    });
  }
}
```

## Configure with NgModule

To configure the auth module by using `NgModule`, you can use the `AuthModule.forRoot()` method

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

`AuthModule.forRoot()` does not accept feature functions, so `withAppInitializerAuthCheck` is not available here. Call `OidcSecurityService.checkAuth(...)` or `OidcSecurityService.checkAuthMultiple(...)` yourself.

Always wrap your configuration in the `config` property (`{ config: { ... } }` or `{ config: [ ... ] }`). Passing the configuration object directly causes a config validation error.

## Config validation

When the configuration is loaded, the library validates it. Errors reject the configuration (it is not set and an error is logged), warnings are only logged.

Errors:

- `authority` is missing.
- `clientId` is missing.
- `redirectUrl` is missing.
- `silentRenew` is `true`, `useRefreshToken` is not `true` and no `silentRenewUrl` is set.
- An entry in the config array is empty (for example the `config` wrapper is missing).

Warnings:

- `useRefreshToken` and `silentRenew` are enabled but the `scope` does not contain `offline_access` (can be suppressed with `disableRefreshTokenOfflineAccessScopeWarning`).
- Two configurations share the same `authority`, `clientId` and `scope`.

When the application is not running in a browser (for example during SSR), `startCheckSession`, `silentRenew`, `useRefreshToken` and `usePushedAuthorisationRequests` are set to `false`.

## Supported id_token signing algorithms

The id_token signature is validated with the keys from the `jwks_uri` using WebCrypto. Supported `alg` values are `RS256`, `RS384`, `RS512`, `ES256`, `ES384`, `EdDSA` and its fully-specified form `Ed25519` (RFC 9864), both for keys with `kty` `OKP` and `crv` `Ed25519`. EdDSA requires a browser that supports Ed25519 in WebCrypto (Chrome/Edge 137+, Firefox 129+, Safari 17+); in other browsers the signature validation fails and a warning is logged.

## Config Values

### `configId`

- Type: `string`
- Required: `false`

In multi-configuration use-cases, each configuration must be assigned a unique `configId`. By default, the library will generate and assign a unique `configId` to each provided configuration. You can override the library's default `configId` generation by providing a unique `configId` for each configuration entry. The generated `configId` has the format `${index}-${clientId}`, for example `0-my-client`.

### `authority`

- Type: `string`
- Required: `true`

This is the url to the Security Token Service (STS). The authority issues tokens.

### `authWellknownEndpointUrl`

- Type: `string`
- Required: `false`

A different well-known endpoint can be defined instead of the authority domain with the standard well-known endpoints postfix. This is only required if the well-known endpoint URL is not implemented in a standard way on the Security Token Service (STS). Defaults to the `authority`. The `authWellknownUrlSuffix` is appended unless the URL already contains it.

### `authWellknownEndpoints`

- Type: `object`
- Required: `false`

Endpoint URLs that override the corresponding values from the discovery document. The discovery document is still loaded, but any endpoint set here takes precedence.

### `authWellknownUrlSuffix`

- Type: `string`
- Required: `false`
- Default: `/.well-known/openid-configuration`

Override the default Security Token Service well-known endpoint postfix.

### `redirectUrl`

- Type: `string`
- Required: `true`

This is the `redirect_url` which was configured on the Security Token Service (STS).

### `checkRedirectUrlWhenCheckingIfIsCallback`

- Type: `boolean`
- Required: `false`

Whether to check if current URL matches the redirect URI when determining if current URL is in fact the redirect URI.

Default = _true_

### `clientId`

- Type: `string`
- Required: `true`

The client **MUST** validate that the `aud` (audience) claim contains its `client_id` value registered at the Issuer identified by the `iss` (issuer) claim as an audience. The id token **MUST** be rejected if the id token does not list the Client as a valid audience, or if it contains additional audiences not trusted by the Client.

### `responseType`

- Type: `string`
- Required: `false`

The name of the flow which to be configured. Valid options are `code`, `id_token token`, or `id_token`. <br/>
Use `code` (Authorization Code Flow with PKCE), which is the recommended flow. The implicit flows (`id_token token` and `id_token`) are legacy; only `id_token token` returns an `access_token`, the `id_token` flow does not. <br/>
Default = _code_

### `scope`

- Type: `string`
- Required: `false`

This contains the scopes that are requested from the server for this client, defined as a space-delimited list. This **MUST** match the STS server configuration. <br/>
Default = _openid email profile_

### `hdParam`

- Type: `string`
- Required: `false`

An optional hd parameter for Google Auth, specifically for the G Suite domain, see https://developers.google.com/identity/protocols/OpenIDConnect#hd-param <br/>
Default = _''_

### `postLogoutRedirectUri`

- Type: `string`
- Required: `false`

If you are using the end session API, this is the URL to redirect the client to after a server logout.

### `startCheckSession`

- Type: `boolean`
- Required: `false`

Starts the OpenID session management for this client. <br/>
Default = _false_

### `silentRenew`

- Type: `boolean`
- Required: `false`

Enables the automatic renewal of the tokens when the `id_token` or `access_token` expires. The tokens are checked every `tokenRefreshInSeconds`. The renewal uses an iframe or, with `useRefreshToken`, refresh tokens. <br/>
Default = _false_

### `silentRenewUrl`

- Type: `string`
- Required: `false`

If you are using the silent renew process and set this parameter, the supplied URL will be used for lightweight silent renew callbacks. Required when `silentRenew` is `true` and `useRefreshToken` is `false` (iframe renew), otherwise the configuration is rejected. See [Silent Renew](silent-renew.md).

### `silentRenewTimeoutInSeconds`

- Type: `number`
- Required: `false`

Sets the maximum wait time for the silent renew process. If this time is exceeded, the silent renew state will be reset. Default = _20_

### `renewTimeBeforeTokenExpiresInSeconds`

- Type: `number`
- Required: `false`

Makes it possible to add an offset to the silent renew check in seconds. By entering a value, you can renew the tokens before they expire. <br/>
Default = _0_

### `useRefreshToken`

- Type: `boolean`
- Required: `false`

If set to true, refresh tokens will be used for the silent renew process instead of the default iframes. <br/>
Default = _false_

### `useRefreshTokenLock`

- Type: `boolean`
- Required: `false`

If set to true, refresh token requests are serialized across browser tabs using the [Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API), so only one tab refreshes at a time while the others reuse the result. Only has an effect together with `useRefreshToken`. If the browser does not support the Web Locks API, the refresh runs without a lock. <br/>
Default = _false_

### `disableRefreshTokenOfflineAccessScopeWarning`

- Type: `boolean`
- Required: `false`

Suppresses the config validation warning that recommends the `offline_access` scope when `useRefreshToken` and `silentRenew` are both enabled. Use this if your provider issues refresh tokens without the `offline_access` scope. <br/>
Default = _false_

### `ignoreNonceAfterRefresh`

- Type: `boolean`
- Required: `false`

A token obtained by using a refresh token normally doesn't contain a nonce value. The library checks it is not there. However some oidc endpoint implementations do send one. Setting `ignoreNonceAfterRefresh` to true disables the check if a nonce is present. Please note that the nonce value, if present, will not be verified. Default is false.

### `postLoginRoute`

- Type: `string`
- Required: `false`

The default Angular route to use after a successful login, if not using the `triggerAuthorizationResultEvent`. Not used for silent renew. <br/>
Default = _/_

### `forbiddenRoute`

- Type: `string`
- Required: `false`

Currently not used by the library. The library does not navigate to this route. <br/>
Default = _/forbidden_

### `unauthorizedRoute`

- Type: `string`
- Required: `false`

The Angular route the library navigates to when processing the authorization callback (code or implicit flow) fails, for example when the token validation or the token request fails. It is not used for silent renew or when `triggerAuthorizationResultEvent` is `true`. <br/>
Default = _/unauthorized_

### `autoUserInfo`

- Type: `boolean`
- Required: `false`

Denote if the library should automatically get user info after authentication. <br/>
Default = _true_

### `renewUserInfoAfterTokenRenew`

- Type: `boolean`
- Required: `false`

Denotes if the library should automatically get user info after token renew. <br/>
Default = _false_

### `autoCleanStateAfterAuthentication`

- Type: `boolean`
- Required: `false`

Denotes if the state should be reset after authentication. When set to false, the state is not automatically reset. This can be used for custom state logic handling. <br/>
Default = _true_

### `triggerAuthorizationResultEvent`

- Type: `boolean`
- Required: `false`

This can be set to `true` which emits an event instead of an Angular route change. Instead of forcing the application consuming this library to automatically redirect to one of the 3 hard-configured routes (start, unauthorized, forbidden), this parameter will add an extra configuration option to override such behavior and trigger an event that will allow you to subscribe to it and let the application perform other actions. One useful application of this event is allowing the application to save an initial return url so that the user is redirected to it after a successful login on the STS (i.e., saving the return url in `sessionStorage` and then retrieving when the event is triggered). <br/>
Default = _false_

### `logLevel`

- Type: `LogLevel`
- Required: `false`

Sets the log level displayed in the console. Possible values are `LogLevel.None`, `LogLevel.Debug`, `LogLevel.Warn` and `LogLevel.Error`. Messages with the configured level or a higher one are logged, `LogLevel.None` disables all logging. <br/>
Default = _LogLevel.Warn_

### `issValidationOff`

- Type: `boolean`
- Required: `false`

Makes it possible to turn the `iss` validation off per configuration. **You should not turn this off!** <br/>
Default = _false_

### `strictIssuerValidationOnWellKnownRetrievalOff`

- Type: `boolean`
- Required: `false`

By default, the library rejects the discovery document unless its `issuer` equals the configured `authWellknownEndpointUrl` or `authority` (without the `/.well-known/openid-configuration` suffix, a trailing slash is ignored). On a mismatch, an `Issuer mismatch` error is logged and the `ConfigLoadingFailed` event is fired. Set this to `true` to skip the check, for example for providers whose issuer differs from the authority. <br/>
Default = _false_

### `historyCleanupOff`

- Type: `boolean`
- Required: `false`

If this is active, the history is not cleaned up during an authorize callback. This can be used when the application needs to preserve the history. <br/>
Default = _false_

### `maxIdTokenIatOffsetAllowedInSeconds`

- Type: `number`
- Required: `false`

The amount of offset allowed between the server creating the token, and the client app receiving the id_token. The diff in time between the server time and client time is also important in validating this value. All times are in UTC. <br/>
Default = _120_

### `disableIatOffsetValidation`

- Type: `boolean`
- Required: `false`

This allows the application to disable the `iat` offset validation check. The `iat` Claim can be used to reject tokens that were issued too far away from the current time, limiting the amount of time that nonces need to be stored to prevent attacks. The acceptable range is client specific. <br/>
Default = _false_

### `customParamsAuthRequest`

- Type: `Object`
- Required: `false`

Extra parameters that can be added to the authorization URL request. <br/>
Default = _{}_

### `customParamsRefreshTokenRequest`

- Type: `Object`
- Required: `false`

Extra parameters that can be added to the refresh token request body. <br/>
Default = _{}_

### `customParamsEndSessionRequest`

- Type: `Object`
- Required: `false`

Extra query parameters that are added to the end session (logout) URL. Parameters passed to `logoff()` override them. <br/>
Default = _{}_

### `customParamsCodeRequest`

- Type: `Object`
- Required: `false`

Extra parameters that are added to the body of the token request which exchanges the authorization code for tokens. <br/>
Default = _{}_

### `disableRefreshIdTokenAuthTimeValidation`

- Type: `boolean`
- Required: `false`

Disables the `auth_time` validation for `id_tokens` in a refresh due to Microsoft Azure's incorrect implementation. <br/>
Default = _false_

### `triggerRefreshWhenIdTokenExpired`

- Type: `boolean`
- Required: `false`

Enables the `id_token` expiry check in the renew process. You can disable this validation if you would like to ignore expired values during the renew process or after the first renew in the expiry check. With this disabled, a renew process will only be triggered when the access token expires. If no `id_token` is returned while using refresh tokens, set this to false. <br/>
Default = _true_

### `tokenRefreshInSeconds`

- Type: `number`
- Required: `false`

Controls the periodic check time interval in seconds. <br/>
Default = _4_

### `secureRoutes`

- Type: `string[]`
- Required: `false`

An array of secure urls to which the access token is sent by the `AuthInterceptor` (`HTTP_INTERCEPTORS`) or the functional `authInterceptor()` (`withInterceptors`). A request matches if its URL starts with an entry or matches a wildcard (`*`) entry. <br/>
See [Http Interceptor](interceptors.md)

### `usePushedAuthorisationRequests`

- Type: `boolean`
- Required: `false`

Activates Pushed Authorisation Requests (PAR) for login and popup login. The discovery document must contain a `pushed_authorization_request_endpoint`. <br/>
(iframe renew is not supported) <br/>
Default = _false_

### `refreshTokenRetryInSeconds`

- Type: `number`
- Required: `false`

The delay in seconds before the token request (code exchange or refresh) is retried when it fails because of a network error (no internet connection). Other errors are not retried. <br/>
Default = _3_. <br/>
Keep this value below `silentRenewTimeoutInSeconds`.

### `ngswBypass`

- Type: `boolean`
- Required: `false`

Adds the `ngsw-bypass` param to all requests ([Angular Documentation](https://angular.dev/ecosystem/service-workers/devops#bypassing-the-service-worker)). <br/>
Default = _false_

### `allowUnsafeReuseRefreshToken`

- Type: `boolean`
- Required: `false`

Allows multiple usage of refresh token. Refresh tokens which can be stored safely are typically longer-lived and RFC6749 allows their reuse. When the specification was written, it was not recommended to use refresh tokens in the browser. This is now required in SPAs because modern browsers block cookies required for iframe refresh. When using refresh tokens in the browser, the refresh tokens should be rotated, relatively short lived and only used once. Re-using refresh tokens is strongly discouraged. This configuration is required for older IDPs.

When the token response does not contain a new refresh token, the previously received refresh token is reused.

Activate this property only if your OIDC provider cannot be configured to rotate refresh tokens.

Default = _false_

### `disableIdTokenValidation`

- Type: `boolean`
- Required: `false`

Disable validation for id_token. This is not recommended! You should always validate the id_token if returned. When set to `true`, all `id_token` checks after the `state` check are skipped (signature, nonce, `iss`, `aud`, `iat`, `at_hash` and expiry), and an expired `id_token` no longer triggers a renew.

Default = _false_

### `useCustomAuth0Domain`

- Type: `boolean`
- Required: `false`

Allows an Auth0 custom domain to be used as the authority without losing the special handling of Auth0's logoff endpoint. If you are using a custom domain with Auth0 it is recommended to set this flag to true. <br/>
Default = _false_

### `disablePkce`

- Type: `boolean`
- Required: `false`

Disables PKCE for the code flow. No `code_challenge` and `code_challenge_method` are sent in the authorize (or PAR) request and no `code_verifier` in the token request. Only use this if your provider cannot handle PKCE. <br/>
Default = _false_

### `disableCleaningPopupOnInvalidMessage`

- Type: `boolean`
- Required: `false`

By default, the popup login closes and cleans up the popup when it receives a `message` event whose data is not a string. Set this to `true` to ignore such messages and keep the popup open. <br/>
Default = _false_
