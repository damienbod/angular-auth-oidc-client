import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CheckAuthService } from '../check-auth.service';
import { AuthWellKnownService } from '../config/auth-well-known.service';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { RedirectService } from '../utils/redirect/redirect.service';
import { UrlService } from '../utils/url/url.service';
import { TokenValidationService } from '../validation/token-validation.service';
import { AuthOptions } from './auth-options';

@Injectable()
export class LoginService {
  modal: Window;

  constructor(
    private loggerService: LoggerService,
    private tokenValidationService: TokenValidationService,
    private urlService: UrlService,
    private redirectService: RedirectService,
    private configurationProvider: ConfigurationProvider,
    private authWellKnownService: AuthWellKnownService,
    private checkAuthService: CheckAuthService
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

    return new Observable((observer) => {
      this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpoint).subscribe(() => {
        const { customParams } = authOptions || {};

        const authUrl = this.urlService.getAuthorizeUrl(customParams);

        if (!authUrl) {
          this.loggerService.logError('Could not create url', authUrl);
          return;
        }

        this.modal = this.createOauthWindow(authUrl);

        const interval = window.setInterval(() => {
          const url = this.modal.location.href;
          const param = this.getParameterByName('code', url);

          if (param) {
            window.clearInterval(interval);

            this.checkAuthService.checkAuth(url).subscribe((isAuthenticated) => {
              if (this.modal) {
                this.modal.close();
              }

              observer.next(isAuthenticated);
              observer.complete();
            });
          }
        }, 100);
      });
    });
  }

  private createOauthWindow(url: string, width = 500, height = 600, left = 0, top = 0) {
    const options = `width=${width},height=${height},left=${left},top=${top}`;
    return window.open(url, '_blank', options);
  }

  private getParameterByName(name: string, url: string) {
    const match = RegExp('[?&]' + name + '=([^&]*)').exec(url);
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  }
}
