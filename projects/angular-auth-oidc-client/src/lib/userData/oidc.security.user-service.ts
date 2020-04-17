import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { OidcDataService } from '../api/oidc-data.service';
import { ConfigurationProvider } from '../config';
import { EventsService, EventTypes } from '../events';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistanceService } from '../storage';

@Injectable()
export class OidcSecurityUserService {
    constructor(
        private oidcDataService: OidcDataService,
        private storagePersistanceService: StoragePersistanceService,
        private eventService: EventsService,
        private loggerService: LoggerService,
        private readonly configurationProvider: ConfigurationProvider
    ) {}

    initUserDataFromStorage() {
        const userData = this.storagePersistanceService.userData;
        if (userData) {
            // Don't send an event, nothing changed
            this.storagePersistanceService.userData = userData;
        }
    }

    getUserDataFromSts(idTokenSub: any) {
        return this.getIdentityUserData().pipe(
            map((data: any) => {
                if (this.validateUserdataSubIdToken(idTokenSub, data.sub)) {
                    this.setUserData(data);
                } else {
                    // something went wrong, userdata sub does not match that from id_token
                    this.loggerService.logWarning('authorizedCallback, User data sub does not match sub in id_token');
                    this.loggerService.logDebug('authorizedCallback, token(s) validation failed, resetting');
                    this.resetUserData();
                }
            })
        );
    }

    getUserData(): any {
        if (!!this.storagePersistanceService.userData) {
            return this.storagePersistanceService.userData;
        }

        return null;
    }

    setUserData(value: any): void {
        this.storagePersistanceService.userData = value;
        this.eventService.fireEvent(EventTypes.UserDataChanged, value);
    }

    resetUserData(): void {
        this.storagePersistanceService.userData = '';
        this.eventService.fireEvent(EventTypes.UserDataChanged, '');
    }

    private getIdentityUserData(): Observable<any> {
        const token = this.storagePersistanceService.getAccessToken();

        if (!this.configurationProvider.wellKnownEndpoints) {
            this.loggerService.logWarning('init check session: authWellKnownEndpoints is undefined');

            throw Error('authWellKnownEndpoints is undefined');
        }

        const canGetUserData =
            this.configurationProvider.wellKnownEndpoints && this.configurationProvider.wellKnownEndpoints.userinfoEndpoint;

        if (!canGetUserData) {
            this.loggerService.logError(
                'init check session: authWellKnownEndpoints.userinfo_endpoint is undefined; set auto_userinfo = false in config'
            );
            throw Error('authWellKnownEndpoints.userinfo_endpoint is undefined');
        }

        return this.oidcDataService.getIdentityUserData(this.configurationProvider.wellKnownEndpoints.userinfoEndpoint || '', token);
    }

    validateUserdataSubIdToken(idTokenSub: any, userdataSub: any): boolean {
        if ((idTokenSub as string) !== (userdataSub as string)) {
            this.loggerService.logDebug(
                'validate_userdata_sub_id_token failed, id_token_sub: ' + idTokenSub + ' userdata_sub:' + userdataSub
            );
            return false;
        }

        return true;
    }
}
