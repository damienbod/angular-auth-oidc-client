import { Injectable, EventEmitter, Output } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { AuthConfiguration } from '../modules/auth.configuration';
import { OidcSecurityCommon } from './oidc.security.common';

@Injectable()
export class AuthWellKnownEndpoints {
    @Output()
    onWellKnownEndpointsLoaded: EventEmitter<any> = new EventEmitter<any>(true);

    issuer: string;
    jwks_uri: string;
    authorization_endpoint: string;
    token_endpoint: string;
    userinfo_endpoint: string;
    end_session_endpoint: string;
    check_session_iframe: string;
    revocation_endpoint: string;
    introspection_endpoint: string;

    constructor(
        private http: HttpClient,
        private authConfiguration: AuthConfiguration,
        private oidcSecurityCommon: OidcSecurityCommon
    ) {}

    setupModule() {
        const data = this.oidcSecurityCommon.wellKnownEndpoints;
        this.oidcSecurityCommon.logDebug(data);
        if (data && data !== '') {
            this.oidcSecurityCommon.logDebug(
                'AuthWellKnownEndpoints already defined'
            );

            this.setWellKnownEndpoints(data);
            this.onWellKnownEndpointsLoaded.emit();
        } else {
            this.oidcSecurityCommon.logDebug(
                'AuthWellKnownEndpoints first time, get from the server'
            );
            this.getWellKnownEndpoints().subscribe((dataFromServer: any) => {
                this.setWellKnownEndpoints(dataFromServer);

                this.oidcSecurityCommon.wellKnownEndpoints = dataFromServer;
                this.oidcSecurityCommon.logDebug(dataFromServer);

                this.onWellKnownEndpointsLoaded.emit();
            });
        }
    }

    private setWellKnownEndpoints(data: any) {
        this.issuer = data.issuer;
        this.jwks_uri = data.jwks_uri;
        this.authorization_endpoint = data.authorization_endpoint;
        this.token_endpoint = data.token_endpoint;
        this.userinfo_endpoint = data.userinfo_endpoint;

        if (data.end_session_endpoint) {
            this.end_session_endpoint = data.end_session_endpoint;
        }

        if (data.check_session_iframe) {
            this.check_session_iframe = data.check_session_iframe;
        }

        if (data.revocation_endpoint) {
            this.revocation_endpoint = data.revocation_endpoint;
        }

        if (data.introspection_endpoint) {
            this.introspection_endpoint = data.introspection_endpoint;
        }
    }
    private getWellKnownEndpoints = (): Observable<any> => {
        let headers = new HttpHeaders();
        headers = headers.set('Accept', 'application/json');

        let url =
            this.authConfiguration.stsServer +
            '/.well-known/openid-configuration';
        if (this.authConfiguration.override_well_known_configuration) {
            url = this.authConfiguration.override_well_known_configuration_url;
        }

        return this.http.get(url, {
            headers: headers
        });
    };
}
