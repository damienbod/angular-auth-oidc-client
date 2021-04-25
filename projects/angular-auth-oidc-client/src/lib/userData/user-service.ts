import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, retry, switchMap } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
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
    private storagePersistenceService: StoragePersistenceService,
    private eventService: PublicEventsService,
    private loggerService: LoggerService,
    private tokenHelperService: TokenHelperService,
    private flowHelper: FlowHelper,
    private configurationProvider: ConfigurationProvider
  ) {}

  getAndPersistUserDataInStore(isRenewProcess = false, idToken?: any, decodedIdToken?: any): Observable<any> {
    idToken = idToken || this.storagePersistenceService.getIdToken();
    decodedIdToken = decodedIdToken || this.tokenHelperService.getPayloadFromToken(idToken, false);

    const existingUserDataFromStorage = this.getUserDataFromStore();
    const haveUserData = !!existingUserDataFromStorage;
    const isCurrentFlowImplicitFlowWithAccessToken = this.flowHelper.isCurrentFlowImplicitFlowWithAccessToken();
    const isCurrentFlowCodeFlow = this.flowHelper.isCurrentFlowCodeFlow();

    const accessToken = this.storagePersistenceService.getAccessToken();
    if (!(isCurrentFlowImplicitFlowWithAccessToken || isCurrentFlowCodeFlow)) {
      this.loggerService.logDebug('authorizedCallback id_token flow');
      this.loggerService.logDebug('accessToken', accessToken);

      this.setUserDataToStore(decodedIdToken);
      return of(decodedIdToken);
    }

    const { renewUserInfoAfterTokenRenew } = this.configurationProvider.getOpenIDConfiguration();

    if (!isRenewProcess || renewUserInfoAfterTokenRenew || !haveUserData) {
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
    return this.storagePersistenceService.read('userData') || null;
  }

  publishUserDataIfExists() {
    const userData = this.getUserDataFromStore();
    if (userData) {
      this.userDataInternal$.next(userData);
      this.eventService.fireEvent(EventTypes.UserDataChanged, userData);
    }
  }

  setUserDataToStore(value: any): void {
    this.storagePersistenceService.write('userData', value);
    this.userDataInternal$.next(value);
    this.eventService.fireEvent(EventTypes.UserDataChanged, value);
  }

  resetUserDataInStore(): void {
    this.storagePersistenceService.remove('userData');
    this.eventService.fireEvent(EventTypes.UserDataChanged, null);
    this.userDataInternal$.next(null);
  }

  private getUserDataOidcFlowAndSave(idTokenSub: any): Observable<any> {
    return this.getIdentityUserData().pipe(
      map((data: any) => {
        if (this.validateUserDataSubIdToken(idTokenSub, data?.sub)) {
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
    const token = this.storagePersistenceService.getAccessToken();

    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints');

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

    return this.oidcDataService.get(userinfoEndpoint, token).pipe(retry(2));
  }

  private validateUserDataSubIdToken(idTokenSub: any, userdataSub: any): boolean {
    if (!idTokenSub) {
      return false;
    }

    if (!userdataSub) {
      return false;
    }

    if ((idTokenSub as string) !== (userdataSub as string)) {
      this.loggerService.logDebug('validateUserDataSubIdToken failed', idTokenSub, userdataSub);
      return false;
    }

    return true;
  }
}
