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
        private intervallService: IntervallService
    ) {}

    authorizedImplicitFlowCallback(hash?: string) {
        const isRenewProcess = this.flowsDataService.isSilentRenewRunning();
        return this.flowsService.processImplicitFlowCallback(hash).pipe(
            tap((callbackContext) => {
                if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent && !callbackContext.isRenewProcess) {
                    this.router.navigate([this.configurationProvider.openIDConfiguration.postLoginRoute]);
                }
            }),
            catchError((error) => {
                this.flowsDataService.resetSilentRenewRunning();
                this.intervallService.stopPeriodicallTokenCheck();
                if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent && !isRenewProcess) {
                    this.router.navigate([this.configurationProvider.openIDConfiguration.unauthorizedRoute]);
                }
                return throwError(error);
            })
        );
    }
}
