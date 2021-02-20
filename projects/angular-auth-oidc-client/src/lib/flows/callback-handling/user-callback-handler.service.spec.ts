import { TestBed } from '@angular/core/testing';
import { AuthStateService } from '../../authState/auth-state.service';
import { AuthStateServiceMock } from '../../authState/auth-state.service-mock';
import { ConfigurationProvider } from '../../config/config.provider';
import { ConfigurationProviderMock } from '../../config/config.provider-mock';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { UserService } from '../../userData/user-service';
import { UserServiceMock } from '../../userData/user-service-mock';
import { FlowsDataService } from '../flows-data.service';
import { FlowsDataServiceMock } from '../flows-data.service-mock';
import { ResetAuthDataService } from '../reset-auth-data.service';
import { ResetAuthDataServiceMock } from '../reset-auth-data.service-mock';
import { UserCallbackHandlerService } from './user-callback-handler.service';

describe('UserCallbackHandlerService', () => {
  let service: UserCallbackHandlerService;
  // let loggerService: LoggerService;
  // let configurationProvider: ConfigurationProvider;
  // let authStateService: AuthStateService;
  // let flowsDataService: FlowsDataService;
  // let userService: UserService;
  // let resetAuthDataService: ResetAuthDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserCallbackHandlerService,
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
        { provide: AuthStateService, useClass: AuthStateServiceMock },
        { provide: FlowsDataService, useClass: FlowsDataServiceMock },
        { provide: UserService, useClass: UserServiceMock },
        { provide: ResetAuthDataService, useClass: ResetAuthDataServiceMock },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(UserCallbackHandlerService);
    // configurationProvider = TestBed.inject(ConfigurationProvider);
    // flowsDataService = TestBed.inject(FlowsDataService);
    // authStateService = TestBed.inject(AuthStateService);
    // loggerService = TestBed.inject(LoggerService);
    // userService = TestBed.inject(UserService);
    // resetAuthDataService = TestBed.inject(ResetAuthDataService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });
});
