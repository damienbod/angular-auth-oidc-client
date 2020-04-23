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

export interface CallbackContext {
    code: string;
    refreshToken: string;
    state: string;
    sessionState: string | null;
    authResult: any;
    isRenewProcess: boolean;
    jwtKeys: JwtKeys;
    validationResult: StateValidationResult;
}

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
        const codeParam = this.urlService.getUrlParameter(urlToCheck, 'code');
        const stateParam = this.urlService.getUrlParameter(urlToCheck, 'state');
        const sessionStateParam = this.urlService.getUrlParameter(urlToCheck, 'session_state') || null;

        if (!stateParam) {
            this.loggerService.logDebug('no state in url');
            return of();
        }
        if (!codeParam) {
            this.loggerService.logDebug('no code in url');
            return of();
        }
        this.loggerService.logDebug('running validation for callback' + urlToCheck);

        const callbackContext: CallbackContext = {
            code: codeParam,
            refreshToken: null,
            state: stateParam,
            sessionState: sessionStateParam,
            authResult: null,
            isRenewProcess: false,
            jwtKeys: null,
            validationResult: null,
        };
        // TODO STEP2
        return this.requestTokensWithCodeProcedure$(callbackContext);
    }

    // STEP 1 Implicit Flow
    authorizedImplicitFlowCallbackProcedure(hash?: string) {
        const isRenewProcessData = this.flowsDataService.isSilentRenewRunning();

        this.loggerService.logDebug('BEGIN authorizedCallback, no auth data');
        if (!isRenewProcessData) {
            this.resetAuthorizationData();
        }

        hash = hash || window.location.hash.substr(1);

        const result: any = hash.split('&').reduce((resultData: any, item: string) => {
            const parts = item.split('=');
            resultData[parts.shift() as string] = parts.join('=');
            return resultData;
        }, {});

        const callbackContext: CallbackContext = {
            code: null,
            refreshToken: null,
            state: null,
            sessionState: null,
            authResult: result,
            isRenewProcess: isRenewProcessData,
            jwtKeys: null,
            validationResult: null,
        };
        // TODO STEP2
        this.authorizedCallbackProcedure(callbackContext);
    }

    // STEP 1 Refresh session
    refreshSessionWithRefreshTokens() {
        const stateData = this.flowsDataService.getExistingOrCreateAuthStateControl();
        this.loggerService.logDebug('RefreshSession created. adding myautostate: ' + stateData);
        const refreshTokenData = this.authStateService.getRefreshToken();

        const callbackContext: CallbackContext = {
            code: null,
            refreshToken: refreshTokenData,
            state: stateData,
            sessionState: null,
            authResult: null,
            isRenewProcess: false,
            jwtKeys: null,
            validationResult: null,
        };

        if (refreshTokenData) {
            this.loggerService.logDebug('found refresh code, obtaining new credentials with refresh code');
            // Nonce is not used with refresh tokens; but Keycloak may send it anyway
            this.flowsDataService.setNonce(TokenValidationService.RefreshTokenNoncePlaceholder);
            return this.refreshTokensWithCodeProcedure(callbackContext);
        } else {
            this.loggerService.logError('no refresh token found, please login');
            return;
        }
    }

    // STEP 2 Refresh Token
    private refreshTokensWithCodeProcedure(callbackContext: CallbackContext): Observable<any> {
        let headers: HttpHeaders = new HttpHeaders();
        headers = headers.set('Content-Type', 'application/x-www-form-urlencoded');

        const tokenRequestUrl = this.getTokenEndpoint();
        if (!tokenRequestUrl) {
            return throwError(new Error('Token Endpoint not defined'));
        }

        const data = this.urlService.createBodyForCodeFlowRefreshTokensRequest(callbackContext.refreshToken);

        return this.dataService.post(tokenRequestUrl, data, headers).pipe(
            map((response) => {
                this.loggerService.logDebug('token refresh response: ' + JSON.stringify(response));
                let authResult: any = new Object();
                authResult = response;
                authResult.state = callbackContext.state;

                callbackContext.authResult = authResult;
                this.authorizedCodeFlowCallbackProcedure(callbackContext);
            }),
            catchError((error) => {
                this.loggerService.logError(error);
                this.loggerService.logError(`OidcService code request ${this.configurationProvider.openIDConfiguration.stsServer}`);
                return of(false);
            })
        );
    }

    // STEP 2 Code Flow //  Code Flow Silent Renew starts here
    requestTokensWithCodeProcedure$(callbackContext: CallbackContext): Observable<void> {
        if (
            !this.tokenValidationService.validateStateFromHashCallback(callbackContext.state, this.flowsDataService.getAuthStateControl())
        ) {
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

        const bodyForCodeFlow = this.urlService.createBodyForCodeFlowCodeRequest(callbackContext.code);

        return this.dataService.post(tokenRequestUrl, bodyForCodeFlow, headers).pipe(
            map((response) => {
                let authResult: any = new Object();
                authResult = response;
                authResult.state = callbackContext.state;
                authResult.session_state = callbackContext.sessionState;

                callbackContext.authResult = authResult;
                // TODO STEP3
                this.authorizedCodeFlowCallbackProcedure(callbackContext);

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
    private authorizedCodeFlowCallbackProcedure(callbackContext: CallbackContext) {
        callbackContext.isRenewProcess = this.flowsDataService.isSilentRenewRunning();

        this.loggerService.logDebug('BEGIN authorized Code Flow Callback, no auth data');
        if (!callbackContext.isRenewProcess) {
            this.resetAuthorizationData();
        }

        // TODO STEP4
        this.authorizedCallbackProcedure(callbackContext);
    }

    // STEP 4 Code Flow, STEP 2 Implicit Flow, STEP 4 Refresh Token LAST Step
    private authorizedCallbackProcedure(callbackContext: CallbackContext) {
        this.authStateService.setAuthResultInStorage(callbackContext.authResult);

        if (this.historyCleanUpTurnedOn() && !callbackContext.isRenewProcess) {
            this.resetBrowserHistory();
        } else {
            this.loggerService.logDebug('history clean up inactive');
        }

        if (callbackContext.authResult.error) {
            this.loggerService.logDebug(`authorizedCallbackProcedure came with error`, callbackContext.authResult.error);
            this.resetAuthorizationData();
            this.flowsDataService.setNonce('');
            this.handleResultErrorFromCallback(callbackContext.authResult, callbackContext.isRenewProcess);
        } else {
            this.loggerService.logDebug(callbackContext.authResult);
            this.loggerService.logDebug('authorizedCallback created, begin token validation');

            this.signinKeyDataService.getSigningKeys().subscribe(
                (jwtKeys) => {
                    callbackContext.jwtKeys = jwtKeys;
                    // TODO STEP5
                    this.callbackStep5(callbackContext);
                },
                (err) => {
                    /* Something went wrong while getting signing key */
                    this.loggerService.logWarning('Failed to retrieve signing key with error: ' + JSON.stringify(err));
                    this.flowsDataService.resetSilentRenewRunning();
                }
            );
        }
    }

    // STEP 5 All flows
    private callbackStep5(callbackContext: CallbackContext) {
        const validationResult = this.stateValidationService.getValidatedStateResult(callbackContext.authResult, callbackContext.jwtKeys);
        callbackContext.validationResult = validationResult;

        if (validationResult.authResponseIsValid) {
            this.authStateService.setAuthorizationData(validationResult.accessToken, validationResult.idToken);
            this.flowsDataService.resetSilentRenewRunning();

            // TODO STEP6
            this.callbackUserDataStep6(callbackContext);
        } else {
            // something went wrong
            this.loggerService.logWarning('authorizedCallback, token(s) validation failed, resetting');
            this.loggerService.logWarning(window.location.hash);
            this.resetAuthorizationData();
            this.flowsDataService.resetSilentRenewRunning();

            this.callbackUserDataStep6(callbackContext);
            this.handleExceptionFromCallback(callbackContext.validationResult, callbackContext.isRenewProcess);
        }
    }

    // STEP 6 userData
    private callbackUserDataStep6(callbackContext: CallbackContext) {
        if (this.configurationProvider.openIDConfiguration.autoUserinfo) {
            this.userService
                .getAndPersistUserDataInStore(
                    callbackContext.isRenewProcess,
                    callbackContext.validationResult.idToken,
                    callbackContext.validationResult.decodedIdToken
                )
                .subscribe(
                    (userData) => {
                        if (!!userData) {
                            this.flowsDataService.setSessionState(callbackContext.authResult.session_state);
                            // TODO move to parent OIDC service, success completion function
                            this.handleSuccessFromCallback(callbackContext.validationResult, callbackContext.isRenewProcess);
                        } else {
                            this.resetAuthorizationData();
                            this.handleExceptionFromCallback(callbackContext.validationResult, callbackContext.isRenewProcess);
                        }
                    },
                    (err) => {
                        /* Something went wrong while getting signing key */
                        this.loggerService.logWarning('Failed to retreive user info with error: ' + JSON.stringify(err));
                    }
                );
        } else {
            if (!callbackContext.isRenewProcess) {
                // userData is set to the id_token decoded, auto get user data set to false
                this.userService.setUserDataToStore(callbackContext.validationResult.decodedIdToken);
            }

            // TODO move to parent OIDC service, success completion function
            this.handleSuccessFromCallback(callbackContext.validationResult, callbackContext.isRenewProcess);
        }
    }

    private handleSuccessFromCallback(stateValidationResult: StateValidationResult, isRenewProcess: boolean) {
        this.authStateService.updateAndPublishAuthState({
            authorizationState: AuthorizedState.Authorized,
            validationResult: stateValidationResult.state,
            isRenewProcess,
        });

        // MOVE to OIDC service
        this.startTokenValidationPeriodically();

        // MOVE to OIDC service
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

        // MOVE to OIDC service
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

        // MOVE to OIDC service
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
