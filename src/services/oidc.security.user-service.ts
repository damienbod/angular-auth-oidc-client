import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { map } from 'rxjs/operators';
import { OidcSecurityCommon } from './oidc.security.common';
import { OidcDataService } from './oidc-data.service';
import { AuthWellKnownEndpoints } from '../models/auth.well-known-endpoints';

@Injectable()
export class OidcSecurityUserService {
    private userData: any = '';
    private authWellKnownEndpoints: AuthWellKnownEndpoints;

    constructor(
        private oidcDataService: OidcDataService,
        private oidcSecurityCommon: OidcSecurityCommon,
    ) { }

    setupModule(authWellKnownEndpoints: AuthWellKnownEndpoints) {
        this.authWellKnownEndpoints = Object.assign({}, authWellKnownEndpoints);
    }

    initUserData() {
        return this.getIdentityUserData().pipe(
            map((data: any) => (this.userData = data))
        );
    }

    getUserData(): any {
        if (!this.userData) {
            throw Error('UserData is not set!');
        }

        return this.userData;
    }

    setUserData(value: any): void {
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
