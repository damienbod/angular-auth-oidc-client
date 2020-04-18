import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { ConfigurationProvider } from '../config/config.provider';
import { EventTypes } from '../events/event-types';
import { EventsService } from '../events/events.service';
import { LoggerService } from '../logging/logger.service';
import { OpenIdConfiguration } from './openid-configuration';

@Injectable({ providedIn: 'root' })
export class OidcConfigService {
    private WELL_KNOWN_SUFFIX = `/.well-known/openid-configuration`;
    constructor(
        private readonly loggerService: LoggerService,
        private readonly http: DataService,
        private readonly configurationProvider: ConfigurationProvider,
        private readonly eventsService: EventsService
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
            tap((mappedWellKnownEndpoints) =>
                this.eventsService.fireEvent(EventTypes.ConfigLoaded, { passedConfig, mappedWellKnownEndpoints })
            ),
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
