import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CallbackContext } from '../flows/callback-context';
import { FlowsService } from '../flows/flows.service';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { LoggerService } from '../logging/logger.service';
import { IntervalService } from './interval.service';

@Injectable({ providedIn: 'root' })
export class RefreshSessionRefreshTokenService {
  constructor(
    private loggerService: LoggerService,
    private resetAuthDataService: ResetAuthDataService,
    private flowsService: FlowsService,
    private intervalService: IntervalService
  ) {}

  refreshSessionWithRefreshTokens(
    configId: string,
    customParams?: { [key: string]: string | number | boolean }
  ): Observable<CallbackContext> {
    this.loggerService.logDebug(configId, 'BEGIN refresh session Authorize');

    return this.flowsService.processRefreshToken(configId, customParams).pipe(
      catchError((error) => {
        this.intervalService.stopPeriodicTokenCheck();
        this.resetAuthDataService.resetAuthorizationData();
        return throwError(error);
      })
    );
  }
}
