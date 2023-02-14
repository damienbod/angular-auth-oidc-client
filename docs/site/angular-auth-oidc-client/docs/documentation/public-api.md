---
sidebar_label: Public API
sidebar_position: 1
---

# Public API

The most public accessible observables, properties and methods are placed in the `OidcSecurityService`. Below you can find the description of every single one of them.

## userData$

The `userData$` observable provides the information about the user after they have logged in. It returns an `UserDataResult` in the following form:

```ts
export interface UserDataResult {
  userData: any;
  allUserData: ConfigUserDataResult[];
}

export interface ConfigUserDataResult {
  configId: string;
  userData: any;
}
```

In case you are running with one configuration, the `ConfigUserDataResult` contains the user data in the `userData` property and the `ConfigUserData[]` returns the same user data with the `configId` filled in case you need it.

In case you are running with multiple configs, the `userData` property of `ConfigUserDataResult` is set to `null` and you find your user data per config in the `ConfigUserData[]`.

### Example

```ts
this.userData$ = this.oidcSecurityService.userData$;
```

#### Single Config

```json
{
  "userData": {
    "sub": "...",
    "preferred_username": "john@doe.org",
    "name": "john@doe.org",
    "email": "john@doe.org",
    "email_verified": false,
    "given_name": "john@doe.org",
    "role": "user",
    "amr": "pwd"
  },
  "allUserData": [
    {
      "configId": "configId",
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
    }
  ]
}
```

#### Multiple Configs

```json
{
  "userData": null,
  "allUserData": [
    {
      "configId": "configId1",
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
      "configId": "configId2",
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
    }
  ]
}
```

## isAuthenticated$

The `isAuthenticated$` property returns an `Observable<AuthenticatedResult>`. This object is filled depending on with how many configurations you run. The `AuthenticatedResult` is structured as follows:

```ts
export interface AuthenticatedResult {
  isAuthenticated: boolean;
  allConfigsAuthenticated: ConfigAuthenticatedResult[];
}

export interface ConfigAuthenticatedResult {
  configId: string;
  isAuthenticated: boolean;
}
```

In case you have a single config, the `isAuthenticated` on the `AuthenticatedResult` tells you if the user is authenticated or not. The `ConfigAuthenticatedResult[]` contains the single config result with its `configId` and again if this config is authenticated or not.

In case you have multiple configs, the `isAuthenticated` on the `AuthenticatedResult` tells you if all configs are authenticated (`true`) or not (`false`). The `ConfigAuthenticatedResult[]` contains the single config results with their `configId` and again if this config is authenticated or not.

### Example

```ts
this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
```

#### Single Config

```json
{
  "isAuthenticated": true,
  "allConfigsAuthenticated": [{ "configId": "configId1", "isAuthenticated": true }]
}
```

#### Multiple Configs

```json
{
  "isAuthenticated": false,
  "allConfigsAuthenticated": [
    { "configId": "configId1", "isAuthenticated": true },
    { "configId": "configId2", "isAuthenticated": false }
  ]
}
```

## isLoading$

> The property is disabled and will be removed in future versions. Please use the `PublicEventsService` with the events `EventTypes.CheckingAuth`, `EventTypes.CheckingAuthFinished`, `EventTypes.CheckingAuthFinishedWithError` instead

The `isLoading$` property returns an `Observable<boolean>`. Emits false when the observable, returned by either of the `checkAuth()` methods, emits a value, or errors. Initial value: true.

### Example

```ts
this.isLoading$ = this.oidcSecurityService.isLoading$;
```

#### Example use case

An auth guard subscribes to `isAuthenticated$` before the observable, returned by `checkAuth()`, emits a value. The `isAuthenticated$` emits false, and prompts an `authorize`, causing an infinite redirect loop. Use the `isLoading$` in combination with the `isAuthenticated$` to ensure that there is no race condition.

## checkSessionChanged$

The `checkSessionChanged$` observable emits values every time the server comes back with a check session and the value `changed`. If you want to get information about when the `CheckSession` Event has been received, please take a look at the [public events](public-events.md).

```ts
this.checkSessionChanged$ = this.oidcSecurityService.checkSessionChanged$;
```

## stsCallback$

The `stsCallback$` observable emits _after_ the library has handled the possible Security Token Service callback. You can perform initial setups and custom workflows inside your application when the Security Token Service redirects you back to your app.

```ts
this.stsCallback$ = this.oidcSecurityService.stsCallback$;
```

## preloadAuthWellKnownDocument(configId?: string)

This method allows you to explicitly load the secure token servers well-known endpoints and persist the settings to the configured storage of this library. This method will perform an http call to load and save the information. If you do not call this method explicitly, the lib will call it when it is needed for the first time automatically.

```ts
// single config
this.oidcSecurityService.preloadAuthWellKnownDocument().subscribe((authWellKnown)=> ... );

// multiple configs
this.oidcSecurityService.preloadAuthWellKnownDocument('configId').subscribe((authWellKnown)=> ... );

```

## getConfigurations()

This method returns all configurations you have configured as an `OpenIdConfiguration[]`. The config includes all your values merged with the ones the library created.

```ts
const allConfigs = this.oidcSecurityService.getConfigurations();
```

## getConfiguration(configId?: string)

This method returns an observable of one single configuration.
If you are running with multiple configs and pass a `configId`, the configuration or `null` is returned. If you are running with multiple configs and do not pass the `configId`, the first one is returned. If you are running with a single config, then this config is returned.

```ts
// one config or the first one in case of multiple or null
this.oidcSecurityService.getConfiguration().subscribe((config)=> ... );

// one config or null
this.oidcSecurityService.getConfiguration('configId').subscribe((config)=> ... );
```

## getUserData(configId?: string)

This method returns an observable of the user data.
If you are running with multiple configs and pass a `configId`, the user data for this config or `null` is returned. If you are running with multiple configs and do not pass the `configId`, the user data for the first config is returned. If you are running with a single config, the user data for this config is returned.

```ts
// one config or the first one in case of multiple or null
this.oidcSecurityService.getUserData().subscribe((data)=> ... );

// user data for this specific config
this.oidcSecurityService.getUserData('configId').subscribe((data)=> ... );
```

## checkAuth(url?: string, configId?: string)

This method starts the complete authentication flow. Use this method if you are running with a single config or want to check a single config.

This method parses the URL when redirected back from the Security Token Service (STS) and sets all values.

It returns an `Observable<LoginResponse>` containing all information you need in one object.

```ts
{
  isAuthenticated: boolean;
  userData: any;
  accessToken: string;
  idToken: string;
  configId: string;
  errorMessage?: string;
}
```

```ts
this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated, userData, accessToken, idToken, configId }) => {
  // ...use data
});
```

You can also pass a `configId` to check for as well as a URL in case you want to overwrite the current one in the address bar from the browser. This is useful for mobile or desktop cases like Electron or Cordova/Ionic.

```ts
const url = '...';
const configId = '...';

this.oidcSecurityService.checkAuth(url, configId).subscribe(({ isAuthenticated, userData, accessToken, idToken, configId }) => {
  // ...use data
});
```

## checkAuthMultiple(url?: string)

This method starts the complete authentication flow for multiple configs. Use this method if you are running with multiple configs to check which one is authenticated or not.

This method parses the URL when you come back from the Security Token Service (STS) and sets all values.

It returns an `Observable<LoginResponse[]>` containing all information you need in the `LoginResponse` object as array so that you can see which config has which values.

```ts
[
  {
    isAuthenticated: boolean;
    userData: any;
    accessToken: string;
    idToken: string;
    configId: string;
    errorMessage?: string;
  }
]
```

```ts
this.oidcSecurityService.checkAuthMultiple().subscribe(({ isAuthenticated, userData, accessToken, idToken, configId }) => {
  // ...use data
});
```

You can also pass a `configId` to check for as well as a URL in case you want to overwrite the one in the address bar from the browser. This is useful for mobile or desktop cases like Electron or Cordova/Ionic.

```ts
const url = '...';

this.oidcSecurityService.checkAuthMultiple(url).subscribe(({ isAuthenticated, userData, accessToken, idToken, configId }) => {
  // ...use data
});
```

## isAuthenticated(configId?: string)

This method provides information if a config is authenticated or not as an `Observable<boolean>` return value.
If you are running with multiple configs and pass the `configId` the authentication for this config is checked. If you are running with multiple configs and do not pass the `configId` the authentication for the first config is checked. If you are running with a single config this configuration is checked if you are authenticated.

```ts
this.oidcSecurityService.isAuthenticated().subscribe((isAuthenticated)=> ... );
```

```ts
this.oidcSecurityService.isAuthenticated('configId').subscribe((isAuthenticated)=> ... );
```

## checkAuthIncludingServer(configId?: string)

This method can be used to check the server for an authenticated session using the iframe silent renew if not locally authenticated. This is useful when opening an app in a new tab and you are already authenticated. This method ONLY works with iframe silent renew. It will not work with refresh tokens. With refresh tokens, you cannot do this, as consent is required.

Returns an `Observable<LoginResponse>`.

```ts
{
  isAuthenticated: boolean;
  userData: any;
  accessToken: string;
  idToken: string;
  configId: string;
  errorMessage?: string;
}
```

If you are running with multiple configs and pass the `configId` the authentication for this config is checked. If you are running with multiple configs and do not pass the `configId` the authentication for the first config is checked. If you are running with a single config this configuration is checked if you are authenticated.

```ts
this.oidcSecurityService.checkAuthIncludingServer().subscribe(/*...*/);
```

```ts
this.oidcSecurityService.checkAuthIncludingServer('configId').subscribe(/*...*/);
```

## getAccessToken(configId?: string):

Returns the access token for your login scenario as an `Observable<string>`.
If you are running with multiple configs and pass the `configId` the access token for this config is returned. If you are running with multiple configs and do not pass the `configId` the access token for the first config is returned. If you are running with a single config the access token for this config returned.

```ts
this.oidcSecurityService.getAccessToken().subscribe(/*...*/);
```

```ts
this.oidcSecurityService.getAccessToken('configId').subscribe(/*...*/);
```

## getIdToken(configId?: string):

Returns the id token for your login scenario as an `Observable<string>`.
If you are running with multiple configs and pass the `configId` the id token for this config is returned. If you are running with multiple configs and do not pass the `configId` the id token for the first config is returned. If you are running with a single config the id token for this config returned.

```ts
this.oidcSecurityService.getIdToken().subscribe(/*...*/);
```

```ts
this.oidcSecurityService.getIdToken('configId').subscribe(/*...*/);
```

## getRefreshToken(configId?: string)

Returns the refresh token as an `Observable<string>` for your login scenario if there is one.
If you are running with multiple configs and pass a `configId`, the refresh token for this config is returned. If you are running with multiple configs and do not pass the `configId`, the refresh token for the first config is returned. If you are running with a single config, the refresh token for this config is returned.

```ts
this.oidcSecurityService.getRefreshToken().subscribe(/*...*/);
```

```ts
this.oidcSecurityService.getRefreshToken('configId').subscribe(/*...*/);
```

## getAuthenticationResult(configId?: string)

Returns the authentication result as an `Observable`, if present, for the sign-in. The `configId` parameter is used to define which configuration to use. This is only required when using multiple configurations. If not passed, the first config will be taken. An object with the authentication result is returned.

```ts
this.oidcSecurityService.getAuthenticationResult().subscribe(/*...*/);
```

```ts
this.oidcSecurityService.getAuthenticationResult('configId').subscribe(/*...*/);
```

## getPayloadFromIdToken(encode = false, configId?: string)

Returns the payload from the id_token as an `Observable`. This can be used to get claims from the token.
If you are running with multiple configs and pass a `configId`, the payload for this config is returned. If you are running with multiple configs and do not pass a `configId`, the payload for the first config is returned. If you are running with a single config, the payload for this config returned.

The `encode` param has to be set to `true` if the payload is base64 encoded.

```ts
this.oidcSecurityService.getPayloadFromIdToken().subscribe(/*...*/);
```

```ts
this.oidcSecurityService.getPayloadFromIdToken(true, 'configId').subscribe(/*...*/);
```

## getPayloadFromAccessToken(encode = false, configId?: string)

Returns the payload from the access token as an `Observable`. This can be used to get claims from the token.
If you are running with multiple configs and pass a `configId`, the payload for this config is returned. If you are running with multiple configs and do not pass a `configId`, the payload for the first config is returned. If you are running with a single config, the payload for this config returned.

The `encode` param has to be set to `true` if the payload is base64 encoded.

```ts
this.oidcSecurityService.getPayloadFromAccessToken().subscribe(/*...*/);
```

```ts
this.oidcSecurityService.getPayloadFromAccessToken(true, 'configId').subscribe(/*...*/);
```

## setState(state: string, configId?: string)

You can set the state value used for the authorize request, if you have `autoCleanStateAfterAuthentication` in the configuration set to `false`. This can be used for custom state logic handling, the state is not automatically reset when set to `false`.
If you are running with multiple configs and pass a `configId`, the passed config is taken. If you are running with multiple configs and do not pass a `configId`, the first config is taken. If you are running with a single config, then this config is taken.

```ts
this.oidcSecurityService.setState('some-state').subscribe(/*...*/);
```

```ts
this.oidcSecurityService.setState('some-state', 'configId').subscribe(/*...*/);
```

## getState(configId?: string)

Returns the state value used for the authorize request as an `Observable`.
If you are running with multiple configs and pass a `configId`, the passed config is taken. If you are running with multiple configs and do not pass a `configId`, the first config is taken. If you are running with a single config, then this config is taken.

```ts
this.oidcSecurityService.getState().subscribe(/*...*/);
```

```ts
this.oidcSecurityService.getState('configId').subscribe(/*...*/);
```

## authorize(configId?: string, authOptions?: AuthOptions)

This method must be called when you want to redirect to the authority and sign in the identity. This method takes a `configId` as parameter if you want to use a specific config and it also takes `authOptions` adding `customParams` or `redirectUrl` which can change every time you want to login.
It also accepts an `urlHandler` which is getting called instead of the redirect.

See also: [Custom parameters](custom-parameters.md).

```ts
export interface AuthOptions {
  customParams?: { [key: string]: string | number | boolean };
  urlHandler?(url: string): any;
  redirectUrl?: string;
}
```

```ts
this.oidcSecurityService.authorize();
```

```ts
const authOptions = {
  customParams: {
    some: 'params',
  },
  urlHandler: () => {
    /* ... */
  },
};
this.oidcSecurityService.authorize('configId', authOptions);
```

## authorizeWithPopUp(authOptions?: AuthOptions, popupOptions?: PopupOptions, configId?: string)

This method must be called when you want to redirect to the Security Token Service in a popup and login your user. This method takes a `configId` as parameter if you want to use a specific config and it also takes `authOptions` adding `customParams` or `redirectUrl` which can change every time you want to login.
It also accepts an `urlHandler` which is getting called instead of the redirect. You can pass additional `PopupOptions` to define where and how the popup should open.

The method returns an `Observable<LoginResponse>` containing

```ts
{
  isAuthenticated: boolean;
  userData: any;
  accessToken: string;
  idToken: string;
  configId: string;
  errorMessage?: string;
}
```

```ts
export interface PopupOptions {
  width?: number;
  height?: number;
  left?: number;
  top?: number;
}
```

```ts
export interface AuthOptions {
  customParams?: { [key: string]: string | number | boolean };
  urlHandler?(url: string): any;
  redirectUrl?: string;
}
```

### Examples

```ts
this.oidcSecurityService.authorizeWithPopUp().subscribe(({ isAuthenticated, userData, accessToken, idToken, configId }) => {
  // ...use data
});
```

```ts
const authOptions = {
  customParams: {
    some: 'params',
  },
  urlHandler: () => {
    /* ... */
  },
  redirectUrl: '/path-to/custom-popup-login-page.html',
};

this.oidcSecurityService
  .authorizeWithPopUp(authOptions, null, 'configId')
  .subscribe(({ isAuthenticated, userData, accessToken, idToken, configId }) => {
    // ...use data
  });
```

## forceRefreshSession(customParams?: { ... }, configId?: string)

This method provides the functionality to manually refresh the session at any time you require. If a current process is running this method will do nothing. After the run is finished the method forces to refresh again.

This method takes `customParams` for this request as well as a `configId` as parameter if you want to use a specific config. If you are running with multiple configs and pass a `configId`, the passed config is taken. If you are running with multiple configs and do not pass a `configId`, the first config is taken. If you are running with a single config, then this config is taken.

See also: [Custom parameters](custom-parameters.md)

The method returns an `Observable<LoginResponse>` containing

```ts
{
  isAuthenticated: boolean;
  userData: any;
  accessToken: string;
  idToken: string;
  configId: string;
  errorMessage?: string;
}
```

### Examples

```ts
this.oidcSecurityService.forceRefreshSession().subscribe(({ isAuthenticated, userData, accessToken, idToken, configId }) => {
  // ...use data
});
```

```ts
const customParams: {
  some: 'params',
}

this.oidcSecurityService
  .forceRefreshSession(customParams, 'configId')
  .subscribe(({ isAuthenticated, userData, accessToken, idToken, configId }) => {
```

## logoffAndRevokeTokens(configId?: string, authOptions?: AuthOptions)

With this method the user is being logged out and the refresh token and and the access token are revoked on the server. If the refresh token does not exist only the access token is revoked. Then the logout runs normally.

This method takes a `configId` and and `authOptions` as parameter and returns an observable. If you are running with multiple configs and pass the `configId` the passed config is taken. If you are running with multiple configs and do not pass the `configId` the first config is taken. If you are running with a single config this config is taken.

```ts
this.oidcSecurityService.logoffAndRevokeTokens().subscribe(/* ... */);
```

```ts
const authOptions = {
  customParams: {
    some: 'params',
  },
  urlHandler: () => {
    /* ... */
  },
};

this.oidcSecurityService.logoffAndRevokeTokens('configId', authOptions).subscribe(/* ... */);
```

## logoff(configId?: string, logoutAuthOptions?: LogoutAuthOptions)

This method logs out on the server and the local client. If the server state has changed, check session, then only a local logout. The method takes a `configId` and `logoutAuthOptions` as parameter. If you are running with multiple configs and pass the `configId` the passed config is taken. If you are running with multiple configs and do not pass the `configId` the first config is taken. If you are running with a single config this config is taken.

The method returns an `Observable<unknown>`.

Examples:

```ts
this.oidcSecurityService.logoff().subscribe((result) => console.log(result));
```

```ts
const authOptions = {
  customParams: {
    some: 'params',
  },
  urlHandler: () => {
    /* ... */
  },
};

this.oidcSecurityService.logoff('configId', authOptions).subscribe((result) => console.log(result));
```

## logoffLocal(configId?: string)

This method is used to reset your local session in the browser, but not sending anything to the server. If you are running with multiple configs and pass a `configId`, the passed config is taken. If you are running with multiple configs and do not pass a `configId`, the first config is taken. If you are running with a single config, then this config is taken.

```ts
this.oidcSecurityService.logoffLocal();
```

```ts
this.oidcSecurityService.logoffLocal('configId');
```

## logoffLocalMultiple()

This method is used to reset your local session in the browser for multiple configs, but not sending anything to the server.

```ts
this.oidcSecurityService.logoffLocalMultiple();
```

## revokeAccessToken(accessToken?: any, configId?: string)

This method revokes an access token on the Security Token Service (STS). This is only required in the code flow with refresh tokens. If no token is provided, then the token from the storage is revoked. You can pass any token to revoke. This makes it possible to manage your own tokens.

This method also takes a `configId`. If you are running with multiple configs and pass the `configId` the passed config is taken. If you are running with multiple configs and do not pass the `configId` the first config is taken. If you are running with a single config this config is taken.

```ts
this.oidcSecurityService.revokeAccessToken().subscribe(/* ... */);
```

```ts
this.oidcSecurityService.revokeAccessToken('accessToken', 'configId').subscribe(/* ... */);
```

More info: [https://tools.ietf.org/html/rfc7009](https://tools.ietf.org/html/rfc7009)

## revokeRefreshToken(refreshToken?: any, configId?: string)

This method revokes a refresh token on the Security Token Service (STS). This is only required in the code flow with refresh tokens. If no token is provided, then the token from the storage is revoked. You can pass any token to revoke. This makes it possible to manage your own tokens.

This method also takes a `configId`. If you are running with multiple configs and pass a `configId`, the passed config is taken. If you are running with multiple configs and do not pass a `configId`, the first config is taken. If you are running with a single config, then this config is taken.

```ts
this.oidcSecurityService.revokeRefreshToken().subscribe(/* ... */);
```

```ts
this.oidcSecurityService.revokeRefreshToken('refreshToken', 'configId').subscribe(/* ... */);
```

More info: [https://tools.ietf.org/html/rfc7009](https://tools.ietf.org/html/rfc7009)

## getEndSessionUrl(customParams?: { ... }, configId?: string)

Creates the end session URL which can be used to implement your own custom server logout. You can pass custom params directly into the method. This method also takes a `configId`. If you are running with multiple configs and pass a `configId`, the passed config is taken. If you are running with multiple configs and do not pass a `configId`, the first config is taken. If you are running with a single config, then this config is taken.

```ts
this.oidcSecurityService.getEndSessionUrl().subscribe(/* ... */);
```

```ts
const customParams = {
  some: 'params',
};

this.oidcSecurityService.getEndSessionUrl(customParams, 'configId').subscribe(/* ... */);
```

## getAuthorizeUrl(customParams?: { ... }, configId?: string)

Creates the authorize URL which can be used to get the URL for the authentication the lib uses internally. You can pass custom params directly into the method. This method also takes a `configId`. If you are running with multiple configs and pass a `configId`, the passed config is taken. If you are running with multiple configs and do not pass a `configId`, the first config is taken. If you are running with a single config this config is taken.

```ts
const authorizeUrl = this.oidcSecurityService.getAuthorizeUrl();
```

```ts
const customParams = {
  some: 'params',
};

const authorizeUrl = this.oidcSecurityService.getAuthorizeUrl(customParams, 'configId');
```
