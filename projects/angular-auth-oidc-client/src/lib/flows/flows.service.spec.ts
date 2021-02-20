import { HttpHeaders } from '@angular/common/http';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
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
import { CallbackContext } from './callback-context';
import { CodeFlowCallbackHandlerService } from './callback-handling/code-flow-callback-handler.service';
import { CodeFlowCallbackHandlerServiceMock } from './callback-handling/code-flow-callback-handler.service-mock';
import { HistoryJwtKeysCallbackHandlerService } from './callback-handling/history-jwt-keys-callback-handler.service';
import { HistoryJwtKeysCallbackHandlerServiceMock } from './callback-handling/history-jwt-keys-callback-handler.service-mock';
import { ImplicitFlowCallbackHandlerService } from './callback-handling/implicit-flow-callback-handler.service';
import { ImplicitFlowCallbackHandlerServiceMock } from './callback-handling/implicit-flow-callback-handler.service.mock';
import { StateValidationCallbackHandlerService } from './callback-handling/state-validation-callback-handler.service';
import { StateValidationCallbackHandlerServiceMock } from './callback-handling/state-validation-callback-handler.service-mock';
import { UserCallbackHandlerService } from './callback-handling/user-callback-handler.service';
import { UserCallbackHandlerServiceMock } from './callback-handling/user-callback-handler.service-mock';
import { FlowsDataService } from './flows-data.service';
import { FlowsDataServiceMock } from './flows-data.service-mock';
import { FlowsService } from './flows.service';
import { ResetAuthDataService } from './reset-auth-data.service';
import { ResetAuthDataServiceMock } from './reset-auth-data.service-mock';
import { SigninKeyDataService } from './signin-key-data.service';
import { SigninKeyDataServiceMock } from './signin-key-data.service-mock';

describe('Flows Service', () => {
  let service: FlowsService;
  let flowsDataService: FlowsDataService;
  let authStateService: AuthStateService;
  let dataService: DataService;
  let storagePersistanceService: StoragePersistanceService;
  let configurationProvider: ConfigurationProvider;
  let codeFlowCallbackHandlerService: CodeFlowCallbackHandlerService;
  let implicitFlowCallbackHandlerService: ImplicitFlowCallbackHandlerService;
  let historyJwtKeysCallbackHandlerService: HistoryJwtKeysCallbackHandlerService;
  let userCallbackHandlerService: UserCallbackHandlerService;
  let stateValidationCallbackHandlerService: StateValidationCallbackHandlerService;

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
        { provide: CodeFlowCallbackHandlerService, useClass: CodeFlowCallbackHandlerServiceMock },
        { provide: ResetAuthDataService, useClass: ResetAuthDataServiceMock },
        { provide: ImplicitFlowCallbackHandlerService, useClass: ImplicitFlowCallbackHandlerServiceMock },
        { provide: HistoryJwtKeysCallbackHandlerService, useClass: HistoryJwtKeysCallbackHandlerServiceMock },
        { provide: UserCallbackHandlerService, useClass: UserCallbackHandlerServiceMock },
        { provide: StateValidationCallbackHandlerService, useClass: StateValidationCallbackHandlerServiceMock },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(FlowsService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    flowsDataService = TestBed.inject(FlowsDataService);
    authStateService = TestBed.inject(AuthStateService);
    dataService = TestBed.inject(DataService);
    storagePersistanceService = TestBed.inject(StoragePersistanceService);
    codeFlowCallbackHandlerService = TestBed.inject(CodeFlowCallbackHandlerService);
    implicitFlowCallbackHandlerService = TestBed.inject(ImplicitFlowCallbackHandlerService);
    historyJwtKeysCallbackHandlerService = TestBed.inject(HistoryJwtKeysCallbackHandlerService);
    userCallbackHandlerService = TestBed.inject(UserCallbackHandlerService);
    stateValidationCallbackHandlerService = TestBed.inject(StateValidationCallbackHandlerService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('processCodeFlowCallback', () => {
    it(
      'calls all methods correctly',
      waitForAsync(() => {
        const codeFlowCallbackSpy = spyOn(codeFlowCallbackHandlerService, 'codeFlowCallback').and.returnValue(of(null));
        const codeFlowCodeRequestSpy = spyOn(codeFlowCallbackHandlerService, 'codeFlowCodeRequest').and.returnValue(of(null));
        const callbackHistoryAndResetJwtKeysSpy = spyOn(
          historyJwtKeysCallbackHandlerService,
          'callbackHistoryAndResetJwtKeys'
        ).and.returnValue(of(null));
        const callbackStateValidationSpy = spyOn(stateValidationCallbackHandlerService, 'callbackStateValidation').and.returnValue(
          of(null)
        );
        const callbackUserSpy = spyOn(userCallbackHandlerService, 'callbackUser').and.returnValue(of(null));

        service.processCodeFlowCallback('some-url').subscribe((value) => {
          expect(value).toBeNull();
          expect(codeFlowCallbackSpy).toHaveBeenCalledOnceWith('some-url');
          expect(codeFlowCodeRequestSpy).toHaveBeenCalledTimes(1);
          expect(callbackHistoryAndResetJwtKeysSpy).toHaveBeenCalledTimes(1);
          expect(callbackStateValidationSpy).toHaveBeenCalledTimes(1);
          expect(callbackUserSpy).toHaveBeenCalledTimes(1);
        });
      })
    );
  });

  describe('processSilentRenewCodeFlowCallback', () => {
    it(
      'calls all methods correctly',
      waitForAsync(() => {
        const codeFlowCodeRequestSpy = spyOn(codeFlowCallbackHandlerService, 'codeFlowCodeRequest').and.returnValue(of(null));
        const callbackHistoryAndResetJwtKeysSpy = spyOn(
          historyJwtKeysCallbackHandlerService,
          'callbackHistoryAndResetJwtKeys'
        ).and.returnValue(of(null));
        const callbackStateValidationSpy = spyOn(stateValidationCallbackHandlerService, 'callbackStateValidation').and.returnValue(
          of(null)
        );
        const callbackUserSpy = spyOn(userCallbackHandlerService, 'callbackUser').and.returnValue(of(null));

        service.processSilentRenewCodeFlowCallback({} as CallbackContext).subscribe((value) => {
          expect(value).toBeNull();
          expect(codeFlowCodeRequestSpy).toHaveBeenCalled();
          expect(callbackHistoryAndResetJwtKeysSpy).toHaveBeenCalled();
          expect(callbackStateValidationSpy).toHaveBeenCalled();
          expect(callbackUserSpy).toHaveBeenCalled();
        });
      })
    );
  });

  describe('processImplicitFlowCallback', () => {
    it(
      'calls all methods correctly',
      waitForAsync(() => {
        const implicitFlowCallbackSpy = spyOn(implicitFlowCallbackHandlerService, 'implicitFlowCallback').and.returnValue(of(null));
        const callbackHistoryAndResetJwtKeysSpy = spyOn(
          historyJwtKeysCallbackHandlerService,
          'callbackHistoryAndResetJwtKeys'
        ).and.returnValue(of(null));
        const callbackStateValidationSpy = spyOn(stateValidationCallbackHandlerService, 'callbackStateValidation').and.returnValue(
          of(null)
        );
        const callbackUserSpy = spyOn(userCallbackHandlerService, 'callbackUser').and.returnValue(of(null));

        (service as any).processImplicitFlowCallback('any-hash').subscribe((value) => {
          expect(value).toBeNull();
          expect(implicitFlowCallbackSpy).toHaveBeenCalled();
          expect(callbackHistoryAndResetJwtKeysSpy).toHaveBeenCalled();
          expect(callbackStateValidationSpy).toHaveBeenCalled();
          expect(callbackUserSpy).toHaveBeenCalled();
        });
      })
    );
  });

  describe('processRefreshToken', () => {
    it(
      'calls all methods correctly',
      waitForAsync(() => {
        const refreshSessionWithRefreshTokensSpy = spyOn(service as any, 'refreshSessionWithRefreshTokens').and.returnValue(of({}));
        const refreshTokensRequestTokensSpy = spyOn(service as any, 'refreshTokensRequestTokens').and.returnValue(of({}));
        const callbackHistoryAndResetJwtKeysSpy = spyOn(
          historyJwtKeysCallbackHandlerService,
          'callbackHistoryAndResetJwtKeys'
        ).and.returnValue(of(null));
        const callbackStateValidationSpy = spyOn(stateValidationCallbackHandlerService, 'callbackStateValidation').and.returnValue(
          of(null)
        );
        const callbackUserSpy = spyOn(userCallbackHandlerService, 'callbackUser').and.returnValue(of(null));

        (service as any).processRefreshToken().subscribe((value) => {
          expect(value).toBeNull();
          expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalled();
          expect(refreshTokensRequestTokensSpy).toHaveBeenCalled();
          expect(callbackHistoryAndResetJwtKeysSpy).toHaveBeenCalled();
          expect(callbackStateValidationSpy).toHaveBeenCalled();
          expect(callbackUserSpy).toHaveBeenCalled();
        });
      })
    );
  });

  describe('refreshSessionWithRefreshTokens', () => {
    it(
      'returns callbackContext if all params are good',
      waitForAsync(() => {
        spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue('state-data');
        spyOn(authStateService, 'getRefreshToken').and.returnValue('henlo-furiend');
        spyOn(authStateService, 'getIdToken').and.returnValue('henlo-legger');

        const expectedCallbackContext = {
          code: null,
          refreshToken: 'henlo-furiend',
          state: 'state-data',
          sessionState: null,
          authResult: null,
          isRenewProcess: true,
          jwtKeys: null,
          validationResult: null,
          existingIdToken: 'henlo-legger',
        };
        (service as any).refreshSessionWithRefreshTokens().subscribe((callbackContext) => {
          expect(callbackContext).toEqual(expectedCallbackContext);
        });
      })
    );

    it(
      'throws error if no refresh token is given',
      waitForAsync(() => {
        spyOn(flowsDataService, 'getExistingOrCreateAuthStateControl').and.returnValue('state-data');
        spyOn(authStateService, 'getRefreshToken').and.returnValue(null);
        spyOn(authStateService, 'getIdToken').and.returnValue('henlo-legger');

        (service as any).refreshSessionWithRefreshTokens().subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );
  });

  describe('refreshTokensRequestTokens', () => {
    it(
      'throws error if no tokenEndpoint is given',
      waitForAsync(() => {
        (service as any).refreshTokensRequestTokens({} as CallbackContext).subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      'calls dataservice if all params are good',
      waitForAsync(() => {
        const postSpy = spyOn(dataService, 'post').and.returnValue(of({}));
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

        (service as any).refreshTokensRequestTokens({} as CallbackContext).subscribe((callbackContext) => {
          expect(postSpy).toHaveBeenCalledWith('tokenEndpoint', '', jasmine.any(HttpHeaders));
          const httpHeaders = postSpy.calls.mostRecent().args[2] as HttpHeaders;
          expect(httpHeaders.has('Content-Type')).toBeTrue();
          expect(httpHeaders.get('Content-Type')).toBe('application/x-www-form-urlencoded');
        });
      })
    );

    it(
      'calls dataservice with correct headers if all params are good',
      waitForAsync(() => {
        const postSpy = spyOn(dataService, 'post').and.returnValue(of({}));
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });

        (service as any).refreshTokensRequestTokens({} as CallbackContext).subscribe((callbackContext) => {
          const httpHeaders = postSpy.calls.mostRecent().args[2] as HttpHeaders;
          expect(httpHeaders.has('Content-Type')).toBeTrue();
          expect(httpHeaders.get('Content-Type')).toBe('application/x-www-form-urlencoded');
        });
      })
    );

    it(
      'returns error in case of http error',
      waitForAsync(() => {
        spyOn(dataService, 'post').and.returnValue(throwError({}));
        spyOn(storagePersistanceService, 'read').withArgs('authWellKnownEndPoints').and.returnValue({ tokenEndpoint: 'tokenEndpoint' });
        spyOnProperty(configurationProvider, 'openIDConfiguration', 'get').and.returnValue({ stsServer: 'stsServer' });

        (service as any).refreshTokensRequestTokens({} as CallbackContext).subscribe({
          error: (err) => {
            console.log(err);
            expect(err).toBeTruthy();
          },
        });
      })
    );
  });
});
