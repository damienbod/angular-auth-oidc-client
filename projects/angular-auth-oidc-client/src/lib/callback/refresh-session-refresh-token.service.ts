import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { CallbackContext } from '../flows/callback-context';
import { FlowsService } from '../flows/flows.service';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { LoggerService } from '../logging/logger.service';
import { IntervalService } from './interval.service';

@Injectable({ providedIn: 'root' })
export class RefreshSessionRefreshTokenService {
  constructor(
    private readonly loggerService: LoggerService,
    private readonly resetAuthDataService: ResetAuthDataService,
    private readonly flowsService: FlowsService,
    private readonly intervalService: IntervalService
  ) {}

  refreshSessionWithRefreshTokens(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    customParamsRefresh?: { [key: string]: string | number | boolean }
  ): Observable<CallbackContext> {
    this.loggerService.logDebug(config, 'BEGIN refresh session Authorize');
    let refreshTokenFailed = false;

    return this.flowsService
      .processRefreshToken(config, allConfigs, customParamsRefresh)
      .pipe(
        catchError((error) => {
          this.resetAuthDataService.resetAuthorizationData(config, allConfigs);
          refreshTokenFailed = true;

          return throwError(() => new Error(error));
        }),
        finalize(
          () =>
            refreshTokenFailed && this.intervalService.stopPeriodicTokenCheck()
        )
      );
  }
}
