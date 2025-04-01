import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { AuthOptions } from '../../auth-options';
import { CheckAuthService } from '../../auth-state/check-auth.service';
import { AuthWellKnownService } from '../../config/auth-well-known/auth-well-known.service';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { RedirectService } from '../../utils/redirect/redirect.service';
import { UrlService } from '../../utils/url/url.service';
import { LoginResponse } from '../login-response';
import { PopupOptions } from '../popup/popup-options';
import { PopupResult } from '../popup/popup-result';
import { PopUpService } from '../popup/popup.service';
import { ResponseTypeValidationService } from '../response-type-validation/response-type-validation.service';
import { ParResponse } from './par-response';
import { ParService } from './par.service';

@Injectable({ providedIn: 'root' })
export class ParLoginService {
  private readonly loggerService = inject(LoggerService);
  private readonly responseTypeValidationService = inject(
    ResponseTypeValidationService
  );
  private readonly urlService = inject(UrlService);
  private readonly redirectService = inject(RedirectService);
  private readonly authWellKnownService = inject(AuthWellKnownService);
  private readonly popupService = inject(PopUpService);
  private readonly checkAuthService = inject(CheckAuthService);
  private readonly parService = inject(ParService);

  loginPar(
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

    this.authWellKnownService
      .queryAndStoreAuthWellKnownEndPoints(configuration)
      .pipe(
        switchMap(() =>
          this.parService.postParRequest(configuration, authOptions)
        )
      )
      .subscribe((response) => {
        this.loggerService.logDebug(configuration, 'par response: ', response);

        const url = this.urlService.getAuthorizeParUrl(
          response.requestUri,
          configuration
        );

        this.loggerService.logDebug(configuration, 'par request url: ', url);

        if (!url) {
          this.loggerService.logError(
            configuration,
            `Could not create URL with param ${response.requestUri}: '${url}'`
          );

          return;
        }

        if (authOptions?.urlHandler) {
          authOptions.urlHandler(url);
        } else {
          this.redirectService.redirectTo(url);
        }
      });
  }

  loginWithPopUpPar(
    configuration: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    authOptions?: AuthOptions,
    popupOptions?: PopupOptions
  ): Observable<LoginResponse> {
    const { configId } = configuration;

    if (
      !this.responseTypeValidationService.hasConfigValidResponseType(
        configuration
      )
    ) {
      const errorMessage = 'Invalid response type!';

      this.loggerService.logError(configuration, errorMessage);

      return throwError(() => new Error(errorMessage));
    }

    this.loggerService.logDebug(
      configuration,
      'BEGIN Authorize OIDC Flow with popup, no auth data'
    );

    return this.authWellKnownService
      .queryAndStoreAuthWellKnownEndPoints(configuration)
      .pipe(
        switchMap(() =>
          this.parService.postParRequest(configuration, authOptions)
        ),
        switchMap((response: ParResponse) => {
          this.loggerService.logDebug(
            configuration,
            `par response: ${response}`
          );

          const url = this.urlService.getAuthorizeParUrl(
            response.requestUri,
            configuration
          );

          this.loggerService.logDebug(configuration, 'par request url: ', url);

          if (!url) {
            const errorMessage = `Could not create URL with param ${response.requestUri}: 'url'`;

            this.loggerService.logError(configuration, errorMessage);

            return throwError(() => new Error(errorMessage));
          }

          this.popupService.openPopUp(url, popupOptions, configuration);

          return this.popupService.result$.pipe(
            take(1),
            switchMap((result: PopupResult) => {
              const { userClosed, receivedUrl } = result;

              if (userClosed) {
                return of({
                  isAuthenticated: false,
                  errorMessage: 'User closed popup',
                  userData: null,
                  idToken: '',
                  accessToken: '',
                  configId,
                });
              }

              return this.checkAuthService.checkAuth(
                configuration,
                allConfigs,
                receivedUrl
              );
            })
          );
        })
      );
  }
}
