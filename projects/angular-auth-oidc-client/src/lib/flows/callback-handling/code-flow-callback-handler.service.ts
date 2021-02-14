import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { LoggerService } from '../../logging/logger.service';
import { UrlService } from '../../utils/url/url.service';
import { CallbackContext } from '../callback-context';

@Injectable()
export class CodeFlowCallbackHandlerService {
  constructor(private readonly urlService: UrlService, private readonly loggerService: LoggerService) {}

  // STEP 1 Code Flow
  codeFlowCallback(urlToCheck: string): Observable<CallbackContext> {
    const code = this.urlService.getUrlParameter(urlToCheck, 'code');
    const state = this.urlService.getUrlParameter(urlToCheck, 'state');
    const sessionState = this.urlService.getUrlParameter(urlToCheck, 'session_state') || null;

    if (!state) {
      this.loggerService.logDebug('no state in url');
      return throwError('no state in url');
    }

    if (!code) {
      this.loggerService.logDebug('no code in url');
      return throwError('no code in url');
    }

    this.loggerService.logDebug('running validation for callback', urlToCheck);

    const initialCallbackContext = {
      code,
      refreshToken: null,
      state,
      sessionState,
      authResult: null,
      isRenewProcess: false,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };

    return of(initialCallbackContext);
  }
}
