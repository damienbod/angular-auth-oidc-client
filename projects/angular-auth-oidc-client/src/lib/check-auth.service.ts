import { Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
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
import { CurrentUrlService } from './utils/url/current-url.service';

@Injectable()
export class CheckAuthService {
  constructor(
    private checkSessionService: CheckSessionService,
    private currentUrlService: CurrentUrlService,
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
    private storagePersistenceService: StoragePersistenceService
  ) {}

  checkAuth(passedConfigId?: string, url?: string): Observable<LoginResponse> {
    if (this.currentUrlService.currentUrlHasStateParam()) {
      const stateParamFromUrl = this.currentUrlService.getStateParamFromCurrentUrl();
      const config = this.getConfigurationWithUrlState(stateParamFromUrl);

      if (!config) {
        return throwError(`could not find matching config for state ${stateParamFromUrl}`);
      }

      return this.checkAuthWithConfig(config, url);
    }

    if (!!passedConfigId) {
      const config = this.configurationProvider.getOpenIDConfiguration(passedConfigId);

      return this.checkAuthWithConfig(config, url);
    }

    const onlyExistingConfig = this.configurationProvider.getOpenIDConfiguration();

    return this.checkAuthWithConfig(onlyExistingConfig, url);
  }

  checkAuthMultiple(passedConfigId?: string, url?: string): Observable<LoginResponse[]> {
    if (this.currentUrlService.currentUrlHasStateParam()) {
      const stateParamFromUrl = this.currentUrlService.getStateParamFromCurrentUrl();
      const config = this.getConfigurationWithUrlState(stateParamFromUrl);

      if (!config) {
        return throwError(`could not find matching config for state ${stateParamFromUrl}`);
      }

      return this.composeMultipleLoginResults(config, url);
    }

    if (!!passedConfigId) {
      const config = this.configurationProvider.getOpenIDConfiguration(passedConfigId);

      if (!config) {
        return throwError(`could not find matching config for id ${passedConfigId}`);
      }

      return this.composeMultipleLoginResults(config, url);
    }

    const allConfigs = this.configurationProvider.getAllConfigurations();
    const allChecks$ = allConfigs.map((x) => this.checkAuthWithConfig(x, url));

    return forkJoin(allChecks$);
  }

  checkAuthIncludingServer(configId: string): Observable<LoginResponse> {
    const config = this.configurationProvider.getOpenIDConfiguration(configId);

    return this.checkAuthWithConfig(config).pipe(
      switchMap((loginResponse) => {
        const { isAuthenticated } = loginResponse;

        if (isAuthenticated) {
          return of(loginResponse);
        }

        return this.refreshSessionService.forceRefreshSession(configId).pipe(
          tap((loginResponseAfterRefreshSession) => {
            if (loginResponseAfterRefreshSession?.isAuthenticated) {
              this.startCheckSessionAndValidation(configId);
            }
          })
        );
      })
    );
  }

  private checkAuthWithConfig(config: OpenIdConfiguration, url?: string): Observable<LoginResponse> {
    const { configId, authority } = config;

    if (!this.configurationProvider.hasAsLeastOneConfig()) {
      const errorMessage = 'Please provide at least one configuration before setting up the module';
      this.loggerService.logError(configId, errorMessage);

      return of({ isAuthenticated: false, errorMessage, userData: null, idToken: null, accessToken: null, configId });
    }

    const currentUrl = url || this.currentUrlService.getCurrentUrl();

    this.loggerService.logDebug(configId, `Working with config '${configId}' using ${authority}`);

    if (this.popupService.isCurrentlyInPopup()) {
      this.popupService.sendMessageToMainWindow(currentUrl);

      return of(null);
    }

    const isCallback = this.callbackService.isCallback(currentUrl);

    this.loggerService.logDebug(configId, 'currentUrl to check auth with: ', currentUrl);

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
          idToken: this.authStateService.getIdToken(configId),
          configId,
        };
      }),
      tap(({ isAuthenticated }) => {
        if (isAuthenticated) {
          this.autoLoginService.checkSavedRedirectRouteAndNavigate(configId);
        }
      }),
      catchError((errorMessage) => {
        this.loggerService.logError(configId, errorMessage);

        return of({ isAuthenticated: false, errorMessage, userData: null, idToken: null, accessToken: null, configId });
      })
    );
  }

  private startCheckSessionAndValidation(configId: string): void {
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

  private composeMultipleLoginResults(activeConfig: OpenIdConfiguration, url?: string): Observable<LoginResponse[]> {
    const allOtherConfigs = this.configurationProvider.getAllConfigurations().filter((x) => x.configId !== activeConfig.configId);

    const currentConfigResult = this.checkAuthWithConfig(activeConfig, url);

    const allOtherConfigResults = allOtherConfigs.map((config) => {
      const { redirectUrl } = config;

      return this.checkAuthWithConfig(config, redirectUrl);
    });

    return forkJoin([currentConfigResult, ...allOtherConfigResults]);
  }
}
