import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { EventTypes, PublicEventsService } from '../../public-api';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { StoragePersistenceServiceMock } from '../storage/storage-persistence-service-mock.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
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
        ConfigurationProvider,
        AuthStateService,
        PublicEventsService,
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
    it('throws event when state is being set to `true`', () => {
      const spy = spyOn((authStateService as any).authorizedInternal$, 'next');
      authStateService.setAuthenticatedAndFireEvent();
      expect(spy).toHaveBeenCalledWith(true);
    });
  });

  describe('setUnauthorizedAndFireEvent', () => {
    it('persist AuthState In Storage', () => {
      const spy = spyOn(storagePersistenceService, 'resetAuthStateInStorage');
      authStateService.setUnauthenticatedAndFireEvent();
      expect(spy).toHaveBeenCalled();
    });

    it('throws event when state is being set to `false`', () => {
      const spy = spyOn((authStateService as any).authorizedInternal$, 'next');
      authStateService.setUnauthenticatedAndFireEvent();
      expect(spy).toHaveBeenCalledWith(false);
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
      authStateService.setAuthorizationData('accesstoken', authResult);
      expect(spy).toHaveBeenCalledWith('authzData', 'accesstoken');
    });

    it('calls setAuthorizedAndFireEvent() method', () => {
      const spy = spyOn(authStateService, 'setAuthorizedAndFireEvent');
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
      authStateService.setAuthorizationData('not used', authResult);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getAccessToken', () => {
    it('isAuthorized is false returns null', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('');
      const result = authStateService.getAccessToken();
      expect(result).toBe(null);
    });

    it('returns false if storagePersistenceService returns something falsy but authorized', () => {
      spyOnProperty(authStateService as any, 'isAuthorized', 'get').and.returnValue(true);
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('');
      const result = authStateService.getAccessToken();
      expect(result).toBe('');
    });

    it('isAuthorized is true returns decodeURIComponent(token)', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('HenloLegger');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('HenloFuriend');
      const result = authStateService.getAccessToken();
      expect(result).toBe(decodeURIComponent('HenloLegger'));
    });
  });

  describe('getIdToken', () => {
    it('isAuthorized is false returns null', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('');
      const result = authStateService.getIdToken();
      expect(result).toBe(null);
    });

    it('isAuthorized is true returns decodeURIComponent(token)', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('HenloLegger');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('HenloFuriend');
      const result = authStateService.getIdToken();
      expect(result).toBe(decodeURIComponent('HenloFuriend'));
    });
  });

  describe('getRefreshToken', () => {
    it('isAuthorized is false returns null', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('');
      const result = authStateService.getRefreshToken();
      expect(result).toBe(null);
    });

    it('isAuthorized is true returns decodeURIComponent(token)', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('HenloLegger');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('HenloFuriend');
      spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue('HenloRefreshLegger');
      const result = authStateService.getRefreshToken();
      expect(result).toBe(decodeURIComponent('HenloRefreshLegger'));
    });
  });

  describe('areAuthStorageTokensValid', () => {
    it('isAuthorized is false returns false', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('');
      const result = authStateService.areAuthStorageTokensValid();
      expect(result).toBeFalse();
    });

    it('isAuthorized is true and id_token is expired returns true', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('HenloLegger');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('HenloFuriend');

      spyOn(authStateService as any, 'hasIdTokenExpired').and.returnValue(true);
      spyOn(authStateService as any, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(false);
      const result = authStateService.areAuthStorageTokensValid();
      expect(result).toBeFalse();
    });

    it('isAuthorized is true  and access_token is expired returns true', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('HenloLegger');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('HenloFuriend');

      spyOn(authStateService as any, 'hasIdTokenExpired').and.returnValue(false);
      spyOn(authStateService as any, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(true);
      const result = authStateService.areAuthStorageTokensValid();
      expect(result).toBeFalse();
    });

    it('isAuthorized is true  and id_token is not expired returns true', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('HenloLegger');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('HenloFuriend');

      spyOn(authStateService as any, 'hasIdTokenExpired').and.returnValue(false);
      spyOn(authStateService as any, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(false);
      const result = authStateService.areAuthStorageTokensValid();
      expect(result).toBeTrue();
    });

    it('authState is AuthorizedState.Authorized and id_token is not expired fires event', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('HenloLegger');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('HenloFuriend');

      spyOn(authStateService as any, 'hasIdTokenExpired').and.returnValue(false);
      spyOn(authStateService as any, 'hasAccessTokenExpiredIfExpiryExists').and.returnValue(false);
      const result = authStateService.areAuthStorageTokensValid();
      expect(result).toBeTrue();
    });
  });

  describe('hasIdTokenExpired', () => {
    it('tokenValidationService gets called with id token if id_token is set', () => {
      configurationProvider.setConfig({ renewTimeBeforeTokenExpiresInSeconds: 30 });
      spyOn(storagePersistenceService, 'read').withArgs('authnResult').and.returnValue({ id_token: 'idToken' });
      const spy = spyOn(tokenValidationService, 'hasIdTokenExpired').and.callFake((a, b) => true);
      authStateService.hasIdTokenExpired();
      expect(spy).toHaveBeenCalledWith('idToken', 30);
    });

    it('fires event if idToken is expired', () => {
      configurationProvider.setConfig({ renewTimeBeforeTokenExpiresInSeconds: 30 });
      spyOn(tokenValidationService, 'hasIdTokenExpired').and.callFake((a, b) => true);

      const spy = spyOn(eventsService, 'fireEvent');

      spyOn(storagePersistenceService, 'read').withArgs('authnResult').and.returnValue('idToken');
      const result = authStateService.hasIdTokenExpired();
      expect(result).toBe(true);
      expect(spy).toHaveBeenCalledWith(EventTypes.IdTokenExpired, true);
    });

    it('does NOT fire event if idToken is NOT expired', () => {
      configurationProvider.setConfig({ renewTimeBeforeTokenExpiresInSeconds: 30 });
      spyOn(tokenValidationService, 'hasIdTokenExpired').and.callFake((a, b) => false);

      const spy = spyOn(eventsService, 'fireEvent');

      spyOn(storagePersistenceService, 'read').withArgs('authnResult').and.returnValue('idToken');
      const result = authStateService.hasIdTokenExpired();
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
      spyOn(storagePersistenceService, 'read').withArgs('access_token_expires_at').and.returnValue(date);
      const spy = spyOn(tokenValidationService, 'validateAccessTokenNotExpired').and.returnValue(validateAccessTokenNotExpiredResult);
      const result = authStateService.hasAccessTokenExpiredIfExpiryExists();
      expect(spy).toHaveBeenCalledWith(date, 5);
      expect(result).toEqual(expectedResult);
    });

    it('throws event when token is expired', () => {
      const validateAccessTokenNotExpiredResult = false;
      const expectedResult = !validateAccessTokenNotExpiredResult;
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ renewTimeBeforeTokenExpiresInSeconds: 5 });
      const date = new Date(new Date().toUTCString());

      spyOn(eventsService, 'fireEvent');

      spyOn(storagePersistenceService, 'read').withArgs('access_token_expires_at').and.returnValue(date);
      spyOn(tokenValidationService, 'validateAccessTokenNotExpired').and.returnValue(validateAccessTokenNotExpiredResult);
      authStateService.hasAccessTokenExpiredIfExpiryExists();
      expect(eventsService.fireEvent).toHaveBeenCalledWith(EventTypes.TokenExpired, expectedResult);
    });
  });
});
