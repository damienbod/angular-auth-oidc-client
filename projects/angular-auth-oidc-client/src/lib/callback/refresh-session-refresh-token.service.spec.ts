import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, NEVER, of, throwError } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { AuthStateService } from '../auth-state/auth-state.service';
import { CallbackContext } from '../flows/callback-context';
import { FlowsService } from '../flows/flows.service';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { LoggerService } from '../logging/logger.service';
import { ValidationResult } from '../validation/validation-result';
import { IntervalService } from './interval.service';
import { RefreshSessionRefreshTokenService } from './refresh-session-refresh-token.service';

describe('RefreshSessionRefreshTokenService', () => {
  beforeEach(() => {
    vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  let refreshSessionRefreshTokenService: RefreshSessionRefreshTokenService;
  let intervalService: IntervalService;
  let resetAuthDataService: ResetAuthDataService;
  let flowsService: FlowsService;
  let authStateService: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        RefreshSessionRefreshTokenService,
        mockProvider(LoggerService),
        mockProvider(FlowsService),
        mockProvider(ResetAuthDataService),
        mockProvider(IntervalService),
        mockProvider(AuthStateService),
      ],
    });
  });

  beforeEach(() => {
    flowsService = TestBed.inject(FlowsService);
    refreshSessionRefreshTokenService = TestBed.inject(
      RefreshSessionRefreshTokenService
    );
    intervalService = TestBed.inject(IntervalService);
    resetAuthDataService = TestBed.inject(ResetAuthDataService);
    authStateService = TestBed.inject(AuthStateService);
  });

  afterEach(() => {
    // cleanup the navigator.locks shadow defined by the lock tests
    delete (navigator as any).locks;
  });

  it('should create', () => {
    expect(refreshSessionRefreshTokenService).toBeTruthy();
  });

  describe('refreshSessionWithRefreshTokens', () => {
    it('calls flowsService.processRefreshToken()', async () => {
      const spy = vi
        .spyOn(flowsService, 'processRefreshToken')
        .mockReturnValue(of({} as CallbackContext));

      await firstValueFrom(
        refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(
          { configId: 'configId1' },
          [{ configId: 'configId1' }]
        )
      );

      expect(spy).toHaveBeenCalled();
    });

    it('resetAuthorizationData in case of error', async () => {
      vi.spyOn(flowsService, 'processRefreshToken').mockReturnValue(
        throwError(() => new Error('error'))
      );
      const resetSilentRenewRunningSpy = vi
        .spyOn(resetAuthDataService, 'resetAuthorizationData')
        .mockReturnValue(undefined);

      try {
        await firstValueFrom(
          refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(
            { configId: 'configId1' },
            [{ configId: 'configId1' }]
          )
        );
        expect.fail('expected an error');
      } catch (err: any) {
        expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
        expect(err).toBeTruthy();
      }
    });

    it('preserves authorization data and the original error for network failures', async () => {
      const networkError = new HttpErrorResponse({
        error: new ProgressEvent('error'),
        status: 0,
        statusText: 'Unknown Error',
      });

      vi.spyOn(flowsService, 'processRefreshToken').mockReturnValue(
        throwError(() => networkError)
      );
      const resetAuthorizationDataSpy = vi.spyOn(
        resetAuthDataService,
        'resetAuthorizationData'
      );
      const stopPeriodicTokenCheckSpy = vi.spyOn(
        intervalService,
        'stopPeriodicTokenCheck'
      );

      await expect(
        firstValueFrom(
          refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(
            { configId: 'configId1' },
            [{ configId: 'configId1' }]
          )
        )
      ).rejects.toBe(networkError);

      expect(resetAuthorizationDataSpy).not.toHaveBeenCalled();
      expect(stopPeriodicTokenCheckSpy).not.toHaveBeenCalled();
    });

    it('times out refreshes without clearing authorization data', async () => {
      vi.spyOn(flowsService, 'processRefreshToken').mockReturnValue(NEVER);
      const resetAuthorizationDataSpy = vi.spyOn(
        resetAuthDataService,
        'resetAuthorizationData'
      );
      const stopPeriodicTokenCheckSpy = vi.spyOn(
        intervalService,
        'stopPeriodicTokenCheck'
      );
      const result = firstValueFrom(
        refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(
          {
            configId: 'configId1',
            silentRenewTimeoutInSeconds: 0.01,
          },
          [{ configId: 'configId1' }]
        )
      );

      await vi.advanceTimersByTimeAsync(10);

      await expect(result).rejects.toBeInstanceOf(Error);
      expect(resetAuthorizationDataSpy).not.toHaveBeenCalled();
      expect(stopPeriodicTokenCheckSpy).not.toHaveBeenCalled();
    });

    it('finalize with stopPeriodicTokenCheck in case of error', async () => {
      vi.spyOn(flowsService, 'processRefreshToken').mockReturnValue(
        throwError(() => new Error('error'))
      );
      const stopPeriodicallyTokenCheckSpy = vi
        .spyOn(intervalService, 'stopPeriodicTokenCheck')
        .mockReturnValue(undefined);

      refreshSessionRefreshTokenService
        .refreshSessionWithRefreshTokens({ configId: 'configId1' }, [
          { configId: 'configId1' },
        ])
        .subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      await vi.advanceTimersByTimeAsync(0);
      expect(stopPeriodicallyTokenCheckSpy).toHaveBeenCalled();
    });

    describe('cross-tab refresh token lock', () => {
      it('does not request a lock when useRefreshTokenLock is disabled', async () => {
        const requestSpy = vi
          .fn()
          .mockName('request')
          .mockImplementation((_name: string, cb: () => Promise<unknown>) =>
            cb()
          );

        Object.defineProperty(navigator, 'locks', {
          value: { request: requestSpy },
          configurable: true,
        });
        const processSpy = vi
          .spyOn(flowsService, 'processRefreshToken')
          .mockReturnValue(of({} as CallbackContext));

        await firstValueFrom(
          refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(
            { configId: 'configId1', useRefreshTokenLock: false },
            [{ configId: 'configId1' }]
          )
        );

        expect(requestSpy).not.toHaveBeenCalled();
        expect(processSpy).toHaveBeenCalled();
      });

      it('reuses the stored tokens and skips processRefreshToken when another tab already refreshed', async () => {
        Object.defineProperty(navigator, 'locks', {
          value: {
            request: (_name: string, cb: () => Promise<unknown>) => cb(),
          },
          configurable: true,
        });
        vi.spyOn(authStateService, 'getAccessToken')
          .mockReturnValueOnce('old-access-token')
          .mockReturnValueOnce('new-access-token');
        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          true
        );
        vi.spyOn(authStateService, 'getRefreshToken').mockReturnValue(
          'new-refresh-token'
        );
        vi.spyOn(authStateService, 'getIdToken').mockReturnValue(
          'new-id-token'
        );
        vi.spyOn(authStateService, 'getAuthenticationResult').mockReturnValue({
          access_token: 'new-access-token',
        });
        const setAuthenticatedSpy = vi
          .spyOn(authStateService, 'setAuthenticatedAndFireEvent')
          .mockReturnValue(undefined);
        const updateAuthStateSpy = vi
          .spyOn(authStateService, 'updateAndPublishAuthState')
          .mockReturnValue(undefined);
        const processSpy = vi
          .spyOn(flowsService, 'processRefreshToken')
          .mockReturnValue(undefined as any);
        const callbackContext = await firstValueFrom(
          refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(
            { configId: 'configId1', useRefreshTokenLock: true },
            [{ configId: 'configId1' }]
          )
        );

        expect(processSpy).not.toHaveBeenCalled();
        expect(callbackContext.refreshToken).toBe('new-refresh-token');
        expect(callbackContext.existingIdToken).toBe('new-id-token');
        expect(callbackContext.authResult).toEqual({
          access_token: 'new-access-token',
        });
        expect(setAuthenticatedSpy).toHaveBeenCalledTimes(1);
        expect(setAuthenticatedSpy).toHaveBeenCalledWith([
          { configId: 'configId1' },
        ]);
        expect(updateAuthStateSpy).toHaveBeenCalledTimes(1);
        expect(updateAuthStateSpy).toHaveBeenCalledWith({
          isAuthenticated: true,
          validationResult: ValidationResult.Ok,
          isRenewProcess: true,
          configId: 'configId1',
        });
      });

      it('reuses the stored tokens when no access token existed before the lock', async () => {
        Object.defineProperty(navigator, 'locks', {
          value: {
            request: (_name: string, cb: () => Promise<unknown>) => cb(),
          },
          configurable: true,
        });
        vi.spyOn(authStateService, 'getAccessToken')
          .mockReturnValueOnce('')
          .mockReturnValueOnce('new-access-token');
        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          true
        );
        vi.spyOn(authStateService, 'getRefreshToken').mockReturnValue(
          'stored-refresh-token'
        );
        const processSpy = vi
          .spyOn(flowsService, 'processRefreshToken')
          .mockReturnValue(undefined as any);
        const callbackContext = await firstValueFrom(
          refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(
            { configId: 'configId1', useRefreshTokenLock: true },
            [{ configId: 'configId1' }]
          )
        );

        expect(processSpy).not.toHaveBeenCalled();
        expect(callbackContext.refreshToken).toBe('stored-refresh-token');
      });

      it('still refreshes inside the lock when no other tab refreshed while waiting', async () => {
        Object.defineProperty(navigator, 'locks', {
          value: {
            request: (_name: string, cb: () => Promise<unknown>) => cb(),
          },
          configurable: true,
        });
        vi.spyOn(authStateService, 'getAccessToken').mockReturnValue(
          'same-access-token'
        );
        const processSpy = vi
          .spyOn(flowsService, 'processRefreshToken')
          .mockReturnValue(of({} as CallbackContext));

        await firstValueFrom(
          refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(
            { configId: 'configId1', useRefreshTokenLock: true },
            [{ configId: 'configId1' }]
          )
        );

        expect(processSpy).toHaveBeenCalled();
      });

      it('still refreshes inside the lock when another tab refreshed but the stored tokens are no longer valid', async () => {
        Object.defineProperty(navigator, 'locks', {
          value: {
            request: (_name: string, cb: () => Promise<unknown>) => cb(),
          },
          configurable: true,
        });
        vi.spyOn(authStateService, 'getAccessToken')
          .mockReturnValueOnce('old-access-token')
          .mockReturnValueOnce('new-access-token');
        vi.spyOn(authStateService, 'areAuthStorageTokensValid').mockReturnValue(
          false
        );
        const processSpy = vi
          .spyOn(flowsService, 'processRefreshToken')
          .mockReturnValue(of({} as CallbackContext));

        await firstValueFrom(
          refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(
            { configId: 'configId1', useRefreshTokenLock: true },
            [{ configId: 'configId1' }]
          )
        );

        expect(processSpy).toHaveBeenCalled();
      });

      it('requests the lock with a per-config name when useRefreshTokenLock is enabled', async () => {
        const requestSpy = vi
          .fn()
          .mockName('request')
          .mockImplementation((_name: string, cb: () => Promise<unknown>) =>
            cb()
          );

        Object.defineProperty(navigator, 'locks', {
          value: { request: requestSpy },
          configurable: true,
        });
        const processSpy = vi
          .spyOn(flowsService, 'processRefreshToken')
          .mockReturnValue(of({} as CallbackContext));

        await firstValueFrom(
          refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(
            { configId: 'configId1', useRefreshTokenLock: true },
            [{ configId: 'configId1' }]
          )
        );

        expect(requestSpy).toHaveBeenCalledTimes(1);

        expect(requestSpy).toHaveBeenCalledWith(
          'angular-auth-oidc-client-refresh-token-configId1',
          expect.any(Function)
        );
        expect(processSpy).toHaveBeenCalled();
      });

      it('still refreshes when useRefreshTokenLock is enabled but the Web Locks API is unavailable', async () => {
        Object.defineProperty(navigator, 'locks', {
          value: undefined,
          configurable: true,
        });
        const processSpy = vi
          .spyOn(flowsService, 'processRefreshToken')
          .mockReturnValue(of({} as CallbackContext));

        await firstValueFrom(
          refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(
            { configId: 'configId1', useRefreshTokenLock: true },
            [{ configId: 'configId1' }]
          )
        );

        expect(processSpy).toHaveBeenCalled();
      });

      it('resetAuthorizationData in case of error inside the lock', async () => {
        Object.defineProperty(navigator, 'locks', {
          value: {
            request: (_name: string, cb: () => Promise<unknown>) => cb(),
          },
          configurable: true,
        });
        vi.spyOn(flowsService, 'processRefreshToken').mockReturnValue(
          throwError(() => new Error('error'))
        );
        const resetAuthorizationDataSpy = vi
          .spyOn(resetAuthDataService, 'resetAuthorizationData')
          .mockReturnValue(undefined);

        await expect(
          firstValueFrom(
            refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(
              { configId: 'configId1', useRefreshTokenLock: true },
              [{ configId: 'configId1' }]
            )
          )
        ).rejects.toThrow();

        expect(resetAuthorizationDataSpy).toHaveBeenCalled();
      });

      it('preserves authorization data when the refresh exceeds silentRenewTimeoutInSeconds inside the lock', async () => {
        Object.defineProperty(navigator, 'locks', {
          value: {
            request: (_name: string, cb: () => Promise<unknown>) => cb(),
          },
          configurable: true,
        });
        vi.spyOn(flowsService, 'processRefreshToken').mockReturnValue(NEVER);
        const resetAuthorizationDataSpy = vi
          .spyOn(resetAuthDataService, 'resetAuthorizationData')
          .mockReturnValue(undefined);

        await expect(
          firstValueFrom(
            refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens(
              {
                configId: 'configId1',
                useRefreshTokenLock: true,
                silentRenewTimeoutInSeconds: 0.01,
              },
              [{ configId: 'configId1' }]
            )
          )
        ).rejects.toThrow();

        expect(resetAuthorizationDataSpy).not.toHaveBeenCalled();
      });
    });
  });
});
