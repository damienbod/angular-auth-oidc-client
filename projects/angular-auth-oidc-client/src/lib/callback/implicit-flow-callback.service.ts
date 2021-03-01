import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ConfigurationProvider } from '../config/config.provider';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsService } from '../flows/flows.service';
import { IntervallService } from './intervall.service';

@Injectable({ providedIn: 'root' })
export class ImplicitFlowCallbackService {
  constructor(
    private flowsService: FlowsService,
    private configurationProvider: ConfigurationProvider,
    private router: Router,
    private flowsDataService: FlowsDataService,
    private intervalService: IntervallService
  ) {}

  authorizedImplicitFlowCallback(hash?: string) {
    const isRenewProcess = this.flowsDataService.isSilentRenewRunning();
    const { triggerAuthorizationResultEvent, postLoginRoute, unauthorizedRoute } = this.configurationProvider.getOpenIDConfiguration();

    return this.flowsService.processImplicitFlowCallback(hash).pipe(
      tap((callbackContext) => {
        if (!triggerAuthorizationResultEvent && !callbackContext.isRenewProcess) {
          this.router.navigate([postLoginRoute]);
        }
      }),
      catchError((error) => {
        this.flowsDataService.resetSilentRenewRunning();
        this.intervalService.stopPeriodicallTokenCheck();
        if (!triggerAuthorizationResultEvent && !isRenewProcess) {
          this.router.navigate([unauthorizedRoute]);
        }
        return throwError(error);
      })
    );
  }
}
