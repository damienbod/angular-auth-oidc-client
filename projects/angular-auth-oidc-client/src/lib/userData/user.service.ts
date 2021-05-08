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
  private configUserDataResultsInternal: Record<string, boolean> = {};
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

  getAndPersistUserDataInStore(configId: string, isRenewProcess = false, idToken?: any, decodedIdToken?: any): Observable<any> {
    idToken = idToken || this.storagePersistenceService.getIdToken(configId);
    decodedIdToken = decodedIdToken || this.tokenHelperService.getPayloadFromToken(idToken, false, configId);

    const existingUserDataFromStorage = this.getUserDataFromStore(configId);
    const haveUserData = !!existingUserDataFromStorage;
    const isCurrentFlowImplicitFlowWithAccessToken = this.flowHelper.isCurrentFlowImplicitFlowWithAccessToken(configId);
    const isCurrentFlowCodeFlow = this.flowHelper.isCurrentFlowCodeFlow(configId);

    const accessToken = this.storagePersistenceService.getAccessToken(configId);
    if (!(isCurrentFlowImplicitFlowWithAccessToken || isCurrentFlowCodeFlow)) {
      this.loggerService.logDebug(configId, `authorizedCallback idToken flow with accessToken ${accessToken}`);

      this.setUserDataToStore(decodedIdToken, configId);
      return of(decodedIdToken);
    }

    const { renewUserInfoAfterTokenRenew } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (!isRenewProcess || renewUserInfoAfterTokenRenew || !haveUserData) {
      return this.getUserDataOidcFlowAndSave(decodedIdToken.sub, configId).pipe(
        switchMap((userData) => {
          this.loggerService.logDebug('Received user data: ', userData);
          if (!!userData) {
            this.loggerService.logDebug('accessToken: ', accessToken);
            return of(userData);
          } else {
            return throwError('Received no user data, request failed');
          }
        })
      );
    }

    return of(existingUserDataFromStorage);
  }

  getUserDataFromStore(configId: string): any {
    return this.storagePersistenceService.read('userData', configId) || null;
  }

  publishUserDataIfExists(configId: string) {
    const userData = this.getUserDataFromStore(configId);
    this.updateUserDataAndFireEvent(configId, userData);
  }

  setUserDataToStore(userData: any, configId: string): void {
    this.storagePersistenceService.write('userData', userData, configId);
    this.updateUserDataAndFireEvent(configId, userData);
  }

  resetUserDataInStore(configId: string): void {
    this.storagePersistenceService.remove('userData', configId);
    this.updateUserDataAndFireEvent(configId, null);
  }

  private getUserDataOidcFlowAndSave(idTokenSub: any, configId: string): Observable<any> {
    return this.getIdentityUserData(configId).pipe(
      map((data: any) => {
        if (this.validateUserDataSubIdToken(idTokenSub, data?.sub)) {
          this.setUserDataToStore(data, configId);
          return data;
        } else {
          // something went wrong, user data sub does not match that from id_token
          this.loggerService.logWarning(configId, `User data sub does not match sub in id_token, resetting`);
          this.resetUserDataInStore(configId);
          return null;
        }
      })
    );
  }

  private getIdentityUserData(configId: string): Observable<any> {
    const token = this.storagePersistenceService.getAccessToken(configId);

    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', configId);

    if (!authWellKnownEndPoints) {
      this.loggerService.logWarning(configId, 'init check session: authWellKnownEndpoints is undefined');
      return throwError('authWellKnownEndpoints is undefined');
    }

    const userInfoEndpoint = authWellKnownEndPoints.userinfoEndpoint;

    if (!userInfoEndpoint) {
      this.loggerService.logError(
        configId,
        'init check session: authWellKnownEndpoints.userinfo_endpoint is undefined; set auto_userinfo = false in config'
      );
      return throwError('authWellKnownEndpoints.userinfo_endpoint is undefined');
    }

    return this.oidcDataService.get(userInfoEndpoint, configId, token).pipe(retry(2));
  }

  private validateUserDataSubIdToken(idTokenSub: any, userDataSub: any): boolean {
    if (!idTokenSub) {
      return false;
    }

    if (!userDataSub) {
      return false;
    }

    if ((idTokenSub as string) !== (userDataSub as string)) {
      this.loggerService.logDebug('validateUserDataSubIdToken failed', idTokenSub, userDataSub);
      return false;
    }

    return true;
  }

  private updateUserDataAndFireEvent(configId: string, userData: any) {
    if (this.configurationProvider.hasManyConfigs()) {
      this.configUserDataResultsInternal[configId] = userData;
      const result = Object.entries(this.configUserDataResultsInternal).map(([key, value]) => ({
        configId: key,
        userData: value,
      }));

      this.userDataInternal$.next(result);
    } else {
      this.userDataInternal$.next(userData);
    }

    this.eventService.fireEvent(EventTypes.UserDataChanged, userData);
  }
}
