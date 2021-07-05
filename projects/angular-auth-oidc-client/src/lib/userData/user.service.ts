import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, retry, switchMap } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { TokenHelperService } from '../utils/tokenHelper/token-helper.service';
import { ConfigUserDataResult, UserDataResult } from './userdata-result';

const DEFAULT_USERRESULT = { userData: null, allUserData: [] };
@Injectable()
export class UserService {
  private userDataInternal$ = new BehaviorSubject<UserDataResult>(DEFAULT_USERRESULT);

  get userData$(): Observable<UserDataResult> {
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
      this.loggerService.logDebug(configId, `authCallback idToken flow with accessToken ${accessToken}`);

      this.setUserDataToStore(decodedIdToken, configId);

      return of(decodedIdToken);
    }

    const { renewUserInfoAfterTokenRenew } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (!isRenewProcess || renewUserInfoAfterTokenRenew || !haveUserData) {
      return this.getUserDataOidcFlowAndSave(decodedIdToken.sub, configId).pipe(
        switchMap((userData) => {
          this.loggerService.logDebug(configId, 'Received user data: ', userData);
          if (!!userData) {
            this.loggerService.logDebug(configId, 'accessToken: ', accessToken);

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

  publishUserDataIfExists(configId: string): void {
    const userData = this.getUserDataFromStore(configId);

    if (userData) {
      this.fireUserDataEvent(configId, userData);
    }
  }

  setUserDataToStore(userData: any, configId: string): void {
    this.storagePersistenceService.write('userData', userData, configId);
    this.fireUserDataEvent(configId, userData);
  }

  resetUserDataInStore(configId: string): void {
    this.storagePersistenceService.remove('userData', configId);
    this.fireUserDataEvent(configId, null);
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

    const userInfoEndpoint = authWellKnownEndPoints.userInfoEndpoint;

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

  private fireUserDataEvent(configId: string, passedUserData: any): void {
    const userData = this.composeSingleOrMultipleUserDataObject(configId, passedUserData);

    this.userDataInternal$.next(userData);

    this.eventService.fireEvent(EventTypes.UserDataChanged, { configId, userData: passedUserData });
  }

  private composeSingleOrMultipleUserDataObject(configId: string, passedUserData: any): UserDataResult {
    const hasManyConfigs = this.configurationProvider.hasManyConfigs();

    if (!hasManyConfigs) {
      return this.composeSingleUserDataResult(configId, passedUserData);
    }

    const configs = this.configurationProvider.getAllConfigurations();

    const allUserData: ConfigUserDataResult[] = configs.map((config) => {
      if (this.currentConfigIsToUpdate(configId, config)) {
        return { configId: config.configId, userData: passedUserData };
      }

      const alreadySavedUserData = this.storagePersistenceService.read('userData', config.configId) || null;

      return { configId: config.configId, userData: alreadySavedUserData };
    });

    return {
      userData: null,
      allUserData,
    };
  }

  private composeSingleUserDataResult(configId: string, userData: any): UserDataResult {
    return {
      userData,
      allUserData: [{ configId, userData }],
    };
  }

  private currentConfigIsToUpdate(configId: string, config: OpenIdConfiguration): boolean {
    return config.configId === configId;
  }
}
