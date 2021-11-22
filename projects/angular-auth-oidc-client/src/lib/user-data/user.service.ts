import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { map, retry, switchMap } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { OpenIdConfiguration } from '../config/openid-configuration';
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
    private flowHelper: FlowHelper
  ) {}

  getAndPersistUserDataInStore(
    currentConfiguration: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    isRenewProcess = false,
    idToken?: any,
    decodedIdToken?: any
  ): Observable<any> {
    const { configId } = currentConfiguration;
    idToken = idToken || this.storagePersistenceService.getIdToken(currentConfiguration);
    decodedIdToken = decodedIdToken || this.tokenHelperService.getPayloadFromToken(idToken, false, currentConfiguration);

    const existingUserDataFromStorage = this.getUserDataFromStore(currentConfiguration);
    const haveUserData = !!existingUserDataFromStorage;
    const isCurrentFlowImplicitFlowWithAccessToken = this.flowHelper.isCurrentFlowImplicitFlowWithAccessToken(currentConfiguration);
    const isCurrentFlowCodeFlow = this.flowHelper.isCurrentFlowCodeFlow(currentConfiguration);

    const accessToken = this.storagePersistenceService.getAccessToken(currentConfiguration);
    if (!(isCurrentFlowImplicitFlowWithAccessToken || isCurrentFlowCodeFlow)) {
      this.loggerService.logDebug(currentConfiguration, `authCallback idToken flow with accessToken ${accessToken}`);

      this.setUserDataToStore(decodedIdToken, currentConfiguration, allConfigs);

      return of(decodedIdToken);
    }

    const { renewUserInfoAfterTokenRenew } = currentConfiguration;

    if (!isRenewProcess || renewUserInfoAfterTokenRenew || !haveUserData) {
      return this.getUserDataOidcFlowAndSave(decodedIdToken.sub, currentConfiguration, allConfigs).pipe(
        switchMap((userData) => {
          this.loggerService.logDebug(currentConfiguration, 'Received user data: ', userData);
          if (!!userData) {
            this.loggerService.logDebug(currentConfiguration, 'accessToken: ', accessToken);

            return of(userData);
          } else {
            return throwError(() => new Error('Received no user data, request failed'));
          }
        })
      );
    }

    return of(existingUserDataFromStorage);
  }

  getUserDataFromStore(currentConfiguration: OpenIdConfiguration): any {
    return this.storagePersistenceService.read('userData', currentConfiguration) || null;
  }

  publishUserDataIfExists(currentConfiguration: OpenIdConfiguration, allConfigs: OpenIdConfiguration[]): void {
    const userData = this.getUserDataFromStore(currentConfiguration);

    if (userData) {
      this.fireUserDataEvent(currentConfiguration, allConfigs, userData);
    }
  }

  setUserDataToStore(userData: any, currentConfiguration: OpenIdConfiguration, allConfigs: OpenIdConfiguration[]): void {
    this.storagePersistenceService.write('userData', userData, currentConfiguration);
    this.fireUserDataEvent(currentConfiguration, allConfigs, userData);
  }

  resetUserDataInStore(currentConfiguration: OpenIdConfiguration, allConfigs: OpenIdConfiguration[]): void {
    this.storagePersistenceService.remove('userData', currentConfiguration);
    this.fireUserDataEvent(currentConfiguration, allConfigs, null);
  }

  private getUserDataOidcFlowAndSave(
    idTokenSub: any,
    currentConfiguration: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): Observable<any> {
    return this.getIdentityUserData(currentConfiguration).pipe(
      map((data: any) => {
        if (this.validateUserDataSubIdToken(currentConfiguration, idTokenSub, data?.sub)) {
          this.setUserDataToStore(data, currentConfiguration, allConfigs);

          return data;
        } else {
          // something went wrong, user data sub does not match that from id_token
          this.loggerService.logWarning(currentConfiguration, `User data sub does not match sub in id_token, resetting`);
          this.resetUserDataInStore(currentConfiguration, allConfigs);

          return null;
        }
      })
    );
  }

  private getIdentityUserData(currentConfiguration: OpenIdConfiguration): Observable<any> {
    const { configId } = currentConfiguration;

    const token = this.storagePersistenceService.getAccessToken(currentConfiguration);

    const authWellKnownEndPoints = this.storagePersistenceService.read('authWellKnownEndPoints', currentConfiguration);

    if (!authWellKnownEndPoints) {
      this.loggerService.logWarning(currentConfiguration, 'init check session: authWellKnownEndpoints is undefined');

      return throwError(() => new Error('authWellKnownEndpoints is undefined'));
    }

    const userInfoEndpoint = authWellKnownEndPoints.userInfoEndpoint;

    if (!userInfoEndpoint) {
      this.loggerService.logError(
        currentConfiguration,
        'init check session: authWellKnownEndpoints.userinfo_endpoint is undefined; set auto_userinfo = false in config'
      );

      return throwError(() => new Error('authWellKnownEndpoints.userinfo_endpoint is undefined'));
    }

    return this.oidcDataService.get(userInfoEndpoint, configId, token).pipe(retry(2));
  }

  private validateUserDataSubIdToken(currentConfiguration: OpenIdConfiguration, idTokenSub: any, userDataSub: any): boolean {
    if (!idTokenSub) {
      return false;
    }

    if (!userDataSub) {
      return false;
    }

    if ((idTokenSub as string) !== (userDataSub as string)) {
      this.loggerService.logDebug(currentConfiguration, 'validateUserDataSubIdToken failed', idTokenSub, userDataSub);

      return false;
    }

    return true;
  }

  private fireUserDataEvent(currentConfiguration: OpenIdConfiguration, allConfigs: OpenIdConfiguration[], passedUserData: any): void {
    const userData = this.composeSingleOrMultipleUserDataObject(currentConfiguration, allConfigs, passedUserData);

    this.userDataInternal$.next(userData);

    const { configId } = currentConfiguration;
    this.eventService.fireEvent(EventTypes.UserDataChanged, { configId, userData: passedUserData });
  }

  private composeSingleOrMultipleUserDataObject(
    currentConfiguration: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    passedUserData: any
  ): UserDataResult {
    const hasManyConfigs = allConfigs.length > 1;

    if (!hasManyConfigs) {
      const { configId } = currentConfiguration;

      return this.composeSingleUserDataResult(configId, passedUserData);
    }

    const allUserData: ConfigUserDataResult[] = allConfigs.map((config) => {
      const { configId } = currentConfiguration;

      if (this.currentConfigIsToUpdate(configId, config)) {
        return { configId: config.configId, userData: passedUserData };
      }

      const alreadySavedUserData = this.storagePersistenceService.read('userData', config) || null;

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
