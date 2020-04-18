import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { OidcDataService } from '../api/oidc-data.service';
import { ConfigurationProvider } from '../config';
import { EventsService, EventTypes } from '../events';
import { LoggerService } from '../logging/logger.service';
import { TokenHelperService } from '../services/oidc-token-helper.service';
import { StoragePersistanceService } from '../storage';

@Injectable()
export class UserService {
    constructor(
        private oidcDataService: OidcDataService,
        private storagePersistanceService: StoragePersistanceService,
        private eventService: EventsService,
        private loggerService: LoggerService,
        private tokenHelperService: TokenHelperService,
        private readonly configurationProvider: ConfigurationProvider
    ) {}

    getAndPersistUserDataInStore(isRenewProcess = false, result?: any, idToken?: any, decodedIdToken?: any): Observable<any> {
        result = result || this.storagePersistanceService.authResult;
        idToken = idToken || this.storagePersistanceService.idToken;
        decodedIdToken = decodedIdToken || this.tokenHelperService.getPayloadFromToken(idToken, false);

        const existingUserDataFromStorage = this.getUserData();
        const haveUserData = !!existingUserDataFromStorage;
        const currentFlowIsIdTokenOrCode = this.currentFlowIs(['id_token token', 'code']);

        if (!currentFlowIsIdTokenOrCode) {
            // flow id_token
            this.loggerService.logDebug('authorizedCallback id_token flow');
            this.loggerService.logDebug(this.storagePersistanceService.accessToken);

            // userData is set to the id_token decoded. No access_token.
            this.setUserData(decodedIdToken);

            return of(decodedIdToken);
        }

        if ((!haveUserData && isRenewProcess) || !isRenewProcess) {
            // get user data from sts server
            return this.getUserDataOidcFlowAndSave(decodedIdToken.sub).pipe(
                map((userData) => {
                    this.loggerService.logDebug('Received user data', userData);

                    if (!!userData) {
                        this.loggerService.logDebug(this.storagePersistanceService.accessToken);
                        return userData;
                    } else {
                        return null;
                    }
                })
            );
        }

        return of(existingUserDataFromStorage);
    }

    private currentFlowIs(flowTypes: string[]) {
        return flowTypes.some((x) => this.configurationProvider.openIDConfiguration.responseType === x);
    }

    private getUserDataOidcFlowAndSave(idTokenSub: any) {
        return this.getIdentityUserData().pipe(
            map((data: any) => {
                if (this.validateUserdataSubIdToken(idTokenSub, data.sub)) {
                    this.setUserData(data);
                    return data;
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
        return this.storagePersistanceService.userData || null;
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
