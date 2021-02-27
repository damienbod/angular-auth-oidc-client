import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthStateService } from '../../authState/auth-state.service';
import { CheckAuthService } from '../../check-auth.service';
import { AuthWellKnownService } from '../../config/auth-well-known.service';
import { ConfigurationProvider } from '../../config/config.provider';
import { LoggerService } from '../../logging/logger.service';
import { UserService } from '../../userData/user-service';
import { UrlService } from '../../utils/url/url.service';
import { AuthOptions } from '../auth-options';
import { LoginResponse } from '../login-response';
import { PopupOptions } from '../popup/popup-options';
import { PopUpService } from '../popup/popup.service';
import { ResponseTypeValidationService } from '../response-type-validation/response-type-validation.service';

@Injectable()
export class PopUpLoginService {
  constructor(
    private loggerService: LoggerService,
    private responseTypeValidationService: ResponseTypeValidationService,
    private urlService: UrlService,
    private configurationProvider: ConfigurationProvider,
    private authWellKnownService: AuthWellKnownService,
    private popupService: PopUpService,
    private checkAuthService: CheckAuthService,
    private userService: UserService,
    private authStateService: AuthStateService
  ) {}

  loginWithPopUpStandard(authOptions?: AuthOptions, popupOptions?: PopupOptions): Observable<LoginResponse> {
    if (!this.responseTypeValidationService.hasConfigValidResponseType()) {
      const errorMessage = 'Invalid response type!';
      this.loggerService.logError(errorMessage);
      return throwError(errorMessage);
    }

    const authWellknownEndpoint = this.configurationProvider.openIDConfiguration.authWellknownEndpoint;

    if (!authWellknownEndpoint) {
      const errorMessage = 'no authWellknownEndpoint given!';
      this.loggerService.logError(errorMessage);
      return throwError(errorMessage);
    }

    this.loggerService.logDebug('BEGIN Authorize OIDC Flow with popup, no auth data');

    return this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpoint).pipe(
      switchMap(() => {
        const { customParams } = authOptions || {};

        const authUrl = this.urlService.getAuthorizeUrl(customParams);

        this.popupService.openPopUp(authUrl, popupOptions);

        return this.popupService.receivedUrl$.pipe(
          take(1),
          switchMap((url: string) => this.checkAuthService.checkAuth(url)),
          map((isAuthenticated) => ({
            isAuthenticated,
            userData: this.userService.getUserDataFromStore(),
            accessToken: this.authStateService.getAccessToken(),
          }))
        );
      })
    );
  }
}
