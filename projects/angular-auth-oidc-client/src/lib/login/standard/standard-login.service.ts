import { Injectable } from '@angular/core';
import { AuthWellKnownService } from '../../config/auth-well-known.service';
import { ConfigurationProvider } from '../../config/config.provider';
import { LoggerService } from '../../logging/logger.service';
import { RedirectService } from '../../utils/redirect/redirect.service';
import { UrlService } from '../../utils/url/url.service';
import { AuthOptions } from '../auth-options';
import { ResponseTypeValidationService } from '../response-type-validation/response-type-validation.service';

@Injectable()
export class StandardLoginService {
  constructor(
    private loggerService: LoggerService,
    private responseTypeValidationService: ResponseTypeValidationService,
    private urlService: UrlService,
    private redirectService: RedirectService,
    private configurationProvider: ConfigurationProvider,
    private authWellKnownService: AuthWellKnownService
  ) {}

  loginStandard(authOptions?: AuthOptions): void {
    if (!this.responseTypeValidationService.hasConfigValidResponseType()) {
      this.loggerService.logError('Invalid response type!');
      return;
    }

    const { authWellknownEndpoint } = this.configurationProvider.getOpenIDConfiguration();

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
