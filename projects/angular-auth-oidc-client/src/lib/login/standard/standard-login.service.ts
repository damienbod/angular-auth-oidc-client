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
    if (!this.responseTypeValidationService.hasConfigValidResponseType(configuration)) {
      this.loggerService.logError(configuration, 'Invalid response type!');

      return;
    }

    this.loggerService.logDebug(configuration, 'BEGIN Authorize OIDC Flow, no auth data');

    this.authWellKnownService.queryAndStoreAuthWellKnownEndPoints(configuration).subscribe(() => {
      const { urlHandler, customParams } = authOptions || {};

      this.urlService.getAuthorizeUrl(configId, customParams).subscribe((url: string) => {
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
    });
  }
}
