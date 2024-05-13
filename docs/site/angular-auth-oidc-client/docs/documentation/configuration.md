---
sidebar_label: Configuration
sidebar_collapsed: false
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

### Getting static config from a service (sync)

You can also get the static config from a service. In this case you can use the `StsConfigStaticLoader` passing the config in the constructor.

```ts
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

@NgModule({
  imports: [
    AuthModule.forRoot({
      loader: {
        provide: StsConfigLoader,
        useFactory: authFactory,
        deps: [ConfigService],
      },
    }),
  ],
  exports: [AuthModule],
})
export class AuthConfigModule {}
```

## Load config from HTTP (async)

If you want to load the config from HTTP and then map it to the interface the library provides you can use the `StsConfigHttpLoader` and pass it with the `loader` property.

```ts
import { AuthModule, StsConfigHttpLoader, StsConfigLoader } from 'angular-auth-oidc-client';

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

### Using multiple HTTP configs

The HTTP loader also supports multiple configs.

```ts
import { AuthModule, StsConfigHttpLoader, StsConfigLoader } from 'angular-auth-oidc-client';

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

### Using localstorage instead of default sessionstorage

The angular-auth-oidc-client uses session storage by default that gets cleared whenever you open the website in a new tab, if you want to change it to localstorage then need to provide a different AbstractSecurityStorage.

```ts
import { NgModule } from '@angular/core';
import { AuthModule, DefaultLocalStorageService, AbstractSecurityStorage } from 'angular-auth-oidc-client';

@NgModule({
  imports: [
    AuthModule.forRoot({
      config: {
        /* Your config here */
      },
    }),
  ],
  exports: [AuthModule],
  providers: [
    {
      provide: AbstractSecurityStorage,
      useClass: DefaultLocalStorageService,
    },
  ],
})
export class AuthConfigModule {}
```

## Configure with standalone config

To configure the auth module by using the standalone API, you can use the `provideAuth` method

```ts
import { ApplicationConfig } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAuth } from 'angular-auth-oidc-client';
import { AppComponent } from './app/app.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAuth({
      config: {
        /* Your config here */
      },
    }),
  ],
};

bootstrapApplication(AppComponent, appConfig);
```

## Config Values

### `configId`

- Type: `string`
- Required: `false`

In multi-configuration use-cases, each configuration must be assigned a unique `configId`. By default, the library will generate and assign a unique `configId` to each provided configuration. You can override the library's default `configId` generation by providing a unique `configId` for each configuration entry.

### `authority`

- Type: `string`
- Required: `true`

This is the url to the Security Token Service (STS). The authority issues tokens.

### `authWellknownEndpointUrl`

- Type: `string`
- Required: `false`

A different well-known endpoint can be defined instead of the authority domain with the standard well-known endpoints postfix. This is only required if the well-known endpoint URL is not implemented in a standard way on the Security Token Service (STS).

### `authWellknownEndpoints`

- Type: `object`
- Required: `false`

Allows you to set custom URLs for the Well-Known endpoints.

### `redirectUrl`

- Type: `string`
- Required: `false`

This is the `redirect_url` which was configured on the Security Token Service (STS).

### `checkRedirectUrlWhenCheckingIfIsCallback`

- Type: `boolean`
- Required: `false`
- Default: `false` *NB:* Default will be `true` in v18.

Whether to check if current URL matches the redirect URI when determining if current URL is in fact the redirect URI.

### `clientId`

- Type: `string`
- Required: `false`

The client **MUST** validate that the `aud` (audience) claim contains its `client_id` value registered at the Issuer identified by the `iss` (issuer) claim as an audience. The id token **MUST** be rejected if the id token does not list the Client as a valid audience, or if it contains additional audiences not trusted by the Client.

### `responseType`

- Type: `string`
- Required: `false`

The name of the flow which to be configured. Valid options are `code`, `id_token token`, or `id_token`. <br/>
If you want to access an API or get user data from the server, the `access_token` value returned by the `id_token` flow is required. You must use the `id_token` flow.

### `scope`

- Type: `string`
- Required: `false`

This contains the scopes that are requested from the server for this client, defined as a space-delimited list. This **MUST** match the STS server configuration.

### `hdParam`

- Type: `string`
- Required: `false`

An optional hd parameter for Google Auth, specifically for the G Suite domain, see https://developers.google.com/identity/protocols/OpenIDConnect#hd-param

### `postLogoutRedirectUri`

- Type: `string`
- Required: `false`

If you are using the end session API, this is the URL to redirect the client to after a server logout.

### `startCheckSession`

- Type: `boolean`
- Required: `false`

Starts the OpenID session management for this client.

### `silentRenew`

- Type: `boolean`
- Required: `false`

Indicates that the library should renew the client's tokens after the `token_id` expires. It can be configured to use iframes or refresh tokens.

### `silentRenewUrl`

- Type: `string`
- Required: `false`

If you are using the silent renew process and set this parameter, the supplied URL will be used for lightweight silent renew callbacks. See [Silent Renew](silent-renew.md).

### `silentRenewTimeoutInSeconds`

- Type: `number`
- Required: `false`

Sets the maximum wait time for the silent renew process. If this time is exceeded, the silent renew state will be reset. Default = _20_

### `renewTimeBeforeTokenExpiresInSeconds`

- Type: `number`
- Required: `false`

Makes it possible to add an offset to the silent renew check in seconds. By entering a value, you can renew the tokens before they expire.

### `useRefreshToken`

- Type: `boolean`
- Required: `false`

If set to true, refresh tokens will be used for the silent renew process instead of the default iframes. <br/>
Default = _false_

### `ignoreNonceAfterRefresh`

- Type: `boolean`
- Required: `false`

A token obtained by using a refresh token normally doesn't contain a nonce value. The library checks it is not there. However some oidc endpoint implementations do send one. Setting `ignoreNonceAfterRefresh` to true disables the check if a nonce is present. Please note that the nonce value, if present, will not be verified. Default is false.

### `postLoginRoute`

- Type: `string`
- Required: `false`

The default Angular route to use after a successful login, if not using the `triggerAuthorizationResultEvent`.

### `forbiddenRoute`

- Type: `string`
- Required: `false`

The Angular route to redirect the client to when the server returns an HTTP 403 response.

### `unauthorizedRoute`

- Type: string
- Required: false

The Angular route to redirect the client to when the server returns an HTTP 401 response.

### `autoUserInfo`

- Type: `boolean`

Denote if the library should automatically get user info after authentication.

### `renewUserInfoAfterTokenRenew`

- Type: `boolean`
- Required: `false`

Denotes if the library should automatically get user info after token renew.

### `autoCleanStateAfterAuthentication`

- Type: `boolean`
- Required: `false`

Denotes if the state should be reset after authentication. When set to false, the state is not automatically reset. This can be used for custom state logic handling.

### `triggerAuthorizationResultEvent`

- Type: `boolean`
- Required: `false`

This can be set to `true` which emits an event instead of an Angular route change. Instead of forcing the application consuming this library to automatically redirect to one of the 3 hard-configured routes (start, unauthorized, forbidden), this parameter will add an extra configuration option to override such behavior and trigger an event that will allow you to subscribe to it and let the application perform other actions. One useful application of this event is allowing the application to save an initial return url so that the user is redirected to it after a successful login on the STS (i.e., saving the return url in `sessionStorage` and then retrieving when the event is triggered).

### `logLevel`

- Type: `LogLevel`
- Required: `false`

Sets the log level displayed in the console.

### `issValidationOff`

- Type: `boolean`
- Required: `false`

Makes it possible to turn the `iss` validation off per configuration. **You should not turn this off!**

### `historyCleanupOff`

- Type: `boolean`
- Required: `false`

If this is active, the history is not cleaned up during an authorize callback. This can be used when the application needs to preserve the history.

### `maxIdTokenIatOffsetAllowedInSeconds`

- Type: `number`
- Required: `false`

The amount of offset allowed between the server creating the token, and the client app receiving the id_token. The diff in time between the server time and client time is also important in validating this value. All times are in UTC.

### `disableIatOffsetValidation`

- Type: `boolean`
- Required: `false`

This allows the application to disable the `iat` offset validation check. The `iat` Claim can be used to reject tokens that were issued too far away from the current time, limiting the amount of time that nonces need to be stored to prevent attacks. The acceptable range is client specific.

### `customParamsAuthRequest`

- Type: `Object`
- Required: `false`

Extra parameters that can be added to the authorization URL request.

### `customParamsRefreshTokenRequest`

- Type: `Object`
- Required: `false`

Extra parameters that can be added to the refresh token request body.

### `customParamsEndSessionRequest`

- Type: `Object`
- Required: `false`

Extra parameters that can be added to the end session request body.

### `customParamsCodeRequest`

- Type: `Object`
- Required: `false`

Extra parameters that can be added to the token URL request.

### `disableRefreshIdTokenAuthTimeValidation`

- Type: `boolean`
- Required: `false`

Disables the `auth_time` validation for `id_tokens` in a refresh due to Microsoft Azure's incorrect implementation.

### `triggerRefreshWhenIdTokenExpired`

- Type: `boolean`
- Required: `false`

Enables the `id_token` expiry check in the renew process. You can disable this validation if you would like to ignore expired values during the renew process or after the first renew in the expiry check. With this disabled, a renew process will only be triggered when the access token expires. If no `id_token` is returned while using refresh tokens, set this to false. <br/>
Default = _true_

### `tokenRefreshInSeconds`

- Type: `number`
- Required: `false`

Controls the periodic check time interval in seconds. <br/>
Default = _3_

### `secureRoutes`

- Type: `string[]`
- Required: `false`

An array of secure urls to which the token should be sent if the interceptor is added to the `HTTP_INTERCEPTORS`. <br/>
See [Http Interceptor](using-access-tokens.md/#http-interceptor)

### `usePushedAuthorisationRequests`

- Type: `boolean`
- Required: `false`

Activates Pushed Authorisation Requests (PAR) for login and popup login. <br/>
(iframe renew is not supported)

### `refreshTokenRetryInSeconds`

- Type: `number`
- Required: `false`

Controls the periodic retry time interval for retrieving new tokens in seconds. <br/>
Default = _3_. <br/>
`silentRenewTimeoutInSeconds` and `tokenRefreshInSeconds` are the upper bounds for this value.

### `ngswBypass`

- Type: `boolean`
- Required: `false`

Adds the `ngsw-bypass` param to all requests ([Angular Documentation](https://angular.io/guide/service-worker-devops#bypassing-the-service-worker)).

### `allowUnsafeReuseRefreshToken`

- Type: `boolean`
- Required: `false`

Allows multiple usage of refresh token. Refresh tokens which can be stored safely are typically longer-lived and RFC6749 allows their reuse. When the specification was written, it was not recommended to use refresh tokens in the browser. This is now required in SPAs because modern browsers block cookies required for iframe refresh. When using refresh tokens in the browser, the refresh tokens should be rotated, relatively short lived and only used once. Re-using refresh tokens is strongly discouraged. This configuration is required for older IDPs.

Activate this property only if your OIDC provider cannot be configured to rotate refresh tokens.

Default = _false_

### `disableIdTokenValidation`

- Type: `boolean`
- Required: `false`

Disable validation for id_token. This is not recommended! You should always validate the id_token if returned.

Default = _false_

### `useCustomAuth0Domain`

- Type: `boolean`
- Required: `false`

Allows an Auth0 custom domain to be used as the authority without losing the special handling of Auth0's logoff endpoint. If you are using a custom domain with Auth0 it is recommended to set this flag to true.
