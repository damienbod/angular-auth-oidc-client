import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { OidcSecurityCommon } from './oidc.security.common';
import { AuthWellKnownEndpoints } from './auth.well-known-endpoints';

@Injectable()
export class OidcSecurityUserService {
    userData = '';

    constructor(
        private http: HttpClient,
        private oidcSecurityCommon: OidcSecurityCommon,
        private authWellKnownEndpoints: AuthWellKnownEndpoints
    ) {}

    initUserData() {
        return this.getIdentityUserData().pipe(
            map((data: any) => (this.userData = data))
        );
    }

    private getIdentityUserData = (): Observable<any> => {
        let headers = new HttpHeaders();
        headers = headers.set('Accept', 'application/json');

        const token = this.oidcSecurityCommon.getAccessToken();

        if (token) {
            headers = headers.set(
                'Authorization',
                'Bearer ' + decodeURIComponent(token)
            );
        }

        return this.http.get(this.authWellKnownEndpoints.userinfo_endpoint, {
            headers: headers
        });
    };
}
