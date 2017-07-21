import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';

import { AuthConfiguration } from '../modules/auth.configuration';
import { OidcSecurityCommon } from './oidc.security.common';
import { AuthWellKnownEndpoints } from './auth.well-known-endpoints';

@Injectable()
export class OidcSecurityUserService {

    userData: any = '';

    constructor(
        private http: Http,
        private authConfiguration: AuthConfiguration,
        private oidcSecurityCommon: OidcSecurityCommon,
        private authWellKnownEndpoints: AuthWellKnownEndpoints
    ) {
    }

    initUserData() {
        return this.getIdentityUserData()
            .map(data => this.userData = data);
    }

    private getIdentityUserData = (): Observable<any> => {

        let headers = new Headers();
        headers.append('Content-Type', 'application/json');
        headers.append('Accept', 'application/json');

        let token = this.oidcSecurityCommon.getAccessToken();

        if (token !== '') {
            headers.append('Authorization', 'Bearer ' + decodeURIComponent(token));
        }

        return this.http.get(this.authWellKnownEndpoints.userinfo_endpoint, {
            headers: headers,
            body: ''
        }).map((res: any) => res.json());
    }

    private handleError(error: any) {
        this.oidcSecurityCommon.logError(error);
    }
}