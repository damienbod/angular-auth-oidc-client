import { Injectable } from '@angular/core';
import { AuthStateService } from '../authState/auth-state.service';
import { UserService } from '../userData/user.service';
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
    this.authStateService.setUnauthorizedAndFireEvent(configId);
  }
}
