import { Injectable } from '@angular/core';
import { interval, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { AuthStateService } from '../authState/auth-state.service';
import { ConfigurationProvider } from '../config/config.provider';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsService } from '../flows/flows.service';
import { RefreshSessionIframeService } from '../iframe/refresh-session-iframe.service';
import { LoggerService } from '../logging/logger.service';
import { UserService } from '../userData/user-service';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { UrlService } from '../utils/url/url.service';
import { CodeFlowCallbackService } from './code-flow-callback.service';
import { ImplicitFlowCallbackService } from './implicit-flow-callback.service';
import { PeriodicallyTokenCheckService } from './periodically-token-check.service';
import { RefreshSessionService } from './refresh-session.service';

@Injectable({ providedIn: 'root' })
export class CallbackService {
    private stsCallbackInternal$ = new Subject();

    get stsCallback$() {
        return this.stsCallbackInternal$.asObservable();
    }

    constructor(
        private urlService: UrlService,
        private flowsService: FlowsService,
        private flowHelper: FlowHelper,
        private configurationProvider: ConfigurationProvider,
        private flowsDataService: FlowsDataService,
        private loggerService: LoggerService,
        private userService: UserService,
        private authStateService: AuthStateService,
        private periodicallyTokenCheckService: PeriodicallyTokenCheckService,
        private implicitFlowCallbackService: ImplicitFlowCallbackService,
        private codeFlowCallbackService: CodeFlowCallbackService,
        private refreshSessionIframeService: RefreshSessionIframeService,
        private refreshSessionService: RefreshSessionService
    ) {}

    isCallback(): boolean {
        return this.urlService.isCallbackFromSts();
    }

    handleCallbackAndFireEvents(currentCallbackUrl: string) {
        let callback$: Observable<any>;

        if (this.flowHelper.isCurrentFlowCodeFlow()) {
            callback$ = this.codeFlowCallbackService.authorizedCallbackWithCode(currentCallbackUrl);
        } else if (this.flowHelper.isCurrentFlowAnyImplicitFlow()) {
            callback$ = this.implicitFlowCallbackService.authorizedImplicitFlowCallback();
        }

        return callback$.pipe(tap(() => this.stsCallbackInternal$.next()));
    }

    startTokenValidationPeriodically(repeatAfterSeconds: number) {
        if (!!this.periodicallyTokenCheckService.runTokenValidationRunning || !this.configurationProvider.openIDConfiguration.silentRenew) {
            return;
        }

        const millisecondsDelayBetweenTokenCheck = repeatAfterSeconds * 1000;

        this.loggerService.logDebug(
            `starting token validation check every ${repeatAfterSeconds}s (${millisecondsDelayBetweenTokenCheck}ms)`
        );

        const periodicallyCheck$ = interval(millisecondsDelayBetweenTokenCheck).pipe(
            switchMap(() => {
                const idToken = this.authStateService.getIdToken();
                const isSilentRenewRunning = this.flowsDataService.isSilentRenewRunning();
                const userDataFromStore = this.userService.getUserDataFromStore();

                this.loggerService.logDebug(
                    `Checking: silentRenewRunning: ${isSilentRenewRunning} id_token: ${!!idToken} userData: ${!!userDataFromStore}`
                );

                const shouldBeExecuted = userDataFromStore && !isSilentRenewRunning && idToken;

                if (!shouldBeExecuted) {
                    return of(null);
                }

                const idTokenHasExpired = this.authStateService.hasIdTokenExpired();
                const accessTokenHasExpired = this.authStateService.hasAccessTokenExpiredIfExpiryExists();

                if (!idTokenHasExpired && !accessTokenHasExpired) {
                    return of(null);
                }

                this.loggerService.logDebug('IsAuthorized: id_token idTokenHasExpired, start silent renew if active');

                if (!this.configurationProvider.openIDConfiguration.silentRenew) {
                    this.flowsService.resetAuthorizationData();
                    return of(null);
                }

                this.flowsDataService.setSilentRenewRunning();

                if (this.flowHelper.isCurrentFlowCodeFlowWithRefeshTokens()) {
                    // Refresh Session using Refresh tokens
                    return this.refreshSessionService.refreshSessionWithRefreshTokens();
                }

                return this.refreshSessionIframeService.refreshSessionWithIframe();
            })
        );

        this.periodicallyTokenCheckService.runTokenValidationRunning = periodicallyCheck$
            .pipe(
                catchError(() => {
                    this.flowsDataService.resetSilentRenewRunning();
                    return throwError('periodically check failed');
                })
            )
            .subscribe(() => {
                if (this.flowHelper.isCurrentFlowCodeFlowWithRefeshTokens()) {
                    this.flowsDataService.resetSilentRenewRunning();
                }
            });
    }
}
