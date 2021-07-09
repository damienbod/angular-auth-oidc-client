import { TestBed, waitForAsync } from '@angular/core/testing';
import { AuthStateService } from '../../authState/auth-state.service';
import { AuthStateServiceMock } from '../../authState/auth-state.service-mock';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { FlowsDataService } from '../flows-data.service';
import { FlowsDataServiceMock } from '../flows-data.service-mock';
import { RefreshSessionCallbackHandlerService } from './refresh-session-callback-handler.service';

describe('RefreshSessionCallbackHandlerService', () => {
  let service: RefreshSessionCallbackHandlerService;
  let flowsDataService: FlowsDataService;
  let authStateService: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RefreshSessionCallbackHandlerService,
        { provide: AuthStateService, useClass: AuthStateServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: FlowsDataService, useClass: FlowsDataServiceMock },
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
    it(
      'returns callbackContext if all params are good',
      waitForAsync(() => {
        spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue('state-data');
        spyOn(authStateService, 'getRefreshToken').and.returnValue('henlo-furiend');
        spyOn(authStateService, 'getIdToken').and.returnValue('henlo-legger');

        const expectedCallbackContext = {
          code: null,
          refreshToken: 'henlo-furiend',
          state: 'state-data',
          sessionState: null,
          authResult: null,
          isRenewProcess: true,
          jwtKeys: null,
          validationResult: null,
          existingIdToken: 'henlo-legger',
        };
        (service as any).refreshSessionWithRefreshTokens().subscribe((callbackContext) => {
          expect(callbackContext).toEqual(expectedCallbackContext);
        });
      })
    );

    it(
      'throws error if no refresh token is given',
      waitForAsync(() => {
        spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue('state-data');
        spyOn(authStateService, 'getRefreshToken').and.returnValue(null);
        spyOn(authStateService, 'getIdToken').and.returnValue('henlo-legger');

        (service as any).refreshSessionWithRefreshTokens().subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );
  });
});
