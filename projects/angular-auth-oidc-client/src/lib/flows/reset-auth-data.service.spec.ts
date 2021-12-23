import { TestBed } from '@angular/core/testing';
import { mockClass } from '../../test/auto-mock';
import { AuthStateService } from '../auth-state/auth-state.service';
import { AuthStateServiceMock } from '../auth-state/auth-state.service-mock';
import { UserService } from '../user-data/user.service';
import { FlowsDataService } from './flows-data.service';
import { ResetAuthDataService } from './reset-auth-data.service';

describe('ResetAuthDataService', () => {
  let service: ResetAuthDataService;
  let userService: UserService;
  let flowsDataService: FlowsDataService;
  let authStateService: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ResetAuthDataService,
        { provide: AuthStateService, useClass: AuthStateServiceMock },
        { provide: FlowsDataService, useClass: mockClass(FlowsDataService) },
        { provide: UserService, useClass: mockClass(UserService) },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(ResetAuthDataService);
    userService = TestBed.inject(UserService);
    flowsDataService = TestBed.inject(FlowsDataService);
    authStateService = TestBed.inject(AuthStateService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('resetAuthorizationData', () => {
    it('calls resetUserDataInStore when autoUserInfo is true', () => {
      const resetUserDataInStoreSpy = spyOn(userService, 'resetUserDataInStore');
      const allConfigs = [
        {
          configId: 'configId1',
        },
      ];

      service.resetAuthorizationData(allConfigs[0], allConfigs);
      expect(resetUserDataInStoreSpy).toHaveBeenCalled();
    });

    it('calls correct methods', () => {
      const resetStorageFlowDataSpy = spyOn(flowsDataService, 'resetStorageFlowData');
      const setUnauthorizedAndFireEventSpy = spyOn(authStateService, 'setUnauthenticatedAndFireEvent');
      const allConfigs = [
        {
          configId: 'configId1',
        },
      ];

      service.resetAuthorizationData(allConfigs[0], allConfigs);

      expect(resetStorageFlowDataSpy).toHaveBeenCalled();
      expect(setUnauthorizedAndFireEventSpy).toHaveBeenCalled();
    });
  });
});
