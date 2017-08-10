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

				oidcSecurityService.setupModule(openIDImplicitFlowConfiguration);
		
	
                let value = (oidcSecurityService as any).createAuthorizeUrl('nonce', 'state', 'http://example');
                expect('http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com&redirect_uri=https://localhost:44386&response_type=id_token token&scope=openid email profile&nonce=nonce&state=state').toEqual(value);
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

				oidcSecurityService.setupModule(openIDImplicitFlowConfiguration);
		
				oidcSecurityService.setCustomRequestParameters({'testcustom': 'customvalue'});
				
                let value = (oidcSecurityService as any).createAuthorizeUrl('nonce', 'state', 'http://example');
				let expectValue = 'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com&redirect_uri=https://localhost:44386&response_type=id_token token&scope=openid email profile&nonce=nonce&state=state&testcustom=customvalue';
                expect(expectValue).toEqual(value);
            })
    );

});
