## Angular Lib for OpenID Connect/OAuth2 Changelog

### 2020-11-20 Version 11.2.3

-   Added config tokenRefreshInSeconds which controls the time interval to run the startTokenValidationPeriodically
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/900)

### 2020-11-13 Version 11.2.2

-   Multiple tabs don't receive any event when session state becomes blank
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/896)
-   Fixed issue with browser history on silent renew redirect to IS
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/895)
-   UTC time fix
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/888)
-   Small fixes of docs and naming
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/887)

### 2020-10-23 Version 11.2.1

-   renewUserInfoAfterTokenRenew to OpenIdConfiguration
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/856)
-   Remove items from local storage instead of writing empty string values
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/872)

### 2020-08-08 Version 11.2.0

-   added possibility to pass url to check from the outside (for example to use in electron cases)
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/840)

### 2020-07-04 Version 11.1.4

-   checkAuthIncludingServer cannot complete without credentials
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/811) // Fixes [#779](https://github.com/damienbod/angular-auth-oidc-client/issues/779)
-   QueryParams are getting lost when doing a silent renew
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/812) // Fixes [#795](https://github.com/damienbod/angular-auth-oidc-client/issues/795)
-   Token endpoint errors not reported correctly
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/813) // Fixes [#805](https://github.com/damienbod/angular-auth-oidc-client/issues/805)

### 2020-06-04 Version 11.1.3

-   Refresh checksession iframe regularly
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/761) // Fixes [#756](https://github.com/damienbod/angular-auth-oidc-client/issues/756)
-   Load checksession iframe right after checkSessionService.start() is invoked
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/766) // fixes [#750](https://github.com/damienbod/angular-auth-oidc-client/issues/750)
-   Not throwing an exception if interceptor is set and config is loaded from http
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/774) // fixes [#772](https://github.com/damienbod/angular-auth-oidc-client/issues/772)
-   Bug fix: forceRefreshSession prematurely completes its observable [#767](https://github.com/damienbod/angular-auth-oidc-client/issues/767)
-   Bug fix: Returns tokens but doesn't apply them [#759](https://github.com/damienbod/angular-auth-oidc-client/issues/759)

### 2020-05-24 Version 11.1.2

-   Added support to check the STS for an authenticated session if not locally logged in (iframe silent renew)
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/752) // Fixes [#744](https://github.com/damienbod/angular-auth-oidc-client/issues/744)
-   fix config bug with eager loading of the well known endpoints
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/748)
-   prevent routing in silent renew requests with iframes
-   return tokens direct in forceRefreshSession

### 2020-05-16 Version 11.1.1

-   Added validation for the lib configuration
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/731) // Fixes [#725](https://github.com/damienbod/angular-auth-oidc-client/issues/725)
-   fixed some doc typos
-   fixed bug 2 auth events emitter on STS callback
    -   Fixes [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/731) // [#734](https://github.com/damienbod/angular-auth-oidc-client/issues/734)

### 2020-05-14 Version 11.1.0

-   Eager loading of well known endpoints can be configured: Made it possible to load the well known endpoints late (per configuration)
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/724) // [Docs](https://github.com/damienbod/angular-auth-oidc-client/blob/master/docs/features.md#delay-the-loading-or-pass-an-existing-well-knownopenid-configuration-configuration) // Fixes [#717](https://github.com/damienbod/angular-auth-oidc-client/issues/717)
-   make it possible to force a session refresh
    -   [PR](https://github.com/damienbod/angular-auth-oidc-client/pull/730) // Fixes [#729](https://github.com/damienbod/angular-auth-oidc-client/issues/729)

### 2020-05-12 Version 11.0.2

-   Add configuration property to disable auth_time validation in refresh flows with Azure B2C (Azure B2C implements this incorrectly)
-   Fix disable at_hash validation in refresh, this is not a required property
-   only use revocation endpoint if supported by the STS

### 2020-05-08 Version 11.0.1

-   Fixing the `Can't resolve all parameters for ...` error
-   Adding documentation to describe how to load configuration inside of child modules

### 2020-05-02 Version 11.0.0

-   Refactor lib config to make it easier to use
-   Update project to Angular 9 #610
-   added examples #625
-   support refresh tokens with example, and docs (coming safari change)
-   refactor configuration property names
-   eslint conform #627
-   Remove avoidable classes and add interfaces instead #626
-   Create Loglevel enum instead of boolean "isxyzactive" #628
-   Add prefix configuration for storage to allow multiple angular run in parallel #634
-   Add an event service with an enum to throw events out #635
-   Make folders for features not services, etc. #636
-   SilentRenew breaks when using refresh_token and refresh_token is expired/invalid #667
-   Pack the tests beside the files which are being tested when feature folders are available #637
-   support multiple instances in browser
-   Do not provide default config when config should have been set before #644
-   Code Verifier not cryptographically random #642
-   After successful login, getIsAuthorized still returns false for a bit. #549
-   Expose silent renew running observable #447
-   Issue with silent renew when js execution has been suspended #605
-   Add support for OAuth 2.0 Token Revocation #673
-   Silent renew dies if startRenew fails #617
-   support for Angular 8 , Angular 9
-   redesign login init
-   Remove avoidable anys #624
-   Use returned expired value of access token for expired validation
-   Id_Token is rejected because of timing issue when server hour is different then client hour
-   fix validate, fix max time offset #175
-   Support azp and multiple audiences #582
-   Add extra Refresh token validation #687
-   Notification that checking session is initialized #686
-   Refactor rxjs events, user profile events, silent renew, check session
-   Add support for EC certificates #645
-   id_token : alg : HS256 support #597
-   redesign docs

### 2020-02-14 version 10.0.15

-   Subscribe startRenew after isAuthorized is true
-   check session origin check improvement, support for non-domain urls

<a name="2020-01-24"></a>

### 2020-01-24 version 10.0.14

-   552-add-config-ignore-nonce-after-refresh
-   bug-xmlurlencode-has-newlines
-   clean up some file formats

<a name="2020-01-03"></a>

### 2020-01-03 version 10.0.11

-   Added renew process denotation to AuthorizationResult

<a name="2019-10-07"></a>

### 2019-10-07 version 10.0.10

-   bug fix logging, code flow callback

<a name="2019-10-05"></a>

### 2019-10-05 version 10.0.9

-   generic OidcSecurityService.getUserData
-   OidcSecurityService with some observables
-   Do not check idToken nonce when using refreshToken
-   strictNullChecks
-   safer-silent-renew

<a name="2019-09-20"></a>

### 2019-09-20 version 10.0.8

-   reduce size of the package

<a name="2019-09-11"></a>

### 2019-09-11 version 10.0.7

-   Ability to change the amount of seconds for the IsAuthorizedRace to do a Timeout

<a name="2019-09-05"></a>

### 2019-09-05 version 10.0.6

-   fixing url parse wo format
-   documentation fixes

<a name="2019-09-03"></a>

### 2019-09-03 version 10.0.5

-   use_refresh_token configuration added.

<a name="2019-09-01"></a>

### 2019-09-01 version 10.0.4

-   Added support for refresh tokens in code flow
-   expose logger service

<a name="2019-07-30"></a>

### 2019-07-30 version 10.0.3

-   Added a try catch to handle the CORS error that is thrown if the parent has a different origin htne the iframe. Issue #466

<a name="2019-06-25"></a>

### 2019-06-25 version 10.0.2

-   bug fix: onConfigurationLoaded does not fired
-   bug fix: [SSR] Session storage is not defined

<a name="2019-06-21"></a>

### 2019-06-21 version 10.0.1

-   revert angular build to angular 7, fix npm dist

<a name="2019-06-21"></a>

### 2019-05-24 version 10.0.0

-   remove silent_redirect_url only use silent_renew_url
-   refactored configuration for module, angular style
-   rename OpenIDImplicitFlowConfiguration to OpenIDConfiguration

## Breaking changes

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

-   authNonce not cleared in storage after unsuccessful login and logout
-   Should 5 seconds timeout on silent_renew be configurable? => fails fast now if server responds

<a name="2019-04-28"></a>

### 2019-04-28 version 9.0.7

-   increased length of state value for OIDC authorize request

<a name="2019-04-22"></a>

### 2019-04-22 version 9.0.6

-   session_state is optional for code flow

<a name="2019-04-14"></a>

### 2019-04-14 version 9.0.5

-   Added disable_iat_offset_validation configuration for clients with clock problems
-   Updated the Docs

<a name="2019-03-29"></a>

### 2019-03-29 version 9.0.4

-   Updated the Docs
-   Adding sample usage to repo

<a name="2019-03-22"></a>

### 2019-03-22 version 9.0.3

-   Updated the Docs
-   Changed to Angular-CLI builder
-   Added a sample in this repo

<a name="2019-02-27"></a>

### 2019-02-27 version 9.0.3

-   Add TokenHelperService to public API
-   logs: use !! to display getIdToken() and \_userData.value in silentRenewHeartBeatCheck()

<a name="2019-02-01"></a>

### 2019-02-01 version 9.0.2

-   bug fix at_hash is optional for code flow
-   removing session_state check from code flow response

<a name="2019-01-11"></a>

### 2019-01-11 version 9.0.1

-   Validation state in code callback redirect
-   Make it possible to turn off history clean up, so that the angular state is preserved.

<a name="2019-01-08"></a>

### 2019-01-08 version 9.0.0

-   Support for OpenID Connect Code Flow with PKCE

### Breaking changes:

Implicit flow callback renamed from authorizedCallback() to authorizedImplicitFlowCallback()

<a name="2018-11-16"></a>

### 2018-11-16 version 8.0.3

-   Changed iframe to avoid changing history state for repeated silent token renewals
-   make it possible to turn the iss validation off per configuration
-   reset history after OIDC callback with tokens

<a name="2018-11-07"></a>

### 2018-11-07 version 8.0.2

-   When `logOff()` is called storage should be cleared before emitting an authorization event.
-   AuthConfiguration object will now always return false for `start_checksession and silent_renew` properties when not running on a browser platform.

<a name="2018-11-02"></a>

### 2018-11-02 version 8.0.1

-   Adding an `onConfigurationChange` Observable to `OidcSecurityService

<a name="2018-10-31"></a>

### 2018-10-31 version 8.0.0

-   replaced eventemitters with Subjects/Observables and updated and docs
-   Optional url handler for logoff function
-   silent_renew is now off by default (false).
-   Fix for when token contains multiple dashes or underscores

<a name="2018-10-24"></a>

### 2018-10-20 version 7.0.3

-   Unicode special characters (accents and such) in JWT are now properly…

<a name="2018-10-20"></a>

### 2018-10-20 version 7.0.2

-   authorizedCallback should wait until the module is setup before running.

<a name="2018-10-18"></a>

### 2018-10-18 version 7.0.1

-   Check session will now be stopped when the user is logged out

<a name="2018-10-14"></a>

### 2018-10-14 version 7.0.0

-   Adding validation state result info to authorization event result
-   bug fixes in check session

<a name="2018-10-07"></a>

### 2018-10-07 version 6.0.12

-   Refactoring getIsAuthorized()
-   A blank `session_state` in the check session heartbeat should emit a …
-   Fixing inability to turn off silent_renew and adding safety timeout
-   check for valid tokens on start up

<a name="2018-10-03"></a>

### 2018-10-03 version 6.0.11

-   silent_renew inconsistent with execution

<a name="2018-09-14"></a>

### 2018-09-14 version 6.0.10

-   Handle callback params that contain equals char

<a name="2018-09-09"></a>

### 2018-09-09 version 6.0.7

-   Removing the fetch package, using the httpClient now instead

<a name="2018-08-18"></a>

### 2018-08-18 version 6.0.6

-   Add unique ending to key to prevent storage crossover
-   Public resetAuthorizationData method and getEndSessionUrl function
-   wso2 Identity Server audience validation failed support

<a name="2018-07-09"></a>

### 2018-07-09 version 6.0.2

-   Throw error when userinfo_endpoint is not defined (Azure AD)

<a name="2018-06-03"></a>

### 2018-06-03 version 6.0.1

-   Removing resource propety from the config, not used.
-   fixing silent renew bug

<a name="2018-05-05"></a>

### 2018-05-05 version 6.0.0

-   Updating src to support rxjs 6.1.0, Angular 6.0.0

<a name="2018-04-21"></a>

### 2018-04-31 version 4.1.1

-   Updating src to support typescript 2.7.2

<a name="2018-03-21"></a>

### 2018-03-31 version 4.1.0

-   Lightweight silent renew

<a name="2018-03-05"></a>

### 2018-03-05 version 4.0.3

-   added optional url handler parameter in the authorize function.

<a name="2018-02-23"></a>

### 2018-02-23 version 4.0.2

-   returning bool event from config service

<a name="2018-02-03"></a>

### 2018-02-03 version 4.0.1

-   silent renew fixes
-   check session renew fixes
-   adding error handling to config service, used for the APP_INITIALIZER

<a name="2018-01-15"></a>

### 2018-01-15 version 4.0.0

-   fixing init process, using APP_INITIALIZER, and proper support for angular guards
-   removed override_well_known_configuration, well_known_configuration now loaded from the APP_INITIALIZER
-   removed override_well_known_configuration_url, well_known_configuration now loaded from the APP_INITIALIZER

If you want to configure the well known endpoints locally, you need to set this to true.

### override_well_known_configuration_url

<a name="2018-01-08"></a>

### 2018-01-08 version 3.0.13

-   fixing rollup build

<a name="2018-01-06"></a>

### 2018-01-06 version 3.0.12

-   adding a check session event
-   adding onAuthorizationResult for the silent renew event
-   onAuthorizationResult is always sent now
-   no redirects are triggered for silent renews

<a name="2018-01-01"></a>

### 2018-01-01 version 3.0.11

-   bug fix incorrect user data type

<a name="2017-12-31"></a>

### 2017-12-31 version 3.0.10

-   bug fix silent renew error handling

<a name="2017-12-15"></a>

### 2017-12-15 version 3.0.9

-   bug fix aud string arrays not supported
-   bug fix user data set from id_token, when oidc user api is not supported
-   code clean up, package size

<a name="2017-12-10"></a>

### 2017-12-10 version 3.0.8

-   bug fix, rxjs imports

<a name="2017-12-10"></a>

### 2017-12-10 version 3.0.7

-   bug fix, rxjs imports

<a name="2017-12-10"></a>

### 2017-12-10 version 3.0.6

-   using lettable operators rxjs
-   bug fix, check session

<a name="2017-12-07"></a>

### 2017-11-06 version 3.0.5

-   refreshSession is now public

<a name="2017-11-06"></a>

### 2017-11-06 version 3.0.4

-   isAuthorized does not working on refresh

<a name="2017-11-03"></a>

### 2017-11-03 version 3.0.3

-   Add prompt= none to silent renew, according to the spec: in fact some op do not refresh the token in the absence of it. Related to: #14
-   Fix the starting of silent renew and check session after the authWellKnownEndpoint has been loaded, to avoid an undefined router (they use its info)
-   Fix(building): public api exports

<a name="2017-10-26"></a>

### 2017-10-26 version 3.0.2

-   fix: adding additional URL parameters to the authorize request in IE, Edge
-   documentation HTTPClient intercept

<a name="2017-10-21"></a>

### 2017-10-21 version 3.0.1

-   fixing peer dependency bug

<a name="2017-10-21"></a>

### 2017-10-21 version 3.0.0

-   Update to HttpClient

<a name="2017-10-20"></a>

### 2017-10-20 version 2.0.1

-   Removing forChild function, not used

<a name="2017-10-20"></a>

### 2017-10-20 version 2.0.0

-   Renaming startup_route to post_login_route
-   setting better default values for the configuration
-   Documentation fixes

<a name="2017-10-15"></a>

### 2017-10-15 version 1.3.19

-   Fix rxjs imports
-   Add optional hd parameter for Google Auth with particular G Suite domain, see https://developers.google.com/identity/protocols/OpenIDConnect#hd-param
-   fix: local_state is always null because is not being set
-   fix: change for emtpy header in id_token, improved logging

<a name="2017-10-05"></a>

### 2017-10-05 version 1.3.18

-   fix: Local Storage session_state undefined parse error

<a name="2017-10-03"></a>

### 2017-10-03 version 1.3.17

-   fix: silent renew fix after refresh

<a name="2017-09-26"></a>

### 2017-09-26 version 1.3.16

-   fix: OidcSecurityService emits onModuleSetup before authWellKnownEndpoints are loaded

<a name="2017-09-06"></a>

### 2017-09-06 version 1.3.15

-   fix: if auto_userinfo is false, we still need to execute runTokenValidation

<a name="2017-09-03"></a>

### 2017-09-03 version 1.3.14

-   Add silent_renew_offset_in_seconds option

<a name="2017-09-01"></a>

### 2017-09-01 version 1.3.13

-   Add option to trigger event on authorization resolution instead of automatic redirect

<a name="2017-08-27"></a>

### 2017-08-27 version 1.3.12

-   Throws Exception when the library is used in an application inside a iframe (cross domain)

<a name="2017-08-20"></a>

### 2017-08-20 version 1.3.11

-   updating jsrasign

<a name="2017-08-15"></a>

### 2017-08-15 version 1.3.9

-   endsession support for custom parameters

<a name="2017-08-13"></a>

### 2017-08-13 version 1.3.8

-   auto_clean_state_after_authentication which can be used for custom state logic handling

<a name="2017-08-11"></a>

### 2017-08-11 version 1.3.7

-   support for hash routes

<a name="2017-08-11"></a>

### 2017-08-11 version 1.3.6

-   support for custom authorization strings like Azure Active Directory B2C

<a name="2017-08-09"></a>

### 2017-08-09 version 1.3.4

-   Fix authorization url construction

<a name="2017-08-09"></a>

### 2017-08-09 version 1.3.3

-   adding moduleSetup boolean so that the authorization callback can wait until the module is ready

<a name="2017-08-09"></a>

### 2017-08-09 version 1.3.2

-   API new function for get id_token
-   API new function for get user info
-   user info configuration for auto get user info after login
-   API custom request params can be added to the authorization request URL using the setCustomRequestParameters function

<a name="2017-07-21"></a>

### 2017-07-21 version 1.3.1

-   bugfix error handling
-   bugfix configuration default values

<a name="2017-07-21"></a>

### 2017-07-21 version 1.3.0

-   bugfix refresh isAuthorized
-   bugfix refresh user data

<a name="2017-07-19"></a>

### 2017-07-19 version 1.2.2

-   support reading json file configurations

<a name="2017-07-12"></a>

### 2017-07-12 version 1.2.1

-   Fix types in storage class

<a name="2017-07-09"></a>

### 2017-07-06 version 1.2.0

-   support for SSR
-   support for custom storage

<a name="2017-07-06"></a>

### 2017-07-06 version 1.1.4

-   bugfix server side rendering, null check for storage

<a name="2017-07-01"></a>

### 2017-07-01 version 1.1.3

-   clean up session management
-   bugfix Silent token renew fails on state validation

<a name="2017-07-01"></a>

### 2017-07-01 version 1.1.2

-   API documentation

<a name="2017-06-28"></a>

### 2017-06-28 version 1.1.1

-   refactor init of module

<a name="2017-06-28"></a>

### 2017-06-28 version 1.0.8

-   setStorage method added
-   bug fix well known endpoints loaded logout.

<a name="2017-06-28"></a>

### 2017-06-28 version 1.0.6

-   Event for well known endpoints loaded
-   storage is can be set per function

<a name="2017-06-27"></a>

### 2017-06-27 version 1.0.5

-   Adding support for server rendering in Angular
-   storage can be set now

<a name="2017-06-23"></a>

### 2017-06-23 version 1.0.3

-   updating validation messages

<a name="2017-06-21"></a>

### 2017-06-21 version 1.0.2

-   Bug fix no kid validation withe single, multiple jwks headers

<a name="2017-06-20"></a>

### 2017-06-20 version 1.0.1

-   Bug fix validation

<a name="2017-06-20"></a>

### 2017-06-20 version 1.0.0

-   Version for OpenID Certification
-   support for decoded tokens

<a name="2017-06-20"></a>

### 2017-06-20 version 0.0.11

-   Adding a resource configuration

<a name="2017-06-17"></a>

### 2017-06-17 version 0.0.10

-   Validating kid in id_token header

<a name="2017-06-17"></a>

### 2017-06-17 version 0.0.9

-   remove manual dependency to jsrasign

<a name="2017-06-15"></a>

### 2017-06-15 version 0.0.8

-   build clean up
-   new configuration override for well known endpoints.

<a name="2017-06-14"></a>

### 2017-06-14 version 0.0.7

-   validate user data sub value

<a name="2017-06-14"></a>

### 2017-06-14

-   id_token flow
-   fixed rollup build

<a name="2017-06-13"></a>

### 2017-06-13

-   Adding some docs to the project

<a name="2017-06-13"></a>

### 2017-06-13

-   init
