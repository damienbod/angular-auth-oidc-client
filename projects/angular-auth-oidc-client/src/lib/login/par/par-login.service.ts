import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { AuthStateService } from '../../authState/auth-state.service';
import { CheckAuthService } from '../../check-auth.service';
import { AuthWellKnownService } from '../../config/auth-well-known.service';
import { ConfigurationProvider } from '../../config/config.provider';
import { LoggerService } from '../../logging/logger.service';
import { UserService } from '../../userData/user-service';
import { RedirectService } from '../../utils/redirect/redirect.service';
import { UrlService } from '../../utils/url/url.service';
import { AuthOptions } from '../auth-options';
import { LoginResponse } from '../login-response';
import { PopupOptions } from '../popup/popup-options';
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
    private userService: UserService,
    private authStateService: AuthStateService,
    private parService: ParService
  ) {}

  loginPar(authOptions?: AuthOptions): void {
    if (!this.responseTypeValidationService.hasConfigValidResponseType()) {
      this.loggerService.logError('Invalid response type!');
      return;
    }

    const authWellknownEndpoint = this.configurationProvider.openIDConfiguration.authWellknownEndpoint;

    if (!authWellknownEndpoint) {
      this.loggerService.logError('no authWellknownEndpoint given!');
      return;
    }

    this.loggerService.logDebug('BEGIN Authorize OIDC Flow, no auth data');

    const { urlHandler, customParams } = authOptions || {};

    this.authWellKnownService
      .getAuthWellKnownEndPoints(authWellknownEndpoint)
      .pipe(switchMap(() => this.parService.postParRequest(customParams)))
      .subscribe((response) => {
        this.loggerService.logDebug('par response: ', response);

        const url = this.urlService.getAuthorizeParUrl(response.requestUri);

        this.loggerService.logDebug('par request url: ', url);

        if (!url) {
          this.loggerService.logError(`Could not create url with param ${response.requestUri}: '${url}'`);
          return;
        }

        if (urlHandler) {
          urlHandler(url);
        } else {
          this.redirectService.redirectTo(url);
        }
      });
  }

  loginWithPopUpPar(authOptions?: AuthOptions, popupOptions?: PopupOptions): Observable<LoginResponse> {
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

    const { customParams } = authOptions || {};

    return this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpoint).pipe(
      switchMap(() => this.parService.postParRequest(customParams)),
      switchMap((response: ParResponse) => {
        this.loggerService.logDebug('par response: ', response);

        const url = this.urlService.getAuthorizeParUrl(response.requestUri);

        this.loggerService.logDebug('par request url: ', url);

        if (!url) {
          const errorMessage = `Could not create url with param ${response.requestUri}: 'url'`;
          this.loggerService.logError(errorMessage);
          return throwError(errorMessage);
        }

        this.popupService.openPopUp(url, popupOptions);

        return this.popupService.receivedUrl$.pipe(
          take(1),
          switchMap((receivedUrl: string) => this.checkAuthService.checkAuth(receivedUrl)),
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
