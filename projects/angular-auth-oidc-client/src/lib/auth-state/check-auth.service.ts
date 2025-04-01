import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AutoLoginService } from '../auto-login/auto-login.service';
import { CallbackService } from '../callback/callback.service';
import { PeriodicallyTokenCheckService } from '../callback/periodically-token-check.service';
import { RefreshSessionService } from '../callback/refresh-session.service';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { CheckSessionService } from '../iframe/check-session.service';
import { SilentRenewService } from '../iframe/silent-renew.service';
import { LoggerService } from '../logging/logger.service';
import { LoginResponse } from '../login/login-response';
import { PopUpService } from '../login/popup/popup.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { UserService } from '../user-data/user.service';
import { CurrentUrlService } from '../utils/url/current-url.service';
import { AuthStateService } from './auth-state.service';

@Injectable({ providedIn: 'root' })
export class CheckAuthService {
  private readonly checkSessionService = inject(CheckSessionService);
  private readonly currentUrlService = inject(CurrentUrlService);
  private readonly silentRenewService = inject(SilentRenewService);
  private readonly userService = inject(UserService);
  private readonly loggerService = inject(LoggerService);
  private readonly authStateService = inject(AuthStateService);
  private readonly callbackService = inject(CallbackService);
  private readonly refreshSessionService = inject(RefreshSessionService);
  private readonly periodicallyTokenCheckService = inject(
    PeriodicallyTokenCheckService
  );
  private readonly popupService = inject(PopUpService);
  private readonly autoLoginService = inject(AutoLoginService);
  private readonly storagePersistenceService = inject(
    StoragePersistenceService
  );
  private readonly publicEventsService = inject(PublicEventsService);

  checkAuth(
    configuration: OpenIdConfiguration | null,
    allConfigs: OpenIdConfiguration[],
    url?: string
  ): Observable<LoginResponse> {
    if (!configuration) {
      return throwError(
        () =>
          new Error(
            'Please provide a configuration before setting up the module'
          )
      );
    }

    this.publicEventsService.fireEvent(EventTypes.CheckingAuth);

    const stateParamFromUrl =
      this.currentUrlService.getStateParamFromCurrentUrl(url);
    const config = this.getConfig(configuration, url);

    if (!config) {
      return throwError(
        () =>
          new Error(
            `could not find matching config for state ${stateParamFromUrl}`
          )
      );
    }

    return this.checkAuthWithConfig(configuration, allConfigs, url);
  }

  checkAuthMultiple(
    allConfigs: OpenIdConfiguration[],
    url?: string
  ): Observable<LoginResponse[]> {
    const stateParamFromUrl =
      this.currentUrlService.getStateParamFromCurrentUrl(url);

    if (stateParamFromUrl) {
      const config = this.getConfigurationWithUrlState(
        allConfigs,
        stateParamFromUrl
      );

      if (!config) {
        return throwError(
          () =>
            new Error(
              `could not find matching config for state ${stateParamFromUrl}`
            )
        );
      }

      return this.composeMultipleLoginResults(allConfigs, config, url);
    }

    const configs = allConfigs;
    const allChecks$ = configs.map((x) =>
      this.checkAuthWithConfig(x, configs, url)
    );

    return forkJoin(allChecks$);
  }

  checkAuthIncludingServer(
    configuration: OpenIdConfiguration | null,
    allConfigs: OpenIdConfiguration[]
  ): Observable<LoginResponse> {
    if (!configuration) {
      return throwError(
        () =>
          new Error(
            'Please provide a configuration before setting up the module'
          )
      );
    }

    return this.checkAuthWithConfig(configuration, allConfigs).pipe(
      switchMap((loginResponse) => {
        const { isAuthenticated } = loginResponse;

        if (isAuthenticated) {
          return of(loginResponse);
        }

        return this.refreshSessionService
          .forceRefreshSession(configuration, allConfigs)
          .pipe(
            tap((loginResponseAfterRefreshSession) => {
              if (loginResponseAfterRefreshSession?.isAuthenticated) {
                this.startCheckSessionAndValidation(configuration, allConfigs);
              }
            })
          );
      })
    );
  }

  private getConfig(
    configuration: OpenIdConfiguration,
    url: string | undefined
  ): OpenIdConfiguration | null {
    const stateParamFromUrl =
      this.currentUrlService.getStateParamFromCurrentUrl(url);

    return Boolean(stateParamFromUrl)
      ? this.getConfigurationWithUrlState([configuration], stateParamFromUrl)
      : configuration;
  }

  private checkAuthWithConfig(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    url?: string
  ): Observable<LoginResponse> {
    if (!config) {
      const errorMessage =
        'Please provide at least one configuration before setting up the module';

      this.loggerService.logError(config, errorMessage);

      const result: LoginResponse = {
        isAuthenticated: false,
        errorMessage,
        userData: null,
        idToken: '',
        accessToken: '',
        configId: '',
      };

      return of(result);
    }

    const currentUrl = url || this.currentUrlService.getCurrentUrl();

    if (!currentUrl) {
      const errorMessage = 'No URL found!';

      this.loggerService.logError(config, errorMessage);

      const result: LoginResponse = {
        isAuthenticated: false,
        errorMessage,
        userData: null,
        idToken: '',
        accessToken: '',
        configId: '',
      };

      return of(result);
    }

    const { configId, authority } = config;

    this.loggerService.logDebug(
      config,
      `Working with config '${configId}' using '${authority}'`
    );

    if (this.popupService.isCurrentlyInPopup(config)) {
      this.popupService.sendMessageToMainWindow(currentUrl, config);

      const result: LoginResponse = {
        isAuthenticated: false,
        errorMessage: '',
        userData: null,
        idToken: '',
        accessToken: '',
        configId: '',
      };

      return of(result);
    }

    const isCallback = this.callbackService.isCallback(currentUrl, config);

    this.loggerService.logDebug(
      config,
      `currentUrl to check auth with: '${currentUrl}'`
    );

    const callback$ = isCallback
      ? this.callbackService.handleCallbackAndFireEvents(
          currentUrl,
          config,
          allConfigs
        )
      : of({});

    return callback$.pipe(
      map(() => {
        const isAuthenticated =
          this.authStateService.areAuthStorageTokensValid(config);

        this.loggerService.logDebug(
          config,
          `checkAuth completed. Firing events now. isAuthenticated: ${isAuthenticated}`
        );

        if (isAuthenticated) {
          this.startCheckSessionAndValidation(config, allConfigs);

          if (!isCallback) {
            this.authStateService.setAuthenticatedAndFireEvent(allConfigs);
            this.userService.publishUserDataIfExists(config, allConfigs);
          }
        }
        this.publicEventsService.fireEvent(EventTypes.CheckingAuthFinished);

        const result: LoginResponse = {
          isAuthenticated,
          userData: this.userService.getUserDataFromStore(config),
          accessToken: this.authStateService.getAccessToken(config),
          idToken: this.authStateService.getIdToken(config),
          configId,
        };

        return result;
      }),
      tap(({ isAuthenticated }) => {
        if (isAuthenticated) {
          this.autoLoginService.checkSavedRedirectRouteAndNavigate(config);
        }
      }),
      catchError(({ message }) => {
        this.loggerService.logError(config, message);
        this.publicEventsService.fireEvent(
          EventTypes.CheckingAuthFinishedWithError,
          message
        );

        const result: LoginResponse = {
          isAuthenticated: false,
          errorMessage: message,
          userData: null,
          idToken: '',
          accessToken: '',
          configId,
        };

        return of(result);
      })
    );
  }

  private startCheckSessionAndValidation(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): void {
    if (this.checkSessionService.isCheckSessionConfigured(config)) {
      this.checkSessionService.start(config);
    }

    this.periodicallyTokenCheckService.startTokenValidationPeriodically(
      allConfigs,
      config
    );

    if (this.silentRenewService.isSilentRenewConfigured(config)) {
      this.silentRenewService.getOrCreateIframe(config);
    }
  }

  private getConfigurationWithUrlState(
    configurations: OpenIdConfiguration[],
    stateFromUrl: string | null
  ): OpenIdConfiguration | null {
    if (!stateFromUrl) {
      return null;
    }

    for (const config of configurations) {
      const storedState = this.storagePersistenceService.read(
        'authStateControl',
        config
      );

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
    const allOtherConfigs = configurations.filter(
      (x) => x.configId !== activeConfig.configId
    );
    const currentConfigResult = this.checkAuthWithConfig(
      activeConfig,
      configurations,
      url
    );
    const allOtherConfigResults = allOtherConfigs.map((config) => {
      const { redirectUrl } = config;

      return this.checkAuthWithConfig(config, configurations, redirectUrl);
    });

    return forkJoin([currentConfigResult, ...allOtherConfigResults]);
  }
}
