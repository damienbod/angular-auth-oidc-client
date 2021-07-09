import { Injectable } from '@angular/core';
import { AuthStateService } from '../auth-state/auth-state.service';
import { UserService } from '../user-data/user.service';
import { FlowsDataService } from './flows-data.service';

@Injectable()
export class ResetAuthDataService {
  constructor(
    private readonly authStateService: AuthStateService,
    private readonly flowsDataService: FlowsDataService,
    private readonly userService: UserService
  ) {}

  resetAuthorizationData(configId: string): void {
    this.userService.resetUserDataInStore(configId);
    this.flowsDataService.resetStorageFlowData(configId);
    this.authStateService.setUnauthenticatedAndFireEvent(configId);
  }
}
