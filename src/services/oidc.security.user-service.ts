import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
        private http: HttpClient,
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

        let headers = new HttpHeaders();
        headers = headers.set('Accept', 'application/json');

        let token = this.oidcSecurityCommon.getAccessToken();

        if (token !== '') {
            headers = headers.set('Authorization', 'Bearer ' + decodeURIComponent(token));
        }

        return this.http.get(this.authWellKnownEndpoints.userinfo_endpoint, {
            headers: headers,
        });
    }
}