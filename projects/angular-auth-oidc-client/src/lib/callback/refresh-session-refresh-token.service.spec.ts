import { TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { mockClass } from '../../test/auto-mock';
import { FlowsService } from '../flows/flows.service';
import { FlowsServiceMock } from '../flows/flows.service-mock';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { LoggerService } from '../logging/logger.service';
import { IntervalService } from './interval.service';
import { RefreshSessionRefreshTokenService } from './refresh-session-refresh-token.service';

describe('RefreshSessionRefreshTokenService', () => {
  let refreshSessionRefreshTokenService: RefreshSessionRefreshTokenService;
  let intervalService: IntervalService;
  let resetAuthDataService: ResetAuthDataService;
  let flowsService: FlowsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        RefreshSessionRefreshTokenService,
        { provide: LoggerService, useClass: mockClass(LoggerService) },
        { provide: FlowsService, useClass: FlowsServiceMock },
        { provide: ResetAuthDataService, useClass: mockClass(ResetAuthDataService) },
        IntervalService,
      ],
    });
  });

  beforeEach(() => {
    flowsService = TestBed.inject(FlowsService);
    refreshSessionRefreshTokenService = TestBed.inject(RefreshSessionRefreshTokenService);
    intervalService = TestBed.inject(IntervalService);
    resetAuthDataService = TestBed.inject(ResetAuthDataService);
  });

  it('should create', () => {
    expect(refreshSessionRefreshTokenService).toBeTruthy();
  });

  describe('refreshSessionWithRefreshTokens', () => {
    it(
      'calls flowsService.processRefreshToken()',
      waitForAsync(() => {
        const spy = spyOn(flowsService, 'processRefreshToken').and.returnValue(of(null));

        refreshSessionRefreshTokenService
          .refreshSessionWithRefreshTokens({ configId: 'configId1' }, [{ configId: 'configId1' }])
          .subscribe(() => {
            expect(spy).toHaveBeenCalled();
          });
      })
    );

    it(
      'resetAuthorizationData and stopPeriodicTokenCheck in case of error',
      waitForAsync(() => {
        spyOn(flowsService, 'processRefreshToken').and.returnValue(throwError(() => new Error('error')));
        const resetSilentRenewRunningSpy = spyOn(resetAuthDataService, 'resetAuthorizationData');
        const stopPeriodicallyTokenCheckSpy = spyOn(intervalService, 'stopPeriodicTokenCheck');

        refreshSessionRefreshTokenService
          .refreshSessionWithRefreshTokens({ configId: 'configId1' }, [{ configId: 'configId1' }])
          .subscribe({
            error: (err) => {
              expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
              expect(stopPeriodicallyTokenCheckSpy).toHaveBeenCalled();
              expect(err).toBeTruthy();
            },
          });
      })
    );
  });
});
