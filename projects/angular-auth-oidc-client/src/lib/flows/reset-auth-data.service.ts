import { Injectable } from '@angular/core';
import { AuthStateService } from '../auth-state/auth-state.service';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { UserService } from '../user-data/user.service';
import { FlowsDataService } from './flows-data.service';

@Injectable()
export class ResetAuthDataService {
  constructor(
    private readonly authStateService: AuthStateService,
    private readonly flowsDataService: FlowsDataService,
    private readonly userService: UserService
  ) {}

  resetAuthorizationData(currentConfiguration: OpenIdConfiguration, allConfigs: OpenIdConfiguration[]): void {
    this.userService.resetUserDataInStore(currentConfiguration, allConfigs);
    this.flowsDataService.resetStorageFlowData(currentConfiguration);
    this.authStateService.setUnauthenticatedAndFireEvent(currentConfiguration, allConfigs);
  }
}
