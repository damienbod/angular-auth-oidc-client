import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { OidcSecurityCommon } from './oidc.security.common';
import { AuthWellKnownEndpoints } from './auth.well-known-endpoints';
import { OidcDataService } from './oidc-data.service';

@Injectable()
export class OidcSecurityUserService {
    userData = '';

    constructor(
        private oidcDataService: OidcDataService,
        private oidcSecurityCommon: OidcSecurityCommon,
        private authWellKnownEndpoints: AuthWellKnownEndpoints
    ) {}

    initUserData() {
        return this.getIdentityUserData().pipe(
            map((data: any) => (this.userData = data))
        );
    }

    private getIdentityUserData = (): Observable<any> => {
        let headers: { [key: string]: string } = {};
        const token = this.oidcSecurityCommon.getAccessToken();

        if (token) {
            headers['Authorization'] = 'Bearer ' + decodeURIComponent(token);
        }

        return this.oidcDataService.get(
            this.authWellKnownEndpoints.userinfo_endpoint,
            headers
        );
    };
}
