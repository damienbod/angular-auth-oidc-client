## angular-auth-oidc-client Changelog

<a name="2018-01-01"></a>
### 2017-01-01 version 3.0.11
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

