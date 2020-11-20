import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthStateService } from './authState/auth-state.service';
import { CallbackService } from './callback/callback.service';
import { PeriodicallyTokenCheckService } from './callback/periodically-token-check.service';
import { RefreshSessionService } from './callback/refresh-session.service';
import { ConfigurationProvider } from './config/config.provider';
import { PublicConfiguration } from './config/public-configuration';
import { FlowsDataService } from './flows/flows-data.service';
import { CheckSessionService } from './iframe/check-session.service';
import { SilentRenewService } from './iframe/silent-renew.service';
import { LoggerService } from './logging/logger.service';
import { AuthOptions } from './login/auth-options';
import { LoginService } from './login/login.service';
import { LogoffRevocationService } from './logoffRevoke/logoff-revocation.service';
import { StoragePersistanceService } from './storage/storage-persistance.service';
import { UserService } from './userData/user-service';
import { TokenHelperService } from './utils/tokenHelper/oidc-token-helper.service';

@Injectable()
export class OidcSecurityService {
    get configuration(): PublicConfiguration {
        return {
            configuration: this.configurationProvider.openIDConfiguration,
            wellknown: this.storagePersistanceService.read('authWellKnownEndPoints'),
        };
    }

    get userData$() {
        return this.userService.userData$;
    }

    get isAuthenticated$() {
        return this.authStateService.authorized$;
    }

    get checkSessionChanged$() {
        return this.checkSessionService.checkSessionChanged$;
    }

    get stsCallback$() {
        return this.callbackService.stsCallback$;
    }

    constructor(
        private checkSessionService: CheckSessionService,
        private silentRenewService: SilentRenewService,
        private userService: UserService,
        private tokenHelperService: TokenHelperService,
        private loggerService: LoggerService,
        private configurationProvider: ConfigurationProvider,
        private authStateService: AuthStateService,
        private flowsDataService: FlowsDataService,
        private callbackService: CallbackService,
        private logoffRevocationService: LogoffRevocationService,
        private loginService: LoginService,
        private storagePersistanceService: StoragePersistanceService,
        private refreshSessionService: RefreshSessionService,
        private periodicallyTokenCheckService: PeriodicallyTokenCheckService
    ) {}

    checkAuth(url?: string): Observable<boolean> {
        if (!this.configurationProvider.hasValidConfig()) {
            this.loggerService.logError('Please provide a configuration before setting up the module');
            return of(false);
        }

        this.loggerService.logDebug('STS server: ' + this.configurationProvider.openIDConfiguration.stsServer);

        const currentUrl = url || window.location.toString();
        const isCallback = this.callbackService.isCallback(currentUrl);

        this.loggerService.logDebug('currentUrl to check auth with: ', currentUrl);

        const callback$ = isCallback ? this.callbackService.handleCallbackAndFireEvents(currentUrl) : of(null);

        return callback$.pipe(
            map(() => {
                const isAuthenticated = this.authStateService.areAuthStorageTokensValid();
                if (isAuthenticated) {
                    this.startCheckSessionAndValidation();

                    if (!isCallback) {
                        this.authStateService.setAuthorizedAndFireEvent();
                        this.userService.publishUserdataIfExists();
                    }
                }

                this.loggerService.logDebug('checkAuth completed fire events, auth: ' + isAuthenticated);

                return isAuthenticated;
            }),
            catchError(() => of(false))
        );
    }

    checkAuthIncludingServer(): Observable<boolean> {
        return this.checkAuth().pipe(
            switchMap((isAuthenticated) => {
                if (isAuthenticated) {
                    return of(isAuthenticated);
                }

                return this.refreshSessionService.forceRefreshSession().pipe(
                    map((result) => !!result?.idToken && !!result?.accessToken),
                    switchMap((isAuth) => {
                        if (isAuth) {
                            this.startCheckSessionAndValidation();
                        }

                        return of(isAuth);
                    })
                );
            })
        );
    }

    private startCheckSessionAndValidation() {
        if (this.checkSessionService.isCheckSessionConfigured()) {
            this.checkSessionService.start();
        }

        this.periodicallyTokenCheckService.startTokenValidationPeriodically(this.configuration.configuration.tokenRefreshInSeconds);

        if (this.silentRenewService.isSilentRenewConfigured()) {
            this.silentRenewService.getOrCreateIframe();
        }
    }

    getToken(): string {
        return this.authStateService.getAccessToken();
    }

    getIdToken(): string {
        return this.authStateService.getIdToken();
    }

    getRefreshToken(): string {
        return this.authStateService.getRefreshToken();
    }

    getPayloadFromIdToken(encode = false): any {
        const token = this.getIdToken();
        return this.tokenHelperService.getPayloadFromToken(token, encode);
    }

    setState(state: string): void {
        this.flowsDataService.setAuthStateControl(state);
    }

    getState(): string {
        return this.flowsDataService.getAuthStateControl();
    }

    // Code Flow with PCKE or Implicit Flow
    authorize(authOptions?: AuthOptions) {
        this.loginService.login(authOptions);
    }

    authorizeWithPopUp(authOptions?: AuthOptions) {
        const internalUrlHandler = (authUrl) => {
            // handle the authorization URL
            window.open(authUrl, '_blank', 'toolbar=0,location=0,menubar=0');
        };

        const urlHandler = authOptions?.urlHandler || internalUrlHandler;

        const options = {
            urlHandler,
            customParams: authOptions?.customParams,
        };

        this.authorize(options);
    }

    forceRefreshSession() {
        return this.refreshSessionService.forceRefreshSession();
    }

    // The refresh token and and the access token are revoked on the server. If the refresh token does not exist
    // only the access token is revoked. Then the logout run.
    logoffAndRevokeTokens(urlHandler?: (url: string) => any) {
        return this.logoffRevocationService.logoffAndRevokeTokens(urlHandler);
    }

    // Logs out on the server and the local client.
    // If the server state has changed, checksession, then only a local logout.
    logoff(urlHandler?: (url: string) => any) {
        return this.logoffRevocationService.logoff(urlHandler);
    }

    logoffLocal() {
        return this.logoffRevocationService.logoffLocal();
    }

    // https://tools.ietf.org/html/rfc7009
    // revokes an access token on the STS. This is only required in the code flow with refresh tokens.
    // If no token is provided, then the token from the storage is revoked. You can pass any token to revoke.
    // This makes it possible to manage your own tokens.
    revokeAccessToken(accessToken?: any) {
        return this.logoffRevocationService.revokeAccessToken(accessToken);
    }

    // https://tools.ietf.org/html/rfc7009
    // revokes a refresh token on the STS. This is only required in the code flow with refresh tokens.
    // If no token is provided, then the token from the storage is revoked. You can pass any token to revoke.
    // This makes it possible to manage your own tokens.
    revokeRefreshToken(refreshToken?: any) {
        return this.logoffRevocationService.revokeRefreshToken(refreshToken);
    }

    getEndSessionUrl(): string | null {
        return this.logoffRevocationService.getEndSessionUrl();
    }
}
