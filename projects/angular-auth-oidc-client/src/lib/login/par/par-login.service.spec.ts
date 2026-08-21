import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { mockProvider } from '../../../test/auto-mock';
import { CheckAuthService } from '../../auth-state/check-auth.service';
import { AuthWellKnownService } from '../../config/auth-well-known/auth-well-known.service';
import { LoggerService } from '../../logging/logger.service';
import { RedirectService } from '../../utils/redirect/redirect.service';
import { UrlService } from '../../utils/url/url.service';
import { LoginResponse } from '../login-response';
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
        mockProvider(LoggerService),
        mockProvider(ResponseTypeValidationService),
        mockProvider(UrlService),
        mockProvider(RedirectService),
        mockProvider(AuthWellKnownService),
        mockProvider(PopUpService),
        mockProvider(CheckAuthService),
        mockProvider(ParService),
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
      vi.spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(false);
      const loggerSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);

      service.loginPar({});

      expect(loggerSpy).toHaveBeenCalled();
    }));

    it('calls parService.postParRequest without custom params when no custom params are passed', waitForAsync(() => {
      vi.spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(true);

      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));

      const spy = vi
        .spyOn(parService, 'postParRequest')
        .mockReturnValue(of({ requestUri: 'requestUri' } as ParResponse));

      service.loginPar({
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      });

      expect(spy).toHaveBeenCalled();
    }));

    it('calls parService.postParRequest with custom params when custom params are passed', waitForAsync(() => {
      vi.spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));

      const spy = vi
        .spyOn(parService, 'postParRequest')
        .mockReturnValue(of({ requestUri: 'requestUri' } as ParResponse));

      service.loginPar(config, {
        customParams: { some: 'thing' },
      });

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith(config, {
        customParams: { some: 'thing' },
      });
    }));

    it('returns undefined and logs error when no url could be created', waitForAsync(() => {
      vi.spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));

      vi.spyOn(parService, 'postParRequest').mockReturnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );
      vi.spyOn(urlService, 'getAuthorizeParUrl').mockReturnValue('');
      const spy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);

      service.loginPar(config);

      expect(spy).toHaveBeenCalledTimes(1);
    }));

    it('calls redirect service redirectTo when url could be created', waitForAsync(() => {
      vi.spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };
      const authOptions = {};

      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));

      vi.spyOn(parService, 'postParRequest').mockReturnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );
      vi.spyOn(urlService, 'getAuthorizeParUrl').mockReturnValue(
        'some-par-url'
      );
      const spy = vi
        .spyOn(redirectService, 'redirectTo')
        .mockReturnValue(undefined);

      service.loginPar(config, authOptions);

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith('some-par-url');
    }));

    it('calls urlHandler when URL is passed', waitForAsync(() => {
      vi.spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));

      vi.spyOn(parService, 'postParRequest').mockReturnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );
      vi.spyOn(urlService, 'getAuthorizeParUrl').mockReturnValue(
        'some-par-url'
      );
      const redirectToSpy = vi
        .spyOn(redirectService, 'redirectTo')
        .mockReturnValue(undefined);
      const spy = vi.fn();
      const urlHandler = (url: any): void => {
        spy(url);
      };

      service.loginPar(config, { urlHandler });

      expect(spy).toHaveBeenCalledTimes(1);

      expect(spy).toHaveBeenCalledWith('some-par-url');
      expect(redirectToSpy).not.toHaveBeenCalled();
    }));
  });

  describe('loginWithPopUpPar', () => {
    it('does nothing if it has an invalid response type', waitForAsync(() => {
      vi.spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(false);
      const loggerSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);
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
      vi.spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };
      const allConfigs = [config];

      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));

      const spy = vi
        .spyOn(parService, 'postParRequest')
        .mockReturnValue(of({ requestUri: 'requestUri' } as ParResponse));

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
      vi.spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };
      const allConfigs = [config];

      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));

      const spy = vi
        .spyOn(parService, 'postParRequest')
        .mockReturnValue(of({ requestUri: 'requestUri' } as ParResponse));

      service
        .loginWithPopUpPar(config, allConfigs, {
          customParams: { some: 'thing' },
        })
        .subscribe({
          error: (err) => {
            expect(spy).toHaveBeenCalledTimes(1);
            expect(spy).toHaveBeenCalledWith(config, {
              customParams: { some: 'thing' },
            });
            expect(err.message).toBe(
              "Could not create URL with param requestUri: 'url'"
            );
          },
        });
    }));

    it('returns undefined and logs error when no URL could be created', waitForAsync(() => {
      vi.spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };
      const allConfigs = [config];

      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));

      vi.spyOn(parService, 'postParRequest').mockReturnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );
      vi.spyOn(urlService, 'getAuthorizeParUrl').mockReturnValue('');
      const spy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);

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
      vi.spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };
      const allConfigs = [config];

      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));

      vi.spyOn(parService, 'postParRequest').mockReturnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );
      vi.spyOn(urlService, 'getAuthorizeParUrl').mockReturnValue(
        'some-par-url'
      );
      vi.spyOn(checkAuthService, 'checkAuth').mockReturnValue(
        of({} as LoginResponse)
      );
      vi.spyOn(popupService, 'result$', 'get').mockReturnValue(
        of({} as PopupResult)
      );
      const spy = vi
        .spyOn(popupService, 'openPopUp')
        .mockReturnValue(undefined);

      service.loginWithPopUpPar(config, allConfigs).subscribe(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith('some-par-url', undefined, config);
      });
    }));

    it('returns correct properties if URL is received', waitForAsync(() => {
      vi.spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
        configId: 'configId1',
      };
      const allConfigs = [config];

      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));

      vi.spyOn(parService, 'postParRequest').mockReturnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );
      vi.spyOn(urlService, 'getAuthorizeParUrl').mockReturnValue(
        'some-par-url'
      );

      const checkAuthSpy = vi
        .spyOn(checkAuthService, 'checkAuth')
        .mockReturnValue(
          of({
            isAuthenticated: true,
            configId: 'configId1',
            idToken: '',
            userData: { any: 'userData' },
            accessToken: 'anyAccessToken',
          })
        );
      const popupResult: PopupResult = {
        userClosed: false,
        receivedUrl: 'someUrl',
      };

      vi.spyOn(popupService, 'result$', 'get').mockReturnValue(of(popupResult));

      service.loginWithPopUpPar(config, allConfigs).subscribe((result) => {
        expect(checkAuthSpy).toHaveBeenCalledTimes(1);
        expect(checkAuthSpy).toHaveBeenCalledWith(
          config,
          allConfigs,
          'someUrl'
        );

        expect(result).toEqual({
          isAuthenticated: true,
          configId: 'configId1',
          idToken: '',
          userData: { any: 'userData' },
          accessToken: 'anyAccessToken',
        });
      });
    }));

    it('returns correct properties if popup was closed by user', waitForAsync(() => {
      vi.spyOn(
        responseTypeValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(true);
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
        configId: 'configId1',
      };
      const allConfigs = [config];

      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));

      vi.spyOn(parService, 'postParRequest').mockReturnValue(
        of({ requestUri: 'requestUri' } as ParResponse)
      );
      vi.spyOn(urlService, 'getAuthorizeParUrl').mockReturnValue(
        'some-par-url'
      );

      const checkAuthSpy = vi
        .spyOn(checkAuthService, 'checkAuth')
        .mockReturnValue(undefined as any);
      const popupResult = { userClosed: true } as PopupResult;

      vi.spyOn(popupService, 'result$', 'get').mockReturnValue(of(popupResult));

      service.loginWithPopUpPar(config, allConfigs).subscribe((result) => {
        expect(checkAuthSpy).not.toHaveBeenCalled();
        expect(result).toEqual({
          isAuthenticated: false,
          errorMessage: 'User closed popup',
          configId: 'configId1',
          idToken: '',
          userData: null,
          accessToken: '',
        });
      });
    }));
  });
});
