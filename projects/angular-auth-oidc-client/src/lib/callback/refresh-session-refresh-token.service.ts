import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { CallbackContext } from '../flows/callback-context';
import { FlowsService } from '../flows/flows.service';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { AbstractLoggerService } from '../logging/abstract-logger.service';
import { IntervalService } from './interval.service';

@Injectable({ providedIn: 'root' })
export class RefreshSessionRefreshTokenService {
  constructor(
    private loggerService: AbstractLoggerService,
    private resetAuthDataService: ResetAuthDataService,
    private flowsService: FlowsService,
    private intervalService: IntervalService
  ) {}

  refreshSessionWithRefreshTokens(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    customParamsRefresh?: { [key: string]: string | number | boolean }
  ): Observable<CallbackContext> {
    this.loggerService.logDebug(config, 'BEGIN refresh session Authorize');

    return this.flowsService.processRefreshToken(config, allConfigs, customParamsRefresh).pipe(
      catchError((error) => {
        this.intervalService.stopPeriodicTokenCheck();
        this.resetAuthDataService.resetAuthorizationData(config, allConfigs);

        return throwError(() => new Error(error));
      })
    );
  }
}
