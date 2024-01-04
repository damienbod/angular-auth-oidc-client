import { TestBed, waitForAsync } from '@angular/core/testing';
import { mockClass } from '../../../test/auto-mock';
import { AuthStateService } from '../../auth-state/auth-state.service';
import { LoggerService } from '../../logging/logger.service';
import { CallbackContext } from '../callback-context';
import { FlowsDataService } from '../flows-data.service';
import { RefreshSessionCallbackHandlerService } from './refresh-session-callback-handler.service';

describe('RefreshSessionCallbackHandlerService', () => {
  let service: RefreshSessionCallbackHandlerService;
  let flowsDataService: FlowsDataService;
  let authStateService: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RefreshSessionCallbackHandlerService,
        { provide: AuthStateService, useClass: mockClass(AuthStateService) },
        { provide: LoggerService, useClass: mockClass(LoggerService) },
        { provide: FlowsDataService, useClass: mockClass(FlowsDataService) },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(RefreshSessionCallbackHandlerService);
    flowsDataService = TestBed.inject(FlowsDataService);
    authStateService = TestBed.inject(AuthStateService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('refreshSessionWithRefreshTokens', () => {
    it('returns callbackContext if all params are good', waitForAsync(() => {
      spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).and.returnValue('state-data');
      spyOn(authStateService, 'getRefreshToken').and.returnValue(
        'henlo-furiend'
      );
      spyOn(authStateService, 'getIdToken').and.returnValue('henlo-legger');

      const expectedCallbackContext = {
        code: '',
        refreshToken: 'henlo-furiend',
        state: 'state-data',
        sessionState: null,
        authResult: null,
        isRenewProcess: true,
        jwtKeys: null,
        validationResult: null,
        existingIdToken: 'henlo-legger',
      } as CallbackContext;

      service
        .refreshSessionWithRefreshTokens({ configId: 'configId1' })
        .subscribe((callbackContext) => {
          expect(callbackContext).toEqual(expectedCallbackContext);
        });
    }));

    it('throws error if no refresh token is given', waitForAsync(() => {
      spyOn(
        flowsDataService,
        'getExistingOrCreateAuthStateControl'
      ).and.returnValue('state-data');
      spyOn(authStateService, 'getRefreshToken').and.returnValue('');
      spyOn(authStateService, 'getIdToken').and.returnValue('henlo-legger');

      service
        .refreshSessionWithRefreshTokens({ configId: 'configId1' })
        .subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
    }));
  });
});
