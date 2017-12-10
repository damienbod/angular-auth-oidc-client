"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var testing_1 = require("@angular/core/testing");
var testing_2 = require("@angular/router/testing");
var platform_browser_1 = require("@angular/platform-browser");
var http_1 = require("@angular/common/http");
var index_1 = require("./../../index");
var index_2 = require("./../../index");
var index_3 = require("./../../index");
describe('OidcSecurityService', function () {
    beforeEach(function () {
        testing_1.TestBed.configureTestingModule({
            imports: [
                platform_browser_1.BrowserModule,
                http_1.HttpClientModule,
                testing_2.RouterTestingModule,
                index_1.AuthModule.forRoot(),
            ],
            providers: [
                index_3.OidcSecurityService
            ]
        });
    });
    it('createAuthorizeUrl default', testing_1.inject([index_3.OidcSecurityService], function (oidcSecurityService) {
        // let well = '{
        // 	"issuer":"https://accounts.google.com",
        // 	"authorization_endpoint":"https://accounts.google.com/o/oauth2/v2/auth",
        // 	"token_endpoint":"https://www.googleapis.com/oauth2/v4/token",
        // 	"userinfo_endpoint":"https://www.googleapis.com/oauth2/v3/userinfo",
        // 	"revocation_endpoint":"https://accounts.google.com/o/oauth2/revoke",
        // 	"jwks_uri":"https://www.googleapis.com/oauth2/v3/certs",
        // 	"response_types_supported":[ "code", "token", "id_token", "codetoken", "codeid_token", "tokenid_token", "codetokenid_token", "none" ],
        // 	"subject_types_supported":[ "public" ],
        // 	"id_token_signing_alg_values_supported":[ "RS256" ],
        // 	"scopes_supported":[ "openid", "email", "profile" ],
        // 	"token_endpoint_auth_methods_supported":[ "client_secret_post", "client_secret_basic" ],
        // 	"claims_supported":[ "aud", "email", "email_verified", "exp", "family_name", "given_name", "iat", "iss","locale","name","picture","sub"],
        // 	"code_challenge_methods_supported":["plain","S256"]}';
        // (oidcSecurityService as any).oidcSecurityCommon.store('wellknownendpoints', well);
        var openIDImplicitFlowConfiguration = new index_2.OpenIDImplicitFlowConfiguration();
        openIDImplicitFlowConfiguration.stsServer = 'https://localhost:5001';
        openIDImplicitFlowConfiguration.redirect_url = 'https://localhost:44386';
        openIDImplicitFlowConfiguration.client_id = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        openIDImplicitFlowConfiguration.response_type = 'id_token token';
        openIDImplicitFlowConfiguration.scope = 'openid email profile';
        openIDImplicitFlowConfiguration.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
        openIDImplicitFlowConfiguration.post_login_route = '/home';
        openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
        openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
        openIDImplicitFlowConfiguration.start_checksession = false;
        openIDImplicitFlowConfiguration.silent_renew = false;
        openIDImplicitFlowConfiguration.silent_renew_offset_in_seconds = 0;
        openIDImplicitFlowConfiguration.log_console_warning_active = true;
        openIDImplicitFlowConfiguration.log_console_debug_active = true;
        openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 10;
        openIDImplicitFlowConfiguration.override_well_known_configuration = true;
        openIDImplicitFlowConfiguration.override_well_known_configuration_url = 'https://localhost:44386/wellknownconfiguration.json';
        oidcSecurityService.authConfiguration.init(openIDImplicitFlowConfiguration);
        //oidcSecurityService.setupModule(openIDImplicitFlowConfiguration);
        var value = oidcSecurityService.createAuthorizeUrl('nonce', 'state', 'http://example');
        var expectValue = 'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Flocalhost%3A44386&response_type=id_token%20token&scope=openid%20email%20profile&nonce=nonce&state=state';
        expect(value).toEqual(expectValue);
    }));
    // https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-reference-oidc
    it('createAuthorizeUrl with custom url like active-directory-b2c', testing_1.inject([index_3.OidcSecurityService], function (oidcSecurityService) {
        var openIDImplicitFlowConfiguration = new index_2.OpenIDImplicitFlowConfiguration();
        openIDImplicitFlowConfiguration.stsServer = 'https://localhost:5001';
        openIDImplicitFlowConfiguration.redirect_url = 'https://localhost:44386';
        openIDImplicitFlowConfiguration.client_id = 'myid';
        openIDImplicitFlowConfiguration.response_type = 'id_token token';
        openIDImplicitFlowConfiguration.scope = 'openid email profile';
        openIDImplicitFlowConfiguration.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
        openIDImplicitFlowConfiguration.post_login_route = '/home';
        openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
        openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
        openIDImplicitFlowConfiguration.start_checksession = false;
        openIDImplicitFlowConfiguration.silent_renew = false;
        openIDImplicitFlowConfiguration.silent_renew_offset_in_seconds = 0;
        openIDImplicitFlowConfiguration.log_console_warning_active = true;
        openIDImplicitFlowConfiguration.log_console_debug_active = true;
        openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 10;
        openIDImplicitFlowConfiguration.override_well_known_configuration = true;
        openIDImplicitFlowConfiguration.override_well_known_configuration_url = 'https://localhost:44386/wellknownconfiguration.json';
        oidcSecurityService.authConfiguration.init(openIDImplicitFlowConfiguration);
        var value = oidcSecurityService.createAuthorizeUrl('nonce', 'state', 'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_sign_in');
        var expectValue = 'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_sign_in&client_id=myid&redirect_uri=https%3A%2F%2Flocalhost%3A44386&response_type=id_token%20token&scope=openid%20email%20profile&nonce=nonce&state=state';
        expect(value).toEqual(expectValue);
    }));
    it('createEndSessionUrl with azure-ad-b2c policy parameter', testing_1.inject([index_3.OidcSecurityService], function (oidcSecurityService) {
        var openIDImplicitFlowConfiguration = new index_2.OpenIDImplicitFlowConfiguration();
        openIDImplicitFlowConfiguration.stsServer = 'https://localhost:5001';
        openIDImplicitFlowConfiguration.redirect_url = 'https://localhost:44386';
        openIDImplicitFlowConfiguration.client_id = 'myid';
        openIDImplicitFlowConfiguration.response_type = 'id_token token';
        openIDImplicitFlowConfiguration.scope = 'openid email profile';
        openIDImplicitFlowConfiguration.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
        openIDImplicitFlowConfiguration.post_login_route = '/home';
        openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
        openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
        openIDImplicitFlowConfiguration.start_checksession = false;
        openIDImplicitFlowConfiguration.silent_renew = false;
        openIDImplicitFlowConfiguration.silent_renew_offset_in_seconds = 0;
        openIDImplicitFlowConfiguration.log_console_warning_active = true;
        openIDImplicitFlowConfiguration.log_console_debug_active = true;
        openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 10;
        openIDImplicitFlowConfiguration.override_well_known_configuration = true;
        openIDImplicitFlowConfiguration.override_well_known_configuration_url = 'https://localhost:44386/wellknownconfiguration.json';
        oidcSecurityService.authConfiguration.init(openIDImplicitFlowConfiguration);
        var value = oidcSecurityService.createEndSessionUrl('https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/logout?p=b2c_1_sign_in', 'UzI1NiIsImtpZCI6Il');
        var expectValue = 'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/logout?p=b2c_1_sign_in&id_token_hint=UzI1NiIsImtpZCI6Il&post_logout_redirect_uri=https%3A%2F%2Flocalhost%3A44386%2FUnauthorized';
        expect(value).toEqual(expectValue);
    }));
    it('createAuthorizeUrl with custom value', testing_1.inject([index_3.OidcSecurityService], function (oidcSecurityService) {
        var openIDImplicitFlowConfiguration = new index_2.OpenIDImplicitFlowConfiguration();
        openIDImplicitFlowConfiguration.stsServer = 'https://localhost:5001';
        openIDImplicitFlowConfiguration.redirect_url = 'https://localhost:44386';
        openIDImplicitFlowConfiguration.client_id = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        openIDImplicitFlowConfiguration.response_type = 'id_token token';
        openIDImplicitFlowConfiguration.scope = 'openid email profile';
        openIDImplicitFlowConfiguration.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
        openIDImplicitFlowConfiguration.post_login_route = '/home';
        openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
        openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
        openIDImplicitFlowConfiguration.start_checksession = false;
        openIDImplicitFlowConfiguration.silent_renew = false;
        openIDImplicitFlowConfiguration.silent_renew_offset_in_seconds = 0;
        openIDImplicitFlowConfiguration.log_console_warning_active = true;
        openIDImplicitFlowConfiguration.log_console_debug_active = true;
        openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 10;
        openIDImplicitFlowConfiguration.override_well_known_configuration = true;
        openIDImplicitFlowConfiguration.override_well_known_configuration_url = 'https://localhost:44386/wellknownconfiguration.json';
        oidcSecurityService.authConfiguration.init(openIDImplicitFlowConfiguration);
        oidcSecurityService.setCustomRequestParameters({ 'testcustom': 'customvalue' });
        var value = oidcSecurityService.createAuthorizeUrl('nonce', 'state', 'http://example');
        var expectValue = 'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Flocalhost%3A44386&response_type=id_token%20token&scope=openid%20email%20profile&nonce=nonce&state=state&testcustom=customvalue';
        expect(value).toEqual(expectValue);
    }));
    it('createAuthorizeUrl with custom values', testing_1.inject([index_3.OidcSecurityService], function (oidcSecurityService) {
        var openIDImplicitFlowConfiguration = new index_2.OpenIDImplicitFlowConfiguration();
        openIDImplicitFlowConfiguration.stsServer = 'https://localhost:5001';
        openIDImplicitFlowConfiguration.redirect_url = 'https://localhost:44386';
        openIDImplicitFlowConfiguration.client_id = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        openIDImplicitFlowConfiguration.response_type = 'id_token token';
        openIDImplicitFlowConfiguration.scope = 'openid email profile';
        openIDImplicitFlowConfiguration.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
        openIDImplicitFlowConfiguration.post_login_route = '/home';
        openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
        openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
        openIDImplicitFlowConfiguration.start_checksession = false;
        openIDImplicitFlowConfiguration.silent_renew = false;
        openIDImplicitFlowConfiguration.silent_renew_offset_in_seconds = 0;
        openIDImplicitFlowConfiguration.log_console_warning_active = true;
        openIDImplicitFlowConfiguration.log_console_debug_active = true;
        openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 10;
        openIDImplicitFlowConfiguration.override_well_known_configuration = true;
        openIDImplicitFlowConfiguration.override_well_known_configuration_url = 'https://localhost:44386/wellknownconfiguration.json';
        oidcSecurityService.authConfiguration.init(openIDImplicitFlowConfiguration);
        oidcSecurityService.setCustomRequestParameters({ 't4': 'ABC abc 123', 't3': '#', 't2': '-_.!~*()', 't1': ';,/?:@&=+$' });
        var value = oidcSecurityService.createAuthorizeUrl('nonce', 'state', 'http://example');
        var expectValue = 'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Flocalhost%3A44386&response_type=id_token%20token&scope=openid%20email%20profile&nonce=nonce&state=state&t4=ABC%20abc%20123&t3=%23&t2=-_.!~*()&t1=%3B%2C%2F%3F%3A%40%26%3D%2B%24';
        expect(value).toEqual(expectValue);
    }));
    it('createEndSessionUrl default', testing_1.inject([index_3.OidcSecurityService], function (oidcSecurityService) {
        var openIDImplicitFlowConfiguration = new index_2.OpenIDImplicitFlowConfiguration();
        openIDImplicitFlowConfiguration.stsServer = 'https://localhost:5001';
        openIDImplicitFlowConfiguration.redirect_url = 'https://localhost:44386';
        openIDImplicitFlowConfiguration.client_id = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        openIDImplicitFlowConfiguration.response_type = 'id_token token';
        openIDImplicitFlowConfiguration.scope = 'openid email profile';
        openIDImplicitFlowConfiguration.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
        openIDImplicitFlowConfiguration.post_login_route = '/home';
        openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
        openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
        openIDImplicitFlowConfiguration.start_checksession = false;
        openIDImplicitFlowConfiguration.silent_renew = false;
        openIDImplicitFlowConfiguration.silent_renew_offset_in_seconds = 0;
        openIDImplicitFlowConfiguration.log_console_warning_active = true;
        openIDImplicitFlowConfiguration.log_console_debug_active = true;
        openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 10;
        openIDImplicitFlowConfiguration.override_well_known_configuration = true;
        openIDImplicitFlowConfiguration.override_well_known_configuration_url = 'https://localhost:44386/wellknownconfiguration.json';
        oidcSecurityService.authConfiguration.init(openIDImplicitFlowConfiguration);
        var value = oidcSecurityService.createEndSessionUrl('http://example', 'mytoken');
        var expectValue = 'http://example?id_token_hint=mytoken&post_logout_redirect_uri=https%3A%2F%2Flocalhost%3A44386%2FUnauthorized';
        expect(value).toEqual(expectValue);
    }));
});
//# sourceMappingURL=oidc.security.service.spec.js.map