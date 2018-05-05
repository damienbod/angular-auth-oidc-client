import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OidcSecurityCommon } from './oidc.security.common';
import { OidcDataService } from './oidc-data.service';
import { AuthWellKnownEndpoints } from '../models/auth.well-known-endpoints';
import { LoggerService } from './oidc.logger.service';

@Injectable()
export class OidcSecurityUserService {
    private userData: any = '';
    private authWellKnownEndpoints: AuthWellKnownEndpoints | undefined;

    constructor(
        private oidcDataService: OidcDataService,
        private oidcSecurityCommon: OidcSecurityCommon,
        private loggerService: LoggerService,
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

        if (this.authWellKnownEndpoints) {
            return this.oidcDataService.getIdentityUserData(
                this.authWellKnownEndpoints.userinfo_endpoint,
                token
            );
        } else {
            this.loggerService.logWarning('init check session: authWellKnownEndpoints is undefined');
        }

        return this.oidcDataService.getIdentityUserData(
            'undefined',
            token
        );
    }
}
