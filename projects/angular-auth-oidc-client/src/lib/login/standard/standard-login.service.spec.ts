import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { mockClass } from '../../../test/auto-mock';
import { AuthWellKnownService } from '../../config/auth-well-known/auth-well-known.service';
import { FlowsDataService } from '../../flows/flows-data.service';
import { LoggerService } from '../../logging/logger.service';
import { RedirectService } from '../../utils/redirect/redirect.service';
import { UrlService } from '../../utils/url/url.service';
import { ResponseTypeValidationService } from '../response-type-validation/response-type-validation.service';
import { StandardLoginService } from './standard-login.service';

describe('StandardLoginService', () => {
  let standardLoginService: StandardLoginService;
  let loggerService: LoggerService;
  let responseTypeValidationService: ResponseTypeValidationService;
  let urlService: UrlService;
  let redirectService: RedirectService;
  let authWellKnownService: AuthWellKnownService;
  let flowsDataService: FlowsDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        StandardLoginService,
        { provide: LoggerService, useClass: mockClass(LoggerService) },
        {
          provide: ResponseTypeValidationService,
          useClass: mockClass(ResponseTypeValidationService),
        },
        { provide: UrlService, useClass: mockClass(UrlService) },
        { provide: RedirectService, useClass: mockClass(RedirectService) },
        {
          provide: AuthWellKnownService,
          useClass: mockClass(AuthWellKnownService),
        },
        { provide: FlowsDataService, useClass: mockClass(FlowsDataService) },
      ],
    });
  });

  beforeEach(() => {
    standardLoginService = TestBed.inject(StandardLoginService);
    loggerService = TestBed.inject(LoggerService);
    responseTypeValidationService = TestBed.inject(
      ResponseTypeValidationService
    );
    standardLoginService = TestBed.inject(StandardLoginService);
    urlService = TestBed.inject(UrlService);
    redirectService = TestBed.inject(RedirectService);
    authWellKnownService = TestBed.inject(AuthWellKnownService);
    flowsDataService = TestBed.inject(FlowsDataService);
  });

  it('should create', () => {
    expect(standardLoginService).toBeTruthy();
  });

  describe('loginStandard', () => {
    it('does nothing if it has an invalid response type', waitForAsync(() => {
      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(false);
      const loggerSpy = spyOn(loggerService, 'logError');

      const result = standardLoginService.loginStandard({
        configId: 'configId1',
      });

      expect(result).toBeUndefined();
      expect(loggerSpy).toHaveBeenCalled();
    }));

    it('calls flowsDataService.setCodeFlowInProgress() if everything fits', waitForAsync(() => {
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);
      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));
      spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of('someUrl'));
      const flowsDataSpy = spyOn(flowsDataService, 'setCodeFlowInProgress');

      const result = standardLoginService.loginStandard(config);

      expect(result).toBeUndefined();
      expect(flowsDataSpy).toHaveBeenCalled();
    }));

    it('calls urlService.getAuthorizeUrl() if everything fits', waitForAsync(() => {
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);
      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));
      spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of('someUrl'));

      const result = standardLoginService.loginStandard(config);

      expect(result).toBeUndefined();
    }));

    it('redirects to URL with no URL handler', fakeAsync(() => {
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);
      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));
      spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of('someUrl'));
      const redirectSpy = spyOn(
        redirectService,
        'redirectTo'
      ).and.callThrough();

      standardLoginService.loginStandard(config);
      tick();
      expect(redirectSpy).toHaveBeenCalledOnceWith('someUrl');
    }));

    it('redirects to URL with URL handler when urlHandler is given', fakeAsync(() => {
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);
      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));
      spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of('someUrl'));
      const redirectSpy = spyOn(redirectService, 'redirectTo').and.callFake(
        () => undefined
      );
      const spy = jasmine.createSpy();
      const urlHandler = (url): void => {
        spy(url);
      };

      standardLoginService.loginStandard(config, { urlHandler });
      tick();
      expect(spy).toHaveBeenCalledOnceWith('someUrl');
      expect(redirectSpy).not.toHaveBeenCalled();
    }));

    it('calls resetSilentRenewRunning', fakeAsync(() => {
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);
      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));
      spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of('someUrl'));
      const flowsDataSpy = spyOn(flowsDataService, 'resetSilentRenewRunning');

      standardLoginService.loginStandard(config, {});
      tick();

      expect(flowsDataSpy).toHaveBeenCalled();
    }));

    it('calls getAuthorizeUrl with custom params if they are given as parameter', fakeAsync(() => {
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);
      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));
      const getAuthorizeUrlSpy = spyOn(
        urlService,
        'getAuthorizeUrl'
      ).and.returnValue(of('someUrl'));
      const redirectSpy = spyOn(redirectService, 'redirectTo').and.callFake(
        () => undefined
      );

      standardLoginService.loginStandard(config, {
        customParams: { to: 'add', as: 'well' },
      });
      tick();
      expect(redirectSpy).toHaveBeenCalledOnceWith('someUrl');
      expect(getAuthorizeUrlSpy).toHaveBeenCalledOnceWith(config, {
        customParams: { to: 'add', as: 'well' },
      });
    }));

    it('does nothing, logs only if getAuthorizeUrl returns falsy', fakeAsync(() => {
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);
      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));
      const loggerSpy = spyOn(loggerService, 'logError');

      spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of(''));
      const redirectSpy = spyOn(redirectService, 'redirectTo').and.callFake(
        () => undefined
      );

      standardLoginService.loginStandard(config);
      tick();
      expect(loggerSpy).toHaveBeenCalledOnceWith(
        config,
        'Could not create URL',
        ''
      );
      expect(redirectSpy).not.toHaveBeenCalled();
    }));
  });
});
