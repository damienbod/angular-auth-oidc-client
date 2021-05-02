import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthStateService } from './authState/auth-state.service';
import { AutoLoginService } from './auto-login/auto-login.service';
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

  checkAuth(configId: string, url?: string): Observable<LoginResponse> {
    if (!this.configurationProvider.hasConfig()) {
      const errorMessage = 'Please provide at least one configuration before setting up the module';
      this.loggerService.logError(configId, errorMessage);

      return of({ isAuthenticated: false, errorMessage });
    }

    const { stsServer, uniqueId } = this.configurationProvider.getOpenIDConfiguration(configId);

    this.loggerService.logDebug(uniqueId, `Working with config '${uniqueId}' using ${stsServer}`);

    const currentUrl = url || this.doc.defaultView.location.toString();

    if (this.popupService.isCurrentlyInPopup()) {
      this.popupService.sendMessageToMainWindow(currentUrl);

      return of(null);
    }

    const isCallback = this.callbackService.isCallback(currentUrl);

    this.loggerService.logDebug('currentUrl to check auth with: ', currentUrl);

    const callback$ = isCallback ? this.callbackService.handleCallbackAndFireEvents(currentUrl, configId) : of(null);

    return callback$.pipe(
      map(() => {
        const isAuthenticated = this.authStateService.areAuthStorageTokensValid(uniqueId);
        if (isAuthenticated) {
          this.startCheckSessionAndValidation(uniqueId);

          if (!isCallback) {
            this.authStateService.setAuthorizedAndFireEvent();
            this.userService.publishUserDataIfExists(configId);
          }
        }

        this.loggerService.logDebug(uniqueId, 'checkAuth completed - firing events now. isAuthenticated: ' + isAuthenticated);

        return {
          isAuthenticated,
          userData: this.userService.getUserDataFromStore(uniqueId),
          accessToken: this.authStateService.getAccessToken(uniqueId),
          configId: uniqueId,
        };
      }),
      tap(() => {
        const savedRouteForRedirect = this.autoLoginService.getStoredRedirectRoute(uniqueId);
        if (savedRouteForRedirect) {
          this.autoLoginService.deleteStoredRedirectRoute(uniqueId);
          this.router.navigateByUrl(savedRouteForRedirect);
        }
      }),
      catchError((errorMessage) => {
        this.loggerService.logError(uniqueId, errorMessage);
        return of({ isAuthenticated: false, errorMessage });
      })
    );
  }

  checkAuthIncludingServer(configId: string): Observable<LoginResponse> {
    return this.checkAuth(configId).pipe(
      switchMap((loginResponse) => {
        const { isAuthenticated } = loginResponse;

        if (isAuthenticated) {
          return of(loginResponse);
        }

        return this.refreshSessionService.forceRefreshSession(configId).pipe(
          tap((loginResponseAfterRefreshSession) => {
            if (loginResponseAfterRefreshSession.isAuthenticated) {
              this.startCheckSessionAndValidation(configId);
            }
          })
        );
      })
    );
  }

  private startCheckSessionAndValidation(configId: string) {
    if (this.checkSessionService.isCheckSessionConfigured()) {
      this.checkSessionService.start();
    }

    const { tokenRefreshInSeconds } = this.configurationProvider.getOpenIDConfiguration(configId);

    this.periodicallyTokenCheckService.startTokenValidationPeriodically(tokenRefreshInSeconds, configId);

    if (this.silentRenewService.isSilentRenewConfigured()) {
      this.silentRenewService.getOrCreateIframe();
    }
  }
}
