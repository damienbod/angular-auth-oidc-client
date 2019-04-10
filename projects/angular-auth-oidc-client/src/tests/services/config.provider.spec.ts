import { TestBed } from '@angular/core/testing';
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

    it('setup defines default openIDConfiguration', () => {
        configurationProvider.setup({}, null);

        expect(configurationProvider.openIDConfiguration.stsServer).toBe('https://localhost:44318');
    });

    it('setup defines openIDConfiguration', () => {
        const config = {
            stsServer: 'stsServer',
        };

        configurationProvider.setup(config, null);

        expect(configurationProvider.openIDConfiguration.stsServer).toBe(config.stsServer);
    });

    it('setup sets special cases', () => {
        const config = {
            stsServer: 'stsServer',
            start_checksession: true,
            silent_renew: true,
        };

        spyOnProperty(platformProvider, 'isBrowser').and.returnValue(false);

        configurationProvider.setup(config, null);

        expect(configurationProvider.openIDConfiguration.stsServer).toBe(config.stsServer);
        expect(configurationProvider.openIDConfiguration.start_checksession).toBe(false);
        expect(configurationProvider.openIDConfiguration.silent_renew).toBe(false);
    });

    it('setup calls setSpecialCases', () => {
        const config = {
            stsServer: 'stsServer',
            start_checksession: true,
            silent_renew: true,
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
        };

        const spy = spyOn((configurationProvider as any).onConfigurationChangeInternal, 'next');

        configurationProvider.setup(config, null);

        expect(spy).toHaveBeenCalled();
    });
});

// @Injectable({ providedIn: 'root' })
// export class ConfigurationProvider {
//   private configurationDone = new Subject();
//   private mergedOpenIdConfiguration: OpenIdConfiguration = null;
//   private authWellKnownEndpoints: AuthWellKnownEndpoints = null;

//   get initialConfigurationDone() {
//     return this.configurationDone.asObservable();
//   }

//   get openIDConfiguration(): OpenIdConfiguration {
//     return this.mergedOpenIdConfiguration;
//   }

//   get wellKnownEndpoints(): AuthWellKnownEndpoints {
//     return this.authWellKnownEndpoints;
//   }

//   private onConfigurationChangeInternal = new Subject<OpenIdConfiguration>();

//   get onConfigurationChange() {
//     return this.onConfigurationChangeInternal.asObservable();
//   }

//   constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

//   setup(openIdConfiguration: OpenIdConfiguration, authWellKnownEndpoints: AuthWellKnownEndpoints) {
//     const defaultConfig: OpenIdConfiguration = {
//       stsServer: 'https://localhost:44318',
//       redirect_url: 'https://localhost:44311',
//       client_id: 'angularclient',
//       response_type: 'id_token token',
//       scope: 'openid email profile',
//       hd_param: '',
//       post_logout_redirect_uri: 'https://localhost:44311/unauthorized',
//       start_checksession: false,
//       silent_renew: false,
//       silent_renew_url: 'https://localhost:44311',
//       silent_renew_offset_in_seconds: 0,
//       silent_redirect_url: 'https://localhost:44311',
//       post_login_route: '/',
//       forbidden_route: '/forbidden',
//       unauthorized_route: '/unauthorized',
//       auto_userinfo: true,
//       auto_clean_state_after_authentication: true,
//       trigger_authorization_result_event: false,
//       log_console_warning_active: true,
//       log_console_debug_active: false,
//       iss_validation_off: false,
//       history_cleanup_off: false,
//       max_id_token_iat_offset_allowed_in_seconds: 3,
//       storage: sessionStorage,
//     };

//     this.mergedOpenIdConfiguration = { ...defaultConfig, ...openIdConfiguration };
//     this.setSpecialCases(this.mergedOpenIdConfiguration);
//     this.authWellKnownEndpoints = { ...authWellKnownEndpoints };
//     this.onConfigurationChangeInternal.next({ ...this.mergedOpenIdConfiguration });
//   }
// }
