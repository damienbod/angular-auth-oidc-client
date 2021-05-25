import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { CheckAuthService } from '../../check-auth.service';
import { CheckAuthServiceMock } from '../../check-auth.service-mock';
import { AuthWellKnownService } from '../../config/auth-well-known/auth-well-known.service';
import { AuthWellKnownServiceMock } from '../../config/auth-well-known/auth-well-known.service-mock';
import { ConfigurationProvider } from '../../config/provider/config.provider';
import { ConfigurationProviderMock } from '../../config/provider/config.provider-mock';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { RedirectService } from '../../utils/redirect/redirect.service';
import { UrlService } from '../../utils/url/url.service';
import { UrlServiceMock } from '../../utils/url/url.service-mock';
import { PopupResult } from '../popup/popup-result';
import { PopUpService } from '../popup/popup.service';
import { PopUpServiceMock } from '../popup/popup.service-mock';
import { ResponseTypeValidationService } from '../response-type-validation/response-type-validation.service';
import { ResponseTypeValidationServiceMock } from '../response-type-validation/response-type-validation.service.mock';
import { RedirectServiceMock } from './../../utils/redirect/redirect.service-mock';
import { ParLoginService } from './par-login.service';
import { ParResponse } from './par-response';
import { ParService } from './par.service';
import { ParServiceMock } from './par.service-mock';

describe('ParLoginService', () => {
  let service: ParLoginService;
  let responseTypeValidationService: ResponseTypeValidationService;
  let loggerService: LoggerService;
  let configurationProvider: ConfigurationProvider;
  let authWellKnownService: AuthWellKnownService;
  let parService: ParService;
  let urlService: UrlService;
  let redirectService: RedirectService;
  let popupService: PopUpService;
  let checkAuthService: CheckAuthService;

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
          provide: ParService,
          useClass: ParServiceMock,
        },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(ParLoginService);
    loggerService = TestBed.inject(LoggerService);
    responseTypeValidationService = TestBed.inject(ResponseTypeValidationService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    authWellKnownService = TestBed.inject(AuthWellKnownService);
    parService = TestBed.inject(ParService);
    urlService = TestBed.inject(UrlService);
    redirectService = TestBed.inject(RedirectService);
    popupService = TestBed.inject(PopUpService);
    checkAuthService = TestBed.inject(CheckAuthService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('loginPar', () => {
    it(
      'does nothing if it has an invalid response type',
      waitForAsync(() => {
        spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(false);
        const loggerSpy = spyOn(loggerService, 'logError');

        const result = service.loginPar('configId');

        expect(result).toBeUndefined();
        expect(loggerSpy).toHaveBeenCalled();
      })
    );

    it(
      'does nothing if no well known endpoint is given',
      waitForAsync(() => {
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ responseType: 'stubValue' });
        const spy = spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);

        const result = service.loginPar('configId');

        expect(result).toBeUndefined();
        expect(spy).toHaveBeenCalled();
      })
    );

    it(
      'calls parService.postParRequest without custom params when no custom params are passed',
      waitForAsync(() => {
        spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          authWellknownEndpointUrl: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });

        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));

        const spy = spyOn(parService, 'postParRequest').and.returnValue(of({ requestUri: 'requestUri' } as ParResponse));

        const result = service.loginPar('configId');

        expect(result).toBeUndefined();
        expect(spy).toHaveBeenCalled();
      })
    );

    it(
      'calls parService.postParRequest with custom params when custom params are passed',
      waitForAsync(() => {
        spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          authWellknownEndpointUrl: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });

        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));

        const spy = spyOn(parService, 'postParRequest').and.returnValue(of({ requestUri: 'requestUri' } as ParResponse));

        const result = service.loginPar('configId', { customParams: { some: 'thing' } });

        expect(result).toBeUndefined();
        expect(spy).toHaveBeenCalledOnceWith('configId', { some: 'thing' });
      })
    );

    it(
      'returns undefined and logs error when no url could be created',
      waitForAsync(() => {
        spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          authWellknownEndpointUrl: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });

        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));

        spyOn(parService, 'postParRequest').and.returnValue(of({ requestUri: 'requestUri' } as ParResponse));
        spyOn(urlService, 'getAuthorizeParUrl').and.returnValue('');
        const spy = spyOn(loggerService, 'logError');

        const result = service.loginPar('configId');

        expect(result).toBeUndefined();
        expect(spy).toHaveBeenCalledTimes(1);
      })
    );

    it(
      'calls redirect service redirectTo when url could be created',
      waitForAsync(() => {
        spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          authWellknownEndpointUrl: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });

        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));

        spyOn(parService, 'postParRequest').and.returnValue(of({ requestUri: 'requestUri' } as ParResponse));
        spyOn(urlService, 'getAuthorizeParUrl').and.returnValue('some-par-url');
        const spy = spyOn(redirectService, 'redirectTo');

        service.loginPar('configId');

        expect(spy).toHaveBeenCalledOnceWith('some-par-url');
      })
    );

    it(
      'calls urlHandler when url is passed',
      waitForAsync(() => {
        spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          authWellknownEndpointUrl: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });

        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));

        spyOn(parService, 'postParRequest').and.returnValue(of({ requestUri: 'requestUri' } as ParResponse));
        spyOn(urlService, 'getAuthorizeParUrl').and.returnValue('some-par-url');
        const redirectToSpy = spyOn(redirectService, 'redirectTo');
        const spy = jasmine.createSpy();
        const urlHandler = (url) => {
          spy(url);
        };

        service.loginPar('configId', { urlHandler });

        expect(spy).toHaveBeenCalledWith('some-par-url');
        expect(redirectToSpy).not.toHaveBeenCalled();
      })
    );
  });

  describe('loginWithPopUpPar', () => {
    it(
      'does nothing if it has an invalid response type',
      waitForAsync(() => {
        spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(false);
        const loggerSpy = spyOn(loggerService, 'logError');

        service.loginWithPopUpPar('configId').subscribe({
          error: (err) => {
            expect(loggerSpy).toHaveBeenCalled();
            expect(err).toBe('Invalid response type!');
          },
        });
      })
    );

    it(
      'does nothing if no well known endpoint is given',
      waitForAsync(() => {
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ responseType: 'stubValue' });
        spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        const loggerSpy = spyOn(loggerService, 'logError');

        service.loginWithPopUpPar('configId').subscribe({
          error: (err) => {
            expect(loggerSpy).toHaveBeenCalled();
            expect(err).toBe('no authWellknownEndpoint given!');
          },
        });
      })
    );

    it(
      'calls parService.postParRequest without custom params when no custom params are passed',
      waitForAsync(() => {
        spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          authWellknownEndpointUrl: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });

        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));

        const spy = spyOn(parService, 'postParRequest').and.returnValue(of({ requestUri: 'requestUri' } as ParResponse));

        service.loginWithPopUpPar('configId').subscribe({
          error: (err) => {
            expect(spy).toHaveBeenCalled();
            expect(err).toBe("Could not create url with param requestUri: 'url'");
          },
        });
      })
    );

    it(
      'calls parService.postParRequest with custom params when custom params are passed',
      waitForAsync(() => {
        spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          authWellknownEndpointUrl: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });

        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));

        const spy = spyOn(parService, 'postParRequest').and.returnValue(of({ requestUri: 'requestUri' } as ParResponse));

        service.loginWithPopUpPar('configId', { customParams: { some: 'thing' } }).subscribe({
          error: (err) => {
            expect(spy).toHaveBeenCalledOnceWith('configId', { some: 'thing' });
            expect(err).toBe("Could not create url with param requestUri: 'url'");
          },
        });
      })
    );

    it(
      'returns undefined and logs error when no url could be created',
      waitForAsync(() => {
        spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          authWellknownEndpointUrl: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });

        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));

        spyOn(parService, 'postParRequest').and.returnValue(of({ requestUri: 'requestUri' } as ParResponse));
        spyOn(urlService, 'getAuthorizeParUrl').and.returnValue('');
        const spy = spyOn(loggerService, 'logError');

        service.loginWithPopUpPar('configId', { customParams: { some: 'thing' } }).subscribe({
          error: (err) => {
            expect(err).toBe("Could not create url with param requestUri: 'url'");
            expect(spy).toHaveBeenCalledTimes(1);
          },
        });
      })
    );

    it(
      'calls popupService openPopUp when url could be created',
      waitForAsync(() => {
        spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          authWellknownEndpointUrl: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });

        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));

        spyOn(parService, 'postParRequest').and.returnValue(of({ requestUri: 'requestUri' } as ParResponse));
        spyOn(urlService, 'getAuthorizeParUrl').and.returnValue('some-par-url');
        spyOnProperty(popupService, 'result$').and.returnValue(of({}));
        const spy = spyOn(popupService, 'openPopUp');

        service.loginWithPopUpPar('configId').subscribe((result) => {
          expect(spy).toHaveBeenCalledOnceWith('some-par-url', undefined);
        });
      })
    );

    it(
      'returns correct properties if url is received',
      waitForAsync(() => {
        spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          authWellknownEndpointUrl: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });

        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));

        spyOn(parService, 'postParRequest').and.returnValue(of({ requestUri: 'requestUri' } as ParResponse));
        spyOn(urlService, 'getAuthorizeParUrl').and.returnValue('some-par-url');

        const checkAuthSpy = spyOn(checkAuthService, 'checkAuth').and.returnValue(
          of({ isAuthenticated: true, userData: { any: 'userData' }, accessToken: 'anyAccessToken' })
        );
        const popupResult: PopupResult = { userClosed: false, receivedUrl: 'someUrl' };
        spyOnProperty(popupService, 'result$').and.returnValue(of(popupResult));

        service.loginWithPopUpPar('configId').subscribe((result) => {
          expect(checkAuthSpy).toHaveBeenCalledWith('someUrl');

          expect(result).toEqual({ isAuthenticated: true, userData: { any: 'userData' }, accessToken: 'anyAccessToken' });
        });
      })
    );

    it(
      'returns correct properties if popup was closed by user',
      waitForAsync(() => {
        spyOn(responseTypeValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          authWellknownEndpointUrl: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });

        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));

        spyOn(parService, 'postParRequest').and.returnValue(of({ requestUri: 'requestUri' } as ParResponse));
        spyOn(urlService, 'getAuthorizeParUrl').and.returnValue('some-par-url');

        const checkAuthSpy = spyOn(checkAuthService, 'checkAuth');
        const popupResult: PopupResult = { userClosed: true };
        spyOnProperty(popupService, 'result$').and.returnValue(of(popupResult));

        service.loginWithPopUpPar('configId').subscribe((result) => {
          expect(checkAuthSpy).not.toHaveBeenCalled();

          expect(result).toEqual({ isAuthenticated: false, errorMessage: 'User closed popup' });
        });
      })
    );
  });
});
