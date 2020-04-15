import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { HttpBaseService } from '../api/http-base.service';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../services/oidc.logger.service';
import { OpenIdConfiguration } from './openid-configuration';

@Injectable({ providedIn: 'root' })
export class OidcConfigService {
    private WELL_KNOWN_SUFFIX = `/.well-known/openid-configuration`;
    private configurationLoadedInternal = new Subject();

    // TODO DO WE NEED THIS?
    public get onConfigurationLoaded() {
        return this.configurationLoadedInternal.asObservable();
    }

    constructor(
        private readonly loggerService: LoggerService,
        private readonly http: HttpBaseService,
        private readonly configurationProvider: ConfigurationProvider
    ) {}

    withConfig(passedConfig: OpenIdConfiguration) {
        if (!passedConfig.stsServer) {
            this.loggerService.logError('please provide at least an stsServer');
            return;
        }

        if (!passedConfig.authWellknownEndpoint) {
            passedConfig.authWellknownEndpoint = passedConfig.stsServer;
        }

        const loadConfig$ = this.getWellKnownDocument(passedConfig.authWellknownEndpoint).pipe(
            map((wellKnownEndpoints) => {
                return {
                    issuer: wellKnownEndpoints.issuer,
                    jwksUri: wellKnownEndpoints.jwks_uri,
                    authorizationEndpoint: wellKnownEndpoints.authorization_endpoint,
                    tokenEndpoint: wellKnownEndpoints.token_endpoint,
                    userinfoEndpoint: wellKnownEndpoints.userinfo_endpoint,
                    endSessionEndpoint: wellKnownEndpoints.end_session_endpoint,
                    checkSessionIframe: wellKnownEndpoints.check_session_iframe,
                    revocationEndpoint: wellKnownEndpoints.revocation_endpoint,
                    introspectionEndpoint: wellKnownEndpoints.introspection_endpoint,
                };
            }),
            tap((mappedWellKnownEndpoints) => this.configurationProvider.setConfig(passedConfig, mappedWellKnownEndpoints))
        );

        return loadConfig$.toPromise();
    }

    private getWellKnownDocument(wellKnownEndpoint: string) {
        let url = wellKnownEndpoint;

        if (!wellKnownEndpoint.includes(this.WELL_KNOWN_SUFFIX)) {
            url = `${wellKnownEndpoint}${this.WELL_KNOWN_SUFFIX}`;
        }

        return this.http.get<any>(url);
    }
}
