## angular-auth-oidc-client Changelog

<a name="2019-04-14"></a>
### 2019-04-14 version 9.0.5
* Added disable_iat_offset_validation configuration for clients with clock problems
* Updated the Docs

<a name="2019-03-29"></a>
### 2019-03-29 version 9.0.4
* Updated the Docs
* Adding sample usage to repo

<a name="2019-03-22"></a>
### 2019-03-22 version 9.0.3
* Updated the Docs
* Changed to Angular-CLI builder
* Added a sample in this repo

<a name="2019-02-27"></a>
### 2019-02-27 version 9.0.3
* Add TokenHelperService to public API
* logs: use !! to display getIdToken() and _userData.value in silentRenewHeartBeatCheck()

<a name="2019-02-01"></a>
### 2019-02-01 version 9.0.2
* bug fix at_hash is optional for code flow
* removing session_state check from code flow response

<a name="2019-01-11"></a>
### 2019-01-11 version 9.0.1
* Validation state in code callback redirect
* Make it possible to turn off history clean up, so that the angular state is preserved.

<a name="2019-01-08"></a>
### 2019-01-08 version 9.0.0
* Support for OpenID Connect Code Flow with PKCE

### Breaking changes:

Implicit flow callback renamed from authorizedCallback() to authorizedImplicitFlowCallback()

<a name="2018-11-16"></a>
### 2018-11-16 version 8.0.3
* Changed iframe to avoid changing history state for repeated silent token renewals
* make it possible to turn the iss validation off per configuration
* reset history after OIDC callback with tokens

<a name="2018-11-07"></a>
### 2018-11-07 version 8.0.2
* When `logOff()` is called storage should be cleared before emitting an authorization event.
* AuthConfiguration object will now always return false for `start_checksession and silent_renew` properties when not running on a browser platform.

<a name="2018-11-02"></a>
### 2018-11-02 version 8.0.1
* Adding an `onConfigurationChange` Observable to `OidcSecurityService

<a name="2018-10-31"></a>
### 2018-10-31 version 8.0.0
* replaced eventemitters with Subjects/Observables and updated and docs
* Optional url handler for logoff function 
* silent_renew is now off by default (false). 
* Fix for when token contains multiple dashes or underscores

<a name="2018-10-24"></a>
### 2018-10-20 version 7.0.3
* Unicode special characters (accents and such) in JWT are now properly…

<a name="2018-10-20"></a>
### 2018-10-20 version 7.0.2
* authorizedCallback should wait until the module is setup before running. 

<a name="2018-10-18"></a>
### 2018-10-18 version 7.0.1
* Check session will now be stopped when the user is logged out

<a name="2018-10-14"></a>
### 2018-10-14 version 7.0.0
* Adding validation state result info to authorization event result
* bug fixes in check session

<a name="2018-10-07"></a>
### 2018-10-07 version 6.0.12
* Refactoring getIsAuthorized()
* A blank `session_state` in the check session heartbeat should emit a …
* Fixing inability to turn off silent_renew and adding safety timeout
* check for valid tokens on start up

<a name="2018-10-03"></a>
### 2018-10-03 version 6.0.11
* silent_renew inconsistent with execution

<a name="2018-09-14"></a>
### 2018-09-14 version 6.0.10
* Handle callback params that contain equals char

<a name="2018-09-09"></a>
### 2018-09-09 version 6.0.7
* Removing the fetch package, using the httpClient now instead

<a name="2018-08-18"></a>
### 2018-08-18 version 6.0.6
* Add unique ending to key to prevent storage crossover
* Public resetAuthorizationData method and getEndSessionUrl function
* wso2 Identity Server audience validation failed support

<a name="2018-07-09"></a>
### 2018-07-09 version 6.0.2
* Throw error when userinfo_endpoint is not defined (Azure AD)

<a name="2018-06-03"></a>
### 2018-06-03 version 6.0.1
* Removing resource propety from the config, not used.
* fixing silent renew bug

<a name="2018-05-05"></a>
### 2018-05-05 version 6.0.0
* Updating src to support rxjs 6.1.0, Angular 6.0.0

<a name="2018-04-21"></a>
### 2018-04-31 version 4.1.1
* Updating src to support typescript 2.7.2

<a name="2018-03-21"></a>
### 2018-03-31 version 4.1.0
* Lightweight silent renew

<a name="2018-03-05"></a>
### 2018-03-05 version 4.0.3
* added optional url handler parameter in the authorize function.

<a name="2018-02-23"></a>
### 2018-02-23 version 4.0.2
* returning bool event from config service

<a name="2018-02-03"></a>
### 2018-02-03 version 4.0.1
* silent renew fixes
* check session renew fixes
* adding error handling to config service, used for the APP_INITIALIZER

<a name="2018-01-15"></a>
### 2018-01-15 version 4.0.0
* fixing init process, using APP_INITIALIZER, and proper support for angular guards
* removed override_well_known_configuration, well_known_configuration now loaded from the APP_INITIALIZER
* removed override_well_known_configuration_url, well_known_configuration now loaded from the APP_INITIALIZER

If you want to configure the well known endpoints locally, you need to set this to true.

### override_well_known_configuration_url
<a name="2018-01-08"></a>
### 2018-01-08 version 3.0.13
* fixing rollup build

<a name="2018-01-06"></a>
### 2018-01-06 version 3.0.12
* adding a check session event
* adding onAuthorizationResult for the silent renew event
* onAuthorizationResult is always sent now
* no redirects are triggered for silent renews

<a name="2018-01-01"></a>
### 2018-01-01 version 3.0.11
* bug fix incorrect user data type

<a name="2017-12-31"></a>
### 2017-12-31 version 3.0.10
* bug fix silent renew error handling

<a name="2017-12-15"></a>
### 2017-12-15 version 3.0.9
* bug fix aud string arrays not supported
* bug fix user data set from id_token, when oidc user api is not supported
* code clean up, package size 

<a name="2017-12-10"></a>
### 2017-12-10 version 3.0.8
* bug fix, rxjs imports

<a name="2017-12-10"></a>
### 2017-12-10 version 3.0.7
* bug fix, rxjs imports

<a name="2017-12-10"></a>
### 2017-12-10 version 3.0.6
* using lettable operators rxjs
* bug fix, check session

<a name="2017-12-07"></a>
### 2017-11-06 version 3.0.5
* refreshSession is now public

<a name="2017-11-06"></a>
### 2017-11-06 version 3.0.4
* isAuthorized does not working on refresh

<a name="2017-11-03"></a>
### 2017-11-03 version 3.0.3
* Add prompt= none to silent renew, according to the spec: in fact some op do not refresh the token in the absence of it. Related to: #14
* Fix the starting of silent renew and check session after the authWellKnownEndpoint has been loaded, to avoid an undefined router (they use its info)
* Fix(building): public api exports


<a name="2017-10-26"></a>
### 2017-10-26 version 3.0.2
* fix: adding additional URL parameters to the authorize request in IE, Edge
* documentation HTTPClient intercept

<a name="2017-10-21"></a>
### 2017-10-21 version 3.0.1
* fixing peer dependency bug

<a name="2017-10-21"></a>
### 2017-10-21 version 3.0.0
* Update to HttpClient

<a name="2017-10-20"></a>
### 2017-10-20 version 2.0.1
* Removing forChild function, not used

<a name="2017-10-20"></a>
### 2017-10-20 version 2.0.0
* Renaming startup_route to post_login_route
* setting better default values for the configuration
* Documentation fixes

<a name="2017-10-15"></a>
### 2017-10-15 version 1.3.19
* Fix rxjs imports
* Add optional hd parameter for Google Auth with particular G Suite domain, see https://developers.google.com/identity/protocols/OpenIDConnect#hd-param
* fix: local_state is always null because is not being set
* fix: change for emtpy header in id_token, improved logging

<a name="2017-10-05"></a>
### 2017-10-05 version 1.3.18
* fix: Local Storage session_state undefined parse error

<a name="2017-10-03"></a>
### 2017-10-03 version 1.3.17
* fix: silent renew fix after refresh

<a name="2017-09-26"></a>
### 2017-09-26 version 1.3.16
* fix: OidcSecurityService emits onModuleSetup before authWellKnownEndpoints are loaded

<a name="2017-09-06"></a>
### 2017-09-06 version 1.3.15
* fix: if auto_userinfo is false, we still need to execute runTokenValidation

<a name="2017-09-03"></a>
### 2017-09-03 version 1.3.14
* Add silent_renew_offset_in_seconds option

<a name="2017-09-01"></a>
### 2017-09-01 version 1.3.13
* Add option to trigger event on authorization resolution instead of automatic redirect

<a name="2017-08-27"></a>
### 2017-08-27 version 1.3.12
* Throws Exception when the library is used in an application inside a iframe (cross domain)

<a name="2017-08-20"></a>
### 2017-08-20 version 1.3.11
* updating jsrasign

<a name="2017-08-15"></a>
### 2017-08-15 version 1.3.9
* endsession support for custom parameters

<a name="2017-08-13"></a>
### 2017-08-13 version 1.3.8
* auto_clean_state_after_authentication which can be used for custom state logic handling

<a name="2017-08-11"></a>
### 2017-08-11 version 1.3.7
* support for hash routes 

<a name="2017-08-11"></a>
### 2017-08-11 version 1.3.6
* support for custom authorization strings like Azure Active Directory B2C

<a name="2017-08-09"></a>
### 2017-08-09 version 1.3.4
* Fix authorization url construction


<a name="2017-08-09"></a>
### 2017-08-09 version 1.3.3
* adding moduleSetup boolean so that the authorization callback can wait until the module is ready

<a name="2017-08-09"></a>
### 2017-08-09 version 1.3.2
* API new function for get id_token
* API new function for get user info
* user info configuration for auto get user info after login
* API custom request params can be added to the authorization request URL using the setCustomRequestParameters function

<a name="2017-07-21"></a>
### 2017-07-21 version 1.3.1
* bugfix error handling
* bugfix configuration default values

<a name="2017-07-21"></a>
### 2017-07-21 version 1.3.0
* bugfix refresh isAuthorized
* bugfix refresh user data

<a name="2017-07-19"></a>
### 2017-07-19 version 1.2.2
* support reading json file configurations

<a name="2017-07-12"></a>
### 2017-07-12 version 1.2.1
* Fix types in storage class

<a name="2017-07-09"></a>
### 2017-07-06 version 1.2.0
* support for SSR
* support for custom storage

<a name="2017-07-06"></a>
### 2017-07-06 version 1.1.4
* bugfix server side rendering, null check for storage

<a name="2017-07-01"></a>
### 2017-07-01 version 1.1.3
* clean up session management
* bugfix Silent token renew fails on state validation 

<a name="2017-07-01"></a>
### 2017-07-01 version 1.1.2
* API documentation

<a name="2017-06-28"></a>
### 2017-06-28 version 1.1.1
* refactor init of module

<a name="2017-06-28"></a>
### 2017-06-28 version 1.0.8
* setStorage method added
* bug fix well known endpoints loaded logout.


<a name="2017-06-28"></a>
### 2017-06-28 version 1.0.6
* Event for well known endpoints loaded
* storage is can be set per function

<a name="2017-06-27"></a>
### 2017-06-27 version 1.0.5
* Adding support for server rendering in Angular
* storage can be set now

<a name="2017-06-23"></a>
### 2017-06-23 version 1.0.3
* updating validation messages

<a name="2017-06-21"></a>
### 2017-06-21 version 1.0.2
* Bug fix no kid validation withe single, multiple jwks headers

<a name="2017-06-20"></a>
### 2017-06-20 version 1.0.1
* Bug fix validation


<a name="2017-06-20"></a>
### 2017-06-20 version 1.0.0
* Version for OpenID Certification
* support for decoded tokens

<a name="2017-06-20"></a>
### 2017-06-20 version 0.0.11
* Adding a resource configuration


<a name="2017-06-17"></a>
### 2017-06-17 version 0.0.10
* Validating kid in id_token header

<a name="2017-06-17"></a>
### 2017-06-17 version 0.0.9
* remove manual dependency to jsrasign

<a name="2017-06-15"></a>
### 2017-06-15 version 0.0.8
* build clean up
* new configuration override for well known endpoints.


<a name="2017-06-14"></a>
### 2017-06-14 version 0.0.7
* validate user data sub value

<a name="2017-06-14"></a>
### 2017-06-14
* id_token flow
* fixed rollup build

<a name="2017-06-13"></a>
### 2017-06-13
* Adding some docs to the project


<a name="2017-06-13"></a>
### 2017-06-13
* init

