import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { ConfigurationProvider } from '../config';
import { EventsService, EventTypes } from '../events';
import { LoggerService } from '../logging/logger.service';
import { TokenHelperService } from '../services/oidc-token-helper.service';
import { StoragePersistanceService } from '../storage';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';

@Injectable()
export class UserService {
    private userDataInternal$ = new BehaviorSubject<any>(null);

    get userData$() {
        return this.userDataInternal$.asObservable();
    }

    constructor(
        private oidcDataService: DataService,
        private storagePersistanceService: StoragePersistanceService,
        private eventService: EventsService,
        private loggerService: LoggerService,
        private tokenHelperService: TokenHelperService,
        private readonly configurationProvider: ConfigurationProvider,
        private readonly flowHelper: FlowHelper
    ) {}

    // TODO CHECK PARAMETERS
    //  validationResult.idToken can be the complete valudationResult
    getAndPersistUserDataInStore(isRenewProcess = false, idToken?: any, decodedIdToken?: any): Observable<any> {
        idToken = idToken || this.storagePersistanceService.idToken;
        decodedIdToken = decodedIdToken || this.tokenHelperService.getPayloadFromToken(idToken, false);

        const existingUserDataFromStorage = this.getUserDataFromStore();
        const haveUserData = !!existingUserDataFromStorage;
        const currentFlowIsIdTokenOrCode = this.flowHelper.currentFlowIs(['id_token token', 'code']);

        if (!currentFlowIsIdTokenOrCode) {
            this.loggerService.logDebug('authorizedCallback id_token flow');
            this.loggerService.logDebug(this.storagePersistanceService.accessToken);

            this.setUserDataToStore(decodedIdToken);

            return of(decodedIdToken);
        }

        if ((!haveUserData && isRenewProcess) || !isRenewProcess) {
            return this.getUserDataOidcFlowAndSave(decodedIdToken.sub).pipe(
                map((userData) => {
                    this.loggerService.logDebug('Received user data', userData);

                    if (!!userData) {
                        this.loggerService.logDebug(this.storagePersistanceService.accessToken);
                        return userData;
                    } else {
                        return throwError('wuahahah');
                    }
                })
            );
        }

        return of(existingUserDataFromStorage);
    }

    getUserDataFromStore(): any {
        return this.storagePersistanceService.userData || null;
    }

    setUserDataToStore(value: any): void {
        this.storagePersistanceService.userData = value;
        this.userDataInternal$.next(value);
        this.eventService.fireEvent(EventTypes.UserDataChanged, value);
    }

    resetUserDataInStore(): void {
        this.storagePersistanceService.userData = null;
        this.eventService.fireEvent(EventTypes.UserDataChanged, null);
        this.userDataInternal$.next(null);
    }

    private getUserDataOidcFlowAndSave(idTokenSub: any) {
        return this.getIdentityUserData().pipe(
            map((data: any) => {
                if (this.validateUserdataSubIdToken(idTokenSub, data.sub)) {
                    this.setUserDataToStore(data);
                    return data;
                } else {
                    // something went wrong, userdata sub does not match that from id_token
                    this.loggerService.logWarning('authorizedCallback, User data sub does not match sub in id_token');
                    this.loggerService.logDebug('authorizedCallback, token(s) validation failed, resetting');
                    this.resetUserDataInStore();
                    return throwError('blablabla');
                }
            })
        );
    }

    private getIdentityUserData(): Observable<any> {
        const token = this.storagePersistanceService.getAccessToken();

        if (!this.configurationProvider.wellKnownEndpoints) {
            this.loggerService.logWarning('init check session: authWellKnownEndpoints is undefined');

            return throwError('authWellKnownEndpoints is undefined');
        }

        const canGetUserData = this.configurationProvider?.wellKnownEndpoints?.userinfoEndpoint;

        if (!canGetUserData) {
            this.loggerService.logError(
                'init check session: authWellKnownEndpoints.userinfo_endpoint is undefined; set auto_userinfo = false in config'
            );
            return throwError('authWellKnownEndpoints.userinfo_endpoint is undefined');
        }

        return this.oidcDataService.get(this.configurationProvider.wellKnownEndpoints.userinfoEndpoint, token);
    }

    private validateUserdataSubIdToken(idTokenSub: any, userdataSub: any): boolean {
        if ((idTokenSub as string) !== (userdataSub as string)) {
            this.loggerService.logDebug('validateUserdataSubIdToken failed', idTokenSub, userdataSub);
            return false;
        }

        return true;
    }
}
