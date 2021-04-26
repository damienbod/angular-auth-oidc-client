import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthStateService } from './authState/auth-state.service';
import { AutoLoginService } from './auto-login/auto-login-service';
import { CallbackService } from './callback/callback.service';
import { PeriodicallyTokenCheckService } from './callback/periodically-token-check.service';
import { RefreshSessionService } from './callback/refresh-session.service';
import { ConfigurationProvider } from './config/config.provider';
import { CheckSessionService } from './iframe/check-session.service';
import { SilentRenewService } from './iframe/silent-renew.service';
import { LoggerService } from './logging/logger.service';
import { LoginResponse } from './login/login-response';
import { PopUpService } from './login/popup/popup.service';
import { UserService } from './userData/user-service';

@Injectable()
export class CheckAuthService {
  constructor(
    @Inject(DOCUMENT) private readonly doc: any,
    private checkSessionService: CheckSessionService,
    private silentRenewService: SilentRenewService,
    private userService: UserService,
    private loggerService: LoggerService,
    private configurationProvider: ConfigurationProvider,
    private authStateService: AuthStateService,
    private callbackService: CallbackService,
    private refreshSessionService: RefreshSessionService,
    private periodicallyTokenCheckService: PeriodicallyTokenCheckService,
    private popupService: PopUpService,
    private autoLoginService: AutoLoginService,
    private router: Router
  ) {}

  checkAuth(url?: string): Observable<LoginResponse> {
    if (!this.configurationProvider.hasValidConfig()) {
      const errorMessage = 'Please provide a configuration before setting up the module';
      this.loggerService.logError(errorMessage);

      return of({ isAuthenticated: false, errorMessage });
    }

    const { stsServer } = this.configurationProvider.getOpenIDConfiguration();

    this.loggerService.logDebug('STS server: ', stsServer);

    const currentUrl = url || this.doc.defaultView.location.toString();

    if (this.popupService.isCurrentlyInPopup()) {
      this.popupService.sendMessageToMainWindow(currentUrl);

      return of(null);
    }

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
            this.userService.publishUserDataIfExists();
          }
        }

        this.loggerService.logDebug('checkAuth completed fired events, auth: ' + isAuthenticated);

        return {
          isAuthenticated,
          userData: this.userService.getUserDataFromStore(),
          accessToken: this.authStateService.getAccessToken(),
        };
      }),
      tap(() => {
        const savedRouteForRedirect = this.autoLoginService.getStoredRedirectRoute();
        if (savedRouteForRedirect) {
          this.autoLoginService.deleteStoredRedirectRoute();
          this.router.navigateByUrl(savedRouteForRedirect);
        }
      }),
      catchError((errorMessage) => {
        this.loggerService.logError(errorMessage);
        return of({ isAuthenticated: false, errorMessage });
      })
    );
  }

  checkAuthIncludingServer(): Observable<LoginResponse> {
    return this.checkAuth().pipe(
      switchMap((loginResponse) => {
        const { isAuthenticated } = loginResponse;

        if (isAuthenticated) {
          return of(loginResponse);
        }

        return this.refreshSessionService.forceRefreshSession().pipe(
          map((result) => !!result?.idToken && !!result?.accessToken),
          switchMap((authenticated) => {
            if (authenticated) {
              this.startCheckSessionAndValidation();
            }

            return of({ ...loginResponse, isAuthenticated: authenticated });
          })
        );
      })
    );
  }

  private startCheckSessionAndValidation() {
    if (this.checkSessionService.isCheckSessionConfigured()) {
      this.checkSessionService.start();
    }

    const { tokenRefreshInSeconds } = this.configurationProvider.getOpenIDConfiguration();

    this.periodicallyTokenCheckService.startTokenValidationPeriodically(tokenRefreshInSeconds);

    if (this.silentRenewService.isSilentRenewConfigured()) {
      this.silentRenewService.getOrCreateIframe();
    }
  }
}
