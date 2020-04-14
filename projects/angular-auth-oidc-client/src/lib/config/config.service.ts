import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, of, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ConfigurationProvider } from '../config/config.provider';
import { OpenIdConfiguration } from '../models/auth.configuration';
import { LoggerService } from '../services/oidc.logger.service';

@Injectable()
export class OidcConfigService {
    private STS_SERVER_SUFFIX = `/.well-known/openid-configuration`;
    private configurationLoadedInternal = new Subject();

    // TODO DO WE NEED THIS?
    public get onConfigurationLoaded() {
        return this.configurationLoadedInternal.asObservable();
    }

    constructor(
        private readonly loggerService: LoggerService,
        private readonly httpClient: HttpClient,
        private configurationProvider: ConfigurationProvider
    ) {}

    withConfig(config: OpenIdConfiguration, mappingFunction?: any) {
        if (!config.stsServer) {
            this.loggerService.logError('please provide at least an stsServer');
            return;
        }

        if (config.customConfigServer && !mappingFunction) {
            this.loggerService.logError(
                'If you have given a custom config server then please provide a mapping method as second param, too '
            );
            return;
        }

        const customConfig$ = this.getCustomConfig(config);
        const stsServerConfig$ = this.getWellKnownDocument(config);

        const loadConfig$ = combineLatest([customConfig$, stsServerConfig$]).pipe(
            map(([customConfig, wellKnownEndpoints]: [OpenIdConfiguration, any]) => {
                return {
                    customConfig,
                    wellKnownEndpoints: {
                        issuer: wellKnownEndpoints.issuer,
                        jwksUri: wellKnownEndpoints.jwks_uri,
                        authorizationEndpoint: wellKnownEndpoints.authorization_endpoint,
                        tokenEndpoint: wellKnownEndpoints.token_endpoint,
                        userinfoEndpoint: wellKnownEndpoints.userinfo_endpoint,
                        endSessionEndpoint: wellKnownEndpoints.end_session_endpoint,
                        checkSessionIframe: wellKnownEndpoints.check_session_iframe,
                        revocationEndpoint: wellKnownEndpoints.revocation_endpoint,
                        introspectionEndpoint: wellKnownEndpoints.introspection_endpoint,
                    },
                };
            }),
            tap((configuration) => this.configurationProvider.setConfig(configuration.customConfig, configuration.wellKnownEndpoints))
        );

        return loadConfig$.toPromise();
    }

    private getCustomConfig(config: OpenIdConfiguration, mappingFunction?: any) {
        if (config.customConfigServer) {
            return this.httpClient.get(config.customConfigServer).pipe(map((result) => mappingFunction(result)));
        } else {
            return of(config);
        }
    }

    private getWellKnownDocument(config: OpenIdConfiguration) {
        const url = `${config.stsServer}/${this.STS_SERVER_SUFFIX}`;
        return this.httpClient.get<any>(url);
    }
}
