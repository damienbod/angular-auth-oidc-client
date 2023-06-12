import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { mockClass } from '../../test/auto-mock';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { TokenValidationService } from '../validation/token-validation.service';
import { AuthStateService } from './auth-state.service';

describe('Auth State Service', () => {
  let authStateService: AuthStateService;
  let storagePersistenceService: StoragePersistenceService;
  let eventsService: PublicEventsService;
  let tokenValidationService: TokenValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthStateService,
        PublicEventsService,
        { provide: LoggerService, useClass: mockClass(LoggerService) },
        {
          provide: TokenValidationService,
          useClass: mockClass(TokenValidationService),
        },
        { provide: PlatformProvider, useClass: mockClass(PlatformProvider) },
        {
          provide: StoragePersistenceService,
          useClass: mockClass(StoragePersistenceService),
        },
      ],
    });
  });

  beforeEach(() => {
    authStateService = TestBed.inject(AuthStateService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    eventsService = TestBed.inject(PublicEventsService);
    tokenValidationService = TestBed.inject(TokenValidationService);
  });

  it('should create', () => {
    expect(authStateService).toBeTruthy();
  });

  it('public authorize$ is observable$', () => {
    expect(authStateService.authenticated$).toEqual(jasmine.any(Observable));
  });

  describe('setAuthorizedAndFireEvent', () => {
    it('throws correct event with single config', () => {
      const spy = spyOn(
        (authStateService as any).authenticatedInternal$,
        'next'
      );

      authStateService.setAuthenticatedAndFireEvent([
        { configId: 'configId1' },
      ]);

      expect(spy).toHaveBeenCalledOnceWith({
        isAuthenticated: true,
        allConfigsAuthenticated: [
          { configId: 'configId1', isAuthenticated: true },
        ],
      });
    });

    it('throws correct event with multiple configs', () => {
      const spy = spyOn(
        (authStateService as any).authenticatedInternal$,
        'next'
      );

      authStateService.setAuthenticatedAndFireEvent([
        { configId: 'configId1' },
        { configId: 'configId2' },
      ]);

      expect(spy).toHaveBeenCalledOnceWith({
        isAuthenticated: false,
        allConfigsAuthenticated: [
          { configId: 'configId1', isAuthenticated: false },
          { configId: 'configId2', isAuthenticated: false },
        ],
      });
    });

    it('throws correct event with multiple configs, one is authenticated', () => {
      const allConfigs = [{ configId: 'configId1' }, { configId: 'configId2' }];

      spyOn(storagePersistenceService, 'getAccessToken')
        .withArgs(allConfigs[0])
        .and.returnValue('someAccessToken')
        .withArgs(allConfigs[1])
        .and.returnValue(null);

      spyOn(storagePersistenceService, 'getIdToken')
        .withArgs(allConfigs[0])
        .and.returnValue('someIdToken')
        .withArgs(allConfigs[1])
        .and.returnValue(null);

      const spy = spyOn(
        (authStateService as any).authenticatedInternal$,
        'next'
      );

      authStateService.setAuthenticatedAndFireEvent(allConfigs);

      expect(spy).toHaveBeenCalledOnceWith({
        isAuthenticated: false,
        allConfigsAuthenticated: [
          { configId: 'configId1', isAuthenticated: true },
          { configId: 'configId2', isAuthenticated: false },
        ],
      });
    });
  });

  describe('setUnauthorizedAndFireEvent', () => {
    it('persist AuthState In Storage', () => {
      const spy = spyOn(storagePersistenceService, 'resetAuthStateInStorage');

      authStateService.setUnauthenticatedAndFireEvent(
        { configId: 'configId1' },
        [{ configId: 'configId1' }]
      );
      expect(spy).toHaveBeenCalledOnceWith({ configId: 'configId1' });
    });

    it('throws correct event with single config', () => {
      const spy = spyOn(
        (authStateService as any).authenticatedInternal$,
        'next'
      );

      authStateService.setUnauthenticatedAndFireEvent(
        { configId: 'configId1' },
        [{ configId: 'configId1' }]
      );

      expect(spy).toHaveBeenCalledOnceWith({
        isAuthenticated: false,
        allConfigsAuthenticated: [
          { configId: 'configId1', isAuthenticated: false },
        ],
      });
    });

    it('throws correct event with multiple configs', () => {
      const spy = spyOn(
        (authStateService as any).authenticatedInternal$,
        'next'
      );

      authStateService.setUnauthenticatedAndFireEvent(
        { configId: 'configId1' },
        [{ configId: 'configId1' }, { configId: 'configId2' }]
      );

      expect(spy).toHaveBeenCalledOnceWith({
        isAuthenticated: false,
        allConfigsAuthenticated: [
          { configId: 'configId1', isAuthenticated: false },
          { configId: 'configId2', isAuthenticated: false },
        ],
      });
    });

    it('throws correct event with multiple configs, one is authenticated', () => {
      spyOn(storagePersistenceService, 'getAccessToken')
        .withArgs({ configId: 'configId1' })
        .and.returnValue('someAccessToken')
        .withArgs({ configId: 'configId2' })
        .and.returnValue(null);

      spyOn(storagePersistenceService, 'getIdToken')
        .withArgs({ configId: 'configId1' })
        .and.returnValue('someIdToken')
        .withArgs({ configId: 'configId2' })
        .and.returnValue(null);

      const spy = spyOn(
        (authStateService as any).authenticatedInternal$,
        'next'
      );

      authStateService.setUnauthenticatedAndFireEvent(
        { configId: 'configId1' },
        [{ configId: 'configId1' }, { configId: 'configId2' }]
      );

      expect(spy).toHaveBeenCalledOnceWith({
        isAuthenticated: false,
        allConfigsAuthenticated: [
          { configId: 'configId1', isAuthenticated: true },
          { configId: 'configId2', isAuthenticated: false },
        ],
      });
    });
  });

  describe('updateAndPublishAuthState', () => {
    it('calls eventsService', () => {
      spyOn(eventsService, 'fireEvent');

      authStateService.updateAndPublishAuthState({
        isAuthenticated: false,
        isRenewProcess: false,
        validationResult: null,
      });

      expect(eventsService.fireEvent).toHaveBeenCalledOnceWith(
        EventTypes.NewAuthenticationResult,
        jasmine.any(Object)
      );
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
        session_state:
          'gjNckdb8h4HS5us_3oz68oqsAhvNMOMpgsJNqrhy7kM.rBe66j0WPYpSx_c4vLM-5w',
      };

      authStateService.setAuthorizationData(
        'accesstoken',
        authResult,
        { configId: 'configId1' },
        [{ configId: 'configId1' }]
      );
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy.calls.allArgs()).toEqual([
        ['authzData', 'accesstoken', { configId: 'configId1' }],
        [
          'access_token_expires_at',
          jasmine.any(Number),
          { configId: 'configId1' },
        ],
      ]);
    });

    it('does not crash and store accessToken when authResult is null', () => {
      const spy = spyOn(storagePersistenceService, 'write');
      const authResult = null;

      authStateService.setAuthorizationData(
        'accesstoken',
        authResult,
        { configId: 'configId1' },
        [{ configId: 'configId1' }]
      );

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
        session_state:
          'gjNckdb8h4HS5us_3oz68oqsAhvNMOMpgsJNqrhy7kM.rBe66j0WPYpSx_c4vLM-5w',
      };

      authStateService.setAuthorizationData(
        'not used',
        authResult,
        { configId: 'configId1' },
        [{ configId: 'configId1' }]
      );

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getAccessToken', () => {
    it('isAuthorized is false returns null', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('');
      const result = authStateService.getAccessToken({ configId: 'configId1' });

      expect(result).toBe(null);
    });

    it('returns false if storagePersistenceService returns something falsy but authorized', () => {
      spyOn(authStateService, 'isAuthenticated').and.returnValue(true);
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('');
      const result = authStateService.getAccessToken({ configId: 'configId1' });

      expect(result).toBe('');
    });

    it('isAuthorized is true returns decodeURIComponent(token)', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue(
        'HenloLegger'
      );
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue(
        'HenloFuriend'
      );
      const result = authStateService.getAccessToken({ configId: 'configId1' });

      expect(result).toBe(decodeURIComponent('HenloLegger'));
    });
  });

  describe('getAuthenticationResult', () => {
    it('isAuthorized is false returns null', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('');

      spyOn(storagePersistenceService, 'getAuthenticationResult')
        .withArgs({ configId: 'configId1' })
        .and.returnValue(null);

      const result = authStateService.getAuthenticationResult({
        configId: 'configId1',
      });

      expect(result).toBe(null);
    });

    it('returns false if storagePersistenceService returns something falsy but authorized', () => {
      spyOn(authStateService, 'isAuthenticated').and.returnValue(true);
      spyOn(storagePersistenceService, 'getAuthenticationResult')
        .withArgs({ configId: 'configId1' })
        .and.returnValue(null);

      const result = authStateService.getAuthenticationResult({
        configId: 'configId1',
      });

      expect(result).toBe(null);
    });

    it('isAuthorized is true returns object', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue(
        'HenloLegger'
      );
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue(
        'HenloFuriend'
      );
      spyOn(storagePersistenceService, 'getAuthenticationResult')
        .withArgs({ configId: 'configId1' })
        .and.returnValue({ test: 'HenloFuriend' });

      const result = authStateService.getAuthenticationResult({
        configId: 'configId1',
      });

      expect(result.test).toBe('HenloFuriend');
    });
  });

  describe('getIdToken', () => {
    it('isAuthorized is false returns null', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('');
      const result = authStateService.getIdToken({ configId: 'configId1' });

      expect(result).toBe(null);
    });

    it('isAuthorized is true returns decodeURIComponent(token)', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue(
        'HenloLegger'
      );
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue(
        'HenloFuriend'
      );
      const result = authStateService.getIdToken({ configId: 'configId1' });

      expect(result).toBe(decodeURIComponent('HenloFuriend'));
    });
  });

  describe('getRefreshToken', () => {
    it('isAuthorized is false returns null', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('');
      const result = authStateService.getRefreshToken({
        configId: 'configId1',
      });

      expect(result).toBe(null);
    });

    it('isAuthorized is true returns decodeURIComponent(token)', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue(
        'HenloLegger'
      );
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue(
        'HenloFuriend'
      );
      spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(
        'HenloRefreshLegger'
      );
      const result = authStateService.getRefreshToken({
        configId: 'configId1',
      });

      expect(result).toBe(decodeURIComponent('HenloRefreshLegger'));
    });
  });

  describe('areAuthStorageTokensValid', () => {
    it('isAuthorized is false returns false', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue('');
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue('');
      const result = authStateService.areAuthStorageTokensValid({
        configId: 'configId1',
      });

      expect(result).toBeFalse();
    });

    it('isAuthorized is true and id_token is expired returns true', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue(
        'HenloLegger'
      );
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue(
        'HenloFuriend'
      );

      spyOn(
        authStateService as any,
        'hasIdTokenExpiredAndRenewCheckIsEnabled'
      ).and.returnValue(true);
      spyOn(
        authStateService as any,
        'hasAccessTokenExpiredIfExpiryExists'
      ).and.returnValue(false);
      const result = authStateService.areAuthStorageTokensValid({
        configId: 'configId1',
      });

      expect(result).toBeFalse();
    });

    it('isAuthorized is true  and access_token is expired returns true', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue(
        'HenloLegger'
      );
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue(
        'HenloFuriend'
      );

      spyOn(
        authStateService as any,
        'hasIdTokenExpiredAndRenewCheckIsEnabled'
      ).and.returnValue(false);
      spyOn(
        authStateService as any,
        'hasAccessTokenExpiredIfExpiryExists'
      ).and.returnValue(true);
      const result = authStateService.areAuthStorageTokensValid({
        configId: 'configId1',
      });

      expect(result).toBeFalse();
    });

    it('isAuthorized is true  and id_token is not expired returns true', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue(
        'HenloLegger'
      );
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue(
        'HenloFuriend'
      );

      spyOn(
        authStateService as any,
        'hasIdTokenExpiredAndRenewCheckIsEnabled'
      ).and.returnValue(false);
      spyOn(
        authStateService as any,
        'hasAccessTokenExpiredIfExpiryExists'
      ).and.returnValue(false);
      const result = authStateService.areAuthStorageTokensValid({
        configId: 'configId1',
      });

      expect(result).toBeTrue();
    });

    it('authState is AuthorizedState.Authorized and id_token is not expired fires event', () => {
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue(
        'HenloLegger'
      );
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue(
        'HenloFuriend'
      );

      spyOn(
        authStateService as any,
        'hasIdTokenExpiredAndRenewCheckIsEnabled'
      ).and.returnValue(false);
      spyOn(
        authStateService as any,
        'hasAccessTokenExpiredIfExpiryExists'
      ).and.returnValue(false);
      const result = authStateService.areAuthStorageTokensValid({
        configId: 'configId1',
      });

      expect(result).toBeTrue();
    });
  });

  describe('hasIdTokenExpiredAndRenewCheckIsEnabled', () => {
    it('tokenValidationService gets called with id token if id_token is set', () => {
      const config = {
        configId: 'configId1',
        renewTimeBeforeTokenExpiresInSeconds: 30,
        triggerRefreshWhenIdTokenExpired: true,
      };

      spyOn(storagePersistenceService, 'getIdToken')
        .withArgs(config)
        .and.returnValue('idToken');
      const spy = spyOn(
        tokenValidationService,
        'hasIdTokenExpired'
      ).and.callFake((_a, _b) => true);

      authStateService.hasIdTokenExpiredAndRenewCheckIsEnabled(config);

      expect(spy).toHaveBeenCalledOnceWith('idToken', config, 30);
    });

    it('fires event if idToken is expired', () => {
      spyOn(tokenValidationService, 'hasIdTokenExpired').and.callFake(
        (_a, _b) => true
      );

      const spy = spyOn(eventsService, 'fireEvent');
      const config = {
        configId: 'configId1',
        renewTimeBeforeTokenExpiresInSeconds: 30,
        triggerRefreshWhenIdTokenExpired: true,
      };

      spyOn(storagePersistenceService, 'read')
        .withArgs('authnResult', config)
        .and.returnValue('idToken');

      const result =
        authStateService.hasIdTokenExpiredAndRenewCheckIsEnabled(config);

      expect(result).toBe(true);
      expect(spy).toHaveBeenCalledOnceWith(EventTypes.IdTokenExpired, true);
    });

    it('does NOT fire event if idToken is NOT expired', () => {
      spyOn(tokenValidationService, 'hasIdTokenExpired').and.callFake(
        (_a, _b) => false
      );

      const spy = spyOn(eventsService, 'fireEvent');
      const config = {
        configId: 'configId1',
        renewTimeBeforeTokenExpiresInSeconds: 30,
      };

      spyOn(storagePersistenceService, 'read')
        .withArgs('authnResult', config)
        .and.returnValue('idToken');
      const result =
        authStateService.hasIdTokenExpiredAndRenewCheckIsEnabled(config);

      expect(result).toBe(false);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('hasAccessTokenExpiredIfExpiryExists', () => {
    it('negates the result of internal call of `validateAccessTokenNotExpired`', () => {
      const validateAccessTokenNotExpiredResult = true;
      const expectedResult = !validateAccessTokenNotExpiredResult;
      const date = new Date(new Date().toUTCString());
      const config = {
        configId: 'configId1',
        renewTimeBeforeTokenExpiresInSeconds: 5,
      };

      spyOn(storagePersistenceService, 'read')
        .withArgs('access_token_expires_at', config)
        .and.returnValue(date);
      const spy = spyOn(
        tokenValidationService,
        'validateAccessTokenNotExpired'
      ).and.returnValue(validateAccessTokenNotExpiredResult);
      const result =
        authStateService.hasAccessTokenExpiredIfExpiryExists(config);

      expect(spy).toHaveBeenCalledOnceWith(date, config, 5);
      expect(result).toEqual(expectedResult);
    });

    it('throws event when token is expired', () => {
      const validateAccessTokenNotExpiredResult = false;
      const expectedResult = !validateAccessTokenNotExpiredResult;
      // spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ renewTimeBeforeTokenExpiresInSeconds: 5 });
      const date = new Date(new Date().toUTCString());
      const config = {
        configId: 'configId1',
        renewTimeBeforeTokenExpiresInSeconds: 5,
      };

      spyOn(eventsService, 'fireEvent');

      spyOn(storagePersistenceService, 'read')
        .withArgs('access_token_expires_at', config)
        .and.returnValue(date);
      spyOn(
        tokenValidationService,
        'validateAccessTokenNotExpired'
      ).and.returnValue(validateAccessTokenNotExpiredResult);
      authStateService.hasAccessTokenExpiredIfExpiryExists(config);
      expect(eventsService.fireEvent).toHaveBeenCalledOnceWith(
        EventTypes.TokenExpired,
        expectedResult
      );
    });
  });
});
