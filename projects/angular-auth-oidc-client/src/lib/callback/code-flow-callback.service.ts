import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsService } from '../flows/flows.service';
import { IntervalService } from './interval.service';

@Injectable({ providedIn: 'root' })
export class CodeFlowCallbackService {
  constructor(
    private flowsService: FlowsService,
    private flowsDataService: FlowsDataService,
    private intervalService: IntervalService,
    private configurationProvider: ConfigurationProvider,
    private router: Router
  ) {}

  authenticatedCallbackWithCode(urlToCheck: string, configId: string) {
    const isRenewProcess = this.flowsDataService.isSilentRenewRunning(configId);
    const { triggerAuthorizationResultEvent, postLoginRoute, unauthorizedRoute } = this.configurationProvider.getOpenIDConfiguration(
      configId
    );

    return this.flowsService.processCodeFlowCallback(urlToCheck, configId).pipe(
      tap((callbackContext) => {
        if (!triggerAuthorizationResultEvent && !callbackContext.isRenewProcess) {
          this.router.navigateByUrl(postLoginRoute);
        }
      }),
      catchError((error) => {
        this.flowsDataService.resetSilentRenewRunning(configId);
        this.intervalService.stopPeriodicTokenCheck();
        if (!triggerAuthorizationResultEvent && !isRenewProcess) {
          this.router.navigateByUrl(unauthorizedRoute);
        }
        return throwError(error);
      })
    );
  }
}
