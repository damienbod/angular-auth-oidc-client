import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthWellKnownService } from '../../config/auth-well-known/auth-well-known.service';
import { AuthWellKnownServiceMock } from '../../config/auth-well-known/auth-well-known.service-mock';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { RedirectService } from '../../utils/redirect/redirect.service';
import { RedirectServiceMock } from '../../utils/redirect/redirect.service-mock';
import { UrlService } from '../../utils/url/url.service';
import { UrlServiceMock } from '../../utils/url/url.service-mock';
import { ResponseTypeValidationService } from '../response-type-validation/response-type-validation.service';
import { ResponseTypeValidationServiceMock } from '../response-type-validation/response-type-validation.service.mock';
import { StandardLoginService } from './standard-login.service';

describe('StandardLoginService', () => {
  let standardLoginService: StandardLoginService;
  let loggerService: LoggerService;
  let responseTypeValidationService: ResponseTypeValidationService;
  let urlService: UrlService;
  let redirectService: RedirectService;
  let authWellKnownService: AuthWellKnownService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        StandardLoginService,
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: ResponseTypeValidationService, useClass: ResponseTypeValidationServiceMock },
        { provide: UrlService, useClass: UrlServiceMock },
        { provide: RedirectService, useClass: RedirectServiceMock },
        { provide: AuthWellKnownService, useClass: AuthWellKnownServiceMock },
      ],
    });
  });

  beforeEach(() => {
    standardLoginService = TestBed.inject(StandardLoginService);
    loggerService = TestBed.inject(LoggerService);
    responseTypeValidationService = TestBed.inject(ResponseTypeValidationService);
    standardLoginService = TestBed.inject(StandardLoginService);
    urlService = TestBed.inject(UrlService);
    redirectService = TestBed.inject(RedirectService);
    authWellKnownService = TestBed.inject(AuthWellKnownService);
  });

  it('should create', () => {
    expect(standardLoginService).toBeTruthy();
  });

  describe('login', () => {
    it(
      'does nothing if it has an invalid response type',
      waitForAsync(() => {
        spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(false);
        const loggerSpy = spyOn(loggerService, 'logError');

        const result = standardLoginService.loginStandard({ configId: 'configId1' });

        expect(result).toBeUndefined();
        expect(loggerSpy).toHaveBeenCalled();
      })
    );

    it(
      'does nothing if no well known endpoint is given',
      waitForAsync(() => {
        const config = { responseType: 'stubValue' };
        const spy = spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);

        const result = standardLoginService.loginStandard(config);

        expect(result).toBeUndefined();
        expect(spy).toHaveBeenCalled();
      })
    );

    it(
      'calls urlService.getAuthorizeUrl() if everything fits',
      waitForAsync(() => {
        const config = {
          authWellknownEndpointUrl: 'authWellknownEndpoint',
          responseType: 'stubValue',
        };
        spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'queryAndStoreAuthWellKnownEndPoints').and.returnValue(of({}));
        spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of('someUrl'));

        const result = standardLoginService.loginStandard(config);

        expect(result).toBeUndefined();
      })
    );

    it('redirects to URL with no URL handler', fakeAsync(() => {
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };
      spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);
      spyOn(authWellKnownService, 'queryAndStoreAuthWellKnownEndPoints').and.returnValue(of({}));
      spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of('someUrl'));
      const redirectSpy = spyOn(redirectService, 'redirectTo').and.callThrough();
      standardLoginService.loginStandard(config);
      tick();
      expect(redirectSpy).toHaveBeenCalledWith('someUrl');
    }));

    it('redirects to URL with URL handler when urlHandler is given', fakeAsync(() => {
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };
      spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);
      spyOn(authWellKnownService, 'queryAndStoreAuthWellKnownEndPoints').and.returnValue(of({}));
      spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of('someUrl'));
      const redirectSpy = spyOn(redirectService, 'redirectTo').and.callFake(() => {});
      const spy = jasmine.createSpy();
      const urlHandler = (url) => {
        spy(url);
      };
      standardLoginService.loginStandard(config, { urlHandler });
      tick();
      expect(spy).toHaveBeenCalledWith('someUrl');
      expect(redirectSpy).not.toHaveBeenCalled();
    }));

    it('calls getAuthorizeUrl with custom params if they are given as parameter', fakeAsync(() => {
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };
      spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);
      spyOn(authWellKnownService, 'queryAndStoreAuthWellKnownEndPoints').and.returnValue(of({}));
      const getAuthorizeUrlSpy = spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of('someUrl'));
      const redirectSpy = spyOn(redirectService, 'redirectTo').and.callFake(() => {});
      standardLoginService.loginStandard(config, { customParams: { to: 'add', as: 'well' } });
      tick();
      expect(redirectSpy).toHaveBeenCalledWith('someUrl');
      expect(getAuthorizeUrlSpy).toHaveBeenCalledWith(config, { to: 'add', as: 'well' });
    }));
  });
});
