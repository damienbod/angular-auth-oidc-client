import { Injectable } from '@angular/core';
import { AuthOptions } from '../../auth-options';
import { AuthWellKnownService } from '../../config/auth-well-known/auth-well-known.service';
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
    private authWellKnownService: AuthWellKnownService
  ) {}

  loginStandard(configuration: OpenIdConfiguration, authOptions?: AuthOptions): void {
    const { configId, authWellknownEndpointUrl } = configuration;

    if (!this.responseTypeValidationService.hasConfigValidResponseType(configId)) {
      this.loggerService.logError(configId, 'Invalid response type!');

      return;
    }

    if (!authWellknownEndpointUrl) {
      this.loggerService.logError(configId, 'no authWellknownEndpoint given!');

      return;
    }

    this.loggerService.logDebug(configId, 'BEGIN Authorize OIDC Flow, no auth data');

    this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpointUrl, configId).subscribe(() => {
      const { urlHandler, customParams } = authOptions || {};

      const url = this.urlService.getAuthorizeUrl(configId, customParams);

      if (!url) {
        this.loggerService.logError(configId, 'Could not create URL', url);

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
