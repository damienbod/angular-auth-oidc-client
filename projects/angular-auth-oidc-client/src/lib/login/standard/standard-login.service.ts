import { Injectable } from '@angular/core';
import { AuthOptions } from '../../auth-options';
import { AuthWellKnownService } from '../../config/auth-well-known.service';
import { ConfigurationProvider } from '../../config/config.provider';
import { LoggerService } from '../../logging/logger.service';
import { RedirectService } from '../../utils/redirect/redirect.service';
import { UrlService } from '../../utils/url/url.service';
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

  loginStandard(configId: string, authOptions?: AuthOptions): void {
    if (!this.responseTypeValidationService.hasConfigValidResponseType(configId)) {
      this.loggerService.logError(configId, 'Invalid response type!');
      return;
    }

    const { authWellknownEndpointUrl } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (!authWellknownEndpointUrl) {
      this.loggerService.logError(configId, 'no authWellknownEndpoint given!');
      return;
    }

    this.loggerService.logDebug(configId, 'BEGIN Authorize OIDC Flow, no auth data');

    this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpointUrl, configId).subscribe(() => {
      const { urlHandler, customParams } = authOptions || {};

      const url = this.urlService.getAuthorizeUrl(configId, customParams);

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
