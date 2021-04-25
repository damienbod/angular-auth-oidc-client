import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ConfigurationProvider } from '../config/config.provider';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsService } from '../flows/flows.service';
import { IntervallService } from './intervall.service';

@Injectable({ providedIn: 'root' })
export class CodeFlowCallbackService {
  constructor(
    private flowsService: FlowsService,
    private flowsDataService: FlowsDataService,
    private intervallService: IntervallService,
    private configurationProvider: ConfigurationProvider,
    private router: Router
  ) {}

  authorizedCallbackWithCode(urlToCheck: string) {
    const isRenewProcess = this.flowsDataService.isSilentRenewRunning();
    const { triggerAuthorizationResultEvent, postLoginRoute, unauthorizedRoute } = this.configurationProvider.getOpenIDConfiguration();

    return this.flowsService.processCodeFlowCallback(urlToCheck).pipe(
      tap((callbackContext) => {
        if (!triggerAuthorizationResultEvent && !callbackContext.isRenewProcess) {
          this.router.navigateByUrl(postLoginRoute);
        }
      }),
      catchError((error) => {
        this.flowsDataService.resetSilentRenewRunning();
        this.intervallService.stopPeriodicallTokenCheck();
        if (!triggerAuthorizationResultEvent && !isRenewProcess) {
          this.router.navigateByUrl(unauthorizedRoute);
        }
        return throwError(error);
      })
    );
  }
}
