import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { mockProvider } from '../../../test/auto-mock';
import { AuthStateService } from '../../auth-state/auth-state.service';
import { LoggerService } from '../../logging/services/logger.service';
import { CallbackContext } from '../callback-context';
import { RefreshSessionCallbackHandlerService } from './refresh-session-callback-handler.service';

describe('RefreshSessionCallbackHandlerService', () => {
  let service: RefreshSessionCallbackHandlerService;
  let authStateService: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RefreshSessionCallbackHandlerService,
        mockProvider(AuthStateService),
        mockProvider(LoggerService),
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(RefreshSessionCallbackHandlerService);
    authStateService = TestBed.inject(AuthStateService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('refreshSessionWithRefreshTokens', () => {
    it('returns callbackContext if all params are good', async () => {
      vi.spyOn(authStateService, 'getRefreshToken').mockReturnValue(
        'henlo-furiend'
      );
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue('henlo-legger');

      const expectedCallbackContext = {
        code: '',
        refreshToken: 'henlo-furiend',
        state: '',
        sessionState: null,
        authResult: null,
        isRenewProcess: true,
        jwtKeys: null,
        validationResult: null,
        existingIdToken: 'henlo-legger',
      } as CallbackContext;
      const callbackContext = await firstValueFrom(
        service.refreshSessionWithRefreshTokens({ configId: 'configId1' })
      );

      expect(callbackContext).toEqual(expectedCallbackContext);
    });

    it('throws error if no refresh token is given', async () => {
      vi.spyOn(authStateService, 'getRefreshToken').mockReturnValue('');
      vi.spyOn(authStateService, 'getIdToken').mockReturnValue('henlo-legger');

      await expect(
        firstValueFrom(
          service.refreshSessionWithRefreshTokens({ configId: 'configId1' })
        )
      ).rejects.toThrow('no refresh token found, please login');
    });
  });
});
