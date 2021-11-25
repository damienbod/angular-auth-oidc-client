import { Injectable } from '@angular/core';
import { from, Observable, of, throwError } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';
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

  loginWithPopUpStandard(configId: string, authOptions?: AuthOptions, popupOptions?: PopupOptions): Observable<LoginResponse> {
    if (!this.responseTypeValidationService.hasConfigValidResponseType(configId)) {
      const errorMessage = 'Invalid response type!';
      this.loggerService.logError(configId, errorMessage);

      return throwError(() => new Error(errorMessage));
    }

    const { authWellknownEndpointUrl } = this.configurationProvider.getOpenIDConfiguration(configId);

    if (!authWellknownEndpointUrl) {
      const errorMessage = 'no authWellknownEndpoint given!';
      this.loggerService.logError(configId, errorMessage);

      return throwError(() => new Error(errorMessage));
    }

    this.loggerService.logDebug(configId, 'BEGIN Authorize OIDC Flow with popup, no auth data');

    return this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpointUrl, configId).pipe(
      switchMap(() => {
        const { customParams } = authOptions || {};

        return this.urlService.getAuthorizeUrl(configId, customParams);
      }),
      tap((authUrl: string) => this.popupService.openPopUp(authUrl, popupOptions)),
      switchMap(() => {
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

            return this.checkAuthService.checkAuth(configId, receivedUrl);
          })
        );
      })
    );
  }
}
