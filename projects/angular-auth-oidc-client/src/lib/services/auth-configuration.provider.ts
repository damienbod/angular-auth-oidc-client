import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { OpenIdConfiguration, OpenIdInternalConfiguration } from '../models/auth.configuration';
import { AuthWellKnownEndpoints } from '../models/auth.well-known-endpoints';
import { PlatformProvider } from './platform.provider';

@Injectable({ providedIn: 'root' })
export class ConfigurationProvider {
    private DEFAULT_CONFIG: OpenIdInternalConfiguration = {
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
        disable_iat_offset_validation: false,
        storage: sessionStorage,
    };

    private INITIAL_AUTHWELLKNOWN: AuthWellKnownEndpoints = {
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

    private mergedOpenIdConfiguration: OpenIdInternalConfiguration = this.DEFAULT_CONFIG;
    private authWellKnownEndpoints: AuthWellKnownEndpoints = this.INITIAL_AUTHWELLKNOWN;

    private onConfigurationChangeInternal = new Subject<OpenIdConfiguration>();

    get openIDConfiguration(): OpenIdInternalConfiguration {
        return this.mergedOpenIdConfiguration;
    }

    get wellKnownEndpoints(): AuthWellKnownEndpoints {
        return this.authWellKnownEndpoints;
    }

    get onConfigurationChange() {
        return this.onConfigurationChangeInternal.asObservable();
    }

    constructor(private platformProvider: PlatformProvider) {}

    setup(passedOpenIfConfiguration: OpenIdConfiguration, passedAuthWellKnownEndpoints: AuthWellKnownEndpoints) {
        this.mergedOpenIdConfiguration = { ...this.mergedOpenIdConfiguration, ...passedOpenIfConfiguration };
        this.setSpecialCases(this.mergedOpenIdConfiguration);
        this.authWellKnownEndpoints = { ...passedAuthWellKnownEndpoints };
        this.onConfigurationChangeInternal.next({ ...this.mergedOpenIdConfiguration });
    }

    private setSpecialCases(currentConfig: OpenIdConfiguration) {
        if (!this.platformProvider.isBrowser) {
            currentConfig.start_checksession = false;
            currentConfig.silent_renew = false;
        }
    }
}
