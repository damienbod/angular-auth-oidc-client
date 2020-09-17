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
        private intervalService: IntervallService,
        private configurationProvider: ConfigurationProvider,
        private router: Router
    ) {}

    authorizedCallbackWithCode(urlToCheck: string) {
        const isRenewProcess = this.flowsDataService.isSilentRenewRunning();

        return this.flowsService.processCodeFlowCallback(urlToCheck).pipe(
            tap((callbackContext) => {
                if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent && !callbackContext.isRenewProcess) {
                    this.router.navigate([this.configurationProvider.openIDConfiguration.postLoginRoute]);
                }
            }),
            catchError((error) => {
                this.flowsDataService.resetSilentRenewRunning();
                this.intervalService.stopPeriodicallyTokenCheck();
                if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent && !isRenewProcess) {
                    this.router.navigate([this.configurationProvider.openIDConfiguration.unauthorizedRoute]);
                }
                return throwError(error);
            })
        );
    }
}
