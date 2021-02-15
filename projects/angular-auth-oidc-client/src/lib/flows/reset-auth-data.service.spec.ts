import { TestBed } from '@angular/core/testing';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthStateServiceMock } from '../authState/auth-state.service-mock';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/config.provider-mock';
import { UserService } from '../userData/user-service';
import { UserServiceMock } from '../userData/user-service-mock';
import { FlowsDataService } from './flows-data.service';
import { FlowsDataServiceMock } from './flows-data.service-mock';
import { ResetAuthDataService } from './reset-auth-data.service';

describe('ResetAuthDataService', () => {
  let service: ResetAuthDataService;
  let userService: UserService;
  let flowsDataService: FlowsDataService;
  let authStateService: AuthStateService;
  let configurationProvider: ConfigurationProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ResetAuthDataService,
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
        { provide: AuthStateService, useClass: AuthStateServiceMock },
        { provide: FlowsDataService, useClass: FlowsDataServiceMock },
        { provide: UserService, useClass: UserServiceMock },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(ResetAuthDataService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    userService = TestBed.inject(UserService);
    flowsDataService = TestBed.inject(FlowsDataService);
    authStateService = TestBed.inject(AuthStateService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('resetAuthorizationData', () => {
    it('calls resetUserDataInStore when autoUserInfo is true', () => {
      spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ autoUserinfo: true });
      const resetUserDataInStoreSpy = spyOn(userService, 'resetUserDataInStore');

      service.resetAuthorizationData();

      expect(resetUserDataInStoreSpy).toHaveBeenCalled();
    });

    it('does not call resetUserDataInStore when autoUserInfo is false', () => {
      spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ autoUserinfo: false });
      const resetUserDataInStoreSpy = spyOn(userService, 'resetUserDataInStore');

      service.resetAuthorizationData();

      expect(resetUserDataInStoreSpy).not.toHaveBeenCalled();
    });

    it('calls correct methods', () => {
      spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ autoUserinfo: false });
      const resetStorageFlowDataSpy = spyOn(flowsDataService, 'resetStorageFlowData');
      const setUnauthorizedAndFireEventSpy = spyOn(authStateService, 'setUnauthorizedAndFireEvent');

      service.resetAuthorizationData();

      expect(resetStorageFlowDataSpy).toHaveBeenCalled();
      expect(setUnauthorizedAndFireEventSpy).toHaveBeenCalled();
    });
  });
});
