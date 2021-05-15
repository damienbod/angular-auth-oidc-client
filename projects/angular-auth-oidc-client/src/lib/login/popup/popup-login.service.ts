import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { AuthOptions } from '../../auth-options';
import { CheckAuthService } from '../../check-auth.service';
import { AuthWellKnownService } from '../../config/auth-well-known/auth-well-known.service';
import { ConfigurationProvider } from '../../config/provider/config.provider';
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
    private configurationProvider: ConfigurationProvider,
    private authWellKnownService: AuthWellKnownService,
    private popupService: PopUpService,
    private checkAuthService: CheckAuthService
  ) {}

  loginWithPopUpStandard(
    configId: string,
    authOptions?: AuthOptions,
    popupOptions?: PopupOptions
  ): Observable<LoginResponse | LoginResponse[]> {
    if (!this.responseTypeValidationService.hasConfigValidResponseType(configId)) {
      const errorMessage = 'Invalid response type!';
      this.loggerService.logError(configId, errorMessage);
      return throwError(errorMessage);
    }

    const { authWellknownEndpointUrl } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (!authWellknownEndpointUrl) {
      const errorMessage = 'no authWellknownEndpoint given!';
      this.loggerService.logError(configId, errorMessage);
      return throwError(errorMessage);
    }

    this.loggerService.logDebug(configId, 'BEGIN Authorize OIDC Flow with popup, no auth data');

    return this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpointUrl, configId).pipe(
      switchMap(() => {
        const { customParams } = authOptions || {};

        const authUrl = this.urlService.getAuthorizeUrl(configId, customParams);

        this.popupService.openPopUp(authUrl, popupOptions);

        return this.popupService.result$.pipe(
          take(1),
          switchMap((result: PopupResultReceivedUrl) => {
            const { userClosed, receivedUrl } = result;

            if (userClosed) {
              return of({ isAuthenticated: false, errorMessage: 'User closed popup' });
            }

            return this.checkAuthService.checkAuth(receivedUrl);
          })
        );
      })
    );
  }
}
