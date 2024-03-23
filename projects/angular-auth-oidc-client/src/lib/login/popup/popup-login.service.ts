import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';
import { AuthOptions } from '../../auth-options';
import { CheckAuthService } from '../../auth-state/check-auth.service';
import { AuthWellKnownService } from '../../config/auth-well-known/auth-well-known.service';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { UrlService } from '../../utils/url/url.service';
import { LoginResponse } from '../login-response';
import { ResponseTypeValidationService } from '../response-type-validation/response-type-validation.service';
import { PopupOptions } from './popup-options';
import { PopupResult } from './popup-result';
import { PopUpService } from './popup.service';

@Injectable({ providedIn: 'root' })
export class PopUpLoginService {
  private readonly loggerService = inject(LoggerService);

  private readonly responseTypeValidationService = inject(
    ResponseTypeValidationService
  );

  private readonly urlService = inject(UrlService);

  private readonly authWellKnownService = inject(AuthWellKnownService);

  private readonly popupService = inject(PopUpService);

  private readonly checkAuthService = inject(CheckAuthService);

  loginWithPopUpStandard(
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
          this.urlService.getAuthorizeUrl(configuration, authOptions)
        ),
        tap((authUrl) =>
          this.popupService.openPopUp(authUrl, popupOptions, configuration)
        ),
        switchMap(() => {
          return this.popupService.result$.pipe(
            take(1),
            switchMap((result: PopupResult) => {
              const { userClosed, receivedUrl } = result;

              if (userClosed) {
                const response: LoginResponse = {
                  isAuthenticated: false,
                  errorMessage: 'User closed popup',
                  userData: null,
                  idToken: '',
                  accessToken: '',
                  configId,
                };

                return of(response);
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
