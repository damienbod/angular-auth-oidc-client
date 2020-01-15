import { TestBed } from '@angular/core/testing';
import { OpenIdConfiguration, OpenIdInternalConfiguration } from '../../lib/models/auth.configuration';
import { ConfigurationProvider } from '../../lib/services/auth-configuration.provider';
import { PlatformProvider } from '../../lib/services/platform.provider';

describe('ConfigurationProviderTests', () => {
    let configurationProvider: ConfigurationProvider;
    let platformProvider: PlatformProvider;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [ConfigurationProvider, PlatformProvider],
        });
    });

    beforeEach(() => {
        configurationProvider = TestBed.get(ConfigurationProvider);
        platformProvider = TestBed.get(PlatformProvider);
    });

    it('should create', () => {
        expect(configurationProvider).toBeTruthy();
    });

    it('setup defines openIDConfiguration', () => {
        configurationProvider.setup({}, null);

        expect(configurationProvider.openIDConfiguration).toBeDefined();
    });

    it('setup defines authwellknownendpoints', () => {
        const toPass = {
            issuer: '',
            jwks_uri: '',
            authorization_endpoint: '',
            token_endpoint: '',
            userinfo_endpoint: '',
            end_session_endpoint: '',
            check_session_iframe: '',
            revocation_endpoint: '',
            introspection_endpoint: '',
        };

        const expected = { ...toPass };

        configurationProvider.setup({}, toPass);

        expect(configurationProvider.wellKnownEndpoints).toEqual(expected);
    });

    it('setup defines default openIDConfiguration', () => {
        const defaultConfig: OpenIdInternalConfiguration = {
            stsServer: 'https://please_set',
            redirect_url: 'https://please_set',
            client_id: 'please_set',
            response_type: 'code',
            scope: 'openid email profile',
            hd_param: '',
            post_logout_redirect_uri: 'https://please_set',
            start_checksession: false,
            silent_renew: false,
            silent_renew_url: 'https://please_set',
            silent_renew_offset_in_seconds: 0,
            use_refresh_token: false,
            ignore_nonce_after_refresh: false,
            post_login_route: '/',
            forbidden_route: '/forbidden',
            unauthorized_route: '/unauthorized',
            auto_userinfo: true,
            auto_clean_state_after_authentication: true,
            trigger_authorization_result_event: false,
            log_console_warning_active: true,
            log_console_debug_active: false,
            iss_validation_off: false,
            history_cleanup_off: false,
            max_id_token_iat_offset_allowed_in_seconds: 3,
            isauthorizedrace_timeout_in_seconds: 5,
            disable_iat_offset_validation: false,
            storage: sessionStorage,
        };

        configurationProvider.setup({}, null);

        expect(configurationProvider.openIDConfiguration).toEqual(defaultConfig);
    });

    it('setup merges default and passed config', () => {
        const config = {
            stsServer: 'stsServer',
        };

        const expected = {
            stsServer: config.stsServer,
            redirect_url: 'https://please_set',
            client_id: 'please_set',
            response_type: 'code',
            scope: 'openid email profile',
            hd_param: '',
            post_logout_redirect_uri: 'https://please_set',
            start_checksession: false,
            silent_renew: false,
            silent_renew_url: 'https://please_set',
            silent_renew_offset_in_seconds: 0,
            use_refresh_token: false,
            ignore_nonce_after_refresh: false,
            post_login_route: '/',
            forbidden_route: '/forbidden',
            unauthorized_route: '/unauthorized',
            auto_userinfo: true,
            auto_clean_state_after_authentication: true,
            trigger_authorization_result_event: false,
            log_console_warning_active: true,
            log_console_debug_active: false,
            iss_validation_off: false,
            history_cleanup_off: false,
            max_id_token_iat_offset_allowed_in_seconds: 3,
            isauthorizedrace_timeout_in_seconds: 5,
            disable_iat_offset_validation: false,
            storage: sessionStorage,
        };

        configurationProvider.setup(config, null);

        expect(configurationProvider.openIDConfiguration).toEqual(expected);
    });

    it('setup sets special cases', () => {
        const config = {
            stsServer: 'stsServer',
            start_checksession: true,
            silent_renew: true,
        };

        const expected = {
            stsServer: config.stsServer,
            redirect_url: 'https://please_set',
            client_id: 'please_set',
            response_type: 'code',
            scope: 'openid email profile',
            hd_param: '',
            post_logout_redirect_uri: 'https://please_set',
            start_checksession: false,
            silent_renew: false,
            silent_renew_url: 'https://please_set',
            silent_renew_offset_in_seconds: 0,
            use_refresh_token: false,
            ignore_nonce_after_refresh: false,
            post_login_route: '/',
            forbidden_route: '/forbidden',
            unauthorized_route: '/unauthorized',
            auto_userinfo: true,
            auto_clean_state_after_authentication: true,
            trigger_authorization_result_event: false,
            log_console_warning_active: true,
            log_console_debug_active: false,
            iss_validation_off: false,
            history_cleanup_off: false,
            max_id_token_iat_offset_allowed_in_seconds: 3,
            isauthorizedrace_timeout_in_seconds: 5,
            disable_iat_offset_validation: false,
            storage: sessionStorage,
        };

        spyOnProperty(platformProvider, 'isBrowser').and.returnValue(false);

        configurationProvider.setup(config, null);

        expect(configurationProvider.openIDConfiguration).toEqual(expected);
    });

    it('setup calls setSpecialCases', () => {
        const config = {
            stsServer: 'stsServer',
            start_checksession: true,
            silent_renew: true,
            use_refresh_token: false,
        };

        const spy = spyOn(configurationProvider as any, 'setSpecialCases');

        configurationProvider.setup(config, null);

        expect(spy).toHaveBeenCalled();
    });

    it('onConfigurationChange gets called when config is set', () => {
        const config = {
            stsServer: 'stsServer',
            start_checksession: true,
            silent_renew: true,
            use_refresh_token: false,
        };

        const spy = spyOn((configurationProvider as any).onConfigurationChangeInternal, 'next');

        configurationProvider.setup(config, null);

        expect(spy).toHaveBeenCalled();
    });
});
