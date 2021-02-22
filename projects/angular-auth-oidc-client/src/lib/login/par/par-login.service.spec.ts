import { TestBed } from '@angular/core/testing';
import { AuthStateService } from '../../authState/auth-state.service';
import { CheckAuthService } from '../../check-auth.service';
import { CheckAuthServiceMock } from '../../check-auth.service-mock';
import { AuthWellKnownService } from '../../config/auth-well-known.service';
import { AuthWellKnownServiceMock } from '../../config/auth-well-known.service-mock';
import { ConfigurationProvider } from '../../config/config.provider';
import { ConfigurationProviderMock } from '../../config/config.provider-mock';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { UserService } from '../../userData/user-service';
import { UserServiceMock } from '../../userData/user-service-mock';
import { RedirectService } from '../../utils/redirect/redirect.service';
import { UrlService } from '../../utils/url/url.service';
import { UrlServiceMock } from '../../utils/url/url.service-mock';
import { PopUpService } from '../popup/popup.service';
import { PopUpServiceMock } from '../popup/popup.service-mock';
import { ResponseTypeValidationService } from '../response-type-validation/response-type-validation.service';
import { ResponseTypeValidationServiceMock } from '../response-type-validation/response-type-validation.service.mock';
import { AuthStateServiceMock } from './../../authState/auth-state.service-mock';
import { RedirectServiceMock } from './../../utils/redirect/redirect.service-mock';
import { ParLoginService } from './par-login.service';
import { ParService } from './par.service';
import { ParServiceMock } from './par.service-mock';

describe('ParLoginService', () => {
  let service: ParLoginService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ParLoginService,
        {
          provide: LoggerService,
          useClass: LoggerServiceMock,
        },
        {
          provide: ResponseTypeValidationService,
          useClass: ResponseTypeValidationServiceMock,
        },
        {
          provide: UrlService,
          useClass: UrlServiceMock,
        },
        {
          provide: RedirectService,
          useClass: RedirectServiceMock,
        },
        {
          provide: ConfigurationProvider,
          useClass: ConfigurationProviderMock,
        },
        {
          provide: AuthWellKnownService,
          useClass: AuthWellKnownServiceMock,
        },
        {
          provide: PopUpService,
          useClass: PopUpServiceMock,
        },
        {
          provide: CheckAuthService,
          useClass: CheckAuthServiceMock,
        },
        {
          provide: UserService,
          useClass: UserServiceMock,
        },
        {
          provide: AuthStateService,
          useClass: AuthStateServiceMock,
        },
        {
          provide: ParService,
          useClass: ParServiceMock,
        },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(ParLoginService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });
});
