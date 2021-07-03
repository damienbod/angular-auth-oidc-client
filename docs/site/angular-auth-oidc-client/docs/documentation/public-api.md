---
sidebar_label: Public API
sidebar_position: 1
---

# Public API

The most public accessible observables, properties and methods are placed in the `OidcSecurityService`. Below you can find the description of every single one of them.

## userData$

The `userData$` observable provides the information about the user after he has logged in. It returns an `ConfigUserDataResult` in the following form.

```ts
export interface ConfigUserDataResult {
  userData: any;
  allUserData: ConfigUserData[];
}

export interface ConfigUserData {
  configId: string;
  userData: any;
}
```

In case you are running with one configuration the `ConfigUserDataResult` contains the user data in the `userData` property and the `ConfigUserData[]` returns the same user data with the `configId` filled in case you need it.

In case you are running with multiple configs the `ConfigUserDataResult`s `userData` property is set to `null` and you find your user data per config in the `ConfigUserData[]`.

Example:

```ts
this.userData$ = this.oidcSecurityService.userData$;
```

Single Config:

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

Multiple Configs:

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

This property returns an `Observable<AuthenticatedResult>`. This object is filled depending on with how many configurations you run. The `AuthenticatedResult` is built as following:

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

In case you have a single config the `isAuthenticated` on the `AuthenticatedResult` tells you if you are authenticated or not. The `ConfigAuthenticatedResult[]` contains the single config result with it's `configId` and again if this config is authenticated or not.

In case you have multiple configs the `isAuthenticated` on the `AuthenticatedResult` tells you if all configs are authenticated (`true`) or not (`false`). The `ConfigAuthenticatedResult[]` contains the single config results with it's `configId` and again if this config is authenticated or not.

```ts
this.isAuthenticated$ = this.oidcSecurityService.isAuthenticated$;
```

Single Config

```json
{
  "isAuthenticated": true,
  "allConfigsAuthenticated": [{ "configId": "configId1", "isAuthenticated": true }]
}
```

Multiple Configs

```json
{
  "isAuthenticated": false,
  "allConfigsAuthenticated": [
    { "configId": "configId1", "isAuthenticated": true },
    { "configId": "configId2", "isAuthenticated": false }
  ]
}
```

## checkSessionChanged$

The `checkSessionChanged$` observable gets emitted values every time the server comes back with a check session and the value `changed`. If you want to get an information about when the CheckSession Event has been received generally take a look at the [public events](features.md#public-events).

Example:

```ts
this.checkSessionChanged$ = this.oidcSecurityService.checkSessionChanged$;
```

## stsCallback$

The `stsCallback$` observable gets emitted _after_ the library has handled the possible sts callback. You can perform initial setups and custom workflows inside your application when the STS redirects you back to your app.

Example:

```ts
this.stsCallback$ = this.oidcSecurityService.stsCallback$;
```

## getConfigurations()

This method returns all configurations you have configured as an `OpenIdConfiguration[]`. The config includes all your values merged with the ones the library created.

```ts
const allConfigs = this.oidcSecurityService.getConfigurations();
```

## getConfiguration(configId?: string)

This method returns one single configuration.
If you are running with multiple configs and pass the `configId` the configuration or `null` is returned. If you are running with multiple configs and do not pass the `configId` the first one is returned. If you are running with a single config this config is returned.

```ts
// one config or the first one in case of multiple or null
const singleConfig = this.oidcSecurityService.getConfiguration();

// one config or null
const singleConfig = this.oidcSecurityService.getConfiguration('configId');
```

## getUserData(configId?: string)

This method returns the user data.
If you are running with multiple configs and pass the `configId` the user data for this config or `null` is returned. If you are running with multiple configs and do not pass the `configId` the user data for the first config is returned. If you are running with a single config the user data for this is returned.

```ts
// one config or the first one in case of multiple or null
const userData = this.oidcSecurityService.getUserData();

// user data for this specific config
const userData = this.oidcSecurityService.getUserData('configId');
```

## checkAuth(url?: string, configId?: string)

This method starts the complete authentication flow. Use this method if you are running with a single config or want to check a single config.

This method parses the url when you come back from the Security Token Service (STS) and sets all values.

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

You can also pass a `configId` to check for as well as a url in case you want to overwrite the one in the address bar from the browser. This is useful for mobile or desktop cases like Electron or Cordova/Ionic.

```ts
const url = '...';
const configId = '...';

this.oidcSecurityService.checkAuth(url, configId).subscribe(({ isAuthenticated, userData, accessToken, idToken, configId }) => {
  // ...use data
});
```

## checkAuthMultiple(url?: string, configId?: string)

This method starts the complete authentication flow for multiple configs. Use this method if you are running with multiple configs to check which one is authenticated or not.

This method parses the url when you come back from the Security Token Service (STS) and sets all values.

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

You can also pass a `configId` to check for as well as a url in case you want to overwrite the one in the address bar from the browser. This is useful for mobile or desktop cases like Electron or Cordova/Ionic.

```ts
const url = '...';
const configId = '...';

this.oidcSecurityService.checkAuthMultiple(url, configId).subscribe(({ isAuthenticated, userData, accessToken, idToken, configId }) => {
  // ...use data
});
```

## isAuthenticated(configId?: string)

This method provides information if a config is authenticated or not as a `boolean` return value.
If you are running with multiple configs and pass the `configId` the authentication for this config is checked. If you are running with multiple configs and do not pass the `configId` the authentication for the first config is checked. If you are running with a single config this configuration is checked if you are authenticated.

```ts
const isAuthenticated = this.oidcSecurityService.isAuthenticated();
```

```ts
const isAuthenticated = this.oidcSecurityService.isAuthenticated('configId');
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

Returns the access token for your login scenario as a `string`.
If you are running with multiple configs and pass the `configId` the access token for this config is returned. If you are running with multiple configs and do not pass the `configId` the access token for the first config is returned. If you are running with a single config the access token for this config returned.

```ts
const accessToken = this.oidcSecurityService.getAccessToken();
```

```ts
const accessToken = this.oidcSecurityService.getAccessToken('configId');
```

## getIdToken(configId?: string):

Returns the id token for your login scenario as a `string`.
If you are running with multiple configs and pass the `configId` the id token for this config is returned. If you are running with multiple configs and do not pass the `configId` the id token for the first config is returned. If you are running with a single config the id token for this config returned.

```ts
const idToken = this.oidcSecurityService.getIdToken();
```

```ts
const idToken = this.oidcSecurityService.getIdToken('configId');
```

## getRefreshToken(configId?: string)

Returns the refresh token for you login scenario if there is one.
If you are running with multiple configs and pass the `configId` the refresh token for this config is returned. If you are running with multiple configs and do not pass the `configId` the refresh token for the first config is returned. If you are running with a single config the refresh token for this config returned.

```ts
const refreshToken = this.oidcSecurityService.getRefreshToken();
```

```ts
const refreshToken = this.oidcSecurityService.getRefreshToken('configId');
```

## getAuthenticationResult(configId?: string)

Returns the authentication result, if present, for the sign-in. The `configId` parameter is used to check define which configuration to use, this is only required when using multiple configurations. If not passed, the first config will be taken. A object with the authentication result is returned.

```ts
const authnResult = this.oidcSecurityService.getAuthenticationResult();
```

```ts
const authnResult = this.oidcSecurityService.getAuthenticationResult('configId');
```

## getPayloadFromIdToken(encode = false, configId?: string)

Returns the payload from the id_token. This can be used to get claims from the token.
If you are running with multiple configs and pass the `configId` the payload for this config is returned. If you are running with multiple configs and do not pass the `configId` the refresh token for the first config is returned. If you are running with a single config the refresh token for this config returned.

The `encode` param has to be set to `true` if the payload is base64 encoded.

```ts
const payload = this.oidcSecurityService.getPayloadFromIdToken();
```

```ts
const payload = this.oidcSecurityService.getPayloadFromIdToken(true, 'configId');
```

## setState(state: string, configId?: string)

You can set the state value used for the authorize request, if you have the `autoCleanStateAfterAuthentication` in the configuration set to `false`. Can be used for custom state logic handling, the state is not automatically reset when set to `false`.
If you are running with multiple configs and pass the `configId` the passed config is taken. If you are running with multiple configs and do not pass the `configId` the first config is taken. If you are running with a single config this config is taken.

```ts
this.oidcSecurityService.setState('some-state');
```

```ts
this.oidcSecurityService.setState('some-state', 'configId');
```

## getState(configId?: string)

Returns the state value used for the authorize request.
If you are running with multiple configs and pass the `configId` the passed config is taken. If you are running with multiple configs and do not pass the `configId` the first config is taken. If you are running with a single config this config is taken.

```ts
const state = this.oidcSecurityService.getState();
```

```ts
const state = this.oidcSecurityService.getState('configId');
```

## authorize(configId?: string, authOptions?: AuthOptions)

This method is being called when you want to redirect to the sts and login your user. This method takes a `configId` as parameter if you want to use a specific config and it also takes `authOptions` adding `customParams` which can change every time you want to login and an `urlHandler` which is getting called instead of the redirect.

See also [Custom parameters](features.md/#custom-parameters)

```ts
export interface AuthOptions {
  customParams?: { [key: string]: string | number | boolean };
  urlHandler?(url: string): any;
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

This method is being called when you want to redirect to the sts in a popup and login your user. This method takes a `configId` as parameter if you want to use a specific config and it also takes `authOptions` adding `customParams` which can change every time you want to login and an `urlHandler` which is getting called instead of the redirect. You can also pass `PopupOptions` to define where and how the popup should open.

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
}
```

Examples:

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
};

this.oidcSecurityService
  .authorizeWithPopUp(authOptions, null, 'configId')
  .subscribe(({ isAuthenticated, userData, accessToken, idToken, configId }) => {
    // ...use data
  });
```

## forceRefreshSession(customParams?: { ... }, configId?: string)

This method provides the functionality to manually refresh the session at any time you require. If a current process is running this method will do nothing. After the run is finished the method forces to refresh again.

This method takes `customParams` for this request as well as a `configId` as parameter if you want to use a specific config. If you are running with multiple configs and pass the `configId` the passed config is taken. If you are running with multiple configs and do not pass the `configId` the first config is taken. If you are running with a single config this config is taken.

See also [Custom parameters](features.md/#custom-parameters)

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

Examples:

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

## logoff(configId?: string, authOptions?: AuthOptions)

This method logs out on the server and the local client. If the server state has changed, check session, then only a local logout. The method takes a `configId` and `authOptions` as parameter. If you are running with multiple configs and pass the `configId` the passed config is taken. If you are running with multiple configs and do not pass the `configId` the first config is taken. If you are running with a single config this config is taken.

Examples:

```ts
this.oidcSecurityService.logoff();
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

this.oidcSecurityService.logoff('configId', authOptions);
```

## logoffLocal(configId?: string)

This method is used to reset your local session in the browser, but not sending anything to the server. If you are running with multiple configs and pass the `configId` the passed config is taken. If you are running with multiple configs and do not pass the `configId` the first config is taken. If you are running with a single config this config is taken.

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

This method revokes an access token on the Security Token Service. This is only required in the code flow with refresh tokens. If no token is provided, then the token from the storage is revoked. You can pass any token to revoke. This makes it possible to manage your own tokens.

This method also takes a `configId`. If you are running with multiple configs and pass the `configId` the passed config is taken. If you are running with multiple configs and do not pass the `configId` the first config is taken. If you are running with a single config this config is taken.

```ts
this.oidcSecurityService.revokeAccessToken().subscribe(/* ... */);
```

```ts
this.oidcSecurityService.revokeAccessToken('accessToken', 'configId').subscribe(/* ... */);
```

More info: [https://tools.ietf.org/html/rfc7009](https://tools.ietf.org/html/rfc7009)

## revokeRefreshToken(refreshToken?: any, configId?: string)

This method revokes a refresh token on the STS. This is only required in the code flow with refresh tokens. If no token is provided, then the token from the storage is revoked. You can pass any token to revoke. This makes it possible to manage your own tokens.

This method also takes a `configId`. If you are running with multiple configs and pass the `configId` the passed config is taken. If you are running with multiple configs and do not pass the `configId` the first config is taken. If you are running with a single config this config is taken.

```ts
this.oidcSecurityService.revokeRefreshToken().subscribe(/* ... */);
```

```ts
this.oidcSecurityService.revokeRefreshToken('refreshToken', 'configId').subscribe(/* ... */);
```

More info: [https://tools.ietf.org/html/rfc7009](https://tools.ietf.org/html/rfc7009)

## getEndSessionUrl(customParams?: { ... }, configId?: string)

Creates the ens session URL which can be used to implement your own custom server logout. You can pass custom params directly into the method. This method also takes a `configId`. If you are running with multiple configs and pass the `configId` the passed config is taken. If you are running with multiple configs and do not pass the `configId` the first config is taken. If you are running with a single config this config is taken.

```ts
const endSessionUrl = this.oidcSecurityService.getEndSessionUrl();
```

```ts
const customParams: {
  some: 'params';
};

const endSessionUrl = this.oidcSecurityService.getEndSessionUrl(customParams, 'configId');
```
