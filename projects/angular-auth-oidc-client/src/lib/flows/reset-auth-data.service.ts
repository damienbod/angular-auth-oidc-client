import { Injectable } from '@angular/core';
import { AuthStateService } from '../auth-state/auth-state.service';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/logger.service';
import { UserService } from '../user-data/user.service';
import { FlowsDataService } from './flows-data.service';

@Injectable({ providedIn: 'root' })
export class ResetAuthDataService {
  constructor(
    private readonly authStateService: AuthStateService,
    private readonly flowsDataService: FlowsDataService,
    private readonly userService: UserService,
    private readonly loggerService: LoggerService
  ) {}

  resetAuthorizationData(
    currentConfiguration: OpenIdConfiguration,
    allConfigs: OpenIdConfiguration[]
  ): void {
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
