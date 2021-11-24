import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { AuthOptions } from '../../auth-options';
import { CheckAuthService } from '../../check-auth.service';
import { AuthWellKnownService } from '../../config/auth-well-known/auth-well-known.service';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { UrlService } from '../../utils/url/url.service';
import { LoginResponse } from '../login-response';
import { PopupOptions } from '../popup/popup-options';
import { PopUpService } from '../popup/popup.service';
import { ResponseTypeValidationService } from '../response-type-validation/response-type-validation.service';
import { PopupResultReceivedUrl } from './popup-result';

@Injectable()
export class PopUpLoginService {
  constructor(
    private loggerService: LoggerService,
    private responseTypeValidationService: ResponseTypeValidationService,
    private urlService: UrlService,
    private authWellKnownService: AuthWellKnownService,
    private popupService: PopUpService,
    private checkAuthService: CheckAuthService
  ) {}

  loginWithPopUpStandard(
    configuration: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    authOptions?: AuthOptions,
    popupOptions?: PopupOptions
  ): Observable<LoginResponse> {
    const { configId } = configuration;

    if (!this.responseTypeValidationService.hasConfigValidResponseType(configuration)) {
      const errorMessage = 'Invalid response type!';
      this.loggerService.logError(configuration, errorMessage);

      return throwError(() => new Error(errorMessage));
    }

    this.loggerService.logDebug(configuration, 'BEGIN Authorize OIDC Flow with popup, no auth data');

    return this.authWellKnownService.queryAndStoreAuthWellKnownEndPoints(configuration).pipe(
      switchMap(() => {
        const { customParams } = authOptions || {};

        const authUrl = this.urlService.getAuthorizeUrl(configuration, customParams);

        this.popupService.openPopUp(authUrl, popupOptions);

        return this.popupService.result$.pipe(
          take(1),
          switchMap((result: PopupResultReceivedUrl) => {
            const { userClosed, receivedUrl } = result;

            if (userClosed) {
              return of({
                isAuthenticated: false,
                errorMessage: 'User closed popup',
                userData: null,
                idToken: null,
                accessToken: null,
                configId,
              });
            }

            return this.checkAuthService.checkAuth(configuration, allConfigs, receivedUrl);
          })
        );
      })
    );
  }
}
