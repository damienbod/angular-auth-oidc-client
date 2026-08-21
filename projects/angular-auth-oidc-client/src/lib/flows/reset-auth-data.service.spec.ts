import { TestBed } from '@angular/core/testing';
import { mockProvider } from '../../test/auto-mock';
import { AuthStateService } from '../auth-state/auth-state.service';
import { LoggerService } from '../logging/logger.service';
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
        mockProvider(AuthStateService),
        mockProvider(FlowsDataService),
        mockProvider(UserService),
        mockProvider(LoggerService),
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
    it('does nothing if no current configuration is provided', () => {
      // arrange
      const resetUserDataInStoreSpy = vi
        .spyOn(userService, 'resetUserDataInStore')
        .mockReturnValue(undefined);
      const resetStorageFlowDataSpy = vi
        .spyOn(flowsDataService, 'resetStorageFlowData')
        .mockReturnValue(undefined);
      const setUnauthenticatedAndFireEventSpy = vi
        .spyOn(authStateService, 'setUnauthenticatedAndFireEvent')
        .mockReturnValue(undefined);

      // act
      service.resetAuthorizationData(null, [{ configId: 'configId1' }]);

      // assert
      expect(resetUserDataInStoreSpy).not.toHaveBeenCalled();
      expect(resetStorageFlowDataSpy).not.toHaveBeenCalled();
      expect(setUnauthenticatedAndFireEventSpy).not.toHaveBeenCalled();
    });

    it('calls resetUserDataInStore when autoUserInfo is true', () => {
      const resetUserDataInStoreSpy = vi
        .spyOn(userService, 'resetUserDataInStore')
        .mockReturnValue(undefined);
      const allConfigs = [
        {
          configId: 'configId1',
        },
      ];

      service.resetAuthorizationData(allConfigs[0], allConfigs);
      expect(resetUserDataInStoreSpy).toHaveBeenCalled();
    });

    it('calls correct methods', () => {
      const resetStorageFlowDataSpy = vi
        .spyOn(flowsDataService, 'resetStorageFlowData')
        .mockReturnValue(undefined);
      const setUnauthorizedAndFireEventSpy = vi
        .spyOn(authStateService, 'setUnauthenticatedAndFireEvent')
        .mockReturnValue(undefined);
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
