import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { EMPTY } from 'rxjs';
import { filter, skipWhile } from 'rxjs/operators';
import { OpenIDImplicitFlowConfiguration } from '../../lib/modules/auth.configuration';
import { AuthModule } from '../../lib/modules/auth.module';
import { IFrameService } from '../../lib/services/existing-iframe.service';
import { OidcSecurityService } from '../../lib/services/oidc.security.service';
import { OidcSecurityStorage } from '../../lib/services/oidc.security.storage';
import { TestStorage } from '../common/test-storage.service';

describe('OidcSecurityService', () => {
    let oidcSecurityService: OidcSecurityService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [BrowserModule, HttpClientModule, RouterTestingModule, AuthModule.forRoot()],
            providers: [
                OidcSecurityService,
                {
                    provide: OidcSecurityStorage,
                    useClass: TestStorage,
                },
                IFrameService,
            ],
        });
    });

    beforeEach(() => {
        oidcSecurityService = TestBed.get(OidcSecurityService);
    });

    it('should create', () => {
        expect(oidcSecurityService).toBeTruthy();
    });

    it('createAuthorizeUrl default', () => {
        // let well = '{
        // 	"issuer":"https://accounts.google.com",
        // 	"authorization_endpoint":"https://accounts.google.com/o/oauth2/v2/auth",
        // 	"token_endpoint":"https://www.googleapis.com/oauth2/v4/token",
        // 	"userinfo_endpoint":"https://www.googleapis.com/oauth2/v3/userinfo",
        // 	"revocation_endpoint":"https://accounts.google.com/o/oauth2/revoke",
        // 	"jwks_uri":"https://www.googleapis.com/oauth2/v3/certs",
        // 	"response_types_supported":[ "code", "token", "id_token", "codetoken", "codeid_token",
        // "tokenid_token", "codetokenid_token", "none" ],
        // 	"subject_types_supported":[ "public" ],
        // 	"id_token_signing_alg_values_supported":[ "RS256" ],
        // 	"scopes_supported":[ "openid", "email", "profile" ],
        // 	"token_endpoint_auth_methods_supported":[ "client_secret_post", "client_secret_basic" ],
        // 	"claims_supported":[ "aud", "email", "email_verified", "exp", "family_name", "given_name",
        // "iat", "iss","locale","name","picture","sub"],
        // 	"code_challenge_methods_supported":["plain","S256"]}';
        // (oidcSecurityService as any).oidcSecurityCommon.store('wellknownendpoints', well);

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

        (oidcSecurityService as any).authConfiguration.init(openIDImplicitFlowConfiguration);

        oidcSecurityService.setupModule(openIDImplicitFlowConfiguration, null);

        const value = (oidcSecurityService as any).createAuthorizeUrl(
            false,
            '', // Implicit Flow
            openIDImplicitFlowConfiguration.redirect_url,
            'nonce',
            'state',
            'http://example'
        );

        const expectValue =
            // tslint:disable-next-line:max-line-length
            'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Flocalhost%3A44386&response_type=id_token%20token&scope=openid%20email%20profile&nonce=nonce&state=state';

        expect(value).toEqual(expectValue);
    });

    // https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-reference-oidc
    it('createAuthorizeUrl with custom url like active-directory-b2c', () => {
        const openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();

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

        (oidcSecurityService as any).authConfiguration.init(openIDImplicitFlowConfiguration);

        const value = (oidcSecurityService as any).createAuthorizeUrl(
            false,
            '', // Implicit Flow
            openIDImplicitFlowConfiguration.redirect_url,
            'nonce',
            'state',
            'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_sign_in'
        );

        const expectValue =
            // tslint:disable-next-line:max-line-length
            'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_sign_in&client_id=myid&redirect_uri=https%3A%2F%2Flocalhost%3A44386&response_type=id_token%20token&scope=openid%20email%20profile&nonce=nonce&state=state';

        expect(value).toEqual(expectValue);
    });

    it('createEndSessionUrl with azure-ad-b2c policy parameter', () => {
        const openIDImplicitFlowConfiguration = new OpenIDImplicitFlowConfiguration();
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

        (oidcSecurityService as any).authConfiguration.init(openIDImplicitFlowConfiguration);

        const value = (oidcSecurityService as any).createEndSessionUrl(
            'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/logout?p=b2c_1_sign_in',
            'UzI1NiIsImtpZCI6Il'
        );

        const expectValue =
            // tslint:disable-next-line:max-line-length
            'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/logout?p=b2c_1_sign_in&id_token_hint=UzI1NiIsImtpZCI6Il&post_logout_redirect_uri=https%3A%2F%2Flocalhost%3A44386%2FUnauthorized';

        expect(value).toEqual(expectValue);
    });

    it('createAuthorizeUrl with custom value', () => {
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

        (oidcSecurityService as any).authConfiguration.init(openIDImplicitFlowConfiguration);

        oidcSecurityService.setCustomRequestParameters({
            testcustom: 'customvalue',
        });

        const value = (oidcSecurityService as any).createAuthorizeUrl(
            false,
            '', // Implicit Flow
            openIDImplicitFlowConfiguration.redirect_url,
            'nonce',
            'state',
            'http://example'
        );
        const expectValue =
            // tslint:disable-next-line:max-line-length
            'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Flocalhost%3A44386&response_type=id_token%20token&scope=openid%20email%20profile&nonce=nonce&state=state&testcustom=customvalue';

        expect(value).toEqual(expectValue);
    });

    it('createAuthorizeUrl with custom values', () => {
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

        (oidcSecurityService as any).authConfiguration.init(openIDImplicitFlowConfiguration);

        oidcSecurityService.setCustomRequestParameters({
            t4: 'ABC abc 123',
            t3: '#',
            t2: '-_.!~*()',
            t1: ';,/?:@&=+$',
        });

        const value = (oidcSecurityService as any).createAuthorizeUrl(
            false,
            '', // Implicit Flow
            openIDImplicitFlowConfiguration.redirect_url,
            'nonce',
            'state',
            'http://example'
        );
        const expectValue =
            // tslint:disable-next-line:max-line-length
            'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Flocalhost%3A44386&response_type=id_token%20token&scope=openid%20email%20profile&nonce=nonce&state=state&t4=ABC%20abc%20123&t3=%23&t2=-_.!~*()&t1=%3B%2C%2F%3F%3A%40%26%3D%2B%24';

        expect(value).toEqual(expectValue);
    });

    it('createEndSessionUrl default', () => {
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

        (oidcSecurityService as any).authConfiguration.init(openIDImplicitFlowConfiguration);

        const value = (oidcSecurityService as any).createEndSessionUrl('http://example', 'mytoken');

        const expectValue = 'http://example?id_token_hint=mytoken&post_logout_redirect_uri=https%3A%2F%2Flocalhost%3A44386%2FUnauthorized';

        expect(value).toEqual(expectValue);
    });

    it('authorizedImplicitFlowCallback should correctly parse hash params', () => {
        spyOn((oidcSecurityService as any), 'getSigningKeys').and.returnValue(EMPTY);

        const resultSetter = spyOnProperty((oidcSecurityService as any).oidcSecurityCommon, 'authResult', 'set');

        let hash = 'access_token=ACCESS-TOKEN&token_type=bearer&state=testState';
        const expectedResult = {
            access_token: 'ACCESS-TOKEN',
            token_type: 'bearer',
            state: 'testState',
        };

        (oidcSecurityService as OidcSecurityService).authorizedImplicitFlowCallback(hash);

        expect(resultSetter).not.toHaveBeenCalled();

        (oidcSecurityService as any).isModuleSetupInternal.next(true);

        expect(resultSetter).toHaveBeenCalledWith(expectedResult);

        // with '=' chars in values
        hash = 'access_token=ACCESS-TOKEN==&token_type=bearer&state=test=State';
        expectedResult.access_token = 'ACCESS-TOKEN==';
        expectedResult.state = 'test=State';

        (oidcSecurityService as OidcSecurityService).authorizedImplicitFlowCallback(hash);
        expect(resultSetter).toHaveBeenCalledWith(expectedResult);
    });

    it('logoff should call urlHandler', () => {
        (oidcSecurityService as any).authWellKnownEndpoints = { end_session_endpoint: 'some_endpoint' };

        const logoffUrl = 'http://some_logoff_url';

        spyOn((oidcSecurityService as any), 'createEndSessionUrl').and.returnValue(logoffUrl);
        const redirectToSpy = spyOn((oidcSecurityService as any), 'redirectTo');

        let hasBeenCalled = false;

        (oidcSecurityService as OidcSecurityService).logoff((url: string) => {
            expect(url).toEqual(logoffUrl);
            hasBeenCalled = true;
        });

        expect(hasBeenCalled).toEqual(true);
        expect(redirectToSpy).not.toHaveBeenCalled();
    });

    it('logoff should redirect', () => {
        (oidcSecurityService as any).authWellKnownEndpoints = { end_session_endpoint: 'some_endpoint' };

        const logoffUrl = 'http://some_logoff_url';

        spyOn((oidcSecurityService as any), 'createEndSessionUrl').and.returnValue(logoffUrl);
        const redirectToSpy = spyOn((oidcSecurityService as any), 'redirectTo');

        (oidcSecurityService as OidcSecurityService).logoff();

        expect(redirectToSpy).toHaveBeenCalledWith(logoffUrl);
    });

    it('logoff should reset storage data before emitting an _isAuthorized change', () => {
        (oidcSecurityService as any).authWellKnownEndpoints = {};

        const resetStorageData = spyOn((oidcSecurityService as any).oidcSecurityCommon, 'resetStorageData');

        let hasBeenCalled = false;
        (oidcSecurityService as any).isAuthorizedInternal
            .pipe(
                skipWhile((isAuthorized: boolean) => !isAuthorized),
                filter((isAuthorized: boolean) => !isAuthorized)
            )
            .subscribe(() => {
                expect(resetStorageData).toHaveBeenCalled();
                hasBeenCalled = true;
            });

        expect(hasBeenCalled).toEqual(false);

        (oidcSecurityService as any).isAuthorizedInternal.next(true);
        (oidcSecurityService as OidcSecurityService).logoff();

        expect(hasBeenCalled).toEqual(true);
    });
});
