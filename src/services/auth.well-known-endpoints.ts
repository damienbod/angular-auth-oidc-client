import { Injectable, EventEmitter, Output } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import { AuthConfiguration } from '../modules/auth.configuration';
import { OidcSecurityCommon } from './oidc.security.common';

@Injectable()
export class AuthWellKnownEndpoints {

    @Output() onWellKnownEndpointsLoaded: EventEmitter<any> = new EventEmitter<any>(true);

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
        private http: Http,
        private authConfiguration: AuthConfiguration,
        private oidcSecurityCommon: OidcSecurityCommon
    ) {
    }

    setupModule() {
        let data = this.oidcSecurityCommon.retrieve(this.oidcSecurityCommon.storage_well_known_endpoints);
        this.oidcSecurityCommon.logDebug(data);
        if (data && data !== '') {
            this.oidcSecurityCommon.logDebug('AuthWellKnownEndpoints already defined');
            this.issuer = data.issuer;
            this.jwks_uri = data.jwks_uri;
            this.authorization_endpoint = data.authorization_endpoint;
            this.token_endpoint = data.token_endpoint;
            this.userinfo_endpoint = data.userinfo_endpoint;

            if (data.end_session_endpoint) {
                this.end_session_endpoint = data.end_session_endpoint;

            };

            if (data.check_session_iframe) {
                this.check_session_iframe = data.check_session_iframe;
            };

            if (data.revocation_endpoint) {
                this.revocation_endpoint = data.revocation_endpoint;
            };

            if (data.introspection_endpoint) {
                this.introspection_endpoint = data.introspection_endpoint;
            }

            this.onWellKnownEndpointsLoaded.emit();
        } else {
            this.oidcSecurityCommon.logDebug('AuthWellKnownEndpoints first time, get from the server');
            this.getWellKnownEndpoints()
                .subscribe((data: any) => {
                    this.issuer = data.issuer;
                    this.jwks_uri = data.jwks_uri;
                    this.authorization_endpoint = data.authorization_endpoint;
                    this.token_endpoint = data.token_endpoint;
                    this.userinfo_endpoint = data.userinfo_endpoint;

                    if (data.end_session_endpoint) {
                        this.end_session_endpoint = data.end_session_endpoint;
                    };

                    if (data.check_session_iframe) {
                        this.check_session_iframe = data.check_session_iframe;
                    };

                    if (data.revocation_endpoint) {
                        this.revocation_endpoint = data.revocation_endpoint;
                    };

                    if (data.introspection_endpoint) {
                        this.introspection_endpoint = data.introspection_endpoint;
                    }

                    this.oidcSecurityCommon.store(this.oidcSecurityCommon.storage_well_known_endpoints, data);
                    this.oidcSecurityCommon.logDebug(data);

                    this.onWellKnownEndpointsLoaded.emit();
                });
        }
    }

    private getWellKnownEndpoints = (): Observable<any> => {

        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/json');

        let url = this.authConfiguration.stsServer + '/.well-known/openid-configuration';
        if (this.authConfiguration.override_well_known_configuration) {
            url = this.authConfiguration.override_well_known_configuration_url;
        }

        return this.http.get(url, {
            headers: headers,
            body: ''
        }).map((res: any) => res.json());
    }
}