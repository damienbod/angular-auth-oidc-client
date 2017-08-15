import { inject, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { HttpModule, JsonpModule } from '@angular/http';

import { AuthModule } from './../../index';
import { OpenIDImplicitFlowConfiguration } from './../../index';
import { OidcSecurityService } from './../../index';

describe('OidcSecurityService', () => {

    beforeEach(() => {
        TestBed.configureTestingModule({
			imports: [
				BrowserModule,
				HttpModule,
				RouterTestingModule,
				JsonpModule,
				AuthModule.forRoot(),
			],
            providers: [
                OidcSecurityService
            ]
        });
    });

    it('createAuthorizeUrl default',
        inject([OidcSecurityService],
            (oidcSecurityService: OidcSecurityService) => {   
			
				// let well = '{ "issuer":"https://accounts.google.com", "authorization_endpoint":"https://accounts.google.com/o/oauth2/v2/auth", "token_endpoint":"https://www.googleapis.com/oauth2/v4/token", "userinfo_endpoint":"https://www.googleapis.com/oauth2/v3/userinfo", "revocation_endpoint":"https://accounts.google.com/o/oauth2/revoke", "jwks_uri":"https://www.googleapis.com/oauth2/v3/certs", "response_types_supported":[ "code", "token", "id_token", "codetoken", "codeid_token", "tokenid_token", "codetokenid_token", "none" ], "subject_types_supported":[ "public" ], "id_token_signing_alg_values_supported":[ "RS256" ], "scopes_supported":[ "openid", "email", "profile" ], "token_endpoint_auth_methods_supported":[ "client_secret_post", "client_secret_basic" ], "claims_supported":[ "aud", "email", "email_verified", "exp", "family_name", "given_name", "iat", "iss","locale","name","picture","sub"],"code_challenge_methods_supported":["plain","S256"]}';
				// (oidcSecurityService as any).oidcSecurityCommon.store('wellknownendpoints', well);
				
				let openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
				openIDImplicitFlowConfiguration.stsServer = 'https://localhost:5001';
				openIDImplicitFlowConfiguration.redirect_url = 'https://localhost:44386';
				openIDImplicitFlowConfiguration.client_id = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
				openIDImplicitFlowConfiguration.response_type = 'id_token token';
				openIDImplicitFlowConfiguration.scope = 'openid email profile';
				openIDImplicitFlowConfiguration.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
				openIDImplicitFlowConfiguration.startup_route = '/home';
				openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
				openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
				openIDImplicitFlowConfiguration.start_checksession = false;
				openIDImplicitFlowConfiguration.silent_renew = false;
				openIDImplicitFlowConfiguration.log_console_warning_active = true;
				openIDImplicitFlowConfiguration.log_console_debug_active = true;
				openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 10;
				openIDImplicitFlowConfiguration.override_well_known_configuration = true;
				openIDImplicitFlowConfiguration.override_well_known_configuration_url = 'https://localhost:44386/wellknownconfiguration.json';

				(oidcSecurityService as any).authConfiguration.init(openIDImplicitFlowConfiguration);
				//oidcSecurityService.setupModule(openIDImplicitFlowConfiguration);
			
                let value = (oidcSecurityService as any).createAuthorizeUrl('nonce', 'state', 'http://example');
                expect('http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com&redirect_uri=https://localhost:44386&response_type=id_token%20token&scope=openid%20email%20profile&nonce=nonce&state=state').toEqual(value);
            })
    );
	
	// https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-reference-oidc
	it('createAuthorizeUrl with custom url like active-directory-b2c',
        inject([OidcSecurityService],
            (oidcSecurityService: OidcSecurityService) => {   
			
				let openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
				openIDImplicitFlowConfiguration.stsServer = 'https://localhost:5001';
				openIDImplicitFlowConfiguration.redirect_url = 'https://localhost:44386';
				openIDImplicitFlowConfiguration.client_id = 'myid';
				openIDImplicitFlowConfiguration.response_type = 'id_token token';
				openIDImplicitFlowConfiguration.scope = 'openid email profile';
				openIDImplicitFlowConfiguration.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
				openIDImplicitFlowConfiguration.startup_route = '/home';
				openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
				openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
				openIDImplicitFlowConfiguration.start_checksession = false;
				openIDImplicitFlowConfiguration.silent_renew = false;
				openIDImplicitFlowConfiguration.log_console_warning_active = true;
				openIDImplicitFlowConfiguration.log_console_debug_active = true;
				openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 10;
				openIDImplicitFlowConfiguration.override_well_known_configuration = true;
				openIDImplicitFlowConfiguration.override_well_known_configuration_url = 'https://localhost:44386/wellknownconfiguration.json';

				(oidcSecurityService as any).authConfiguration.init(openIDImplicitFlowConfiguration);
				
                let value = (oidcSecurityService as any).createAuthorizeUrl('nonce', 'state', 'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_sign_in');
				let expectValue = 'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_sign_in&client_id=myid&redirect_uri=https://localhost:44386&response_type=id_token%20token&scope=openid%20email%20profile&nonce=nonce&state=state';
                expect(expectValue).toEqual(value);
            })
	);
		
	it('createEndSessionUrl with azure-ad-b2c policy parameter',
		inject([OidcSecurityService],
			(oidcSecurityService: OidcSecurityService) => {

				let openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
				openIDImplicitFlowConfiguration.stsServer = 'https://localhost:5001';
				openIDImplicitFlowConfiguration.redirect_url = 'https://localhost:44386';
				openIDImplicitFlowConfiguration.client_id = 'myid';
				openIDImplicitFlowConfiguration.response_type = 'id_token token';
				openIDImplicitFlowConfiguration.scope = 'openid email profile';
				openIDImplicitFlowConfiguration.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
				openIDImplicitFlowConfiguration.startup_route = '/home';
				openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
				openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
				openIDImplicitFlowConfiguration.start_checksession = false;
				openIDImplicitFlowConfiguration.silent_renew = false;
				openIDImplicitFlowConfiguration.log_console_warning_active = true;
				openIDImplicitFlowConfiguration.log_console_debug_active = true;
				openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 10;
				openIDImplicitFlowConfiguration.override_well_known_configuration = true;
				openIDImplicitFlowConfiguration.override_well_known_configuration_url = 'https://localhost:44386/wellknownconfiguration.json';

				(oidcSecurityService as any).authConfiguration.init(openIDImplicitFlowConfiguration);

				let value = (oidcSecurityService as any).createEndSessionUrl('https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/logout?p=b2c_1_sign_in','UzI1NiIsImtpZCI6Il')
				let expectValue = 'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/logout?p=b2c_1_sign_in&id_token_hint=UzI1NiIsImtpZCI6Il&post_logout_redirect_uri=https://localhost:44386/Unauthorized';
				expect(expectValue).toEqual(value);
			})
	);
	
	it('createAuthorizeUrl with custom value',
        inject([OidcSecurityService],
            (oidcSecurityService: OidcSecurityService) => {   
			
				let openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
				openIDImplicitFlowConfiguration.stsServer = 'https://localhost:5001';
				openIDImplicitFlowConfiguration.redirect_url = 'https://localhost:44386';
				openIDImplicitFlowConfiguration.client_id = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
				openIDImplicitFlowConfiguration.response_type = 'id_token token';
				openIDImplicitFlowConfiguration.scope = 'openid email profile';
				openIDImplicitFlowConfiguration.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
				openIDImplicitFlowConfiguration.startup_route = '/home';
				openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
				openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
				openIDImplicitFlowConfiguration.start_checksession = false;
				openIDImplicitFlowConfiguration.silent_renew = false;
				openIDImplicitFlowConfiguration.log_console_warning_active = true;
				openIDImplicitFlowConfiguration.log_console_debug_active = true;
				openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 10;
				openIDImplicitFlowConfiguration.override_well_known_configuration = true;
				openIDImplicitFlowConfiguration.override_well_known_configuration_url = 'https://localhost:44386/wellknownconfiguration.json';

				(oidcSecurityService as any).authConfiguration.init(openIDImplicitFlowConfiguration);
				
				oidcSecurityService.setCustomRequestParameters({'testcustom': 'customvalue'});
				
                let value = (oidcSecurityService as any).createAuthorizeUrl('nonce', 'state', 'http://example');
				let expectValue = 'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com&redirect_uri=https://localhost:44386&response_type=id_token%20token&scope=openid%20email%20profile&nonce=nonce&state=state&testcustom=customvalue';
                expect(expectValue).toEqual(value);
            })
    );
	
	it('createEndSessionUrl default',
        inject([OidcSecurityService],
            (oidcSecurityService: OidcSecurityService) => {   
			
				let openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
				openIDImplicitFlowConfiguration.stsServer = 'https://localhost:5001';
				openIDImplicitFlowConfiguration.redirect_url = 'https://localhost:44386';
				openIDImplicitFlowConfiguration.client_id = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
				openIDImplicitFlowConfiguration.response_type = 'id_token token';
				openIDImplicitFlowConfiguration.scope = 'openid email profile';
				openIDImplicitFlowConfiguration.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
				openIDImplicitFlowConfiguration.startup_route = '/home';
				openIDImplicitFlowConfiguration.forbidden_route = '/Forbidden';
				openIDImplicitFlowConfiguration.unauthorized_route = '/Unauthorized';
				openIDImplicitFlowConfiguration.start_checksession = false;
				openIDImplicitFlowConfiguration.silent_renew = false;
				openIDImplicitFlowConfiguration.log_console_warning_active = true;
				openIDImplicitFlowConfiguration.log_console_debug_active = true;
				openIDImplicitFlowConfiguration.max_id_token_iat_offset_allowed_in_seconds = 10;
				openIDImplicitFlowConfiguration.override_well_known_configuration = true;
				openIDImplicitFlowConfiguration.override_well_known_configuration_url = 'https://localhost:44386/wellknownconfiguration.json';

				(oidcSecurityService as any).authConfiguration.init(openIDImplicitFlowConfiguration);
				
                let value = (oidcSecurityService as any).createEndSessionUrl('http://example', "mytoken");
				let expectValue = 'http://example?id_token_hint=mytoken&post_logout_redirect_uri=https://localhost:44386/Unauthorized';
                expect(expectValue).toEqual(value);
            })
    );

	
});
