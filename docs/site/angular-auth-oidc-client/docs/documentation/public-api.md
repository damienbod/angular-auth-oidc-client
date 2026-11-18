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

In case you are running with one configuration, `UserDataResult.userData` contains the user data, and `allUserData` (a `ConfigUserDataResult[]`) contains the same user data together with its `configId`, in case you need it.

In case you are running with multiple configs, `UserDataResult.userData` is `null` and you find the user data per config in `allUserData`.

Before any user data is known, the observable emits `{ userData: null, allUserData: [] }`.

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

## userData

A signal implementation of `userData$`.
The `userData` signal returns a `Signal<UserDataResult>`.

### Example

```ts
userData = this.oidcSecurityService.userData;

console.log(this.userData().userData);
console.log(this.userData().userData?.name);
console.log(this.userData().allUserData);
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

## authenticated

A signal implementation of `isAuthenticated$`.
The `authenticated` signal returns a `Signal<AuthenticatedResult>`.

### Example

```ts
authenticated = this.oidcSecurityService.authenticated;

console.log(authenticated().isAuthenticated);
console.log(authenticated().allConfigsAuthenticated);
```

## tokens$

The `tokens$` property returns an `Observable<TokensResult>` which emits the tokens and the user data each time the library has validated a new, valid authentication result: after a login, after the callback of the security token service and after every renewal of the tokens, including the silent ones (iframe and refresh token).

In contrast to `getAccessToken()`, `getIdToken()` and `getAuthenticationResult()`, which return the stored value once and complete, `tokens$` never completes and keeps emitting for every renewal. This is useful if the application has to hand the current access token to something else, for example a WebSocket connection, a service worker or another library.

```ts
export interface TokensResult {
  accessToken: string; // empty if the flow does not return an access token
  idToken: string;
  userData: any; // the user data of the config, null if there are none
  isRenewProcess: boolean; // true if the tokens come from a renewal, false for a login
  configId?: string;
}
```

- It does not emit for failed results, for example a failed silent renew. Use the `SilentRenewFailed` event of the [Public Events](public-events.md) for that.
- It does not emit when `checkAuth()` finds a valid session in the storage, because no new authentication result is produced. Use the `LoginResponse` of `checkAuth()` for the initial tokens.
- When running with multiple configs, it emits for all configs. Filter by `configId` to get a single one.
- Like `registerForEvents()` it is built on the [Public Events](public-events.md) and does not replay old results. Subscribe early, for example in an `APP_INITIALIZER` or the constructor of a root service.

### Example

```ts
this.oidcSecurityService.tokens$.subscribe(({ accessToken, userData, isRenewProcess }) => {
  this.socket.setToken(accessToken);
});
```

```ts
this.oidcSecurityService.tokens$
  .pipe(filter(({ configId }) => configId === 'configId1'))
  .subscribe(({ accessToken }) => console.log(accessToken));
```

## checkSessionChanged$

The `checkSessionChanged$` observable starts with `false` and emits `true` when the check session iframe reports `changed`, or when the session cannot be checked because `session_state` or the `check_session_iframe` endpoint is missing. To get every check session answer (`changed` and `unchanged`), use the `CheckSessionReceived` [public event](public-events.md).

```ts
this.checkSessionChanged$ = this.oidcSecurityService.checkSessionChanged$;
```

## stsCallback$

The `stsCallback$` observable emits _after_ the library has handled the possible Security Token Service callback. You can perform initial setups and custom workflows inside your application when the Security Token Service redirects you back to your app.

It is a plain `Subject`: it does not replay, so subscribe before `checkAuth()` runs. It does not emit when handling the callback fails.

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

**Call this once on every app load** (typically from your root component's `ngOnInit`). Without it, the library never bootstraps and the auth state stays uninitialised.

Specifically, `checkAuth()` does three things:

1. **Processes the callback** if the current URL contains an auth response from the identity provider (after the redirect back from sign-in).
2. **Restores an existing session** from storage if one is present, so a page refresh keeps the user signed in.
3. **Starts silent token renewal** and the periodic token-validity check, if configured.

Step 3 only happens when the user is authenticated afterwards. If no configuration matches the passed `configId`, or the `state` in the URL, the returned observable errors (`Please provide a configuration before setting up the module` / `could not find matching config for state ...`). Failures while processing the callback do not error: they resolve with `isAuthenticated: false` and the reason in `errorMessage`.

It returns an `Observable<LoginResponse>` describing the result:

```ts
{
  isAuthenticated: boolean;
  userData: any;
  accessToken: string;
  idToken: string;
  configId?: string;
  errorMessage?: string;
  errorDescription?: string;
}
```

> `checkAuth()` does **not** redirect the user anywhere. To start a *new* sign-in (e.g. on a "Login" button click), call [`authorize()`](#authorizeconfigid-string-authoptions-authoptions) instead.

```ts
this.oidcSecurityService.checkAuth().subscribe(({ isAuthenticated, userData, accessToken, idToken, configId }) => {
  // ...use data
});
```

You can also pass a `configId` to target a specific config, and a `url` to override the URL the library reads the callback from. The custom URL is mainly useful for non-browser shells like Electron or Cordova/Ionic where `window.location` doesn't reflect the callback.

```ts
const url = '...';
const configId = '...';

this.oidcSecurityService.checkAuth(url, configId).subscribe(({ isAuthenticated, userData, accessToken, idToken, configId }) => {
  // ...use data
});
```

> **Multiple configs:** `checkAuth()` only bootstraps a single config. If you've registered more than one via `provideAuth`, use [`checkAuthMultiple()`](#checkauthmultipleurl-string) to bootstrap all of them in one call.

> **Already signed in elsewhere?** If you want the app to detect a server-side session at the identity provider that this app hasn't observed yet (typical SSO case), use [`checkAuthIncludingServer()`](#checkauthincludingserverconfigid-string).

## checkAuthMultiple(url?: string)

The multi-config equivalent of [`checkAuth()`](#checkauthurl-string-configid-string). Use this once on every app load **if you've registered more than one `provideAuth` configuration** — it bootstraps all of them in a single call.

It does the same three things as `checkAuth()` (processes the callback, restores stored sessions, starts silent renewal), applied to every registered config.

It returns an `Observable<LoginResponse[]>` with one `LoginResponse` per config, so you can see the status of each. Normally they come in registration order. When the URL is a callback (it contains a `state`), the config matching that state comes first, followed by the others.

```ts
[
  {
    isAuthenticated: boolean;
    userData: any;
    accessToken: string;
    idToken: string;
    configId?: string;
    errorMessage?: string;
    errorDescription?: string;
  }
]
```

```ts
this.oidcSecurityService.checkAuthMultiple().subscribe((responses: LoginResponse[]) => {
  // ...use data
});
```

You can also pass a URL in case you want to override the one in the browser's address bar. This is useful for mobile or desktop cases like Electron or Cordova/Ionic.

```ts
const url = '...';

this.oidcSecurityService.checkAuthMultiple(url).subscribe((responses: LoginResponse[]) => {
  // ...use data
});
```

## isAuthenticated(configId?: string)

This method provides information if a config is authenticated or not as an `Observable<boolean>` return value.
If you are running with multiple configs and pass the `configId` the authentication for this config is checked. If you are running with multiple configs and do not pass the `configId` the authentication for the first config is checked. If you are running with a single config this configuration is checked if you are authenticated.

The value only tells whether an access token and an id token are stored. It does not check whether they have expired. If no configuration is found for the `configId`, it emits `false`.

```ts
this.oidcSecurityService.isAuthenticated().subscribe((isAuthenticated)=> ... );
```

```ts
this.oidcSecurityService.isAuthenticated('configId').subscribe((isAuthenticated)=> ... );
```

## checkAuthIncludingServer(configId?: string)

The same local bootstrap as [`checkAuth()`](#checkauthurl-string-configid-string), **plus** an iframe silent renew against the identity provider when the user isn't already locally authenticated.

Use this when your app needs to detect a server-side session that this app hasn't observed yet — typically the SSO scenario where the user is already signed in to the IdP via another app and you want this app to pick that up automatically on first load.

> This method **only works with iframe silent renew**. It does **not** work with refresh tokens (`useRefreshToken: true`), because completing the flow there would require user consent.

Returns an `Observable<LoginResponse>`.

```ts
{
  isAuthenticated: boolean;
  userData: any;
  accessToken: string;
  idToken: string;
  configId?: string;
  errorMessage?: string;
  errorDescription?: string;
}
```

If you are running with multiple configs and pass the `configId` the authentication for this config is checked. If you are running with multiple configs and do not pass the `configId` the authentication for the first config is checked. If you are running with a single config this configuration is checked if you are authenticated.

If no configuration is found for the `configId`, the observable errors.

```ts
this.oidcSecurityService.checkAuthIncludingServer().subscribe(/*...*/);
```

```ts
this.oidcSecurityService.checkAuthIncludingServer('configId').subscribe(/*...*/);
```

## getAccessToken(configId?: string):

Returns the access token for your login scenario as an `Observable<string>`.
If you are running with multiple configs and pass the `configId` the access token for this config is returned. If you are running with multiple configs and do not pass the `configId` the access token for the first config is returned. If you are running with a single config the access token for this config is returned.

Emits an empty string if no configuration is found or the user is not authenticated.

```ts
this.oidcSecurityService.getAccessToken().subscribe(/*...*/);
```

```ts
this.oidcSecurityService.getAccessToken('configId').subscribe(/*...*/);
```

## getIdToken(configId?: string):

Returns the id token for your login scenario as an `Observable<string>`.
If you are running with multiple configs and pass the `configId` the id token for this config is returned. If you are running with multiple configs and do not pass the `configId` the id token for the first config is returned. If you are running with a single config the id token for this config is returned.

Emits an empty string if no configuration is found or the user is not authenticated.

```ts
this.oidcSecurityService.getIdToken().subscribe(/*...*/);
```

```ts
this.oidcSecurityService.getIdToken('configId').subscribe(/*...*/);
```

## getRefreshToken(configId?: string)

Returns the refresh token as an `Observable<string>` for your login scenario if there is one.
If you are running with multiple configs and pass a `configId`, the refresh token for this config is returned. If you are running with multiple configs and do not pass the `configId`, the refresh token for the first config is returned. If you are running with a single config, the refresh token for this config is returned.

Emits an empty string if no configuration is found or the user is not authenticated.

```ts
this.oidcSecurityService.getRefreshToken().subscribe(/*...*/);
```

```ts
this.oidcSecurityService.getRefreshToken('configId').subscribe(/*...*/);
```

## getAuthenticationResult(configId?: string)

Returns the authentication result as an `Observable`, if present, for the sign-in. The `configId` parameter is used to define which configuration to use. This is only required when using multiple configurations. If not passed, the first config will be taken.

Returns an `Observable<AuthResult | null>`. It emits `null` if no configuration is found or the user is not authenticated.

```ts
this.oidcSecurityService.getAuthenticationResult().subscribe(/*...*/);
```

```ts
this.oidcSecurityService.getAuthenticationResult('configId').subscribe(/*...*/);
```

## getPayloadFromIdToken(encode = false, configId?: string)

Returns the payload from the id_token as an `Observable`. This can be used to get claims from the token.
If you are running with multiple configs and pass a `configId`, the payload for this config is returned. If you are running with multiple configs and do not pass a `configId`, the payload for the first config is returned. If you are running with a single config, the payload for this config returned.

By default (`encode = false`) the payload is decoded and returned as an object. Set `encode` to `true` to get the raw, base64url-encoded payload part of the token as a string instead. If there is no valid token, or no configuration is found, `{}` is emitted.

```ts
this.oidcSecurityService.getPayloadFromIdToken().subscribe(/*...*/);
```

```ts
this.oidcSecurityService.getPayloadFromIdToken(true, 'configId').subscribe(/*...*/);
```

## getPayloadFromAccessToken(encode = false, configId?: string)

Returns the payload from the access token as an `Observable`. This can be used to get claims from the token.
If you are running with multiple configs and pass a `configId`, the payload for this config is returned. If you are running with multiple configs and do not pass a `configId`, the payload for the first config is returned. If you are running with a single config, the payload for this config returned.

By default (`encode = false`) the payload is decoded and returned as an object. Set `encode` to `true` to get the raw, base64url-encoded payload part of the token as a string instead. If there is no valid token, or no configuration is found, `{}` is emitted.

```ts
this.oidcSecurityService.getPayloadFromAccessToken().subscribe(/*...*/);
```

```ts
this.oidcSecurityService.getPayloadFromAccessToken(true, 'configId').subscribe(/*...*/);
```

## setState(state: string, configId?: string)

You can set the state value used for the authorize request, if you have `autoCleanStateAfterAuthentication` in the configuration set to `false`. This can be used for custom state logic handling, the state is not automatically reset when set to `false`.
If you are running with multiple configs and pass a `configId`, the passed config is taken. If you are running with multiple configs and do not pass a `configId`, the first config is taken. If you are running with a single config, then this config is taken.

Returns an `Observable<boolean>` that tells whether the state was written. It is `false` if no configuration is found.

```ts
this.oidcSecurityService.setState('some-state').subscribe(/*...*/);
```

```ts
this.oidcSecurityService.setState('some-state', 'configId').subscribe(/*...*/);
```

## getState(configId?: string)

Returns the state value used for the authorize request as an `Observable`.
If you are running with multiple configs and pass a `configId`, the passed config is taken. If you are running with multiple configs and do not pass a `configId`, the first config is taken. If you are running with a single config, then this config is taken.

Emits an empty string if no configuration is found.

```ts
this.oidcSecurityService.getState().subscribe(/*...*/);
```

```ts
this.oidcSecurityService.getState('configId').subscribe(/*...*/);
```

## authorize(configId?: string, authOptions?: AuthOptions)

**Call this when the user initiates a sign-in** — typically from a "Login" button click handler, or when an auth guard determines the user needs to authenticate. It redirects the browser to the identity provider's login page.

> `authorize()` does **not** check or restore session state. That's the job of [`checkAuth()`](#checkauthurl-string-configid-string), which you call once on app load.

This method takes a `configId` if you want to target a specific config and an `authOptions` object with `customParams` or `redirectUrl` for per-call customization. It also accepts a `urlHandler` that is called instead of the redirect (useful if you need to construct the navigation yourself).

If no configuration is found for the `configId`, an error is thrown and reported as an unhandled error.

See also: [Custom parameters](custom-parameters.md).

```ts
export interface AuthOptions {
  customParams?: { [key: string]: string | number | boolean };
  urlHandler?(url: string): void;
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
  configId?: string;
  errorMessage?: string;
  errorDescription?: string;
}
```

If the user closes the popup, the observable emits a `LoginResponse` with `isAuthenticated: false` and `errorMessage: 'User closed popup'`. If no configuration is found for the `configId`, the observable errors.

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
  urlHandler?(url: string): void;
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
  .authorizeWithPopUp(authOptions, undefined, 'configId')
  .subscribe(({ isAuthenticated, userData, accessToken, idToken, configId }) => {
    // ...use data
  });
```

## forceRefreshSession(customParams?: { ... }, configId?: string)

This method manually refreshes the session at any time you require. If a refresh for this config is already running, no second refresh is started: the method waits for the running one to finish and returns its result. If the refresh fails with an error, or times out (`silentRenewTimeoutInSeconds`), the returned observable errors. If no configuration is found, the observable errors.

This method takes `customParams` for this request as well as a `configId` as parameter if you want to use a specific config. If you are running with multiple configs and pass a `configId`, the passed config is taken. If you are running with multiple configs and do not pass a `configId`, the first config is taken. If you are running with a single config, then this config is taken.

See also: [Custom parameters](custom-parameters.md)

If the refresh with an iframe (silent renew without refresh tokens) fails, `errorMessage` contains the error of the failed silent renew, e.g. the `error` returned by the identity provider such as `login_required`. If that callback also carried an `error_description`, it is set on `errorDescription`, which tells apart failures that share the same `error`.

The method returns an `Observable<LoginResponse>` containing

```ts
{
  isAuthenticated: boolean;
  userData: any;
  accessToken: string;
  idToken: string;
  configId?: string;
  errorMessage?: string;
  errorDescription?: string;
}
```

### Examples

```ts
this.oidcSecurityService.forceRefreshSession().subscribe(({ isAuthenticated, userData, accessToken, idToken, configId }) => {
  // ...use data
});
```

```ts
const customParams = {
  some: 'params',
};

this.oidcSecurityService
  .forceRefreshSession(customParams, 'configId')
  .subscribe(({ isAuthenticated, userData, accessToken, idToken, configId }) => {
    // ...use data
  });
```

## logoffAndRevokeTokens(configId?: string, logoutAuthOptions?: LogoutAuthOptions)

With this method the user is being logged out and the refresh token and the access token are revoked on the server. If the refresh token does not exist only the access token is revoked. Then the logout runs normally.

This method takes a `configId` and `logoutAuthOptions` as parameter and returns an observable. If you are running with multiple configs and pass the `configId` the passed config is taken. If you are running with multiple configs and do not pass the `configId` the first config is taken. If you are running with a single config this config is taken.

If the identity provider has no revocation endpoint, only `logoff()` runs. If revocation fails, the observable errors and no logout happens.

```ts
this.oidcSecurityService.logoffAndRevokeTokens().subscribe(/* ... */);
```

```ts
const logoutAuthOptions: LogoutAuthOptions = {
  customParams: {
    some: 'params',
  },
  urlHandler: () => {
    /* ... */
  },
};

this.oidcSecurityService.logoffAndRevokeTokens('configId', logoutAuthOptions).subscribe(/* ... */);
```

## logoff(configId?: string, logoutAuthOptions?: LogoutAuthOptions)

This method logs out on the server and the local client. Nothing happens until you subscribe. If no end session endpoint is available, or the check session reported that the server state changed, no server logout happens and the observable emits `null`. Note that the local session is **not** cleared in that case; call [`logoffLocal()`](#logofflocalconfigid-string) if you need it cleared. In all other cases the local auth data is cleared before the redirect or POST. The method takes a `configId` and `logoutAuthOptions` as parameter. If you are running with multiple configs and pass the `configId` the passed config is taken. If you are running with multiple configs and do not pass the `configId` the first config is taken. If you are running with a single config this config is taken.

`LogoutAuthOptions` accepts `customParams`, `urlHandler` and `logoffMethod`. With `logoffMethod: 'GET'` (Default = _'GET'_) the browser is redirected to the end session endpoint. With `'POST'` the end session request is sent with HTTP and the observable emits the response.

```ts
export interface LogoutAuthOptions {
  customParams?: { [key: string]: string | number | boolean };
  urlHandler?(url: string): void;
  logoffMethod?: 'GET' | 'POST';
}
```

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

The request is retried twice. If it still fails, or no configuration is found, the observable errors.

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

The request is retried twice. If it still fails, or no configuration is found, the observable errors.

More info: [https://tools.ietf.org/html/rfc7009](https://tools.ietf.org/html/rfc7009)

## getEndSessionUrl(customParams?: { ... }, configId?: string)

Creates the end session URL which can be used to implement your own custom server logout. You can pass custom params directly into the method. This method also takes a `configId`. If you are running with multiple configs and pass a `configId`, the passed config is taken. If you are running with multiple configs and do not pass a `configId`, the first config is taken. If you are running with a single config, then this config is taken.

Returns an `Observable<string | null>`. It emits `null` if no configuration or no end session endpoint is found.

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

The method returns an `Observable<string | null>`. It emits `null` if no configuration or redirect URL is found, and an empty string if the well-known endpoints are not loaded yet (call `preloadAuthWellKnownDocument()` first). Calling it creates and stores a new nonce and PKCE code verifier, just as a login does.

```ts
this.oidcSecurityService.getAuthorizeUrl().subscribe((authorizeUrl) => {
  /* ... */
});
```

```ts
const customParams = {
  some: 'params',
};

this.oidcSecurityService.getAuthorizeUrl(customParams, 'configId').subscribe((authorizeUrl) => {
  /* ... */
});
```
