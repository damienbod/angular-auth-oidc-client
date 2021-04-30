import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { FlowsService } from '../flows/flows.service';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { LoggerService } from '../logging/logger.service';
import { IntervallService } from './intervall.service';
import { CallbackContext } from '../flows/callback-context';

@Injectable({ providedIn: 'root' })
export class RefreshSessionRefreshTokenService {
  constructor(
    private loggerService: LoggerService,
    private resetAuthDataService: ResetAuthDataService,
    private flowsService: FlowsService,
    private intervalService: IntervallService
  ) {}

  refreshSessionWithRefreshTokens(customParams?: { [key: string]: string | number | boolean }): Observable<CallbackContext> {
    this.loggerService.logDebug('BEGIN refresh session Authorize');

    return this.flowsService.processRefreshToken(customParams).pipe(
      catchError((error) => {
        this.intervalService.stopPeriodicallTokenCheck();
        this.resetAuthDataService.resetAuthorizationData();
        return throwError(error);
      })
    );
  }
}
