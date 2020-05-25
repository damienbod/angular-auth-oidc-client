import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FlowsService } from '../flows/flows.service';
import { LoggerService } from '../logging/logger.service';
import { PeriodicallyTokenCheckService } from './periodically-token-check.service';

@Injectable({ providedIn: 'root' })
export class RefreshSessionRefreshTokenService {
    constructor(
        private loggerService: LoggerService,
        private flowsService: FlowsService,
        private periodicallyTokenCheckService: PeriodicallyTokenCheckService
    ) {}

    refreshSessionWithRefreshTokens() {
        this.loggerService.logDebug('BEGIN refresh session Authorize');

        return this.flowsService.processRefreshToken().pipe(
            catchError((error) => {
                this.periodicallyTokenCheckService.stopPeriodicallTokenCheck();
                this.flowsService.resetAuthorizationData();
                return throwError(error);
            })
        );
    }
}
