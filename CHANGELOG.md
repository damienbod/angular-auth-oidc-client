## Angular Lib for OpenID Connect/OAuth2 Changelog

### 2025-09-10 20.0.1

- Angular 20.2.3
- Bug: AuthResult type is no longer exported since 20.0.0
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/2128)

### 2025-09-05 20.0.0

- Angular 20.2.3
- Feat: Strict issuer validation on OIDC Discovery document retrieval
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/2116)

### 2025-07-22 19.0.2

- Fix silent refresh iframe with multiple idps
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/2107)

### 2025-05-11 19.0.1

- Wildcards in secure routes
- New lint rules
- Updated build
- fix: prevent event listener accumulation
- add debug log for redirectUrl check

### 2024-12-03 19.0.0

- Angular 19

### 2024-10-12 18.0.2

- Feat: log when provided configId does not exist
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/2010)
- Fix: auto login guard passes correct config id
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/2008)
- Feat: add guard autoLoginPartialRoutesGuardWithConfig for specific configuration
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/2000)
- Fix: Rudimentary fix for popup closing too early
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1988)
- merge the well-known endpoints with the config ones
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1984)
- Bugfix: Updated URL service isCallbackFromSts
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1976)

### 2024-06-21 18.0.1

- Fix issue #1954: Ensure CheckingAuthFinished event fires regardless of authentication state
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1961)
- feat: add support for route data to autoLoginPartialRoutesGuard
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1964)
- docs: add migration docs
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1960)

### 2024-06-06 18.0.0

- Support Angular 18

### 2024-05-31 17.1.0

- docs: add new signal properties to public api docs
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1944)
- fix(refresh-session): forceRefreshSession does not reset storageSilentRenewRunning
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1943)
- refactor example to control flow syntax
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1941)
- feat: add option to override the auth well known suffix
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1940)
- feat: add authenticated and userData signals
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1937)
- Bugfix: Updated URL service isCallbackFromSts
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1936)
- fix network error detection due to potential falsy instanceof ProgressEvent evaluation if ProgressEvent is monkey patched by another library
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1934)
- fix: refresh authWellKnownEndPoints
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1922)
- refactor: replace any types
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1919)
- fix: inject DOCUMENT
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1918)
- Moving to inject function
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1917)
- fix: adding missing field token_type from AuthResult.
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1907)

### 2024-02-03 17.0.0

- Support Angular 17

### 2023-08-27 16.0.1

- Fix problem in logoff when urlHandler option is present
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1825)
- Included authOptions in createBodyForParCodeFlowRequest - url.service.ts
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1823)
- Added useCustomAuth0Domain flag
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1821)
- Check if savedRouteForRedirect is null
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1812)
- Remove provided in root for interceptor
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1806)
- Support ng-add for standalone applications
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1800)
- Code improvement, remove cast
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1787)

### 2023-06-19 16.0.0

- Add provideAuth for standalone applications
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1643)
- Docs: adds docs for standalone methods
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1778)
- Docs: add standalone example
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1639)
- Fix: returning a loginresponse and not null
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1781)
- moved the setting of popupauth in storage before opening the popup wi…
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1776)
- Deprecate guard and update docs
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1782)

### 2023-05-05 15.0.5

- Bugfix id token expire check
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1751)

### 2023-04-15 15.0.4

- isCurrentlyInPopup will check for opener and session storage
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1719)
- Expand configuration per default
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1713)
- Move code storage values to store to simple boolean
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1710)
- Bugfix: Library fails on Firefox REOPEN #1621
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1704)
- added localstorage service. refactored missed jsdocs + fixed imports
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1666)
- adding provided in root to services
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1665)

### 2023-01-23 15.0.3

- fix(refreshSession): fix refreshSessionWithRefreshTokens

### 2022-11-27 15.0.2

- bugfix POST logout, missing parameters
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1612)

### 2022-11-26 15.0.1

- Add silent renew error event
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1592)
- Improve Popup flows
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1595)
- Bugfixes revocation
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1604)
- Updated project to Angular 15
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1590)

### 2022-11-18 15.0.0

- Support refresh tokens without returning an id_token in the refresh
- run silent renew using only the access token
- id_token only has to be valid on the first authentication
- add support to disable id_token validation completely, not recommended
- Renamed `enableIdTokenExpiredValidationInRenew` to `triggerRefreshWhenIdTokenExpired`
- Added `disableIdTokenValidation` parameter in config
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1571)
- `logoff()` possible now with `POST` request
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1582)
- removed deprecated `isLoading$` property
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1580)

Docs:
[Silent Renew](https://www.angular-auth-oidc-client.com/docs/documentation/silent-renew)

[Configuration](https://angular-auth-oidc-client.com/docs/documentation/configuration#disableidtokenvalidation)

[Migration V14 to V15](https://www.angular-auth-oidc-client.com/docs/migrations/v14-to-v15)

### 2022-09-21 14.1.5

- Exposing payload of access token
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1541)
- Fix bug in logoffAndRevokeTokens() which was not revoking the access token correctly
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1533)
- Fix checkSession messageHandler configuration correctly
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1526)
- fix: Use correct offset in ID token expiry check
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1529)

### 2022-08-26 14.1.4

- Bugfix/unable to extract jwk without kid
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1517)
- Make id_token_hint optional on session end logout
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1512)
- construction of token endpoint body breaks if pkce is disable
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1510)
- deprecating is loading
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1504)
- added build step for rxjs 6
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1502)
- Added console debug to fulfill browser filters
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1499)

### 2022-08-06 14.1.3

- Improve logging error messages
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1497)
- Support observable open id configuration in sts config http loader constructor
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1496)
- Fix sample links for azure implementations
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1495)
- Fix throwing config event
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1494)

### 2022-07-31 14.1.2

- Bugfix RxJS imports to be compatible with RxJS 6
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1491)
- Updated dependencies
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1488)
- Bugfix concurrent issue with renew and normal code flow
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1483)
- Add disablePkce config parameter
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1455)

### 2022-07-05 14.1.1

- Bugfix getUserData - You provided an invalid object where a stream was expected.
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1480)

### 2022-07-02 14.1.0

- Support Angular 14

### 2022-06-10 14.0.2

- Disable id_token time validation
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1451)

### 2022-05-22 14.0.1

- Fix regression in the check session service
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1440)

### 2022-04-18 14.0.0

In this version the APP_INITIALIZER was removed. ([See PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1307)).
The library will not do anything until the application interact with it. There is no pre-loading of anything and it does not affect your application's bootstrapping process at all.
You can however explicitly preload the secure token server well-known endpoints with a new method called [preloadAuthWellKnownDocument()](/docs/documentation/public-api#preloadauthwellknowndocumentconfigid-string). As a side effect because the config has to be loaded first, a lot of APIs become reactive and return an Observable now.

See the [migration guide](https://angular-auth-oidc-client.com/docs/migrations/v13-to-v14).

- refresh token rotation is now optional and can be activated using allowUnsafeReuseRefreshToken
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1342)
- Fixed getUrlParameter's handling of fragment response
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1359)
- isLoading observable in OidcSecurityService
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1353)
- Add redirectUrl customization (via AuthOptions)
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1372)
- Fix: implicit flow in popup window error (fixes #1385)
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1390)
- Enhancement: Improved abstract services
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1422)
- Remove double quotes in info messages
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1420)
- Enhancement: Added auth result
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1386)

### 2021-12-01 13.1.0

- Using window.crypto for jwt signature validation
- Removed jsrsasign dependency
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1220)

### 2021-11-19 13.0.0

- Update to Angular 13 and rxjs 7

### 2021-08-17 12.0.3

- docs(guards): use UrlTree for redirect, clean up
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1231)
- fixing storage mechanism
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1228)
- Additional logging when a nonce is created and validated
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1214)

### 2021-07-20 12.0.2

- Added fix overwriting prompt param
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1193)
- Unclear error message when providing improper config to module
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1186)
- added multiple configs documentation
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1183)
- Expose PopupService and PopupOptions as public
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1199)
- Support end session for Auth0 (non conform OIDC endpoint)
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1203)

### 2021-07-06 12.0.1

- Fix #1168 userInfoEndpoint Typo

### 2021-07-04 Version 12.0.0

- Configuration via forRoot(...) method

  - [Issue](https://github.com/damienbod/angular-auth-oidc-client/issues/747) | [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1041)

- Remove the "AuthorizedState" enum in Version 12

  - [Issue](https://github.com/damienbod/angular-auth-oidc-client/issues/755) | [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1062)

- Use a different key than redirect to store redirect route when using autologin

  - [Issue](https://github.com/damienbod/angular-auth-oidc-client/issues/1060) | [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1067)

- Returnvalue of loginwithpopup and login should be the same

  - [Issue](https://github.com/damienbod/angular-auth-oidc-client/issues/1048) | [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1066)

- How to provide client id during logoff

  - [Issue](https://github.com/damienbod/angular-auth-oidc-client/issues/932) | [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1069)

- urlHandler callback function parameter in LogoffRevocationService.logoff does nothing

  - [Issue](https://github.com/damienbod/angular-auth-oidc-client/issues/966) | [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1069)

- Convert all instances of "Authorized" to "Authenticated"

  - [Issue](https://github.com/damienbod/angular-auth-oidc-client/issues/1088) | [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1085)

- Support for multiple APIs with unique scopes

  - [Issue](https://github.com/damienbod/angular-auth-oidc-client/issues/885) | [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1085)

- Multiple access tokens for the same client_id but different scopes

  - [Issue](https://github.com/damienbod/angular-auth-oidc-client/issues/620) | [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1085)

- Is there a silent renew event？

  - [Issue](https://github.com/damienbod/angular-auth-oidc-client/issues/1011) | [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1085)

- Angular 12 Support

  - [Issue](https://github.com/damienbod/angular-auth-oidc-client/issues/1096) | [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1112)

- Add configuration to disable or enable id_token expired check

  - [Issue](https://github.com/damienbod/angular-auth-oidc-client/issues/1113) | [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1126)

- Support for Azure B2C multiple policies

  - [Issue](https://github.com/damienbod/angular-auth-oidc-client/issues/802) | [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1085)

- Improve AutoLoginSample

  - [Issue](https://github.com/damienbod/angular-auth-oidc-client/issues/1138) | [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1144)

- Accessing AuthResult response object

  - [Issue](https://github.com/damienbod/angular-auth-oidc-client/issues/536) | [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1142)

- Rename `stsServer` configuration parameter to `authority`

  - [Issue](https://github.com/damienbod/angular-auth-oidc-client/issues/1161) | [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1166)

- Only one returntype (object) when subscribing to isAuthenticated and user data to avoid confusion.

  - [Issue](https://github.com/damienbod/angular-auth-oidc-client/issues/1164) | [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1165)

### 2021-06-12 Version 11.6.11

- Silent renew does not always start
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1128)

### 2021-05-28 Version 11.6.10

- AutoLoginGuard appears to cause some sort of infinite loop.
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1102)

### 2021-05-16 Version 11.6.9

- Support Custom Params for EndSession and RefreshTokens Renew
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1093)
- Added Auth0 example
- Bugfix: the "use" attr on the jwks key is optional if only one key is present
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1089)

### 2021-05-04 Version 11.6.8

- bugfix incorrect storage for silent renew, requires Json object
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1086)

### 2021-05-01 Version 11.6.7

- Enable handling users closing login popup
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1058)
- Renamed all occurrences of "Persistance" to "Persistence"
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1064)
- Document public facing API
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1073)
- Exported and moved authOptions
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1076)
- Fix(randomService): fix misuse of Uint8Array
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1078)
- hooking into the zone again to avoid outside ngzone messages and throw event only when value change
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1082)
- fixed json stringify objects and storage
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1083)

### 2021-04-18 Version 11.6.6

- fix: use navigateByUrl to fix url params encoding
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1051)
- Store singing keys as fallback
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1047)
- Exposing popup options
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1045)

### 2021-04-11 Version 11.6.5

- Silent renew with refresh tokens - handle no connection use case
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1040)
- Added Guard CanLoad interface
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1038)

### 2021-03-13 Version 11.6.4

- Improve AutoLoginGuard
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1015)
- Add support custom params during token exchange
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1010)
- Clean up user data when autoUserInfo is false => from id_token
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1014)

### 2021-03-12 Version 11.6.3

- Inconsistent behavior of OidcSecurityService.userData$ Observable, if autoUserinfo is false
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1008)
- CheckSessionService keeps polling after logoffLocal() is invoked
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1009)

### 2021-03-05 Version 11.6.2

- Bugfix: Check session does not work when autoUserinfo is set to false in code flow with PKCE
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/990), [ISSUE](https://github.com/damienbod/angular-auth-oidc-client/issues/864)
- Bugfix: checkAuth returning null when href target="\_blank"
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/991), [ISSUE](https://github.com/damienbod/angular-auth-oidc-client/issues/983)
- Support silent renew with refresh tokens without scope offline access
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/998)
- Bugfix: Refresh response without an id token breaks mechanism
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/1000)

### 2021-02-27 Version 11.6.1

- Added AutoLoginGuard
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/987)
- Updated Azure AD, Azure B2C templates to prompt for select_account (problem with multiple accounts)

### 2021-02-24 Version 11.6.0

- Added support for OAuth Pushed authorisation requests (PAR)
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/978)
- Added Pushed authorisation requests (PAR) example
- Added OAuth Pushed authorisation requests (PAR) template using schematics
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/979)
- unsubscribe receivedUrl$ prevents multiple "/token" request
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/981)

### 2021-02-13 Version 11.5.1

- ApplicationRef.isStable is always false when using this package
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/965)

### 2021-02-02 Version 11.5.0

- Added support for authentication using a popup
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/960)
- Added popup sample
- Added Title to Silent Renew IFrame
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/958)

### 2021-02-02 Version 11.4.5

- Added Auth0 template using schematics

### 2021-02-02 Version 11.4.4

- Support aud arrays which are not ordered in id_token validation of refresh token process
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/950)
- Fixed Bug were Dynamic Custom Request Parameters are forgotten after first login or forceRefreshSession when doing a silent renew/refresh
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/947)

### 2021-01-19 Version 11.4.3

- Added ability to use Custom Parameters when calling ForceRefreshSession
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/941)
- Missing RefreshToken causes erroneous token request
  - [issue](https://github.com/damienbod/angular-auth-oidc-client/pull/909)
- Bug. App fully hang during silent renew
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/942)

### 2021-01-10 Version 11.4.2

- Added checksession null checks
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/937)

### 2021-01-10 Version 11.4.1

- Added event to throw when config could not be loaded
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/929)
- Check session fails if secure token server has a different origin than the check_session_iframe
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/933)
- Fix http config example and templates for HTTP config load
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/935)

### 2021-01-03 Version 11.4.0

- Adding schematics
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/876)
- Provided interceptor out of the lib
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/924)

### 2020-12-18 Version 11.3.0

- Update to Angular 11, fix tslib warnings
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/915)
- Use window object safely by injecting document
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/917)

### 2020-11-20 Version 11.2.4

- Do not clear session state when refreshing session with refresh tokens
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/905)

### 2020-11-20 Version 11.2.3

- Added config tokenRefreshInSeconds which controls the time interval to run the startTokenValidationPeriodically
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/900)

### 2020-11-13 Version 11.2.2

- Multiple tabs don't receive any event when session state becomes blank
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/896)
- Fixed issue with browser history on silent renew redirect to IS
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/895)
- UTC time fix
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/888)
- Small fixes of docs and naming
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/887)

### 2020-10-23 Version 11.2.1

- renewUserInfoAfterTokenRenew to OpenIdConfiguration
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/856)
- Remove items from local storage instead of writing empty string values
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/872)

### 2020-08-08 Version 11.2.0

- added possibility to pass url to check from the outside (for example to use in electron cases)
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/840)

### 2020-07-04 Version 11.1.4

- checkAuthIncludingServer cannot complete without credentials
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/811) // Fixes [#779](https://github.com/damienbod/angular-auth-oidc-client/issues/779)
- QueryParams are getting lost when doing a silent renew
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/812) // Fixes [#795](https://github.com/damienbod/angular-auth-oidc-client/issues/795)
- Token endpoint errors not reported correctly
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/813) // Fixes [#805](https://github.com/damienbod/angular-auth-oidc-client/issues/805)

### 2020-06-04 Version 11.1.3

- Refresh checksession iframe regularly
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/761) // Fixes [#756](https://github.com/damienbod/angular-auth-oidc-client/issues/756)
- Load checksession iframe right after checkSessionService.start() is invoked
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/766) // fixes [#750](https://github.com/damienbod/angular-auth-oidc-client/issues/750)
- Not throwing an exception if interceptor is set and config is loaded from http
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/774) // fixes [#772](https://github.com/damienbod/angular-auth-oidc-client/issues/772)
- Bug fix: forceRefreshSession prematurely completes its observable [#767](https://github.com/damienbod/angular-auth-oidc-client/issues/767)
- Bug fix: Returns tokens but doesn't apply them [#759](https://github.com/damienbod/angular-auth-oidc-client/issues/759)

### 2020-05-24 Version 11.1.2

- Added support to check the secure token server for an authenticated session if not locally logged in (iframe silent renew)
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/752) // Fixes [#744](https://github.com/damienbod/angular-auth-oidc-client/issues/744)
- fix config bug with eager loading of the well known endpoints
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/748)
- prevent routing in silent renew requests with iframes
- return tokens direct in forceRefreshSession

### 2020-05-16 Version 11.1.1

- Added validation for the lib configuration
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/731) // Fixes [#725](https://github.com/damienbod/angular-auth-oidc-client/issues/725)
- fixed some doc typos
- fixed bug 2 auth events emitter on secure token server callback
  - Fixes [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/731) // [#734](https://github.com/damienbod/angular-auth-oidc-client/issues/734)

### 2020-05-14 Version 11.1.0

- Eager loading of well known endpoints can be configured: Made it possible to load the well known endpoints late (per configuration)
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/724) // Fixes [#717](https://github.com/damienbod/angular-auth-oidc-client/issues/717)
- make it possible to force a session refresh
  - [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/730) // Fixes [#729](https://github.com/damienbod/angular-auth-oidc-client/issues/729)

### 2020-05-12 Version 11.0.2

- Add configuration property to disable auth_time validation in refresh flows with Azure B2C (Azure B2C implements this incorrectly)
- Fix disable at_hash validation in refresh, this is not a required property
- only use revocation endpoint if supported by the STS

### 2020-05-08 Version 11.0.1

- Fixing the `Can't resolve all parameters for ...` error
- Adding documentation to describe how to load configuration inside of child modules

### 2020-05-02 Version 11.0.0

- Refactor lib config to make it easier to use
- Update project to Angular 9 #610
- added examples #625
- support refresh tokens with example, and docs (coming safari change)
- refactor configuration property names
- eslint conform #627
- Remove avoidable classes and add interfaces instead #626
- Create Loglevel enum instead of boolean "isxyzactive" #628
- Add prefix configuration for storage to allow multiple angular run in parallel #634
- Add an event service with an enum to throw events out #635
- Make folders for features not services, etc. #636
- SilentRenew breaks when using refresh_token and refresh_token is expired/invalid #667
- Pack the tests beside the files which are being tested when feature folders are available #637
- support multiple instances in browser
- Do not provide default config when config should have been set before #644
- Code Verifier not cryptographically random #642
- After successful login, getIsAuthorized still returns false for a bit. #549
- Expose silent renew running observable #447
- Issue with silent renew when js execution has been suspended #605
- Add support for OAuth 2.0 Token Revocation #673
- Silent renew dies if startRenew fails #617
- support for Angular 8 , Angular 9
- redesign login init
- Remove avoidable anys #624
- Use returned expired value of access token for expired validation
- Id_Token is rejected because of timing issue when server hour is different then client hour
- fix validate, fix max time offset #175
- Support azp and multiple audiences #582
- Add extra Refresh token validation #687
- Notification that checking session is initialized #686
- Refactor rxjs events, user profile events, silent renew, check session
- Add support for EC certificates #645
- id_token : alg : HS256 support #597
- redesign docs

### 2020-02-14 version 10.0.15

- Subscribe startRenew after isAuthorized is true
- check session origin check improvement, support for non-domain urls

<a name="2020-01-24"></a>

### 2020-01-24 version 10.0.14

- 552-add-config-ignore-nonce-after-refresh
- bug-xmlurlencode-has-newlines
- clean up some file formats

<a name="2020-01-03"></a>

### 2020-01-03 version 10.0.11

- Added renew process denotation to AuthorizationResult

<a name="2019-10-07"></a>

### 2019-10-07 version 10.0.10

- bug fix logging, code flow callback

<a name="2019-10-05"></a>

### 2019-10-05 version 10.0.9

- generic OidcSecurityService.getUserData
- OidcSecurityService with some observables
- Do not check idToken nonce when using refreshToken
- strictNullChecks
- safer-silent-renew

<a name="2019-09-20"></a>

### 2019-09-20 version 10.0.8

- reduce size of the package

<a name="2019-09-11"></a>

### 2019-09-11 version 10.0.7

- Ability to change the amount of seconds for the IsAuthorizedRace to do a Timeout

<a name="2019-09-05"></a>

### 2019-09-05 version 10.0.6

- fixing url parse wo format
- documentation fixes

<a name="2019-09-03"></a>

### 2019-09-03 version 10.0.5

- use_refresh_token configuration added.

<a name="2019-09-01"></a>

### 2019-09-01 version 10.0.4

- Added support for refresh tokens in code flow
- expose logger service

<a name="2019-07-30"></a>

### 2019-07-30 version 10.0.3

- Added a try catch to handle the CORS error that is thrown if the parent has a different origin htne the iframe. Issue #466

<a name="2019-06-25"></a>

### 2019-06-25 version 10.0.2

- bug fix: onConfigurationLoaded does not fired
- bug fix: [SSR] Session storage is not defined

<a name="2019-06-21"></a>

### 2019-06-21 version 10.0.1

- revert angular build to angular 7, fix npm dist

<a name="2019-06-21"></a>

### 2019-05-24 version 10.0.0

- remove silent_redirect_url only use silent_renew_url
- refactored configuration for module, angular style
- rename OpenIDImplicitFlowConfiguration to OpenIDConfiguration

### Breaking changes

Before

```
this.oidcConfigService.onConfigurationLoaded.subscribe(() => {

	const openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
	openIDImplicitFlowConfiguration.stsServer = this.oidcConfigService.clientConfiguration.stsServer;
	openIDImplicitFlowConfiguration.redirect_url = this.oidcConfigService.clientConfiguration.redirect_url;
	openIDImplicitFlowConfiguration.client_id = this.oidcConfigService.clientConfiguration.client_id;
	openIDImplicitFlowConfiguration.response_type = this.oidcConfigService.clientConfiguration.response_type;

	...

	configuration.FileServer = this.oidcConfigService.clientConfiguration.apiFileServer;
	configuration.Server = this.oidcConfigService.clientConfiguration.apiServer;

	const authWellKnownEndpoints = new AuthWellKnownEndpoints();
	authWellKnownEndpoints.setWellKnownEndpoints(this.oidcConfigService.wellKnownEndpoints);

	this.oidcSecurityService.setupModule(openIDImplicitFlowConfiguration, authWellKnownEndpoints);
```

After

```

import {
    AuthModule,
    OidcSecurityService,
    ConfigResult,
    OidcConfigService,
    OpenIdConfiguration
} from 'angular-auth-oidc-client';

export function loadConfig(oidcConfigService: OidcConfigService) {
    console.log('APP_INITIALIZER STARTING');
    return () => oidcConfigService.load(`${window.location.origin}/api/ClientAppSettings`);
}

@NgModule({
    imports: [
        ...
        HttpClientModule,
        AuthModule.forRoot(),
    ],
    providers: [
        OidcConfigService,
        OidcSecurityService,
        {
            provide: APP_INITIALIZER,
            useFactory: loadConfig,
            deps: [OidcConfigService],
            multi: true
        }
    ],
    bootstrap: [AppComponent],
})

export class AppModule {

    constructor(
        private oidcSecurityService: OidcSecurityService,
        private oidcConfigService: OidcConfigService,
    ) {

        this.oidcConfigService.onConfigurationLoaded.subscribe((configResult: ConfigResult) => {

            const config: OpenIdConfiguration = {
                stsServer: configResult.customConfig.stsServer,
                redirect_url: configResult.customConfig.redirect_url,
                client_id: configResult.customConfig.client_id,
                response_type: configResult.customConfig.response_type,
                scope: configResult.customConfig.scope,
                post_logout_redirect_uri: configResult.customConfig.post_logout_redirect_uri,
                start_checksession: configResult.customConfig.start_checksession,
                silent_renew: configResult.customConfig.silent_renew,
                silent_renew_url: configResult.customConfig.redirect_url + '/silent-renew.html',
                post_login_route: configResult.customConfig.startup_route,
                forbidden_route: configResult.customConfig.forbidden_route,
                unauthorized_route: configResult.customConfig.unauthorized_route,
                log_console_warning_active: configResult.customConfig.log_console_warning_active,
                log_console_debug_active: configResult.customConfig.log_console_debug_active,
                max_id_token_iat_offset_allowed_in_seconds: configResult.customConfig.max_id_token_iat_offset_allowed_in_seconds,
                history_cleanup_off: true
                // iss_validation_off: false
                // disable_iat_offset_validation: true
            };

            this.oidcSecurityService.setupModule(config, configResult.authWellknownEndpoints);
        });
    }
}

```

<a name="2019-05-21"></a>

### 2019-05-21 version 9.0.8

- authNonce not cleared in storage after unsuccessful login and logout
- Should 5 seconds timeout on silent_renew be configurable? => fails fast now if server responds

<a name="2019-04-28"></a>

### 2019-04-28 version 9.0.7

- increased length of state value for OIDC authorize request

<a name="2019-04-22"></a>

### 2019-04-22 version 9.0.6

- session_state is optional for code flow

<a name="2019-04-14"></a>

### 2019-04-14 version 9.0.5

- Added disable_iat_offset_validation configuration for clients with clock problems
- Updated the Docs

<a name="2019-03-29"></a>

### 2019-03-29 version 9.0.4

- Updated the Docs
- Adding sample usage to repo

<a name="2019-03-22"></a>

### 2019-03-22 version 9.0.3

- Updated the Docs
- Changed to Angular-CLI builder
- Added a sample in this repo

<a name="2019-02-27"></a>

### 2019-02-27 version 9.0.3

- Add TokenHelperService to public API
- logs: use !! to display getIdToken() and \_userData.value in silentRenewHeartBeatCheck()

<a name="2019-02-01"></a>

### 2019-02-01 version 9.0.2

- bug fix at_hash is optional for code flow
- removing session_state check from code flow response

<a name="2019-01-11"></a>

### 2019-01-11 version 9.0.1

- Validation state in code callback redirect
- Make it possible to turn off history clean up, so that the angular state is preserved.

<a name="2019-01-08"></a>

### 2019-01-08 version 9.0.0

- Support for OpenID Connect Code Flow with PKCE

### Breaking changes:

Implicit flow callback renamed from authorizedCallback() to authorizedImplicitFlowCallback()

<a name="2018-11-16"></a>

### 2018-11-16 version 8.0.3

- Changed iframe to avoid changing history state for repeated silent token renewals
- make it possible to turn the iss validation off per configuration
- reset history after OIDC callback with tokens

<a name="2018-11-07"></a>

### 2018-11-07 version 8.0.2

- When `logOff()` is called storage should be cleared before emitting an authorization event.
- AuthConfiguration object will now always return false for `start_checksession and silent_renew` properties when not running on a browser platform.

<a name="2018-11-02"></a>

### 2018-11-02 version 8.0.1

- Adding an `onConfigurationChange` Observable to `OidcSecurityService

<a name="2018-10-31"></a>

### 2018-10-31 version 8.0.0

- replaced eventemitters with Subjects/Observables and updated and docs
- Optional url handler for logoff function
- silent_renew is now off by default (false).
- Fix for when token contains multiple dashes or underscores

<a name="2018-10-24"></a>

### 2018-10-20 version 7.0.3

- Unicode special characters (accents and such) in JWT are now properly…

<a name="2018-10-20"></a>

### 2018-10-20 version 7.0.2

- authorizedCallback should wait until the module is setup before running.

<a name="2018-10-18"></a>

### 2018-10-18 version 7.0.1

- Check session will now be stopped when the user is logged out

<a name="2018-10-14"></a>

### 2018-10-14 version 7.0.0

- Adding validation state result info to authorization event result
- bug fixes in check session

<a name="2018-10-07"></a>

### 2018-10-07 version 6.0.12

- Refactoring getIsAuthorized()
- A blank `session_state` in the check session heartbeat should emit a …
- Fixing inability to turn off silent_renew and adding safety timeout
- check for valid tokens on start up

<a name="2018-10-03"></a>

### 2018-10-03 version 6.0.11

- silent_renew inconsistent with execution

<a name="2018-09-14"></a>

### 2018-09-14 version 6.0.10

- Handle callback params that contain equals char

<a name="2018-09-09"></a>

### 2018-09-09 version 6.0.7

- Removing the fetch package, using the httpClient now instead

<a name="2018-08-18"></a>

### 2018-08-18 version 6.0.6

- Add unique ending to key to prevent storage crossover
- Public resetAuthorizationData method and getEndSessionUrl function
- wso2 Identity Server audience validation failed support

<a name="2018-07-09"></a>

### 2018-07-09 version 6.0.2

- Throw error when userinfo_endpoint is not defined (Azure AD)

<a name="2018-06-03"></a>

### 2018-06-03 version 6.0.1

- Removing resource propety from the config, not used.
- fixing silent renew bug

<a name="2018-05-05"></a>

### 2018-05-05 version 6.0.0

- Updating src to support rxjs 6.1.0, Angular 6.0.0

<a name="2018-04-21"></a>

### 2018-04-31 version 4.1.1

- Updating src to support typescript 2.7.2

<a name="2018-03-21"></a>

### 2018-03-31 version 4.1.0

- Lightweight silent renew

<a name="2018-03-05"></a>

### 2018-03-05 version 4.0.3

- added optional url handler parameter in the authorize function.

<a name="2018-02-23"></a>

### 2018-02-23 version 4.0.2

- returning bool event from config service

<a name="2018-02-03"></a>

### 2018-02-03 version 4.0.1

- silent renew fixes
- check session renew fixes
- adding error handling to config service, used for the APP_INITIALIZER

<a name="2018-01-15"></a>

### 2018-01-15 version 4.0.0

- fixing init process, using APP_INITIALIZER, and proper support for angular guards
- removed override_well_known_configuration, well_known_configuration now loaded from the APP_INITIALIZER
- removed override_well_known_configuration_url, well_known_configuration now loaded from the APP_INITIALIZER

If you want to configure the well known endpoints locally, you need to set this to true.

### override_well_known_configuration_url

<a name="2018-01-08"></a>

### 2018-01-08 version 3.0.13

- fixing rollup build

<a name="2018-01-06"></a>

### 2018-01-06 version 3.0.12

- adding a check session event
- adding onAuthorizationResult for the silent renew event
- onAuthorizationResult is always sent now
- no redirects are triggered for silent renews

<a name="2018-01-01"></a>

### 2018-01-01 version 3.0.11

- bug fix incorrect user data type

<a name="2017-12-31"></a>

### 2017-12-31 version 3.0.10

- bug fix silent renew error handling

<a name="2017-12-15"></a>

### 2017-12-15 version 3.0.9

- bug fix aud string arrays not supported
- bug fix user data set from id_token, when oidc user api is not supported
- code clean up, package size

<a name="2017-12-10"></a>

### 2017-12-10 version 3.0.8

- bug fix, rxjs imports

<a name="2017-12-10"></a>

### 2017-12-10 version 3.0.7

- bug fix, rxjs imports

<a name="2017-12-10"></a>

### 2017-12-10 version 3.0.6

- using lettable operators rxjs
- bug fix, check session

<a name="2017-12-07"></a>

### 2017-11-06 version 3.0.5

- refreshSession is now public

<a name="2017-11-06"></a>

### 2017-11-06 version 3.0.4

- isAuthorized does not working on refresh

<a name="2017-11-03"></a>

### 2017-11-03 version 3.0.3

- Add prompt= none to silent renew, according to the spec: in fact some op do not refresh the token in the absence of it. Related to: #14
- Fix the starting of silent renew and check session after the authWellKnownEndpoint has been loaded, to avoid an undefined router (they use its info)
- Fix(building): public api exports

<a name="2017-10-26"></a>

### 2017-10-26 version 3.0.2

- fix: adding additional URL parameters to the authorize request in IE, Edge
- documentation HTTPClient intercept

<a name="2017-10-21"></a>

### 2017-10-21 version 3.0.1

- fixing peer dependency bug

<a name="2017-10-21"></a>

### 2017-10-21 version 3.0.0

- Update to HttpClient

<a name="2017-10-20"></a>

### 2017-10-20 version 2.0.1

- Removing forChild function, not used

<a name="2017-10-20"></a>

### 2017-10-20 version 2.0.0

- Renaming startup_route to post_login_route
- setting better default values for the configuration
- Documentation fixes

<a name="2017-10-15"></a>

### 2017-10-15 version 1.3.19

- Fix rxjs imports
- Add optional hd parameter for Google Auth with particular G Suite domain, see https://developers.google.com/identity/protocols/OpenIDConnect#hd-param
- fix: local_state is always null because is not being set
- fix: change for emtpy header in id_token, improved logging

<a name="2017-10-05"></a>

### 2017-10-05 version 1.3.18

- fix: Local Storage session_state undefined parse error

<a name="2017-10-03"></a>

### 2017-10-03 version 1.3.17

- fix: silent renew fix after refresh

<a name="2017-09-26"></a>

### 2017-09-26 version 1.3.16

- fix: OidcSecurityService emits onModuleSetup before authWellKnownEndpoints are loaded

<a name="2017-09-06"></a>

### 2017-09-06 version 1.3.15

- fix: if auto_userinfo is false, we still need to execute runTokenValidation

<a name="2017-09-03"></a>

### 2017-09-03 version 1.3.14

- Add silent_renew_offset_in_seconds option

<a name="2017-09-01"></a>

### 2017-09-01 version 1.3.13

- Add option to trigger event on authorization resolution instead of automatic redirect

<a name="2017-08-27"></a>

### 2017-08-27 version 1.3.12

- Throws Exception when the library is used in an application inside a iframe (cross domain)

<a name="2017-08-20"></a>

### 2017-08-20 version 1.3.11

- updating jsrasign

<a name="2017-08-15"></a>

### 2017-08-15 version 1.3.9

- endsession support for custom parameters

<a name="2017-08-13"></a>

### 2017-08-13 version 1.3.8

- auto_clean_state_after_authentication which can be used for custom state logic handling

<a name="2017-08-11"></a>

### 2017-08-11 version 1.3.7

- support for hash routes

<a name="2017-08-11"></a>

### 2017-08-11 version 1.3.6

- support for custom authorization strings like Azure Active Directory B2C

<a name="2017-08-09"></a>

### 2017-08-09 version 1.3.4

- Fix authorization url construction

<a name="2017-08-09"></a>

### 2017-08-09 version 1.3.3

- adding moduleSetup boolean so that the authorization callback can wait until the module is ready

<a name="2017-08-09"></a>

### 2017-08-09 version 1.3.2

- API new function for get id_token
- API new function for get user info
- user info configuration for auto get user info after login
- API custom request params can be added to the authorization request URL using the setCustomRequestParameters function

<a name="2017-07-21"></a>

### 2017-07-21 version 1.3.1

- bugfix error handling
- bugfix configuration default values

<a name="2017-07-21"></a>

### 2017-07-21 version 1.3.0

- bugfix refresh isAuthorized
- bugfix refresh user data

<a name="2017-07-19"></a>

### 2017-07-19 version 1.2.2

- support reading json file configurations

<a name="2017-07-12"></a>

### 2017-07-12 version 1.2.1

- Fix types in storage class

<a name="2017-07-09"></a>

### 2017-07-06 version 1.2.0

- support for SSR
- support for custom storage

<a name="2017-07-06"></a>

### 2017-07-06 version 1.1.4

- bugfix server side rendering, null check for storage

<a name="2017-07-01"></a>

### 2017-07-01 version 1.1.3

- clean up session management
- bugfix Silent token renew fails on state validation

<a name="2017-07-01"></a>

### 2017-07-01 version 1.1.2

- API documentation

<a name="2017-06-28"></a>

### 2017-06-28 version 1.1.1

- refactor init of module

<a name="2017-06-28"></a>

### 2017-06-28 version 1.0.8

- setStorage method added
- bug fix well known endpoints loaded logout.

<a name="2017-06-28"></a>

### 2017-06-28 version 1.0.6

- Event for well known endpoints loaded
- storage is can be set per function

<a name="2017-06-27"></a>

### 2017-06-27 version 1.0.5

- Adding support for server rendering in Angular
- storage can be set now

<a name="2017-06-23"></a>

### 2017-06-23 version 1.0.3

- updating validation messages

<a name="2017-06-21"></a>

### 2017-06-21 version 1.0.2

- Bug fix no kid validation withe single, multiple jwks headers

<a name="2017-06-20"></a>

### 2017-06-20 version 1.0.1

- Bug fix validation

<a name="2017-06-20"></a>

### 2017-06-20 version 1.0.0

- Version for OpenID Certification
- support for decoded tokens

<a name="2017-06-20"></a>

### 2017-06-20 version 0.0.11

- Adding a resource configuration

<a name="2017-06-17"></a>

### 2017-06-17 version 0.0.10

- Validating kid in id_token header

<a name="2017-06-17"></a>

### 2017-06-17 version 0.0.9

- remove manual dependency to jsrasign

<a name="2017-06-15"></a>

### 2017-06-15 version 0.0.8

- build clean up
- new configuration override for well known endpoints.

<a name="2017-06-14"></a>

### 2017-06-14 version 0.0.7

- validate user data sub value

<a name="2017-06-14"></a>

### 2017-06-14

- id_token flow
- fixed rollup build

<a name="2017-06-13"></a>

### 2017-06-13

- Adding some docs to the project

<a name="2017-06-13"></a>

### 2017-06-13

- init
