import { Injectable } from '@angular/core';
import { AuthWellKnownService } from '../config/auth-well-known.service';
import { ConfigurationProvider } from '../config/config.provider';
import { LoggerService } from '../logging/logger.service';
import { RedirectService } from '../utils/redirect/redirect.service';
import { UrlService } from '../utils/url/url.service';
import { TokenValidationService } from '../validation/token-validation.service';
import { AuthOptions } from './auth-options';

@Injectable()
export class LoginService {
  constructor(
    private loggerService: LoggerService,
    private tokenValidationService: TokenValidationService,
    private urlService: UrlService,
    private redirectService: RedirectService,
    private configurationProvider: ConfigurationProvider,
    private authWellKnownService: AuthWellKnownService
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
}
