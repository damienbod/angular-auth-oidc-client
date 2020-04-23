import { HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DataService } from '../api/data.service';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthorizedState } from '../authState/authorized-state';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { UserService } from '../userData/user-service';
import { UrlService } from '../utils';
import { StateValidationResult } from '../validation/state-validation-result';
import { StateValidationService } from '../validation/state-validation.service';
import { TokenValidationService } from '../validation/token-validation.service';
import { ValidationResult } from '../validation/validation-result';
import { JwtKeys } from './../validation/jwtkeys';
import { FlowsDataService } from './flows-data.service';
import { SigninKeyDataService } from './signin-key-data.service';

@Injectable()
export class FlowsService {
    constructor(
        private urlService: UrlService,
        private loggerService: LoggerService,
        private tokenValidationService: TokenValidationService,
        private readonly configurationProvider: ConfigurationProvider,
        private readonly authStateService: AuthStateService,
        private readonly flowsDataService: FlowsDataService,
        private readonly signinKeyDataService: SigninKeyDataService,
        private readonly dataService: DataService,
        private readonly userService: UserService,
        private readonly stateValidationService: StateValidationService,
        private router: Router
    ) {}

    resetAuthorizationData(): void {
        if (this.configurationProvider.openIDConfiguration.autoUserinfo) {
            // Clear user data. Fixes #97.
            this.userService.resetUserDataInStore();
        }

        this.flowsDataService.resetStorageFlowData();
        this.authStateService.setUnauthorizedAndFireEvent();
    }

    // STEP 1 Code Flow
    authorizedCallbackWithCode$(urlToCheck: string): Observable<void> {
        const code = this.urlService.getUrlParameter(urlToCheck, 'code');
        const state = this.urlService.getUrlParameter(urlToCheck, 'state');
        const sessionState = this.urlService.getUrlParameter(urlToCheck, 'session_state') || null;

        if (!state) {
            this.loggerService.logDebug('no state in url');
            return of();
        }
        if (!code) {
            this.loggerService.logDebug('no code in url');
            return of();
        }
        this.loggerService.logDebug('running validation for callback' + urlToCheck);
        return this.requestTokensWithCodeProcedure$(code, state, sessionState);
    }

    // STEP 1 Implicit Flow
    authorizedImplicitFlowCallbackProcedure(hash?: string) {
        const isRenewProcess = this.flowsDataService.isSilentRenewRunning();

        this.loggerService.logDebug('BEGIN authorizedCallback, no auth data');
        if (!isRenewProcess) {
            this.resetAuthorizationData();
        }

        hash = hash || window.location.hash.substr(1);

        const result: any = hash.split('&').reduce((resultData: any, item: string) => {
            const parts = item.split('=');
            resultData[parts.shift() as string] = parts.join('=');
            return resultData;
        }, {});

        this.authorizedCallbackProcedure(result, isRenewProcess);
    }

    // STEP 1 Refresh session
    refreshSessionWithRefreshTokens() {
        const state = this.flowsDataService.getExistingOrCreateAuthStateControl();
        this.loggerService.logDebug('RefreshSession created. adding myautostate: ' + state);
        const refreshToken = this.authStateService.getRefreshToken();
        if (refreshToken) {
            this.loggerService.logDebug('found refresh code, obtaining new credentials with refresh code');
            // Nonce is not used with refresh tokens; but Keycloak may send it anyway
            this.flowsDataService.setNonce(TokenValidationService.RefreshTokenNoncePlaceholder);
            return this.refreshTokensWithCodeProcedure(refreshToken, state);
        } else {
            this.loggerService.logError('no refresh token found, please login');
            return;
        }
    }

    // STEP 2 Refresh Token
    private refreshTokensWithCodeProcedure(refreshToken: string, state: string): Observable<any> {
        let headers: HttpHeaders = new HttpHeaders();
        headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

        const tokenRequestUrl = this.getTokenEndpoint();
        if (!tokenRequestUrl) {
            return throwError(new Error('Token Endpoint not defined'));
        }

        const data = this.urlService.createBodyForCodeFlowRefreshTokensRequest(refreshToken);

        return this.dataService.post(tokenRequestUrl, data, headers).pipe(
            map((response) => {
                this.loggerService.logDebug('token refresh response: ' + JSON.stringify(response));
                let obj: any = new Object();
                obj = response;
                obj.state = state;

                this.authorizedCodeFlowCallbackProcedure(obj);
            }),
            catchError((error) => {
                this.loggerService.logError(error);
                this.loggerService.logError(`OidcService code request ${this.configurationProvider.openIDConfiguration.stsServer}`);
                return of(false);
            })
        );
    }

    // STEP 2 Code Flow //  Code Flow Silent Renew starts here
    requestTokensWithCodeProcedure$(code: string, state: string, sessionState: string | null): Observable<void> {
        if (!this.tokenValidationService.validateStateFromHashCallback(state, this.flowsDataService.getAuthStateControl())) {
            this.loggerService.logWarning('authorizedCallback incorrect state');
            // ValidationResult.StatesDoNotMatch;
            return throwError(new Error('incorrect state'));
        }

        const tokenRequestUrl = this.getTokenEndpoint();
        if (!tokenRequestUrl) {
            return throwError(new Error('Token Endpoint not defined'));
        }

        let headers: HttpHeaders = new HttpHeaders();
        headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

        const bodyForCodeFlow = this.urlService.createBodyForCodeFlowCodeRequest(code);

        return this.dataService.post(tokenRequestUrl, bodyForCodeFlow, headers).pipe(
            map((response) => {
                let obj: any = new Object();
                obj = response;
                obj.state = state;
                obj.session_state = sessionState;

                this.authorizedCodeFlowCallbackProcedure(obj);

                return undefined;
            }),
            catchError((error) => {
                this.loggerService.logError(error);
                this.loggerService.logError(`OidcService code request ${this.configurationProvider.openIDConfiguration.stsServer}`);
                return throwError(error);
            })
        );
    }

    // STEP 3 Code Flow, STEP 3 Refresh Token
    private authorizedCodeFlowCallbackProcedure(result: any) {
        const isRenewProcess = this.flowsDataService.isSilentRenewRunning();

        this.loggerService.logDebug('BEGIN authorized Code Flow Callback, no auth data');
        if (!isRenewProcess) {
            this.resetAuthorizationData();
        }
        this.authorizedCallbackProcedure(result, isRenewProcess);
    }

    // STEP 4 Code Flow, STEP 2 Implicit Flow, STEP 4 Refresh Token LAST Step
    private authorizedCallbackProcedure(result: any, isRenewProcess: boolean) {
        this.authStateService.setAuthResultInStorage(result);

        if (this.historyCleanUpTurnedOn() && !isRenewProcess) {
            this.resetBrowserHistory();
        } else {
            this.loggerService.logDebug('history clean up inactive');
        }

        if (result.error) {
            this.loggerService.logDebug(`authorizedCallbackProcedure came with error`, result.error);
            this.resetAuthorizationData();
            this.flowsDataService.setNonce('');
            this.handleResultErrorFromCallback(result, isRenewProcess);
        } else {
            this.loggerService.logDebug(result);
            this.loggerService.logDebug('authorizedCallback created, begin token validation');

            this.signinKeyDataService.getSigningKeys().subscribe(
                (jwtKeys) => {
                    this.callbackStep5(result, isRenewProcess, jwtKeys);
                },
                (err) => {
                    /* Something went wrong while getting signing key */
                    this.loggerService.logWarning('Failed to retreive siging key with error: ' + JSON.stringify(err));
                    this.flowsDataService.resetSilentRenewRunning();
                }
            );
        }
    }

    // STEP 5 callback
    private callbackStep5(result: any, isRenewProcess: boolean, jwtKeys: JwtKeys) {
        const validationResult = this.stateValidationService.getValidatedStateResult(result, jwtKeys);

        if (validationResult.authResponseIsValid) {
            this.authStateService.setAuthorizationData(validationResult.accessToken, validationResult.idToken);
            this.flowsDataService.resetSilentRenewRunning();

            if (this.configurationProvider.openIDConfiguration.autoUserinfo) {
                this.userService
                    .getAndPersistUserDataInStore(isRenewProcess, validationResult.idToken, validationResult.decodedIdToken)
                    .subscribe(
                        (userData) => {
                            if (!!userData) {
                                this.flowsDataService.setSessionState(result.session_state);
                                this.handleSuccessFromCallback(validationResult, isRenewProcess);
                            } else {
                                this.resetAuthorizationData();
                                this.handleExceptionFromCallback(validationResult, isRenewProcess);
                            }
                        },
                        (err) => {
                            /* Something went wrong while getting signing key */
                            this.loggerService.logWarning('Failed to retreive user info with error: ' + JSON.stringify(err));
                        }
                    );
            } else {
                if (!isRenewProcess) {
                    // userData is set to the id_token decoded, auto get user data set to false
                    this.userService.setUserDataToStore(validationResult.decodedIdToken);
                }

                this.handleSuccessFromCallback(validationResult, isRenewProcess);
            }
        } else {
            // something went wrong
            this.loggerService.logWarning('authorizedCallback, token(s) validation failed, resetting');
            this.loggerService.logWarning(window.location.hash);
            this.resetAuthorizationData();
            this.flowsDataService.resetSilentRenewRunning();

            this.handleExceptionFromCallback(validationResult, isRenewProcess);
        }
    }
    private handleSuccessFromCallback(stateValidationResult: StateValidationResult, isRenewProcess: boolean) {
        this.startTokenValidationPeriodically();

        this.authStateService.updateAndPublishAuthState({
            authorizationState: AuthorizedState.Authorized,
            validationResult: stateValidationResult.state,
            isRenewProcess,
        });
        if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent && !isRenewProcess) {
            this.router.navigate([this.configurationProvider.openIDConfiguration.postLoginRoute]);
        }
    }

    private handleExceptionFromCallback(stateValidationResult: StateValidationResult, isRenewProcess: boolean) {
        this.authStateService.updateAndPublishAuthState({
            authorizationState: AuthorizedState.Unauthorized,
            validationResult: stateValidationResult.state,
            isRenewProcess,
        });

        if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent && !isRenewProcess) {
            this.router.navigate([this.configurationProvider.openIDConfiguration.unauthorizedRoute]);
        }
    }

    private handleResultErrorFromCallback(result: any, isRenewProcess: boolean) {
        if ((result.error as string) === 'login_required') {
            this.authStateService.updateAndPublishAuthState({
                authorizationState: AuthorizedState.Unauthorized,
                validationResult: ValidationResult.LoginRequired,
                isRenewProcess,
            });
        } else {
            this.authStateService.updateAndPublishAuthState({
                authorizationState: AuthorizedState.Unauthorized,
                validationResult: ValidationResult.SecureTokenServerError,
                isRenewProcess,
            });
        }

        if (!this.configurationProvider.openIDConfiguration.triggerAuthorizationResultEvent && !isRenewProcess) {
            this.router.navigate([this.configurationProvider.openIDConfiguration.unauthorizedRoute]);
        }
    }

    private getTokenEndpoint(): string {
        if (this.configurationProvider.wellKnownEndpoints && this.configurationProvider.wellKnownEndpoints.tokenEndpoint) {
            return `${this.configurationProvider.wellKnownEndpoints.tokenEndpoint}`;
        }
        return null;
    }

    private historyCleanUpTurnedOn() {
        return !this.configurationProvider.openIDConfiguration.historyCleanupOff;
    }

    private resetBrowserHistory() {
        window.history.replaceState({}, window.document.title, window.location.origin + window.location.pathname);
    }
}
