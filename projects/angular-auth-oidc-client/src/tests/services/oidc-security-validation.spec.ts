import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthConfiguration, OpenIDImplicitFlowConfiguration } from '../../lib/modules/auth.configuration';
import { AuthModule } from '../../lib/modules/auth.module';
import { EqualityHelperService } from '../../lib/services/oidc-equality-helper.service';
import { LoggerService } from '../../lib/services/oidc.logger.service';
import { OidcSecurityStorage } from '../../lib/services/oidc.security.storage';
import { OidcSecurityValidation } from '../../lib/services/oidc.security.validation';
import { TestLogging } from '../common/test-logging.service';
import { TestStorage } from '../common/test-storage.service';

describe('OidcSecurityValidation', () => {
    let oidcSecurityValidation: OidcSecurityValidation;
    let authConfiguration: AuthConfiguration;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [BrowserModule, HttpClientModule, RouterTestingModule, AuthModule.forRoot()],
            providers: [
                AuthConfiguration,
                EqualityHelperService,
                OidcSecurityValidation,
                {
                    provide: OidcSecurityStorage,
                    useClass: TestStorage,
                },
                {
                    provide: LoggerService,
                    useClass: TestLogging,
                },
            ],
        });
    });

    beforeEach(() => {
        oidcSecurityValidation = TestBed.get(OidcSecurityValidation);
        authConfiguration = TestBed.get(AuthConfiguration);
    });

    it('validate aud string', () => {
        const openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
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

        authConfiguration.init(openIDImplicitFlowConfiguration);

        const dataIdToken = { aud: 'banana' };
        const valueTrue = oidcSecurityValidation.validate_id_token_aud(dataIdToken, 'banana');
        expect(valueTrue).toEqual(true);

        const valueFalse = oidcSecurityValidation.validate_id_token_aud(dataIdToken, 'bananammmm');
        expect(valueFalse).toEqual(false);
    });

    it('validate aud array', () => {
        const openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
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

        authConfiguration.init(openIDImplicitFlowConfiguration);

        const dataIdToken = {
            aud: ['banana', 'apple', 'https://nice.dom'],
        };
        const valueTrue = oidcSecurityValidation.validate_id_token_aud(dataIdToken, ['banana', 'apple', 'https://nice.dom']);
        expect(valueTrue).toEqual(true);

        const valueFalse = oidcSecurityValidation.validate_id_token_aud(dataIdToken, ['ooo', 'apple', 'https://nice.dom']);
        expect(valueFalse).toEqual(false);
    });
});
