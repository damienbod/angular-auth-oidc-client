import { Injectable } from '@angular/core';
import { map, switchMap } from 'rxjs/operators';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthWellKnownService } from '../config/auth-well-known.service';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { PopUpService } from '../popup.service';
import { RedirectService } from '../utils/redirect/redirect.service';
import { UrlService } from '../utils/url/url.service';
import { TokenValidationService } from '../validation/token-validation.service';
import { CheckAuthService } from './../check-auth.service';
import { UserService } from './../userData/user-service';
import { AuthOptions } from './auth-options';

@Injectable()
export class LoginService {
  constructor(
    private loggerService: LoggerService,
    private tokenValidationService: TokenValidationService,
    private urlService: UrlService,
    private redirectService: RedirectService,
    private configurationProvider: ConfigurationProvider,
    private authWellKnownService: AuthWellKnownService,
    private popupService: PopUpService,
    private checkAuthService: CheckAuthService,
    private userService: UserService,
    private authStateService: AuthStateService
  ) {}

  login(authOptions?: AuthOptions) {
    if (!this.tokenValidationService.configValidateResponseType(this.configurationProvider.openIDConfiguration.responseType)) {
      this.loggerService.logError('Invalid response type!');
      return;
    }

    const authWellknownEndpoint = this.configurationProvider.openIDConfiguration?.authWellknownEndpoint;

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

  loginWithPopUp(authOptions?: AuthOptions) {
    if (!this.tokenValidationService.configValidateResponseType(this.configurationProvider.openIDConfiguration.responseType)) {
      this.loggerService.logError('Invalid response type!');
      return;
    }

    const authWellknownEndpoint = this.configurationProvider.openIDConfiguration?.authWellknownEndpoint;

    if (!authWellknownEndpoint) {
      this.loggerService.logError('no authWellknownEndpoint given!');
      return;
    }

    this.loggerService.logDebug('BEGIN Authorize OIDC Flow, no auth data');

    return this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpoint).pipe(
      switchMap(() => {
        const { customParams } = authOptions || {};

        const authUrl = this.urlService.getAuthorizeUrl(customParams);

        this.popupService.openPopUp(authUrl);

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
