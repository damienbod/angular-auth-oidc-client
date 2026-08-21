import { TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { LoggerService } from '../logging/logger.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { TokenValidationService } from '../validation/token-validation.service';
import { ValidationResult } from '../validation/validation-result';
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
        mockProvider(LoggerService),
        mockProvider(TokenValidationService),
        mockProvider(PlatformProvider),
        mockProvider(StoragePersistenceService),
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
    expect(authStateService.authenticated$).toEqual(expect.any(Observable));
  });

  describe('setAuthorizedAndFireEvent', () => {
    it('throws correct event with single config', () => {
      const spy = vi
        .spyOn((authStateService as any).authenticatedInternal$, 'next')
        .mockReturnValue(undefined);

      authStateService.setAuthenticatedAndFireEvent([
        { configId: 'configId1' },
      ]);

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith({
        isAuthenticated: true,
        allConfigsAuthenticated: [
          { configId: 'configId1', isAuthenticated: true },
        ],
      });
    });

    it('throws correct event with multiple configs', () => {
      const spy = vi
        .spyOn((authStateService as any).authenticatedInternal$, 'next')
        .mockReturnValue(undefined);

      authStateService.setAuthenticatedAndFireEvent([
        { configId: 'configId1' },
        { configId: 'configId2' },
      ]);

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith({
        isAuthenticated: false,
        allConfigsAuthenticated: [
          { configId: 'configId1', isAuthenticated: false },
          { configId: 'configId2', isAuthenticated: false },
        ],
      });
    });

    it('throws correct event with multiple configs, one is authenticated', () => {
      const allConfigs = [{ configId: 'configId1' }, { configId: 'configId2' }];

      vi.spyOn(storagePersistenceService, 'getAccessToken').mockImplementation(
        (...args: any[]): any => {
          if (args[0] === allConfigs[0]) {
            return 'someAccessToken';
          }

          if (args[0] === allConfigs[1]) {
            return '';
          }

          return undefined;
        }
      );

      vi.spyOn(storagePersistenceService, 'getIdToken').mockImplementation(
        (...args: any[]): any => {
          if (args[0] === allConfigs[0]) {
            return 'someIdToken';
          }

          if (args[0] === allConfigs[1]) {
            return '';
          }

          return undefined;
        }
      );

      const spy = vi
        .spyOn((authStateService as any).authenticatedInternal$, 'next')
        .mockReturnValue(undefined);

      authStateService.setAuthenticatedAndFireEvent(allConfigs);

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith({
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
      const spy = vi
        .spyOn(storagePersistenceService, 'resetAuthStateInStorage')
        .mockReturnValue(undefined);

      authStateService.setUnauthenticatedAndFireEvent(
        { configId: 'configId1' },
        [{ configId: 'configId1' }]
      );
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith({ configId: 'configId1' });
    });

    it('throws correct event with single config', () => {
      const spy = vi
        .spyOn((authStateService as any).authenticatedInternal$, 'next')
        .mockReturnValue(undefined);

      authStateService.setUnauthenticatedAndFireEvent(
        { configId: 'configId1' },
        [{ configId: 'configId1' }]
      );

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith({
        isAuthenticated: false,
        allConfigsAuthenticated: [
          { configId: 'configId1', isAuthenticated: false },
        ],
      });
    });

    it('throws correct event with multiple configs', () => {
      const spy = vi
        .spyOn((authStateService as any).authenticatedInternal$, 'next')
        .mockReturnValue(undefined);

      authStateService.setUnauthenticatedAndFireEvent(
        { configId: 'configId1' },
        [{ configId: 'configId1' }, { configId: 'configId2' }]
      );

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith({
        isAuthenticated: false,
        allConfigsAuthenticated: [
          { configId: 'configId1', isAuthenticated: false },
          { configId: 'configId2', isAuthenticated: false },
        ],
      });
    });

    it('throws correct event with multiple configs, one is authenticated', () => {
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockImplementation(
        (...args: any[]): any => {
          if (args[0]?.configId === 'configId1') {
            return 'someAccessToken';
          }

          if (args[0]?.configId === 'configId2') {
            return '';
          }

          return undefined;
        }
      );

      vi.spyOn(storagePersistenceService, 'getIdToken').mockImplementation(
        (...args: any[]): any => {
          if (args[0]?.configId === 'configId1') {
            return 'someIdToken';
          }

          if (args[0]?.configId === 'configId2') {
            return '';
          }

          return undefined;
        }
      );

      const spy = vi
        .spyOn((authStateService as any).authenticatedInternal$, 'next')
        .mockReturnValue(undefined);

      authStateService.setUnauthenticatedAndFireEvent(
        { configId: 'configId1' },
        [{ configId: 'configId1' }, { configId: 'configId2' }]
      );

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith({
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
      vi.spyOn(eventsService, 'fireEvent').mockReturnValue(undefined);

      authStateService.updateAndPublishAuthState({
        isAuthenticated: false,
        isRenewProcess: false,
        validationResult: {} as ValidationResult,
      });

      expect(eventsService.fireEvent).toHaveBeenCalledTimes(1);

      expect(eventsService.fireEvent).toHaveBeenCalledWith(
        EventTypes.NewAuthenticationResult,
        expect.any(Object)
      );
    });
  });

  describe('setAuthorizationData', () => {
    it('stores accessToken', () => {
      const spy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);
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
      expect(vi.mocked(spy).mock.calls).toEqual([
        ['authzData', 'accesstoken', { configId: 'configId1' }],
        [
          'access_token_expires_at',
          expect.any(Number),
          { configId: 'configId1' },
        ],
      ]);
    });

    it('does not crash and store accessToken when authResult is null', () => {
      const spy = vi
        .spyOn(storagePersistenceService, 'write')
        .mockReturnValue(undefined as any);
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
      const spy = vi
        .spyOn(authStateService, 'setAuthenticatedAndFireEvent')
        .mockReturnValue(undefined);
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
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue('');
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue('');
      const result = authStateService.getAccessToken({ configId: 'configId1' });

      expect(result).toBe('');
    });

    it('returns false if storagePersistenceService returns something falsy but authorized', () => {
      vi.spyOn(authStateService, 'isAuthenticated').mockReturnValue(true);
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue('');
      const result = authStateService.getAccessToken({ configId: 'configId1' });

      expect(result).toBe('');
    });

    it('isAuthorized is true returns decodeURIComponent(token)', () => {
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        'HenloLegger'
      );
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue(
        'HenloFuriend'
      );
      const result = authStateService.getAccessToken({ configId: 'configId1' });

      expect(result).toBe(decodeURIComponent('HenloLegger'));
    });
  });

  describe('getAuthenticationResult', () => {
    it('isAuthorized is false returns null', () => {
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue('');
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue('');

      vi.spyOn(
        storagePersistenceService,
        'getAuthenticationResult'
      ).mockImplementation((...args: any[]): any => {
        if (args[0]?.configId === 'configId1') {
          return {};
        }

        return undefined;
      });

      const result = authStateService.getAuthenticationResult({
        configId: 'configId1',
      });

      expect(result).toBe(null);
    });

    it('returns false if storagePersistenceService returns something falsy but authorized', () => {
      vi.spyOn(authStateService, 'isAuthenticated').mockReturnValue(true);
      vi.spyOn(
        storagePersistenceService,
        'getAuthenticationResult'
      ).mockImplementation((...args: any[]): any => {
        if (args[0]?.configId === 'configId1') {
          return {};
        }

        return undefined;
      });

      const result = authStateService.getAuthenticationResult({
        configId: 'configId1',
      });

      expect(result).toEqual({});
    });

    it('isAuthorized is true returns object', () => {
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        'HenloLegger'
      );
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue(
        'HenloFuriend'
      );
      vi.spyOn(
        storagePersistenceService,
        'getAuthenticationResult'
      ).mockImplementation((...args: any[]): any => {
        if (args[0]?.configId === 'configId1') {
          return { scope: 'HenloFuriend' };
        }

        return undefined;
      });

      const result = authStateService.getAuthenticationResult({
        configId: 'configId1',
      });

      expect(result?.scope).toBe('HenloFuriend');
    });
  });

  describe('getIdToken', () => {
    it('isAuthorized is false returns null', () => {
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue('');
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue('');
      const result = authStateService.getIdToken({ configId: 'configId1' });

      expect(result).toBe('');
    });

    it('isAuthorized is true returns decodeURIComponent(token)', () => {
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        'HenloLegger'
      );
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue(
        'HenloFuriend'
      );
      const result = authStateService.getIdToken({ configId: 'configId1' });

      expect(result).toBe(decodeURIComponent('HenloFuriend'));
    });
  });

  describe('getRefreshToken', () => {
    it('isAuthorized is false returns null', () => {
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue('');
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue('');
      const result = authStateService.getRefreshToken({
        configId: 'configId1',
      });

      expect(result).toBe('');
    });

    it('isAuthorized is true returns decodeURIComponent(token)', () => {
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        'HenloLegger'
      );
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue(
        'HenloFuriend'
      );
      vi.spyOn(storagePersistenceService, 'getRefreshToken').mockReturnValue(
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
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue('');
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue('');
      const result = authStateService.areAuthStorageTokensValid({
        configId: 'configId1',
      });

      expect(result).toBe(false);
    });

    it('isAuthorized is true and id_token is expired returns true', () => {
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        'HenloLegger'
      );
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue(
        'HenloFuriend'
      );

      vi.spyOn(
        authStateService as any,
        'hasIdTokenExpiredAndRenewCheckIsEnabled'
      ).mockReturnValue(true);
      vi.spyOn(
        authStateService as any,
        'hasAccessTokenExpiredIfExpiryExists'
      ).mockReturnValue(false);
      const result = authStateService.areAuthStorageTokensValid({
        configId: 'configId1',
      });

      expect(result).toBe(false);
    });

    it('isAuthorized is true  and access_token is expired returns true', () => {
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        'HenloLegger'
      );
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue(
        'HenloFuriend'
      );

      vi.spyOn(
        authStateService as any,
        'hasIdTokenExpiredAndRenewCheckIsEnabled'
      ).mockReturnValue(false);
      vi.spyOn(
        authStateService as any,
        'hasAccessTokenExpiredIfExpiryExists'
      ).mockReturnValue(true);
      const result = authStateService.areAuthStorageTokensValid({
        configId: 'configId1',
      });

      expect(result).toBe(false);
    });

    it('isAuthorized is true  and id_token is not expired returns true', () => {
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        'HenloLegger'
      );
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue(
        'HenloFuriend'
      );

      vi.spyOn(
        authStateService as any,
        'hasIdTokenExpiredAndRenewCheckIsEnabled'
      ).mockReturnValue(false);
      vi.spyOn(
        authStateService as any,
        'hasAccessTokenExpiredIfExpiryExists'
      ).mockReturnValue(false);
      const result = authStateService.areAuthStorageTokensValid({
        configId: 'configId1',
      });

      expect(result).toBe(true);
    });

    it('authState is AuthorizedState.Authorized and id_token is not expired fires event', () => {
      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        'HenloLegger'
      );
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue(
        'HenloFuriend'
      );

      vi.spyOn(
        authStateService as any,
        'hasIdTokenExpiredAndRenewCheckIsEnabled'
      ).mockReturnValue(false);
      vi.spyOn(
        authStateService as any,
        'hasAccessTokenExpiredIfExpiryExists'
      ).mockReturnValue(false);
      const result = authStateService.areAuthStorageTokensValid({
        configId: 'configId1',
      });

      expect(result).toBe(true);
    });
  });

  describe('hasIdTokenExpiredAndRenewCheckIsEnabled', () => {
    it('tokenValidationService gets called with id token if id_token is set', () => {
      const config = {
        configId: 'configId1',
        renewTimeBeforeTokenExpiresInSeconds: 30,
        triggerRefreshWhenIdTokenExpired: true,
      };

      vi.spyOn(storagePersistenceService, 'getIdToken').mockImplementation(
        (...args: any[]): any => {
          if (args[0] === config) {
            return 'idToken';
          }

          return undefined;
        }
      );
      const spy = vi
        .spyOn(tokenValidationService, 'hasIdTokenExpired')
        .mockImplementation((_a, _b) => true);

      authStateService.hasIdTokenExpiredAndRenewCheckIsEnabled(config);

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith('idToken', config, 30);
    });

    it('fires event if idToken is expired', () => {
      vi.spyOn(tokenValidationService, 'hasIdTokenExpired').mockImplementation(
        (_a, _b) => true
      );

      const spy = vi
        .spyOn(eventsService, 'fireEvent')
        .mockReturnValue(undefined);
      const config = {
        configId: 'configId1',
        renewTimeBeforeTokenExpiresInSeconds: 30,
        triggerRefreshWhenIdTokenExpired: true,
      };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authnResult') {
            return 'idToken';
          }

          return undefined;
        }
      );

      const result =
        authStateService.hasIdTokenExpiredAndRenewCheckIsEnabled(config);

      expect(result).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(EventTypes.IdTokenExpired, true);
    });

    it('does NOT fire event if idToken is NOT expired', () => {
      vi.spyOn(tokenValidationService, 'hasIdTokenExpired').mockImplementation(
        (_a, _b) => false
      );

      const spy = vi
        .spyOn(eventsService, 'fireEvent')
        .mockReturnValue(undefined);
      const config = {
        configId: 'configId1',
        renewTimeBeforeTokenExpiresInSeconds: 30,
      };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authnResult') {
            return 'idToken';
          }

          return undefined;
        }
      );
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

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'access_token_expires_at') {
            return date;
          }

          return undefined;
        }
      );
      const spy = vi
        .spyOn(tokenValidationService, 'validateAccessTokenNotExpired')
        .mockReturnValue(validateAccessTokenNotExpiredResult);
      const result =
        authStateService.hasAccessTokenExpiredIfExpiryExists(config);

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith(date, config, 5);
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

      vi.spyOn(eventsService, 'fireEvent').mockReturnValue(undefined);

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'access_token_expires_at') {
            return date;
          }

          return undefined;
        }
      );
      vi.spyOn(
        tokenValidationService,
        'validateAccessTokenNotExpired'
      ).mockReturnValue(validateAccessTokenNotExpiredResult);
      authStateService.hasAccessTokenExpiredIfExpiryExists(config);
      expect(eventsService.fireEvent).toHaveBeenCalledTimes(1);
      expect(eventsService.fireEvent).toHaveBeenCalledWith(
        EventTypes.TokenExpired,
        expectedResult
      );
    });
  });
});
