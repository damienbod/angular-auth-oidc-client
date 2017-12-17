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

    private getIdentityUserData(): Observable<any> {
        const token = this.oidcSecurityCommon.getAccessToken();

        return this.oidcDataService.getIdentityUserData(
            this.authWellKnownEndpoints.userinfo_endpoint,
            token
        );
    }
}
