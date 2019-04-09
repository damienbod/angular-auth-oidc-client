import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Subject } from 'rxjs';
import { OpenIDImplicitFlowConfiguration } from '../models/auth.configuration';
import { AuthWellKnownEndpoints } from '../models/auth.well-known-endpoints';

@Injectable({ providedIn: 'root' })
export class ConfigurationProvider {
    private configurationDone = new Subject();
    private openIDImplicitFlowConfiguration: OpenIDImplicitFlowConfiguration = null;
    private authWellKnownEndpoints: AuthWellKnownEndpoints = null;

    get initialConfigurationDone() {
        return this.configurationDone.asObservable();
    }

    get openIDConfiguration(): OpenIDImplicitFlowConfiguration {
        return this.openIDImplicitFlowConfiguration;
    }

    get wellKnownEndpoints(): AuthWellKnownEndpoints {
        return this.authWellKnownEndpoints;
    }

    private onConfigurationChangeInternal = new Subject<OpenIDImplicitFlowConfiguration>();

    get onConfigurationChange() {
        return this.onConfigurationChangeInternal.asObservable();
    }

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

    setup(openIDImplicitFlowConfiguration: OpenIDImplicitFlowConfiguration, authWellKnownEndpoints: AuthWellKnownEndpoints) {
        const defaultConfig: OpenIDImplicitFlowConfiguration = {
            stsServer: 'https://localhost:44318',
            redirect_url: 'https://localhost:44311',
            client_id: 'angularclient',
            response_type: 'id_token token',
            scope: 'openid email profile',
            hd_param: '',
            post_logout_redirect_uri: 'https://localhost:44311/unauthorized',
            start_checksession: false,
            silent_renew: false,
            silent_renew_url: 'https://localhost:44311',
            silent_renew_offset_in_seconds: 0,
            silent_redirect_url: 'https://localhost:44311',
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
            storage: sessionStorage,
        };

        this.openIDImplicitFlowConfiguration = { ...defaultConfig, ...openIDImplicitFlowConfiguration };
        this.setSpecialCases(this.openIDImplicitFlowConfiguration);
        this.authWellKnownEndpoints = { ...authWellKnownEndpoints };
        this.onConfigurationChangeInternal.next({ ...openIDImplicitFlowConfiguration });
    }

    private setSpecialCases(currentConfig: OpenIDImplicitFlowConfiguration) {
        const isBrowser = isPlatformBrowser(this.platformId);

        if (!isBrowser) {
            currentConfig.start_checksession = false;
            currentConfig.silent_renew = false;
        }
    }
}
