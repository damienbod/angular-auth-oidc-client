import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { filter, skipWhile } from 'rxjs/operators';
import { OpenIdConfiguration } from '../../lib/angular-auth-oidc-client';
import { AuthModule } from '../../lib/modules/auth.module';
import { ConfigurationProvider } from '../../lib/services/auth-configuration.provider';
import { IFrameService } from '../../lib/services/existing-iframe.service';
import { LoggerService } from '../../lib/services/oidc.logger.service';
import { OidcSecurityService } from '../../lib/services/oidc.security.service';
import { OidcSecurityStorage } from '../../lib/services/oidc.security.storage';
import { TestLogging } from '../common/test-logging.service';
import { TestStorage } from '../common/test-storage.service';
import { OidcSecurityCommon } from '../../lib/services/oidc.security.common';

describe('OidcSecurityService', () => {
    let oidcSecurityService: OidcSecurityService;
    let configurationProvider: ConfigurationProvider;
    let oidcSecurityCommon: OidcSecurityCommon;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [BrowserModule, HttpClientModule, RouterTestingModule, AuthModule.forRoot()],
            providers: [
                OidcSecurityService,
                {
                    provide: OidcSecurityStorage,
                    useClass: TestStorage,
                },
                { provide: LoggerService, useClass: TestLogging },
                ConfigurationProvider,
                IFrameService,
            ],
        });
    });

    beforeEach(() => {
        oidcSecurityService = TestBed.get(OidcSecurityService);
        configurationProvider = TestBed.get(ConfigurationProvider);
        oidcSecurityCommon = TestBed.get(OidcSecurityCommon);
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
        // 	"response_types_supported":[ "code", "token", "id_token", "codetoken", "codeid_token", "tokenid_token", "codetokenid_token", "none" ],
        // 	"subject_types_supported":[ "public" ],
        // 	"id_token_signing_alg_values_supported":[ "RS256" ],
        // 	"scopes_supported":[ "openid", "email", "profile" ],
        // 	"token_endpoint_auth_methods_supported":[ "client_secret_post", "client_secret_basic" ],
        // 	"claims_supported":[ "aud", "email", "email_verified", "exp", "family_name", "given_name", "iat", "iss","locale","name","picture","sub"],
        // 	"code_challenge_methods_supported":["plain","S256"]}';
        // (oidcSecurityService as any).oidcSecurityCommon.store('wellknownendpoints', well);

        const config: OpenIdConfiguration = {};
        config.stsServer = 'https://localhost:5001';
        config.redirect_url = 'https://localhost:44386';
        config.client_id = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        config.response_type = 'id_token token';
        config.scope = 'openid email profile';
        config.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
        config.post_login_route = '/home';
        config.forbidden_route = '/Forbidden';
        config.unauthorized_route = '/Unauthorized';
        config.start_checksession = false;
        config.silent_renew = false;
        config.silent_renew_offset_in_seconds = 0;
        config.log_console_warning_active = true;
        config.log_console_debug_active = true;
        config.max_id_token_iat_offset_allowed_in_seconds = 10;

        configurationProvider.setup(config, null);

        const value = (oidcSecurityService as any).createAuthorizeUrl(
            false,
            '', // Implicit Flow
            config.redirect_url,
            'nonce',
            'state',
            'http://example'
        );

        const expectValue =
            'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
            '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
            '&response_type=id_token%20token' +
            '&scope=openid%20email%20profile' +
            '&nonce=nonce' +
            '&state=state';

        expect(value).toEqual(expectValue);
    });

    // https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-reference-oidc
    it('createAuthorizeUrl with custom url like active-directory-b2c', () => {
        const config: OpenIdConfiguration = {};

        config.stsServer = 'https://localhost:5001';
        config.redirect_url = 'https://localhost:44386';
        config.client_id = 'myid';
        config.response_type = 'id_token token';
        config.scope = 'openid email profile';
        config.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
        config.post_login_route = '/home';
        config.forbidden_route = '/Forbidden';
        config.unauthorized_route = '/Unauthorized';
        config.start_checksession = false;
        config.silent_renew = false;
        config.silent_renew_offset_in_seconds = 0;
        config.log_console_warning_active = true;
        config.log_console_debug_active = true;
        config.max_id_token_iat_offset_allowed_in_seconds = 10;

        configurationProvider.setup(config, null);

        const value = (oidcSecurityService as any).createAuthorizeUrl(
            false,
            '', // Implicit Flow
            config.redirect_url,
            'nonce',
            'state',
            'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_sign_in'
        );

        const expectValue =
            'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/authorize?p=b2c_1_sign_in' +
            '&client_id=myid' +
            '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
            '&response_type=id_token%20token' +
            '&scope=openid%20email%20profile' +
            '&nonce=nonce' +
            '&state=state';

        expect(value).toEqual(expectValue);
    });

    it('createEndSessionUrl with azure-ad-b2c policy parameter', () => {
        const config: OpenIdConfiguration = {};
        config.stsServer = 'https://localhost:5001';
        config.redirect_url = 'https://localhost:44386';
        config.client_id = 'myid';
        config.response_type = 'id_token token';
        config.scope = 'openid email profile';
        config.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
        config.post_login_route = '/home';
        config.forbidden_route = '/Forbidden';
        config.unauthorized_route = '/Unauthorized';
        config.start_checksession = false;
        config.silent_renew = false;
        config.silent_renew_offset_in_seconds = 0;
        config.log_console_warning_active = true;
        config.log_console_debug_active = true;
        config.max_id_token_iat_offset_allowed_in_seconds = 10;

        configurationProvider.setup(config, null);

        const value = (oidcSecurityService as any).createEndSessionUrl(
            'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/logout?p=b2c_1_sign_in',
            'UzI1NiIsImtpZCI6Il'
        );

        const expectValue =
            'https://login.microsoftonline.com/fabrikamb2c.onmicrosoft.com/oauth2/v2.0/logout?p=b2c_1_sign_in' +
            '&id_token_hint=UzI1NiIsImtpZCI6Il' +
            '&post_logout_redirect_uri=https%3A%2F%2Flocalhost%3A44386%2FUnauthorized';

        expect(value).toEqual(expectValue);
    });

    it('createAuthorizeUrl with custom value', () => {
        const config: OpenIdConfiguration = {};
        config.stsServer = 'https://localhost:5001';
        config.redirect_url = 'https://localhost:44386';
        config.client_id = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        config.response_type = 'id_token token';
        config.scope = 'openid email profile';
        config.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
        config.post_login_route = '/home';
        config.forbidden_route = '/Forbidden';
        config.unauthorized_route = '/Unauthorized';
        config.start_checksession = false;
        config.silent_renew = false;
        config.silent_renew_offset_in_seconds = 0;
        config.log_console_warning_active = true;
        config.log_console_debug_active = true;
        config.max_id_token_iat_offset_allowed_in_seconds = 10;

        oidcSecurityService.setCustomRequestParameters({
            testcustom: 'customvalue',
        });

        configurationProvider.setup(config, null);

        const value = (oidcSecurityService as any).createAuthorizeUrl(
            false,
            '', // Implicit Flow
            config.redirect_url,
            'nonce',
            'state',
            'http://example'
        );

        const expectValue =
            'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
            '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
            '&response_type=id_token%20token' +
            '&scope=openid%20email%20profile' +
            '&nonce=nonce' +
            '&state=state' +
            '&testcustom=customvalue';

        expect(value).toEqual(expectValue);
    });

    it('createAuthorizeUrl with custom values', () => {
        const config: OpenIdConfiguration = {};
        config.stsServer = 'https://localhost:5001';
        config.redirect_url = 'https://localhost:44386';
        config.client_id = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        config.response_type = 'id_token token';
        config.scope = 'openid email profile';
        config.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
        config.post_login_route = '/home';
        config.forbidden_route = '/Forbidden';
        config.unauthorized_route = '/Unauthorized';
        config.start_checksession = false;
        config.silent_renew = false;
        config.silent_renew_offset_in_seconds = 0;
        config.log_console_warning_active = true;
        config.log_console_debug_active = true;
        config.max_id_token_iat_offset_allowed_in_seconds = 10;

        configurationProvider.setup(config, null);

        oidcSecurityService.setCustomRequestParameters({
            t4: 'ABC abc 123',
            t3: '#',
            t2: '-_.!~*()',
            t1: ';,/?:@&=+$',
        });

        const value = (oidcSecurityService as any).createAuthorizeUrl(
            false,
            '', // Implicit Flow
            config.redirect_url,
            'nonce',
            'state',
            'http://example'
        );

        const expectValue =
            'http://example?client_id=188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com' +
            '&redirect_uri=https%3A%2F%2Flocalhost%3A44386' +
            '&response_type=id_token%20token' +
            '&scope=openid%20email%20profile' +
            '&nonce=nonce' +
            '&state=state&t4=ABC%20abc%20123&t3=%23&t2=-_.!~*()&t1=%3B%2C%2F%3F%3A%40%26%3D%2B%24';

        expect(value).toEqual(expectValue);
    });

    it('createEndSessionUrl default', () => {
        const config: OpenIdConfiguration = {};
        config.stsServer = 'https://localhost:5001';
        config.redirect_url = 'https://localhost:44386';
        config.client_id = '188968487735-b1hh7k87nkkh6vv84548sinju2kpr7gn.apps.googleusercontent.com';
        config.response_type = 'id_token token';
        config.scope = 'openid email profile';
        config.post_logout_redirect_uri = 'https://localhost:44386/Unauthorized';
        config.post_login_route = '/home';
        config.forbidden_route = '/Forbidden';
        config.unauthorized_route = '/Unauthorized';
        config.start_checksession = false;
        config.silent_renew = false;
        config.silent_renew_offset_in_seconds = 0;
        config.log_console_warning_active = true;
        config.log_console_debug_active = true;
        config.max_id_token_iat_offset_allowed_in_seconds = 10;

        configurationProvider.setup(config, null);

        const value = (oidcSecurityService as any).createEndSessionUrl('http://example', 'mytoken');

        const expectValue = 'http://example?id_token_hint=mytoken&post_logout_redirect_uri=https%3A%2F%2Flocalhost%3A44386%2FUnauthorized';

        expect(value).toEqual(expectValue);
    });

    it('authorizedImplicitFlowCallback should correctly parse hash params', () => {
        spyOn(oidcSecurityService as any, 'getSigningKeys').and.returnValue(of(null));

        const config: OpenIdConfiguration = {
            silent_renew: false,
        };

        const resultSetter = spyOnProperty((oidcSecurityService as any).oidcSecurityCommon, 'authResult', 'set');

        let hash = 'access_token=ACCESS-TOKEN&token_type=bearer&state=testState';
        const expectedResult = {
            access_token: 'ACCESS-TOKEN',
            token_type: 'bearer',
            state: 'testState',
        };

        configurationProvider.setup(config, null);

        (oidcSecurityService as OidcSecurityService).authorizedImplicitFlowCallback(hash);

        expect(resultSetter).not.toHaveBeenCalled();

        (oidcSecurityService as any)._isModuleSetup.next(true);

        expect(resultSetter).toHaveBeenCalledWith(expectedResult);

        // with '=' chars in values
        hash = 'access_token=ACCESS-TOKEN==&token_type=bearer&state=test=State';
        expectedResult.access_token = 'ACCESS-TOKEN==';
        expectedResult.state = 'test=State';

        (oidcSecurityService as OidcSecurityService).authorizedImplicitFlowCallback(hash);
        expect(resultSetter).toHaveBeenCalledWith(expectedResult);
    });

    it('logoff should call urlHandler', () => {
        const authwellknown = {
            end_session_endpoint: 'some_endpoint',
        };

        const logoffUrl = 'http://some_logoff_url';

        configurationProvider.setup(null, authwellknown);

        spyOn(oidcSecurityService as any, 'createEndSessionUrl').and.returnValue(logoffUrl);
        const redirectToSpy = spyOn(oidcSecurityService as any, 'redirectTo');

        let hasBeenCalled = false;

        (oidcSecurityService as OidcSecurityService).logoff((url: string) => {
            expect(url).toEqual(logoffUrl);
            hasBeenCalled = true;
        });

        expect(hasBeenCalled).toEqual(true);
        expect(redirectToSpy).not.toHaveBeenCalled();
    });

    it('logoff should redirect', () => {
        const authwellknown = {
            end_session_endpoint: 'some_endpoint',
        };

        const logoffUrl = 'http://some_logoff_url';

        configurationProvider.setup(null, authwellknown);

        spyOn(oidcSecurityService as any, 'createEndSessionUrl').and.returnValue(logoffUrl);
        const redirectToSpy = spyOn(oidcSecurityService as any, 'redirectTo');

        (oidcSecurityService as OidcSecurityService).logoff();

        expect(redirectToSpy).toHaveBeenCalledWith(logoffUrl);
    });

    it('logoff should reset storage data before emitting an _isAuthorized change', () => {
        const authwellknown = {};

        const resetStorageData = spyOn((oidcSecurityService as any).oidcSecurityCommon, 'resetStorageData');
        configurationProvider.setup(null, authwellknown);
        let hasBeenCalled = false;
        (oidcSecurityService as any)._isAuthorized
            .pipe(
                skipWhile((isAuthorized: boolean) => !isAuthorized),
                filter((isAuthorized: boolean) => !isAuthorized)
            )
            .subscribe(() => {
                expect(resetStorageData).toHaveBeenCalled();
                hasBeenCalled = true;
            });

        expect(hasBeenCalled).toEqual(false);

        (oidcSecurityService as any)._isAuthorized.next(true);
        (oidcSecurityService as OidcSecurityService).logoff();

        expect(hasBeenCalled).toEqual(true);
    });

    it('authorizedCallbackWithCode handles url correctly when hash at the end', () => {
        const urlToCheck = 'https://www.example.com/signin?code=thisisacode&state=0000.1234.000#';

        const spy = spyOn(oidcSecurityService, 'requestTokensWithCode$').and.callThrough();
        oidcSecurityService.authorizedCallbackWithCode(urlToCheck);

        expect(spy).toHaveBeenCalledWith('thisisacode', '0000.1234.000', null);
    });
    it('refresh session with refresh token should call authorized callback with isRenew running to true', done => {
        const config: OpenIdConfiguration = {};
        config.response_type = 'code';
        config.silent_renew = true;
        config.use_refresh_token = true;
        config.silent_renew_offset_in_seconds = 0;
        configurationProvider.setup(config, null);

        spyOn(oidcSecurityService as any, 'refreshTokensWithCodeProcedure').and.returnValue(of(true));
        spyOn(oidcSecurityCommon as any, 'getRefreshToken').and.returnValue('refresh token');
        oidcSecurityService.refreshSession().subscribe(() => {
            expect(oidcSecurityCommon.silentRenewRunning).toBe('running');
            done();
        });
    });
});
