
import { inject, Injectable, DOCUMENT } from '@angular/core';
import { Observable, of } from 'rxjs';
import { OpenIdConfiguration } from '../../config/openid-configuration';
import { LoggerService } from '../../logging/logger.service';
import { AuthResult, CallbackContext } from '../callback-context';
import { FlowsDataService } from '../flows-data.service';
import { ResetAuthDataService } from '../reset-auth-data.service';

@Injectable({ providedIn: 'root' })
export class ImplicitFlowCallbackHandlerService {
  private readonly loggerService = inject(LoggerService);
  private readonly resetAuthDataService = inject(ResetAuthDataService);
  private readonly flowsDataService = inject(FlowsDataService);
  private readonly document = inject(DOCUMENT);

  // STEP 1 Code Flow
  // STEP 1 Implicit Flow
  implicitFlowCallback(
    config: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[],
    hash?: string
  ): Observable<CallbackContext> {
    const isRenewProcessData =
      this.flowsDataService.isSilentRenewRunning(config);

    this.loggerService.logDebug(config, 'BEGIN callback, no auth data');
    if (!isRenewProcessData) {
      this.resetAuthDataService.resetAuthorizationData(config, allConfigs);
    }

    hash = hash || this.document.location.hash.substring(1);

    const authResult = hash
      .split('&')
      .reduce((resultData: any, item: string) => {
        const parts = item.split('=');

        resultData[parts.shift() as string] = parts.join('=');

        return resultData;
      }, {} as AuthResult);
    const callbackContext: CallbackContext = {
      code: '',
      refreshToken: '',
      state: '',
      sessionState: null,
      authResult,
      isRenewProcess: isRenewProcessData,
      jwtKeys: null,
      validationResult: null,
      existingIdToken: null,
    };

    return of(callbackContext);
  }
}
