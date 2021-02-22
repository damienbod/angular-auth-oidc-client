import { Injectable } from '@angular/core';
import { map, switchMap } from 'rxjs/operators';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthWellKnownService } from '../config/auth-well-known.service';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { RedirectService } from '../utils/redirect/redirect.service';
import { UrlService } from '../utils/url/url.service';
import { CheckAuthService } from './../check-auth.service';
import { UserService } from './../userData/user-service';
import { AuthOptions } from './auth-options';
import { ParResponse, ParService } from './par.service';
import { PopupOptions } from './popup-options';
import { PopUpService } from './popup.service';
import { ResponseTypeValidationService } from './response-type-validation.service';

@Injectable()
export class LoginService {
  constructor(
    private loggerService: LoggerService,
    private responseTypeValidationService: ResponseTypeValidationService,
    private urlService: UrlService,
    private redirectService: RedirectService,
    private configurationProvider: ConfigurationProvider,
    private authWellKnownService: AuthWellKnownService,
    private popupService: PopUpService,
    private checkAuthService: CheckAuthService,
    private userService: UserService,
    private authStateService: AuthStateService,
    private parService: ParService
  ) {}

  login(authOptions?: AuthOptions) {
    const usePushedAuthorisationRequests = this.configurationProvider.openIDConfiguration.usePushedAuthorisationRequests;

    if (usePushedAuthorisationRequests) {
      return this.loginPar(authOptions);
    } else {
      return this.loginStandard(authOptions);
    }
  }

  loginStandard(authOptions?: AuthOptions) {
    if (!this.responseTypeValidationService.hasConfigValidResponseType()) {
      this.loggerService.logError('Invalid response type!');
      return;
    }

    const authWellknownEndpoint = this.configurationProvider.openIDConfiguration.authWellknownEndpoint;

    if (!authWellknownEndpoint) {
      this.loggerService.logError('no authWellknownEndpoint given!');
      return;
    }

    this.loggerService.logDebug('BEGIN Authorize OIDC Flow, no auth data');

    this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpoint).subscribe(() => {
      const { urlHandler, customParams } = authOptions || {};

      const url = this.urlService.getAuthorizeUrl(customParams);

      if (!url) {
        this.loggerService.logError('Could not create url', url);
        return;
      }

      if (urlHandler) {
        urlHandler(url);
      } else {
        this.redirectService.redirectTo(url);
      }
    });
  }

  loginPar(authOptions?: AuthOptions) {
    if (!this.responseTypeValidationService.hasConfigValidResponseType()) {
      this.loggerService.logError('Invalid response type!');
      return;
    }

    const authWellknownEndpoint = this.configurationProvider.openIDConfiguration.authWellknownEndpoint;

    if (!authWellknownEndpoint) {
      this.loggerService.logError('no authWellknownEndpoint given!');
      return;
    }

    this.loggerService.logDebug('BEGIN Authorize OIDC Flow, no auth data');

    this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpoint).subscribe(() => {
      const { urlHandler, customParams } = authOptions || {};

      this.parService
        .postParRequest(customParams)
        .pipe(
          map((response: ParResponse) => {
            this.loggerService.logDebug('par response: ', response.request_uri);

            const url = this.urlService.getAuthorizeParUrl(response.request_uri);
            this.loggerService.logDebug('par request url: ', url);
            if (!url) {
              this.loggerService.logError('Could not create url', url);
              return;
            }

            if (urlHandler) {
              urlHandler(url);
            } else {
              this.redirectService.redirectTo(url);
            }
            return response;
          })
        )
        .subscribe(() => {
          // get to url from the service and redirect.
        }); // just for test to remove
    });
  }

  loginWithPopUp(authOptions?: AuthOptions, popupOptions?: PopupOptions) {
    const usePushedAuthorisationRequests = this.configurationProvider.openIDConfiguration.usePushedAuthorisationRequests;

    if (usePushedAuthorisationRequests) {
      return this.loginPar(authOptions);
    } else {
      return this.loginWithPopUpStandard(authOptions, popupOptions);
    }
  }

  loginWithPopUpPar(authOptions?: AuthOptions, popupOptions?: PopupOptions) {
    if (!this.responseTypeValidationService.hasConfigValidResponseType()) {
      this.loggerService.logError('Invalid response type!');
      return;
    }

    const authWellknownEndpoint = this.configurationProvider.openIDConfiguration.authWellknownEndpoint;

    if (!authWellknownEndpoint) {
      this.loggerService.logError('no authWellknownEndpoint given!');
      return;
    }

    this.loggerService.logDebug('BEGIN Authorize OIDC Flow with popup, no auth data');

    const { customParams } = authOptions || {};
    return this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpoint).pipe(
      switchMap(() => this.parService.postParRequest(customParams)),
      switchMap((response: ParResponse) => {
        this.loggerService.logDebug('par response: ', response.request_uri);

        const url = this.urlService.getAuthorizeParUrl(response.request_uri);
        this.loggerService.logDebug('par request url: ', url);

        this.popupService.openPopUp(url, popupOptions);

        return this.popupService.receivedUrl$.pipe(
          switchMap((url: string) => this.checkAuthService.checkAuth(url)),
          map((isAuthenticated) => ({
            isAuthenticated,
            userData: this.userService.getUserDataFromStore(),
            accessToken: this.authStateService.getAccessToken(),
          }))
        );
      })
    );
  }

  loginWithPopUpStandard(authOptions?: AuthOptions, popupOptions?: PopupOptions) {
    if (!this.responseTypeValidationService.hasConfigValidResponseType()) {
      this.loggerService.logError('Invalid response type!');
      return;
    }

    const authWellknownEndpoint = this.configurationProvider.openIDConfiguration.authWellknownEndpoint;

    if (!authWellknownEndpoint) {
      this.loggerService.logError('no authWellknownEndpoint given!');
      return;
    }

    this.loggerService.logDebug('BEGIN Authorize OIDC Flow with popup, no auth data');

    return this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpoint).pipe(
      switchMap(() => {
        const { customParams } = authOptions || {};

        const authUrl = this.urlService.getAuthorizeUrl(customParams);

        this.popupService.openPopUp(authUrl, popupOptions);

        return this.popupService.receivedUrl$.pipe(
          switchMap((url: string) => this.checkAuthService.checkAuth(url)),
          map((isAuthenticated) => ({
            isAuthenticated,
            userData: this.userService.getUserDataFromStore(),
            accessToken: this.authStateService.getAccessToken(),
          }))
        );
      })
    );
  }
}
