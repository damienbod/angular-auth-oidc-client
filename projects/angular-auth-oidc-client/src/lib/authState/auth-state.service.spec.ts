import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { EventTypes, PublicEventsService } from '../../public-api';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { ConfigurationProviderMock } from '../config/provider/config.provider-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { StoragePersistenceServiceMock } from '../storage/storage-persistence.service-mock';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { PlatformProviderMock } from '../utils/platform-provider/platform.provider-mock';
import { TokenValidationService } from '../validation/token-validation.service';
import { TokenValidationServiceMock } from '../validation/token-validation.service-mock';
import { AuthStateService } from './auth-state.service';

describe('Auth State Service', () => {
  let authStateService: AuthStateService;
  let storagePersistenceService: StoragePersistenceService;
  let eventsService: PublicEventsService;
  let tokenValidationService: TokenValidationService;
  let configurationProvider: ConfigurationProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthStateService,
        PublicEventsService,
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: TokenValidationService, useClass: TokenValidationServiceMock },
        { provide: PlatformProvider, useClass: PlatformProviderMock },
        {
          provide: StoragePersistenceService,
          useClass: StoragePersistenceServiceMock,
        },
      ],
    });
  });

  beforeEach(() => {
    authStateService = TestBed.inject(AuthStateService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    eventsService = TestBed.inject(PublicEventsService);
    tokenValidationService = TestBed.inject(TokenValidationService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
  });

  it('should create', () => {
    expect(authStateService).toBeTruthy();
  });

  it('public authorize$ is observable$', () => {
    expect(authStateService.authenticated$).toEqual(jasmine.any(Observable));
  });

  describe('setAuthorizedAndFireEvent', () => {
    it('throws event with boolean (single config)', () => {
      const spy = spyOn((authStateService as any).authenticatedInternal$, 'next');
      authStateService.setAuthenticatedAndFireEvent();
      expect(spy).toHaveBeenCalledWith(true);
    });

    it('throws event with ConfigAuthenticatedResult (multiple configs)', () => {
      spyOn(configurationProvider, 'hasManyConfigs').and.returnValue(true);
      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ configId: 'configId1' }, { configId: 'configId2' }]);

      const spy = spyOn((authStateService as any).authenticatedInternal$, 'next');

      authStateService.setAuthenticatedAndFireEvent();

      expect(spy).toHaveBeenCalledWith([
        { configId: 'configId1', isAuthenticated: false },
        { configId: 'configId2', isAuthenticated: false },
      ]);
    });

    it('throws event with ConfigAuthenticatedResult (multiple configs), one is authenticated', () => {
      spyOn(configurationProvider, 'hasManyConfigs').and.returnValue(true);
      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ configId: 'configId1' }, { configId: 'configId2' }]);
      spyOn(storagePersistenceService, 'getAccessToken')
        .withArgs('configId1')
        .and.returnValue('someAccessToken')
        .withArgs('configId2')
        .and.returnValue(null);

      spyOn(storagePersistenceService, 'getIdToken')
        .withArgs('configId1')
        .and.returnValue('someIdToken')
        .withArgs('configId2')
        .and.returnValue(null);

      const spy = spyOn((authStateService as any).authenticatedInternal$, 'next');

      authStateService.setAuthenticatedAndFireEvent();

      expect(spy).toHaveBeenCalledWith([
        { configId: 'configId1', isAuthenticated: true },
        { configId: 'configId2', isAuthenticated: false },
      ]);
    });
  });

  describe('setUnauthorizedAndFireEvent', () => {
    it('persist AuthState In Storage', () => {
      const spy = spyOn(storagePersistenceService, 'resetAuthStateInStorage');
      authStateService.setUnauthenticatedAndFireEvent('configIdToReset');
      expect(spy).toHaveBeenCalledWith('configIdToReset');
    });

    it('throws event with boolean (single config)', () => {
      const spy = spyOn((authStateService as any).authenticatedInternal$, 'next');
      authStateService.setUnauthenticatedAndFireEvent('configId');
      expect(spy).toHaveBeenCalledWith(false);
    });

    it('throws event with ConfigAuthenticatedResult (multiple configs)', () => {
      spyOn(configurationProvider, 'hasManyConfigs').and.returnValue(true);
      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ configId: 'configId1' }, { configId: 'configId2' }]);

      const spy = spyOn((authStateService as any).authenticatedInternal$, 'next');

      authStateService.setUnauthenticatedAndFireEvent('configIdToReset');

      expect(spy).toHaveBeenCalledWith([
        { configId: 'configId1', isAuthenticated: false },
        { configId: 'configId2', isAuthenticated: false },
      ]);
    });

    it('throws event with ConfigAuthenticatedResult (multiple configs), one is authenticated', () => {
      spyOn(configurationProvider, 'hasManyConfigs').and.returnValue(true);
      spyOn(configurationProvider, 'getAllConfigurations').and.returnValue([{ configId: 'configId1' }, { configId: 'configId2' }]);
      spyOn(storagePersistenceService, 'getAccessToken')
        .withArgs('configId1')
        .and.returnValue('someAccessToken')
        .withArgs('configId2')
        .and.returnValue(null);

      spyOn(storagePersistenceService, 'getIdToken')
        .withArgs('configId1')
        .and.returnValue('someIdToken')
        .withArgs('configId2')
        .and.returnValue(null);

      const spy = spyOn((authStateService as any).authenticatedInternal$, 'next');

      authStateService.setUnauthenticatedAndFireEvent('configIdToReset');

      expect(spy).toHaveBeenCalledWith([
        { configId: 'configId1', isAuthenticated: true },
        { configId: 'configId2', isAuthenticated: false },
      ]);
    });
  });

  describe('updateAndPublishAuthState', () => {
    it('calls eventsService', () => {
      spyOn(eventsService, 'fireEvent');
      authStateService.updateAndPublishAuthState({ isAuthenticated: false, isRenewProcess: false, validationResult: null });
      expect(eventsService.fireEvent).toHaveBeenCalledWith(EventTypes.NewAuthorizationResult, jasmine.any(Object));
    });
  });

  describe('setAuthorizationData', () => {
    it('stores accessToken', () => {
      const spy = spyOn(storagePersistenceService, 'write');
      const authResult = {
        id_token: 'idtoken',
        access_token: 'accesstoken',
        expires_in: 330,
        token_type: 'Bearer',
        refresh_token: '9UuSQKx_UaGJSEvfHW2NK6FxAPSVvK-oVyeOb1Sstz0',
        scope: 'openid profile email taler_api offline_access',
        state: '7bad349c97cd7391abb6dfc41ec8c8e8ee8yeprJL',
        session_state: 'gjNckdb8h4HS5us_3oz68oqsAhvNMOMpgsJNqrhy7kM.rBe66j0WPYpSx_c4vLM-5w',
      };

      authStateService.setAuthorizationData('accesstoken', authResult, 'configId');

      expect(spy).toHaveBeenCalledWith('authzData', 'accesstoken', 'configId');
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('does not crash and store accessToken when authResult is null', () => {
      const spy = spyOn(storagePersistenceService, 'write');
      const authResult = null;

      authStateService.setAuthorizationData('accesstoken', authResult, 'configId');

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('calls setAuthenticatedAndFireEvent() method', () => {
      const spy = spyOn(authStateService, 'setAuthenticatedAndFireEvent');
      const authResult = {
        id_token: 'idtoken',
        access_token: 'accesstoken',
        expires_in: 330,
        token_type: 'Bearer',
        refresh_token: '9UuSQKx_UaGJSEvfHW2NK6FxAPSVvK-oVyeOb1Sstz0',
        scope: 'openid profile email taler_api offline_access',
        state: '7bad349c97cd7391abb6dfc41ec8c8e8ee8yeprJL',
        session_state: 'gjNckdb8h4HS5us_3oz68oqsAhvNMOMpgsJNqrhy7kM.rBe66j0WPYpSx_c4vLM-5w',
      };
      authStateService.setAuthorizationData('not used', authResult, 'configId');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getAccessToken', () => {
    it('isAuthorized is false returns null', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('');
      const result = authStateService.getAccessToken('configId');
      expect(result).toBe(null);
    });

    it('returns false if storagePersistenceService returns something falsy but authorized', () => {
      spyOn(authStateService, 'isAuthenticated').and.returnValue(true);
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('');
      const result = authStateService.getAccessToken('configId');
      expect(result).toBe('');
    });

    it('isAuthorized is true returns decodeURIComponent(token)', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('HenloLegger');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('HenloFuriend');
      const result = authStateService.getAccessToken('configId');
      expect(result).toBe(decodeURIComponent('HenloLegger'));
    });
  });

  describe('getAuthenticationResult', () => {
    it('isAuthorized is false returns null', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('');

      spyOn(storagePersistenceService, 'getAuthenticationResult').withArgs('configId').and.returnValue(null);

      const result = authStateService.getAuthenticationResult('configId');
      expect(result).toBe(null);
    });

    it('returns false if storagePersistenceService returns something falsy but authorized', () => {
      spyOn(authStateService, 'isAuthenticated').and.returnValue(true);
      spyOn(storagePersistenceService, 'getAuthenticationResult').withArgs('configId').and.returnValue(null);

      const result = authStateService.getAuthenticationResult('configId');
      expect(result).toBe('');
    });

    it('isAuthorized is true returns object', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('HenloLegger');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('HenloFuriend');
      spyOn(storagePersistenceService, 'getAuthenticationResult').withArgs('configId').and.returnValue({ test: 'HenloFuriend' });

      const result = authStateService.getAuthenticationResult('configId');
      expect(result.test).toBe('HenloLegger');
    });
  });

  describe('getIdToken', () => {
    it('isAuthorized is false returns null', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('');
      const result = authStateService.getIdToken('configId');
      expect(result).toBe(null);
    });

    it('isAuthorized is true returns decodeURIComponent(token)', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('HenloLegger');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('HenloFuriend');
      const result = authStateService.getIdToken('configId');
      expect(result).toBe(decodeURIComponent('HenloFuriend'));
    });
  });

  describe('getRefreshToken', () => {
    it('isAuthorized is false returns null', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('');
      const result = authStateService.getRefreshToken('configId');
      expect(result).toBe(null);
    });

    it('isAuthorized is true returns decodeURIComponent(token)', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('HenloLegger');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('HenloFuriend');
      spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue('HenloRefreshLegger');
      const result = authStateService.getRefreshToken('configId');
      expect(result).toBe(decodeURIComponent('HenloRefreshLegger'));
    });
  });

  describe('areAuthStorageTokensValid', () => {
    it('isAuthorized is false returns false', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('');
      const result = authStateService.areAuthStorageTokensValid('configId');
      expect(result).toBeFalse();
    });

    it('isAuthorized is true and id_token is expired returns true', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('HenloLegger');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('HenloFuriend');

      spyOn(authStateService as any, 'hasIdTokenExpiredAndRenewCheckIsEnabled').and.returnValue(true);
      spyOn(authStateService as any, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(false);
      const result = authStateService.areAuthStorageTokensValid('configId');
      expect(result).toBeFalse();
    });

    it('isAuthorized is true  and access_token is expired returns true', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('HenloLegger');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('HenloFuriend');

      spyOn(authStateService as any, 'hasIdTokenExpiredAndRenewCheckIsEnabled').and.returnValue(false);
      spyOn(authStateService as any, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(true);
      const result = authStateService.areAuthStorageTokensValid('configId');
      expect(result).toBeFalse();
    });

    it('isAuthorized is true  and id_token is not expired returns true', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('HenloLegger');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('HenloFuriend');

      spyOn(authStateService as any, 'hasIdTokenExpiredAndRenewCheckIsEnabled').and.returnValue(false);
      spyOn(authStateService as any, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(false);
      const result = authStateService.areAuthStorageTokensValid('configId');
      expect(result).toBeTrue();
    });

    it('authState is AuthorizedState.Authorized and id_token is not expired fires event', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('HenloLegger');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('HenloFuriend');

      spyOn(authStateService as any, 'hasIdTokenExpiredAndRenewCheckIsEnabled').and.returnValue(false);
      spyOn(authStateService as any, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(false);
      const result = authStateService.areAuthStorageTokensValid('configId');
      expect(result).toBeTrue();
    });
  });

  describe('hasIdTokenExpiredAndRenewCheckIsEnabled', () => {
    it('tokenValidationService gets called with id token if id_token is set', () => {
      configurationProvider.setConfig({ renewTimeBeforeTokenExpiresInSeconds: 30, enableIdTokenExpiredValidationInRenew: true });
      spyOn(storagePersistenceService, 'getIdToken').withArgs('configId').and.returnValue('idToken');
      const spy = spyOn(tokenValidationService, 'hasIdTokenExpired').and.callFake((a, b) => true);

      authStateService.hasIdTokenExpiredAndRenewCheckIsEnabled('configId');

      expect(spy).toHaveBeenCalledWith('idToken', 'configId', 30);
    });

    it('fires event if idToken is expired', () => {
      configurationProvider.setConfig({ renewTimeBeforeTokenExpiresInSeconds: 30, enableIdTokenExpiredValidationInRenew: true });
      spyOn(tokenValidationService, 'hasIdTokenExpired').and.callFake((a, b) => true);

      const spy = spyOn(eventsService, 'fireEvent');

      spyOn(storagePersistenceService, 'read').withArgs('authnResult', 'configId').and.returnValue('idToken');

      const result = authStateService.hasIdTokenExpiredAndRenewCheckIsEnabled('configId');

      expect(result).toBe(true);
      expect(spy).toHaveBeenCalledWith(EventTypes.IdTokenExpired, true);
    });

    it('does NOT fire event if idToken is NOT expired', () => {
      configurationProvider.setConfig({ renewTimeBeforeTokenExpiresInSeconds: 30 });
      spyOn(tokenValidationService, 'hasIdTokenExpired').and.callFake((a, b) => false);

      const spy = spyOn(eventsService, 'fireEvent');

      spyOn(storagePersistenceService, 'read').withArgs('authnResult', 'configId').and.returnValue('idToken');
      const result = authStateService.hasIdTokenExpiredAndRenewCheckIsEnabled('configId');
      expect(result).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('hasAccessTokenExpiredIfExpiryExists', () => {
    it('negates the result of internal call of `validateAccessTokenNotExpired`', () => {
      const validateAccessTokenNotExpiredResult = true;
      const expectedResult = !validateAccessTokenNotExpiredResult;
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ renewTimeBeforeTokenExpiresInSeconds: 5 });
      const date = new Date(new Date().toUTCString());
      spyOn(storagePersistenceService, 'read').withArgs('access_token_expires_at', 'configId').and.returnValue(date);
      const spy = spyOn(tokenValidationService, 'validateAccessTokenNotExpired').and.returnValue(validateAccessTokenNotExpiredResult);
      const result = authStateService.hasAccessTokenExpiredIfExpiryExists('configId');
      expect(spy).toHaveBeenCalledWith(date, 'configId', 5);
      expect(result).toEqual(expectedResult);
    });

    it('throws event when token is expired', () => {
      const validateAccessTokenNotExpiredResult = false;
      const expectedResult = !validateAccessTokenNotExpiredResult;
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ renewTimeBeforeTokenExpiresInSeconds: 5 });
      const date = new Date(new Date().toUTCString());

      spyOn(eventsService, 'fireEvent');

      spyOn(storagePersistenceService, 'read').withArgs('access_token_expires_at', 'configId').and.returnValue(date);
      spyOn(tokenValidationService, 'validateAccessTokenNotExpired').and.returnValue(validateAccessTokenNotExpiredResult);
      authStateService.hasAccessTokenExpiredIfExpiryExists('configId');
      expect(eventsService.fireEvent).toHaveBeenCalledWith(EventTypes.TokenExpired, expectedResult);
    });
  });
});
