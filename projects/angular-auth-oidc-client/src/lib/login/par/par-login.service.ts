import { Injectable } from '@angular/core';
import { map, switchMap } from 'rxjs/operators';
import { AuthStateService } from '../../authState/auth-state.service';
import { CheckAuthService } from '../../check-auth.service';
import { AuthWellKnownService } from '../../config/auth-well-known.service';
import { ConfigurationProvider } from '../../config/config.provider';
import { LoggerService } from '../../logging/logger.service';
import { UserService } from '../../userData/user-service';
import { RedirectService } from '../../utils/redirect/redirect.service';
import { UrlService } from '../../utils/url/url.service';
import { AuthOptions } from '../auth-options';
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

  loginPar(authOptions?: AuthOptions) {
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

    this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpoint).subscribe(() => {
      const { urlHandler, customParams } = authOptions || {};

      this.parService
        .postParRequest(customParams)
        .pipe(
          map((response: ParResponse) => {
            this.loggerService.logDebug('par response: ', response.requestUri);

            const url = this.urlService.getAuthorizeParUrl(response.requestUri);
            this.loggerService.logDebug('par request url: ', url);
            if (!url) {
              this.loggerService.logError('Could not create url', url);
              return;
            }

            if (urlHandler) {
              urlHandler(url);
            } else {
              this.redirectService.redirectTo(url);
            }
            return response;
          })
        )
        .subscribe(() => {
          // get to url from the service and redirect.
        }); // just for test to remove
    });
  }

  loginWithPopUpPar(authOptions?: AuthOptions, popupOptions?: PopupOptions) {
    if (!this.responseTypeValidationService.hasConfigValidResponseType()) {
      this.loggerService.logError('Invalid response type!');
      return;
    }

    const authWellknownEndpoint = this.configurationProvider.openIDConfiguration.authWellknownEndpoint;

    if (!authWellknownEndpoint) {
      this.loggerService.logError('no authWellknownEndpoint given!');
      return;
    }

    this.loggerService.logDebug('BEGIN Authorize OIDC Flow with popup, no auth data');

    const { customParams } = authOptions || {};
    return this.authWellKnownService.getAuthWellKnownEndPoints(authWellknownEndpoint).pipe(
      switchMap(() => this.parService.postParRequest(customParams)),
      switchMap((response: ParResponse) => {
        this.loggerService.logDebug('par response: ', response.requestUri);

        const url = this.urlService.getAuthorizeParUrl(response.requestUri);
        this.loggerService.logDebug('par request url: ', url);

        this.popupService.openPopUp(url, popupOptions);

        return this.popupService.receivedUrl$.pipe(
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
