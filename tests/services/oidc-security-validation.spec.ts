import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';

import { OpenIDImplicitFlowConfiguration } from '../../src/angular-auth-oidc-client';
import {
    AuthConfiguration,
    DefaultConfiguration
} from '../../src/modules/auth.configuration';
import { OidcSecurityCommon } from '../../src/services/oidc.security.common';
import { OidcSecurityValidation } from '../../src/services/oidc.security.validation';
import { TestStorage } from '../common/test-storage.service';
import { AuthModule } from './../../index';

describe('OidcSecurityService', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [
                BrowserModule,
                HttpClientModule,
                RouterTestingModule,
                AuthModule.forRoot()
            ],
            providers: []
        });
    });

    // beforeEach(() => {
    //     oidcSecurityService = TestBed.get(OidcSecurityService);
    // });

    it('validate aud string', () => {
        const authConfiguration = new AuthConfiguration(
            new DefaultConfiguration()
        );

        let openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
        openIDImplicitFlowConfiguration.stsServer = 'https://localhost:5001';
        openIDImplicitFlowConfiguration.redirect_url =
            'https://localhost:44386';
        openIDImplicitFlowConfiguration.client_id =
            '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        openIDImplicitFlowConfiguration.response_type = 'id_token token';
        openIDImplicitFlowConfiguration.scope = 'openid email profile';
        openIDImplicitFlowConfiguration.post_logout_redirect_uri =
            'https://localhost:44386/Unauthorized';
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
        openIDImplicitFlowConfiguration.override_well_known_configuration_url =
            'https://localhost:44386/wellknownconfiguration.json';

        authConfiguration.init(openIDImplicitFlowConfiguration);

        const oidcSecurityStorage = new TestStorage();

        const oidcSecurityCommon = new OidcSecurityCommon(
            authConfiguration,
            oidcSecurityStorage
        );

        const oidcSecurityValidation = new OidcSecurityValidation(
            oidcSecurityCommon
        );

        const dataIdToken = { aud: 'banana' };
        let valueTrue = oidcSecurityValidation.validate_id_token_aud(
            dataIdToken,
            'banana'
        );
        expect(valueTrue).toEqual(true);

        let valueFalse = oidcSecurityValidation.validate_id_token_aud(
            dataIdToken,
            'bananammmm'
        );
        expect(valueFalse).toEqual(false);
    });

    it('validate aud array', () => {
        const authConfiguration = new AuthConfiguration(
            new DefaultConfiguration()
        );

        let openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
        openIDImplicitFlowConfiguration.stsServer = 'https://localhost:5001';
        openIDImplicitFlowConfiguration.redirect_url =
            'https://localhost:44386';
        openIDImplicitFlowConfiguration.client_id =
            '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        openIDImplicitFlowConfiguration.response_type = 'id_token token';
        openIDImplicitFlowConfiguration.scope = 'openid email profile';
        openIDImplicitFlowConfiguration.post_logout_redirect_uri =
            'https://localhost:44386/Unauthorized';
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
        openIDImplicitFlowConfiguration.override_well_known_configuration_url =
            'https://localhost:44386/wellknownconfiguration.json';

        authConfiguration.init(openIDImplicitFlowConfiguration);

        const oidcSecurityStorage = new TestStorage();

        const oidcSecurityCommon = new OidcSecurityCommon(
            authConfiguration,
            oidcSecurityStorage
        );
        const oidcSecurityValidation = new OidcSecurityValidation(
            oidcSecurityCommon
        );

        const dataIdToken = {
            aud: ['banana', 'apple', 'https://nice.dom']
        };
        let valueTrue = oidcSecurityValidation.validate_id_token_aud(
            dataIdToken,
            ['banana', 'apple', 'https://nice.dom']
        );
        expect(valueTrue).toEqual(true);

        let valueFalse = oidcSecurityValidation.validate_id_token_aud(
            dataIdToken,
            ['ooo', 'apple', 'https://nice.dom']
        );
        expect(valueFalse).toEqual(false);
    });
});
