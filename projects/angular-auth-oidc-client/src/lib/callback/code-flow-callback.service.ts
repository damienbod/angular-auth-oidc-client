import { HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthorizedState } from '../authState/authorized-state';
import { ConfigurationProvider } from '../config/config.provider';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsService } from '../flows/flows.service';
import { ValidationResult } from '../validation/validation-result';
import { PeriodicallyTokenCheckService } from './periodically-token-check-service';

@Injectable({ providedIn: 'root' })
export class CodeFlowCallbackService {
    constructor(
        private flowsService: FlowsService,
        private flowsDataService: FlowsDataService,
        private periodicallyTokenCheckService: PeriodicallyTokenCheckService,
        private authStateService: AuthStateService,
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
                this.periodicallyTokenCheckService.stopPeriodicallTokenCheck();
                if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent && !isRenewProcess) {
                    this.router.navigate([this.configurationProvider.openIDConfiguration.unauthorizedRoute]);
                }
                return throwError(error);
            })
        );
    }

    codeFlowCallbackSilentRenewIframe(urlParts) {
        const params = new HttpParams({
            fromString: urlParts[1],
        });

        const error = params.get('error');

        if (error) {
            this.authStateService.updateAndPublishAuthState({
                authorizationState: AuthorizedState.Unauthorized,
                validationResult: ValidationResult.LoginRequired,
                isRenewProcess: true,
            });
            this.flowsService.resetAuthorizationData();
            this.flowsDataService.setNonce('');
            this.periodicallyTokenCheckService.stopPeriodicallTokenCheck();
            return throwError(error);
        }

        const code = params.get('code');
        const state = params.get('state');
        const sessionState = params.get('session_state');

        const callbackContext = {
            code,
            refreshToken: null,
            state,
            sessionState,
            authResult: null,
            isRenewProcess: false,
            jwtKeys: null,
            validationResult: null,
            existingIdToken: null,
        };

        return this.flowsService.processSilentRenewCodeFlowCallback(callbackContext).pipe(
            catchError((errorFromFlow) => {
                this.periodicallyTokenCheckService.stopPeriodicallTokenCheck();
                this.flowsService.resetAuthorizationData();
                return throwError(errorFromFlow);
            })
        );
    }
}
