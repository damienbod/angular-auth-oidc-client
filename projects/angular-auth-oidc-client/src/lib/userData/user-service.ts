import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { TokenHelperService } from '../utils/tokenHelper/oidc-token-helper.service';

@Injectable()
export class UserService {
    private userDataInternal$ = new BehaviorSubject<any>(null);

    get userData$() {
        return this.userDataInternal$.asObservable();
    }

    constructor(
        private oidcDataService: DataService,
        private storagePersistanceService: StoragePersistanceService,
        private eventService: PublicEventsService,
        private loggerService: LoggerService,
        private tokenHelperService: TokenHelperService,
        private readonly flowHelper: FlowHelper,
        private readonly configurationProvider: ConfigurationProvider
    ) {}

    // TODO CHECK PARAMETERS
    //  validationResult.idToken can be the complete valudationResult
    getAndPersistUserDataInStore(isRenewProcess = false, idToken?: any, decodedIdToken?: any): Observable<any> {
        idToken = idToken || this.storagePersistanceService.getIdToken();
        decodedIdToken = decodedIdToken || this.tokenHelperService.getPayloadFromToken(idToken, false);

        const existingUserDataFromStorage = this.getUserDataFromStore();
        const haveUserData = !!existingUserDataFromStorage;
        const isCurrentFlowImplicitFlowWithAccessToken = this.flowHelper.isCurrentFlowImplicitFlowWithAccessToken();
        const isCurrentFlowCodeFlow = this.flowHelper.isCurrentFlowCodeFlow();

        const accessToken = this.storagePersistanceService.getAccessToken();
        if (!(isCurrentFlowImplicitFlowWithAccessToken || isCurrentFlowCodeFlow)) {
            this.loggerService.logDebug('authorizedCallback id_token flow');
            this.loggerService.logDebug('accessToken', accessToken);

            this.setUserDataToStore(decodedIdToken);
            return of(decodedIdToken);
        }

        if (!isRenewProcess || this.configurationProvider.openIDConfiguration.renewUserInfoAfterTokenRenew || !haveUserData) {
            return this.getUserDataOidcFlowAndSave(decodedIdToken.sub).pipe(
                switchMap((userData) => {
                    this.loggerService.logDebug('Received user data', userData);
                    if (!!userData) {
                        this.loggerService.logDebug('accessToken', accessToken);
                        return of(userData);
                    } else {
                        return throwError('no user data, request failed');
                    }
                })
            );
        }

        return of(existingUserDataFromStorage);
    }

    getUserDataFromStore(): any {
        return this.storagePersistanceService.read('userData') || null;
    }

    publishUserdataIfExists() {
        const userdata = this.getUserDataFromStore();
        if (userdata) {
            this.userDataInternal$.next(userdata);
            this.eventService.fireEvent(EventTypes.UserDataChanged, userdata);
        }
    }

    setUserDataToStore(value: any): void {
        this.storagePersistanceService.write('userData', value);
        this.userDataInternal$.next(value);
        this.eventService.fireEvent(EventTypes.UserDataChanged, value);
    }

    resetUserDataInStore(): void {
        this.storagePersistanceService.write('userData', null);
        this.eventService.fireEvent(EventTypes.UserDataChanged, null);
        this.userDataInternal$.next(null);
    }

    private getUserDataOidcFlowAndSave(idTokenSub: any): Observable<any> {
        return this.getIdentityUserData().pipe(
            map((data: any) => {
                if (this.validateUserdataSubIdToken(idTokenSub, data?.sub)) {
                    this.setUserDataToStore(data);
                    return data;
                } else {
                    // something went wrong, userdata sub does not match that from id_token
                    this.loggerService.logWarning('authorizedCallback, User data sub does not match sub in id_token');
                    this.loggerService.logDebug('authorizedCallback, token(s) validation failed, resetting');
                    this.resetUserDataInStore();
                    return null;
                }
            })
        );
    }

    private getIdentityUserData(): Observable<any> {
        const token = this.storagePersistanceService.getAccessToken();

        const authWellKnownEndPoints = this.storagePersistanceService.read('authWellKnownEndPoints');

        if (!authWellKnownEndPoints) {
            this.loggerService.logWarning('init check session: authWellKnownEndpoints is undefined');
            return throwError('authWellKnownEndpoints is undefined');
        }

        const userinfoEndpoint = authWellKnownEndPoints.userinfoEndpoint;

        if (!userinfoEndpoint) {
            this.loggerService.logError(
                'init check session: authWellKnownEndpoints.userinfo_endpoint is undefined; set auto_userinfo = false in config'
            );
            return throwError('authWellKnownEndpoints.userinfo_endpoint is undefined');
        }

        return this.oidcDataService.get(userinfoEndpoint, token);
    }

    private validateUserdataSubIdToken(idTokenSub: any, userdataSub: any): boolean {
        if (!idTokenSub) {
            return false;
        }

        if (!userdataSub) {
            return false;
        }

        if ((idTokenSub as string) !== (userdataSub as string)) {
            this.loggerService.logDebug('validateUserdataSubIdToken failed', idTokenSub, userdataSub);
            return false;
        }

        return true;
    }
}
