import { TestBed } from '@angular/core/testing';
import { DataService } from '../api/data.service';
import { DataServiceMock } from '../api/data.service-mock';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthStateServiceMock } from '../authState/auth-state.service-mock';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/config.provider-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { StoragePersistanceService } from '../storage/storage-persistance.service';
import { StoragePersistanceServiceMock } from '../storage/storage-persistance.service-mock';
import { UserService } from '../userData/user-service';
import { UserServiceMock } from '../userData/user-service-mock';
import { UrlService } from '../utils/url/url.service';
import { UrlServiceMock } from '../utils/url/url.service-mock';
import { StateValidationService } from '../validation/state-validation.service';
import { StateValidationServiceMock } from '../validation/state-validation.service-mock';
import { TokenValidationService } from '../validation/token-validation.service';
import { TokenValidationServiceMock } from '../validation/token-validation.service-mock';
import { FlowsDataService } from './flows-data.service';
import { FlowsDataServiceMock } from './flows-data.service-mock';
import { FlowsService } from './flows.service';
import { SigninKeyDataService } from './signin-key-data.service';
import { SigninKeyDataServiceMock } from './signin-key-data.service-mock';

describe('Flows Service', () => {
    let service: FlowsService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                FlowsService,
                { provide: UrlService, useClass: UrlServiceMock },
                { provide: FlowsDataService, useClass: FlowsDataServiceMock },
                { provide: LoggerService, useClass: LoggerServiceMock },
                { provide: TokenValidationService, useClass: TokenValidationServiceMock },
                { provide: StoragePersistanceService, useClass: StoragePersistanceServiceMock },
                { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
                { provide: AuthStateService, useClass: AuthStateServiceMock },
                { provide: StateValidationService, useClass: StateValidationServiceMock },
                { provide: UserService, useClass: UserServiceMock },
                { provide: DataService, useClass: DataServiceMock },
                { provide: SigninKeyDataService, useClass: SigninKeyDataServiceMock },
            ],
        });
    });

    beforeEach(() => {
        service = TestBed.inject(FlowsService);
    });

    it('should create', () => {
        expect(service).toBeTruthy();
    });
});
