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
import { UserService } from './userData/user.service';

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

  checkAuth(passedConfigId: string, url?: string): Observable<LoginResponse> {
    if (!this.configurationProvider.hasConfig()) {
      const errorMessage = 'Please provide at least one configuration before setting up the module';
      this.loggerService.logError(passedConfigId, errorMessage);

      return of({ isAuthenticated: false, errorMessage });
    }

    const { stsServer, configId } = this.configurationProvider.getOpenIDConfiguration(passedConfigId);

    this.loggerService.logDebug(configId, `Working with config '${configId}' using ${stsServer}`);

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
        const isAuthenticated = this.authStateService.areAuthStorageTokensValid(configId);
        if (isAuthenticated) {
          this.startCheckSessionAndValidation(configId);

          if (!isCallback) {
            this.authStateService.setAuthorizedAndFireEvent();
            this.userService.publishUserDataIfExists(configId);
          }
        }

        this.loggerService.logDebug(configId, 'checkAuth completed - firing events now. isAuthenticated: ' + isAuthenticated);

        return {
          isAuthenticated,
          userData: this.userService.getUserDataFromStore(configId),
          accessToken: this.authStateService.getAccessToken(configId),
          configId,
        };
      }),
      tap(() => {
        const savedRouteForRedirect = this.autoLoginService.getStoredRedirectRoute(configId);
        if (savedRouteForRedirect) {
          this.autoLoginService.deleteStoredRedirectRoute(configId);
          this.router.navigateByUrl(savedRouteForRedirect);
        }
      }),
      catchError((errorMessage) => {
        this.loggerService.logError(configId, errorMessage);
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
    if (this.checkSessionService.isCheckSessionConfigured(configId)) {
      this.checkSessionService.start(configId);
    }

    this.periodicallyTokenCheckService.startTokenValidationPeriodically();

    if (this.silentRenewService.isSilentRenewConfigured(configId)) {
      this.silentRenewService.getOrCreateIframe(configId);
    }
  }
}
