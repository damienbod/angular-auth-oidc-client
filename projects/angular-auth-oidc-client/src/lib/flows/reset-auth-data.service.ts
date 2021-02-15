import { Injectable } from '@angular/core';
import { AuthStateService } from '../authState/auth-state.service';
import { ConfigurationProvider } from '../config/config.provider';
import { UserService } from '../userData/user-service';
import { FlowsDataService } from './flows-data.service';

@Injectable()
export class ResetAuthDataService {
  constructor(
    private readonly configurationProvider: ConfigurationProvider,
    private readonly authStateService: AuthStateService,
    private readonly flowsDataService: FlowsDataService,
    private readonly userService: UserService
  ) {}

  resetAuthorizationData(): void {
    if (this.configurationProvider.openIDConfiguration.autoUserinfo) {
      // Clear user data. Fixes #97.
      this.userService.resetUserDataInStore();
    }

    this.flowsDataService.resetStorageFlowData();
    this.authStateService.setUnauthorizedAndFireEvent();
  }
}
