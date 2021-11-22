import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthStateService } from './auth-state/auth-state.service';
import { AutoLoginService } from './auto-login/auto-login.service';
import { CallbackService } from './callback/callback.service';
import { PeriodicallyTokenCheckService } from './callback/periodically-token-check.service';
import { RefreshSessionService } from './callback/refresh-session.service';
import { OpenIdConfiguration } from './config/openid-configuration';
import { CheckSessionService } from './iframe/check-session.service';
import { SilentRenewService } from './iframe/silent-renew.service';
import { LoggerService } from './logging/logger.service';
import { LoginResponse } from './login/login-response';
import { PopUpService } from './login/popup/popup.service';
import { StoragePersistenceService } from './storage/storage-persistence.service';
import { UserService } from './user-data/user.service';
import { CurrentUrlService } from './utils/url/current-url.service';

@Injectable()
export class CheckAuthService {
  constructor(
    private checkSessionService: CheckSessionService,
    private currentUrlService: CurrentUrlService,
    private silentRenewService: SilentRenewService,
    private userService: UserService,
    private loggerService: LoggerService,
    private authStateService: AuthStateService,
    private callbackService: CallbackService,
    private refreshSessionService: RefreshSessionService,
    private periodicallyTokenCheckService: PeriodicallyTokenCheckService,
    private popupService: PopUpService,
    private autoLoginService: AutoLoginService,
    private storagePersistenceService: StoragePersistenceService
  ) {}

  checkAuth(configuration: OpenIdConfiguration, allConfigs: OpenIdConfiguration[], url?: string): Observable<LoginResponse> {
    if (this.currentUrlService.currentUrlHasStateParam()) {
      const stateParamFromUrl = this.currentUrlService.getStateParamFromCurrentUrl();
      const config = this.getConfigurationWithUrlState([configuration], stateParamFromUrl);

      if (!config) {
        return throwError(() => new Error(`could not find matching config for state ${stateParamFromUrl}`));
      }

      return this.checkAuthWithConfig(config, allConfigs, url);
    }

    return this.checkAuthWithConfig(configuration, allConfigs, url);
  }

  checkAuthMultiple(allConfigs: OpenIdConfiguration[], url?: string): Observable<LoginResponse[]> {
    if (this.currentUrlService.currentUrlHasStateParam()) {
      const stateParamFromUrl = this.currentUrlService.getStateParamFromCurrentUrl();
      const config = this.getConfigurationWithUrlState(allConfigs, stateParamFromUrl);

      if (!config) {
        return throwError(() => new Error(`could not find matching config for state ${stateParamFromUrl}`));
      }

      return this.composeMultipleLoginResults(allConfigs, config, url);
    }

    const allChecks$ = allConfigs.map((x) => this.checkAuthWithConfig(x, allConfigs, url));

    return forkJoin(allChecks$);
  }

  checkAuthIncludingServer(configuration: OpenIdConfiguration, allConfigs: OpenIdConfiguration[]): Observable<LoginResponse> {
    return this.checkAuthWithConfig(configuration, allConfigs).pipe(
      switchMap((loginResponse) => {
        const { isAuthenticated } = loginResponse;
        const { configId } = configuration;

        if (isAuthenticated) {
          return of(loginResponse);
        }

        return this.refreshSessionService.forceRefreshSession(configuration).pipe(
          tap((loginResponseAfterRefreshSession) => {
            if (loginResponseAfterRefreshSession?.isAuthenticated) {
              this.startCheckSessionAndValidation(configId);
            }
          })
        );
      })
    );
  }

  private checkAuthWithConfig(config: OpenIdConfiguration, allConfigs: OpenIdConfiguration[], url?: string): Observable<LoginResponse> {
    const { configId, authority } = config;

    if (!config) {
      const errorMessage = 'Please provide at least one configuration before setting up the module';
      this.loggerService.logError(config, errorMessage);

      return of({ isAuthenticated: false, errorMessage, userData: null, idToken: null, accessToken: null, configId });
    }

    const currentUrl = url || this.currentUrlService.getCurrentUrl();

    this.loggerService.logDebug(config, `Working with config '${configId}' using ${authority}`);

    if (this.popupService.isCurrentlyInPopup()) {
      this.popupService.sendMessageToMainWindow(currentUrl);

      return of(null);
    }

    const isCallback = this.callbackService.isCallback(currentUrl);

    this.loggerService.logDebug(config, 'currentUrl to check auth with: ', currentUrl);

    const callback$ = isCallback ? this.callbackService.handleCallbackAndFireEvents(currentUrl, config, allConfigs) : of(null);

    return callback$.pipe(
      map(() => {
        const isAuthenticated = this.authStateService.areAuthStorageTokensValid(config);
        if (isAuthenticated) {
          this.startCheckSessionAndValidation(configId);

          if (!isCallback) {
            this.authStateService.setAuthenticatedAndFireEvent(allConfigs);
            this.userService.publishUserDataIfExists(config, allConfigs);
          }
        }

        this.loggerService.logDebug(config, 'checkAuth completed - firing events now. isAuthenticated: ' + isAuthenticated);

        return {
          isAuthenticated,
          userData: this.userService.getUserDataFromStore(config),
          accessToken: this.authStateService.getAccessToken(config),
          idToken: this.authStateService.getIdToken(config),
          configId,
        };
      }),
      tap(({ isAuthenticated }) => {
        if (isAuthenticated) {
          this.autoLoginService.checkSavedRedirectRouteAndNavigate(config);
        }
      }),
      catchError(({ message }) => {
        this.loggerService.logError(config, message);

        return of({ isAuthenticated: false, errorMessage: message, userData: null, idToken: null, accessToken: null, configId });
      })
    );
  }

  private startCheckSessionAndValidation(config: OpenIdConfiguration, allConfigs: OpenIdConfiguration[]): void {
    if (this.checkSessionService.isCheckSessionConfigured(config)) {
      this.checkSessionService.start(config);
    }

    this.periodicallyTokenCheckService.startTokenValidationPeriodically(allConfigs, config);

    if (this.silentRenewService.isSilentRenewConfigured(configId)) {
      this.silentRenewService.getOrCreateIframe(configId);
    }
  }

  private getConfigurationWithUrlState(configurations: OpenIdConfiguration[], stateFromUrl: string): OpenIdConfiguration {
    for (const config of configurations) {
      const storedState = this.storagePersistenceService.read('authStateControl', config.configId);

      if (storedState === stateFromUrl) {
        return config;
      }
    }

    return null;
  }

  private composeMultipleLoginResults(
    configurations: OpenIdConfiguration[],
    activeConfig: OpenIdConfiguration,
    url?: string
  ): Observable<LoginResponse[]> {
    const allOtherConfigs = configurations.filter((x) => x.configId !== activeConfig.configId);

    const currentConfigResult = this.checkAuthWithConfig(activeConfig, url);

    const allOtherConfigResults = allOtherConfigs.map((config) => {
      const { redirectUrl } = config;

      return this.checkAuthWithConfig(config, redirectUrl);
    });

    return forkJoin([currentConfigResult, ...allOtherConfigResults]);
  }
}
