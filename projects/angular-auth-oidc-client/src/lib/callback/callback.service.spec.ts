import { HttpClientModule } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthStateServiceMock } from '../authState/auth-state.service-mock';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/config.provider-mock';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsDataServiceMock } from '../flows/flows-data.servoce-mock';
import { FlowsService } from '../flows/flows.service';
import { FlowsServiceMock } from '../flows/flows.service-mock';
import { SilentRenewService } from '../iframe/silent-renew.service';
import { SilentRenewServiceMock } from '../iframe/silent-renew.service-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { UserService } from '../userData/user-service';
import { UserServiceMock } from '../userData/user-service-mock';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { UrlService } from '../utils/url/url.service';
import { UrlServiceMock } from '../utils/url/url.service-mock';
import { CallbackService } from './callback.service';

describe('Callbackservice ', () => {
    let callbackService: CallbackService;
    let loggerService: LoggerService;

    let urlService: UrlService;
    let flowsService: FlowsService;
    let configurationProvider: ConfigurationProvider;
    let flowsDataService: FlowsDataService;
    let silentRenewService: SilentRenewService;
    let userService: UserService;
    let authStateService: AuthStateService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule, RouterTestingModule],
            providers: [
                CallbackService,
                { provide: LoggerService, useClass: LoggerServiceMock },
                { provide: UrlService, useClass: UrlServiceMock },
                { provide: FlowsService, useClass: FlowsServiceMock },
                { provide: SilentRenewService, useClass: SilentRenewServiceMock },
                { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
                { provide: UserService, useClass: UserServiceMock },
                { provide: AuthStateService, useClass: AuthStateServiceMock },
                { provide: FlowsDataService, useClass: FlowsDataServiceMock },
                FlowHelper,
            ],
        });
    });

    beforeEach(() => {
        configurationProvider = TestBed.inject(ConfigurationProvider);
        urlService = TestBed.inject(UrlService);
        userService = TestBed.inject(UserService);
        authStateService = TestBed.inject(AuthStateService);
        silentRenewService = TestBed.inject(SilentRenewService);
        flowsDataService = TestBed.inject(FlowsDataService);
        loggerService = TestBed.inject(LoggerService);
        flowsService = TestBed.inject(FlowsService);
        callbackService = TestBed.inject(CallbackService);
    });

    it('should create', () => {
        expect(callbackService).toBeTruthy();
    });
});
