import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AuthStateService } from './authState/auth-state.service';
import { CallbackService } from './callback/callback.service';
import { PeriodicallyTokenCheckService } from './callback/periodically-token-check.service';
import { RefreshSessionService } from './callback/refresh-session.service';
import { ConfigurationProvider } from './config/config.provider';
import { CheckSessionService } from './iframe/check-session.service';
import { SilentRenewService } from './iframe/silent-renew.service';
import { LoggerService } from './logging/logger.service';
import { PopUpService } from './login/popup.service';
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
    private popupService: PopUpService
  ) {}

  checkAuth(url?: string): Observable<boolean> {
    if (!this.configurationProvider.hasValidConfig()) {
      this.loggerService.logError('Please provide a configuration before setting up the module');
      return of(false);
    }

    this.loggerService.logDebug('STS server: ' + this.configurationProvider.openIDConfiguration.stsServer);

    const currentUrl = url || this.doc.defaultView.location.toString();

    if (this.popupService.hasPopup()) {
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

    this.periodicallyTokenCheckService.startTokenValidationPeriodically(
      this.configurationProvider.openIDConfiguration.tokenRefreshInSeconds
    );

    if (this.silentRenewService.isSilentRenewConfigured()) {
      this.silentRenewService.getOrCreateIframe();
    }
  }
}
