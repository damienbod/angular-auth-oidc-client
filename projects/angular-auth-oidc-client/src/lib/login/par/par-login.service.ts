import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { AuthOptions } from '../../auth-options';
import { CheckAuthService } from '../../check-auth.service';
import { AuthWellKnownService } from '../../config/auth-well-known/auth-well-known.service';
import { ConfigurationProvider } from '../../config/provider/config.provider';
import { LoggerService } from '../../logging/logger.service';
import { RedirectService } from '../../utils/redirect/redirect.service';
import { UrlService } from '../../utils/url/url.service';
import { LoginResponse } from '../login-response';
import { PopupOptions } from '../popup/popup-options';
import { PopupResultReceivedUrl } from '../popup/popup-result';
import { PopUpService } from '../popup/popup.service';
import { ResponseTypeValidationService } from '../response-type-validation/response-type-validation.service';
import { ParResponse } from './par-response';
import { ParService } from './par.service';

@Injectable()
export class ParLoginService {
  constructor(
    private loggerService: LoggerService,
    private responseTypeValidationService: ResponseTypeValidationService,
    private urlService: UrlService,
    private redirectService: RedirectService,
    private configurationProvider: ConfigurationProvider,
    private authWellKnownService: AuthWellKnownService,
    private popupService: PopUpService,
    private checkAuthService: CheckAuthService,
    private parService: ParService
  ) {}

  loginPar(configId: string, authOptions?: AuthOptions): void {
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

    const { urlHandler, customParams } = authOptions || {};

    this.authWellKnownService
      .getAuthWellKnownEndPoints(authWellknownEndpointUrl, configId)
      .pipe(switchMap(() => this.parService.postParRequest(configId, customParams)))
      .subscribe((response) => {
        this.loggerService.logDebug('par response: ', response);

        const url = this.urlService.getAuthorizeParUrl(response.requestUri, configId);

        this.loggerService.logDebug('par request url: ', url);

        if (!url) {
          this.loggerService.logError(configId, `Could not create url with param ${response.requestUri}: '${url}'`);
          return;
        }

        if (urlHandler) {
          urlHandler(url);
        } else {
          this.redirectService.redirectTo(url);
        }
      });
  }

  loginWithPopUpPar(configId: string, authOptions?: AuthOptions, popupOptions?: PopupOptions): Observable<LoginResponse> {
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

    const { customParams } = authOptions || {};

    return this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpointUrl, configId).pipe(
      switchMap(() => this.parService.postParRequest(configId, customParams)),
      switchMap((response: ParResponse) => {
        this.loggerService.logDebug('par response: ', response);

        const url = this.urlService.getAuthorizeParUrl(response.requestUri, configId);

        this.loggerService.logDebug('par request url: ', url);

        if (!url) {
          const errorMessage = `Could not create url with param ${response.requestUri}: 'url'`;
          this.loggerService.logError(configId, errorMessage);
          return throwError(errorMessage);
        }

        this.popupService.openPopUp(url, popupOptions);

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
