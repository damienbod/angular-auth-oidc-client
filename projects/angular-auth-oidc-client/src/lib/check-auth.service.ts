import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthStateService } from './authState/auth-state.service';
import { AutoLoginService } from './auto-login/auto-login.service';
import { CallbackService } from './callback/callback.service';
import { PeriodicallyTokenCheckService } from './callback/periodically-token-check.service';
import { RefreshSessionService } from './callback/refresh-session.service';
import { OpenIdConfiguration } from './config/openid-configuration';
import { ConfigurationProvider } from './config/provider/config.provider';
import { CheckSessionService } from './iframe/check-session.service';
import { SilentRenewService } from './iframe/silent-renew.service';
import { LoggerService } from './logging/logger.service';
import { LoginResponse } from './login/login-response';
import { PopUpService } from './login/popup/popup.service';
import { StoragePersistenceService } from './storage/storage-persistence.service';
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
    private router: Router,
    private storagePersistenceService: StoragePersistenceService
  ) {}

  checkAuth(passedConfigId: string, url?: string): Observable<LoginResponse> {
    if (this.currentUrlHasStateParam()) {
      const stateParamFromUrl = this.getStateParamFromCurrentUrl();
      const config = this.getConfigurationWithUrlState(stateParamFromUrl);

      return this.checkAuthWithConfig(config, url);
    }

    if (!!passedConfigId) {
      const config = this.configurationProvider.getOpenIDConfiguration(passedConfigId);
      return this.checkAuthWithConfig(config, url);
    }

    const onlyExistingConfig = this.configurationProvider.getOpenIDConfiguration();
    return this.checkAuthWithConfig(onlyExistingConfig, url);
  }

  checkAuthMultiple(passedConfigId: string, url?: string): Observable<LoginResponse[]> {
    if (this.currentUrlHasStateParam()) {
      const stateParamFromUrl = this.getStateParamFromCurrentUrl();
      const config = this.getConfigurationWithUrlState(stateParamFromUrl);
      return this.checkAuthWithConfig(config, url).pipe(map((x) => [x]));
    }

    if (!!passedConfigId) {
      const config = this.configurationProvider.getOpenIDConfiguration(passedConfigId);
      return this.checkAuthWithConfig(config, url).pipe(map((x) => [x]));
    }

    const allConfigs = this.configurationProvider.getAllConfigurations();
    const allChecks$ = allConfigs.map((x) => this.checkAuthWithConfig(x, url));

    return forkJoin(allChecks$);
  }

  checkAuthIncludingServer(configId: string): Observable<LoginResponse> {
    const onlyExistingConfig = this.configurationProvider.getOpenIDConfiguration();
    return this.checkAuthWithConfig(onlyExistingConfig).pipe(
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

  private checkAuthWithConfig(config: OpenIdConfiguration, url?: string): Observable<LoginResponse> {
    const { configId, stsServer } = config;

    if (!this.configurationProvider.hasAsLeastOneConfig()) {
      const errorMessage = 'Please provide at least one configuration before setting up the module';
      this.loggerService.logError(configId, errorMessage);

      return of({ isAuthenticated: false, errorMessage });
    }

    const currentUrl = url || this.doc.defaultView.location.toString();

    this.loggerService.logDebug(configId, `Working with config '${configId}' using ${stsServer}`);

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
            this.authStateService.setAuthenticatedAndFireEvent();
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
      tap(({ isAuthenticated }) => {
        if (isAuthenticated) {
          const savedRouteForRedirect = this.autoLoginService.getStoredRedirectRoute(configId);

          if (savedRouteForRedirect) {
            this.autoLoginService.deleteStoredRedirectRoute(configId);
            this.router.navigateByUrl(savedRouteForRedirect);
          }
        }
      }),
      catchError((errorMessage) => {
        this.loggerService.logError(configId, errorMessage);
        return of({ isAuthenticated: false, errorMessage });
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

  private getConfigurationWithUrlState(stateFromUrl: string): OpenIdConfiguration {
    const allConfigs = this.configurationProvider.getAllConfigurations();

    for (const config of allConfigs) {
      const storedState = this.storagePersistenceService.read('authStateControl', config.configId);

      if (storedState === stateFromUrl) {
        return config;
      }
    }

    return null;
  }

  private getStateParamFromCurrentUrl(): string {
    const currentUrl = this.getCurrentUrl();
    const urlParams = new URLSearchParams(currentUrl);
    const stateFromUrl = urlParams.get('state');
    return stateFromUrl;
  }

  private currentUrlHasStateParam(): boolean {
    return !!this.getStateParamFromCurrentUrl();
  }

  private getCurrentUrl(): string {
    return this.doc.defaultView.location.toString();
  }
}
