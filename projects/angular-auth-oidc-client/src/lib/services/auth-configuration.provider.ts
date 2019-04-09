import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Subject } from 'rxjs';
import { OpenIdConfiguration } from '../models/auth.configuration';
import { AuthWellKnownEndpoints } from '../models/auth.well-known-endpoints';

@Injectable({ providedIn: 'root' })
export class ConfigurationProvider {
    private configurationDone = new Subject();
    private mergedOpenIdConfiguration: OpenIdConfiguration = null;
    private authWellKnownEndpoints: AuthWellKnownEndpoints = null;

    get initialConfigurationDone() {
        return this.configurationDone.asObservable();
    }

    get openIDConfiguration(): OpenIdConfiguration {
        return this.mergedOpenIdConfiguration;
    }

    get wellKnownEndpoints(): AuthWellKnownEndpoints {
        return this.authWellKnownEndpoints;
    }

    private onConfigurationChangeInternal = new Subject<OpenIdConfiguration>();

    get onConfigurationChange() {
        return this.onConfigurationChangeInternal.asObservable();
    }

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

    setup(openIdConfiguration: OpenIdConfiguration, authWellKnownEndpoints: AuthWellKnownEndpoints) {
        const defaultConfig: OpenIdConfiguration = {
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

        this.mergedOpenIdConfiguration = { ...defaultConfig, ...openIdConfiguration };
        this.setSpecialCases(this.mergedOpenIdConfiguration);
        this.authWellKnownEndpoints = { ...authWellKnownEndpoints };
        this.onConfigurationChangeInternal.next({ ...this.mergedOpenIdConfiguration });
    }

    private setSpecialCases(currentConfig: OpenIdConfiguration) {
        const isBrowser = isPlatformBrowser(this.platformId);

        if (!isBrowser) {
            currentConfig.start_checksession = false;
            currentConfig.silent_renew = false;
        }
    }
}
