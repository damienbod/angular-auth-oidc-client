import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, Subject } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
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
        private readonly configurationProvider: ConfigurationProvider
    ) {}

    withConfig(passedConfig: OpenIdConfiguration, mappingFunction?: any) {
        if (!passedConfig.customConfigServer && !passedConfig.stsServer) {
            this.loggerService.logError('please provide at least an stsServer or a custom config');
            return;
        }

        if (passedConfig.customConfigServer && !mappingFunction) {
            this.loggerService.logError(
                'If you have given a custom config server then please provide a mapping method as second param, too '
            );
            return;
        }

        const loadConfig$ = this.getCustomConfig(passedConfig, mappingFunction).pipe(
            switchMap((libConfig) =>
                this.getWellKnownDocument(passedConfig.stsServer || libConfig.stsServer).pipe(
                    map((wellKnownEndpoints) => {
                        return {
                            libConfig,
                            wellKnownEndpoints,
                        };
                    })
                )
            ),
            map(({ libConfig, wellKnownEndpoints }) => {
                return {
                    customConfig: libConfig,
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
            tap(({ customConfig, wellKnownEndpoints }) => this.configurationProvider.setConfig(customConfig, wellKnownEndpoints))
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

    private getWellKnownDocument(stsServerAdress: string) {
        let url = stsServerAdress;

        if (!stsServerAdress.endsWith(this.STS_SERVER_SUFFIX)) {
            url = `${stsServerAdress}${this.STS_SERVER_SUFFIX}`;
        }

        return this.httpClient.get<any>(url);
    }
}
