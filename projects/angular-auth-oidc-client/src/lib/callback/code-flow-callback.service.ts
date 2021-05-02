import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ConfigurationProvider } from '../config/config.provider';
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

  authorizedCallbackWithCode(urlToCheck: string, configId: string) {
    const isRenewProcess = this.flowsDataService.isSilentRenewRunning();
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
        this.flowsDataService.resetSilentRenewRunning();
        this.intervalService.stopPeriodicTokenCheck();
        if (!triggerAuthorizationResultEvent && !isRenewProcess) {
          this.router.navigateByUrl(unauthorizedRoute);
        }
        return throwError(error);
      })
    );
  }
}
