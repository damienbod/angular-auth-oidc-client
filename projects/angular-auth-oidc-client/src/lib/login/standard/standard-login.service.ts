import { Injectable } from '@angular/core';
import { AuthOptions } from '../../auth-options';
import { ConfigurationService } from '../../config/config.service';
import { LoggerService } from '../../logging/logger.service';
import { RedirectService } from '../../utils/redirect/redirect.service';
import { UrlService } from '../../utils/url/url.service';
import { ResponseTypeValidationService } from '../response-type-validation/response-type-validation.service';
import { OpenIdConfiguration } from './../../config/openid-configuration';

@Injectable()
export class StandardLoginService {
  constructor(
    private loggerService: LoggerService,
    private responseTypeValidationService: ResponseTypeValidationService,
    private urlService: UrlService,
    private redirectService: RedirectService,
    private authWellKnownService: ConfigurationService
  ) {}

  loginStandard(configuration: OpenIdConfiguration, authOptions?: AuthOptions): void {
    const { authWellknownEndpointUrl } = configuration;

    if (!this.responseTypeValidationService.hasConfigValidResponseType(configuration)) {
      this.loggerService.logError(configuration, 'Invalid response type!');

      return;
    }

    if (!authWellknownEndpointUrl) {
      this.loggerService.logError(configuration, 'no authWellknownEndpoint given!');

      return;
    }

    this.loggerService.logDebug(configuration, 'BEGIN Authorize OIDC Flow, no auth data');

    this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpointUrl, configuration).subscribe(() => {
      const { urlHandler, customParams } = authOptions || {};

      const url = this.urlService.getAuthorizeUrl(configuration, customParams);

      if (!url) {
        this.loggerService.logError(configuration, 'Could not create URL', url);

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
