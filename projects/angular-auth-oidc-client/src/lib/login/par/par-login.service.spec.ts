import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { mockClass } from '../../../test/auto-mock';
import { CheckAuthService } from '../../auth-state/check-auth.service';
import { AuthWellKnownService } from '../../config/auth-well-known/auth-well-known.service';
import { LoggerService } from '../../logging/logger.service';
import { RedirectService } from '../../utils/redirect/redirect.service';
import { UrlService } from '../../utils/url/url.service';
import { PopupResult } from '../popup/popup-result';
import { PopUpService } from '../popup/popup.service';
import { ResponseTypeValidationService } from '../response-type-validation/response-type-validation.service';
import { ParLoginService } from './par-login.service';
import { ParResponse } from './par-response';
import { ParService } from './par.service';

describe('ParLoginService', () => {
  let service: ParLoginService;
  let responseTypeValidationService: ResponseTypeValidationService;
  let loggerService: LoggerService;
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
          useClass: mockClass(LoggerService),
        },
        {
          provide: ResponseTypeValidationService,
          useClass: mockClass(ResponseTypeValidationService),
        },
        {
          provide: UrlService,
          useClass: mockClass(UrlService),
        },
        {
          provide: RedirectService,
          useClass: mockClass(RedirectService),
        },
        {
          provide: AuthWellKnownService,
          useClass: mockClass(AuthWellKnownService),
        },
        {
          provide: PopUpService,
          useClass: mockClass(PopUpService),
        },
        {
          provide: CheckAuthService,
          useClass: mockClass(CheckAuthService),
        },
        {
          provide: ParService,
          useClass: mockClass(ParService),
        },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(ParLoginService);
    loggerService = TestBed.inject(LoggerService);
    responseTypeValidationService = TestBed.inject(
      ResponseTypeValidationService
    );
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
    it('does nothing if it has an invalid response type', waitForAsync(() => {
      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(false);
      const loggerSpy = spyOn(loggerService, 'logError');

      const result = service.loginPar({});

      expect(result).toBeUndefined();
      expect(loggerSpy).toHaveBeenCalled();
    }));

    it('calls parService.postParRequest without custom params when no custom params are passed', waitForAsync(() => {
      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);

      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));

      const spy = spyOn(parService, 'postParRequest').and.returnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );

      const result = service.loginPar({
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      });

      expect(result).toBeUndefined();
      expect(spy).toHaveBeenCalled();
    }));

    it('calls parService.postParRequest with custom params when custom params are passed', waitForAsync(() => {
      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));

      const spy = spyOn(parService, 'postParRequest').and.returnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );

      const result = service.loginPar(config, {
        customParams: { some: 'thing' },
      });

      expect(result).toBeUndefined();
      expect(spy).toHaveBeenCalledOnceWith(config, { some: 'thing' });
    }));

    it('returns undefined and logs error when no url could be created', waitForAsync(() => {
      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));

      spyOn(parService, 'postParRequest').and.returnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );
      spyOn(urlService, 'getAuthorizeParUrl').and.returnValue('');
      const spy = spyOn(loggerService, 'logError');

      const result = service.loginPar(config);

      expect(result).toBeUndefined();
      expect(spy).toHaveBeenCalledTimes(1);
    }));

    it('calls redirect service redirectTo when url could be created', waitForAsync(() => {
      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));

      spyOn(parService, 'postParRequest').and.returnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );
      spyOn(urlService, 'getAuthorizeParUrl').and.returnValue('some-par-url');
      const spy = spyOn(redirectService, 'redirectTo');

      service.loginPar(config);

      expect(spy).toHaveBeenCalledOnceWith('some-par-url');
    }));

    it('calls urlHandler when URL is passed', waitForAsync(() => {
      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));

      spyOn(parService, 'postParRequest').and.returnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );
      spyOn(urlService, 'getAuthorizeParUrl').and.returnValue('some-par-url');
      const redirectToSpy = spyOn(redirectService, 'redirectTo');
      const spy = jasmine.createSpy();
      const urlHandler = (url): void => {
        spy(url);
      };

      service.loginPar(config, { urlHandler });

      expect(spy).toHaveBeenCalledOnceWith('some-par-url');
      expect(redirectToSpy).not.toHaveBeenCalled();
    }));
  });

  describe('loginWithPopUpPar', () => {
    it('does nothing if it has an invalid response type', waitForAsync(() => {
      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(false);
      const loggerSpy = spyOn(loggerService, 'logError');
      const config = {};
      const allConfigs = [config];

      service.loginWithPopUpPar(config, allConfigs).subscribe({
        error: (err) => {
          expect(loggerSpy).toHaveBeenCalled();
          expect(err.message).toBe('Invalid response type!');
        },
      });
    }));

    it('calls parService.postParRequest without custom params when no custom params are passed', waitForAsync(() => {
      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };
      const allConfigs = [config];

      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));

      const spy = spyOn(parService, 'postParRequest').and.returnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );

      service.loginWithPopUpPar(config, allConfigs).subscribe({
        error: (err) => {
          expect(spy).toHaveBeenCalled();
          expect(err.message).toBe(
            "Could not create URL with param requestUri: 'url'"
          );
        },
      });
    }));

    it('calls parService.postParRequest with custom params when custom params are passed', waitForAsync(() => {
      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };
      const allConfigs = [config];

      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));

      const spy = spyOn(parService, 'postParRequest').and.returnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );

      service
        .loginWithPopUpPar(config, allConfigs, {
          customParams: { some: 'thing' },
        })
        .subscribe({
          error: (err) => {
            expect(spy).toHaveBeenCalledOnceWith(config, { some: 'thing' });
            expect(err.message).toBe(
              "Could not create URL with param requestUri: 'url'"
            );
          },
        });
    }));

    it('returns undefined and logs error when no URL could be created', waitForAsync(() => {
      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };
      const allConfigs = [config];

      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));

      spyOn(parService, 'postParRequest').and.returnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );
      spyOn(urlService, 'getAuthorizeParUrl').and.returnValue('');
      const spy = spyOn(loggerService, 'logError');

      service
        .loginWithPopUpPar(config, allConfigs, {
          customParams: { some: 'thing' },
        })
        .subscribe({
          error: (err) => {
            expect(err.message).toBe(
              "Could not create URL with param requestUri: 'url'"
            );
            expect(spy).toHaveBeenCalledTimes(1);
          },
        });
    }));

    it('calls popupService openPopUp when URL could be created', waitForAsync(() => {
      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };
      const allConfigs = [config];

      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));

      spyOn(parService, 'postParRequest').and.returnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );
      spyOn(urlService, 'getAuthorizeParUrl').and.returnValue('some-par-url');
      spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));
      spyOnProperty(popupService, 'result$').and.returnValue(
        of({} as PopupResult)
      );
      const spy = spyOn(popupService, 'openPopUp');

      service.loginWithPopUpPar(config, allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalledOnceWith('some-par-url', undefined, config);
      });
    }));

    it('returns correct properties if URL is received', waitForAsync(() => {
      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
        configId: 'configId1',
      };
      const allConfigs = [config];

      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));

      spyOn(parService, 'postParRequest').and.returnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );
      spyOn(urlService, 'getAuthorizeParUrl').and.returnValue('some-par-url');

      const checkAuthSpy = spyOn(checkAuthService, 'checkAuth').and.returnValue(
        of({
          isAuthenticated: true,
          configId: 'configId1',
          idToken: null,
          userData: { any: 'userData' },
          accessToken: 'anyAccessToken',
        })
      );
      const popupResult: PopupResult = {
        userClosed: false,
        receivedUrl: 'someUrl',
      };

      spyOnProperty(popupService, 'result$').and.returnValue(of(popupResult));

      service.loginWithPopUpPar(config, allConfigs).subscribe((result) => {
        expect(checkAuthSpy).toHaveBeenCalledOnceWith(
          config,
          allConfigs,
          'someUrl'
        );

        expect(result).toEqual({
          isAuthenticated: true,
          configId: 'configId1',
          idToken: null,
          userData: { any: 'userData' },
          accessToken: 'anyAccessToken',
        });
      });
    }));

    it('returns correct properties if popup was closed by user', waitForAsync(() => {
      spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).and.returnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
        configId: 'configId1',
      };
      const allConfigs = [config];

      spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).and.returnValue(of({}));

      spyOn(parService, 'postParRequest').and.returnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );
      spyOn(urlService, 'getAuthorizeParUrl').and.returnValue('some-par-url');

      const checkAuthSpy = spyOn(checkAuthService, 'checkAuth');
      const popupResult: PopupResult = { userClosed: true };

      spyOnProperty(popupService, 'result$').and.returnValue(of(popupResult));

      service.loginWithPopUpPar(config, allConfigs).subscribe((result) => {
        expect(checkAuthSpy).not.toHaveBeenCalled();
        expect(result).toEqual({
          isAuthenticated: false,
          errorMessage: 'User closed popup',
          configId: 'configId1',
          idToken: null,
          userData: null,
          accessToken: null,
        });
      });
    }));
  });
});
