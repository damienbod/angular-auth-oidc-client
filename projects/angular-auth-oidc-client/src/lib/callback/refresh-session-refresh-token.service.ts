import { Injectable } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FlowsService } from '../flows/flows.service';
import { LoggerService } from '../logging/logger.service';
import { IntervallService } from './intervall.service';

@Injectable({ providedIn: 'root' })
export class RefreshSessionRefreshTokenService {
    constructor(private loggerService: LoggerService, private flowsService: FlowsService, private intervallService: IntervallService) {}

    refreshSessionWithRefreshTokens(customParams?: { [key: string]: string | number | boolean }) {
        this.loggerService.logDebug('BEGIN refresh session Authorize');

        return this.flowsService.processRefreshToken(customParams).pipe(
            catchError((error) => {
                this.intervallService.stopPeriodicallTokenCheck();
                this.flowsService.resetAuthorizationData();
                return throwError(error);
            })
        );
    }
}
