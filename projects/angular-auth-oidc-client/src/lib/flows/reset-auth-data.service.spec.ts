import { TestBed } from '@angular/core/testing';
import { AuthStateService } from '../auth-state/auth-state.service';
import { AuthStateServiceMock } from '../auth-state/auth-state.service-mock';
import { UserServiceMock } from '../user-data/user-service-mock';
import { UserService } from '../user-data/user.service';
import { FlowsDataService } from './flows-data.service';
import { FlowsDataServiceMock } from './flows-data.service-mock';
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
        { provide: FlowsDataService, useClass: FlowsDataServiceMock },
        { provide: UserService, useClass: UserServiceMock },
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
      service.resetAuthorizationData('configId');
      expect(resetUserDataInStoreSpy).toHaveBeenCalled();
    });

    it('calls correct methods', () => {
      const resetStorageFlowDataSpy = spyOn(flowsDataService, 'resetStorageFlowData');
      const setUnauthorizedAndFireEventSpy = spyOn(authStateService, 'setUnauthenticatedAndFireEvent');

      service.resetAuthorizationData('configId');

      expect(resetStorageFlowDataSpy).toHaveBeenCalled();
      expect(setUnauthorizedAndFireEventSpy).toHaveBeenCalled();
    });
  });
});
