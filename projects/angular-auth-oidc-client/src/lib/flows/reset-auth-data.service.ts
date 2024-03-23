import { Injectable, inject } from '@angular/core';
import { AuthStateService } from '../auth-state/auth-state.service';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/logger.service';
import { UserService } from '../user-data/user.service';
import { FlowsDataService } from './flows-data.service';

@Injectable({ providedIn: 'root' })
export class ResetAuthDataService {
  private readonly loggerService = inject(LoggerService);

  private readonly userService = inject(UserService);

  private readonly flowsDataService = inject(FlowsDataService);

  private readonly authStateService = inject(AuthStateService);

  resetAuthorizationData(
    currentConfiguration: OpenIdConfiguration | null,
    allConfigs: OpenIdConfiguration[]
  ): void {
    if (!currentConfiguration) {
      return;
    }

    this.userService.resetUserDataInStore(currentConfiguration, allConfigs);
    this.flowsDataService.resetStorageFlowData(currentConfiguration);
    this.authStateService.setUnauthenticatedAndFireEvent(
      currentConfiguration,
      allConfigs
    );

    this.loggerService.logDebug(
      currentConfiguration,
      'Local Login information cleaned up and event fired'
    );
  }
}
