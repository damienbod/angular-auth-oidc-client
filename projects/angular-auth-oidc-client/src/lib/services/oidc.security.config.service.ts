import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, Observable, of, ReplaySubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { OpenIdConfiguration } from '../models/auth.configuration';
import { ConfigResult, ConfigurationProvider } from './config.provider';
import { LoggerService } from './oidc.logger.service';

@Injectable()
export class OidcConfigService {
    private STS_SERVER_SUFFIX = `/.well-known/openid-configuration`;
    private configurationLoadedInternal = new ReplaySubject<ConfigResult>(1);

    // TODO ERASE THIS
    public get onConfigurationLoaded(): Observable<ConfigResult> {
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

        let customConfig$ = null;

        if (config.customConfigServer) {
            customConfig$ = this.httpClient.get(config.customConfigServer).pipe(map((result) => mappingFunction(result)));
        } else {
            customConfig$ = of(config as OpenIdConfiguration);
        }

        const url = `${config.stsServer}/${this.STS_SERVER_SUFFIX}`;
        const stsServerConfig$ = this.httpClient.get<any>(url);

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
}
