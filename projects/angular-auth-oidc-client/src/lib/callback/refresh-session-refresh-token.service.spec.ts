import { HttpClientModule } from '@angular/common/http';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { FlowsService } from '../flows/flows.service';
import { FlowsServiceMock } from '../flows/flows.service-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { IntervallService } from './intervall.service';
import { RefreshSessionRefreshTokenService } from './refresh-session-refresh-token.service';

describe('RefreshSessionRefreshTokenService', () => {
    let refreshSessionRefreshTokenService: RefreshSessionRefreshTokenService;
    let intervallService: IntervallService;
    let flowsService: FlowsService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule, RouterTestingModule],
            providers: [
                RefreshSessionRefreshTokenService,
                { provide: LoggerService, useClass: LoggerServiceMock },
                { provide: FlowsService, useClass: FlowsServiceMock },
                IntervallService,
            ],
        });
    });

    beforeEach(() => {
        refreshSessionRefreshTokenService = TestBed.inject(RefreshSessionRefreshTokenService);
        intervallService = TestBed.inject(IntervallService);
        flowsService = TestBed.inject(FlowsService);
    });

    it('should create', () => {
        expect(refreshSessionRefreshTokenService).toBeTruthy();
    });

    describe('refreshSessionWithRefreshTokens', () => {
        it(
            'calls flowsService.processRefreshToken()',
            waitForAsync(() => {
                const spy = spyOn(flowsService, 'processRefreshToken').and.returnValue(of(null));

                refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens().subscribe(() => {
                    expect(spy).toHaveBeenCalled();
                });
            })
        );

        it(
            'resetAuthorizationData and stopPeriodicallTokenCheck in case of error',
            waitForAsync(() => {
                spyOn(flowsService, 'processRefreshToken').and.returnValue(throwError('error'));
                const resetSilentRenewRunningSpy = spyOn(flowsService, 'resetAuthorizationData');
                const stopPeriodicallTokenCheckSpy = spyOn(intervallService, 'stopPeriodicallTokenCheck');

                refreshSessionRefreshTokenService.refreshSessionWithRefreshTokens().subscribe({
                    error: (err) => {
                        expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
                        expect(stopPeriodicallTokenCheckSpy).toHaveBeenCalled();
                        expect(err).toBeTruthy();
                    },
                });
            })
        );
    });
});
