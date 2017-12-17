import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { OidcSecurityCommon } from './oidc.security.common';
import { AuthWellKnownEndpoints } from './auth.well-known-endpoints';
import { OidcDataService } from './oidc-data.service';

@Injectable()
export class OidcSecurityUserService {
    private userData = '';

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

    getUserData(): string {
        if (!this.userData) {
            throw Error('UserData is not set!');
        }

        return this.userData;
    }

    setUserData(value: string): void {
        this.userData = value;
    }

    private getIdentityUserData(): Observable<any> {
        const token = this.oidcSecurityCommon.getAccessToken();

        return this.oidcDataService.getIdentityUserData(
            this.authWellKnownEndpoints.userinfo_endpoint,
            token
        );
    }
}
