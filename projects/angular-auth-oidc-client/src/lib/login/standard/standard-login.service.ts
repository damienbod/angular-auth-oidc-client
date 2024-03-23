import { Injectable, inject } from '@angular/core';
import { AuthOptions } from '../../auth-options';
import { AuthWellKnownService } from '../../config/auth-well-known/auth-well-known.service';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { FlowsDataService } from '../../flows/flows-data.service';
import { LoggerService } from '../../logging/logger.service';
import { RedirectService } from '../../utils/redirect/redirect.service';
import { UrlService } from '../../utils/url/url.service';
import { ResponseTypeValidationService } from '../response-type-validation/response-type-validation.service';

@Injectable({ providedIn: 'root' })
export class StandardLoginService {
  private readonly loggerService = inject(LoggerService);

  private readonly responseTypeValidationService = inject(
    ResponseTypeValidationService
  );

  private readonly urlService = inject(UrlService);

  private readonly redirectService = inject(RedirectService);

  private readonly authWellKnownService = inject(AuthWellKnownService);

  private readonly flowsDataService = inject(FlowsDataService);

  loginStandard(
    configuration: OpenIdConfiguration,
    authOptions?: AuthOptions
  ): void {
    if (
      !this.responseTypeValidationService.hasConfigValidResponseType(
        configuration
      )
    ) {
      this.loggerService.logError(configuration, 'Invalid response type!');

      return;
    }

    this.loggerService.logDebug(
      configuration,
      'BEGIN Authorize OIDC Flow, no auth data'
    );
    this.flowsDataService.setCodeFlowInProgress(configuration);

    this.authWellKnownService
      .queryAndStoreAuthWellKnownEndPoints(configuration)
      .subscribe(() => {
        const { urlHandler } = authOptions || {};

        this.flowsDataService.resetSilentRenewRunning(configuration);

        this.urlService
          .getAuthorizeUrl(configuration, authOptions)
          .subscribe((url) => {
            if (!url) {
              this.loggerService.logError(
                configuration,
                'Could not create URL',
                url
              );

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
