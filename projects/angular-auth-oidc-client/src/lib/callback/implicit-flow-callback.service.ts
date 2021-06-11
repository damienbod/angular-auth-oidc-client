import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { CallbackContext } from '../flows/callback-context';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsService } from '../flows/flows.service';
import { IntervalService } from './interval.service';

@Injectable({ providedIn: 'root' })
export class ImplicitFlowCallbackService {
  constructor(
    private flowsService: FlowsService,
    private configurationProvider: ConfigurationProvider,
    private router: Router,
    private flowsDataService: FlowsDataService,
    private intervalService: IntervalService
  ) {}

  authenticatedImplicitFlowCallback(configId: string, hash?: string): Observable<CallbackContext> {
    const isRenewProcess = this.flowsDataService.isSilentRenewRunning(configId);
    const { triggerAuthorizationResultEvent, postLoginRoute, unauthorizedRoute } = this.configurationProvider.getOpenIDConfiguration(
      configId
    );

    return this.flowsService.processImplicitFlowCallback(configId, hash).pipe(
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
