import { CommonModule } from '@angular/common';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthWellKnownService } from '../config/auth-well-known.service';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/config.provider-mock';
import { LoggerService } from '../logging/logger.service';
import { RedirectService } from '../utils/redirect/redirect.service';
import { UrlService } from '../utils/url/url.service';
import { CheckAuthService } from './../check-auth.service';
import { UserService } from './../userData/user-service';
import { LoginService } from './login.service';
import { ParLoginService } from './par/par-login.service';
import { ParLoginServiceMock } from './par/par-login.service-mock';
import { PopUpLoginService } from './popup/popup-login.service';
import { PopUpLoginServiceMock } from './popup/popup-login.service-mock';
import { PopUpService } from './popup/popup.service';
import { ResponseTypeValidationService } from './response-type-validation/response-type-validation.service';
import { StandardLoginService } from './standard/standard-login.service';
import { StandardLoginServiceMock } from './standard/standard-login.service-mock';

describe('LoginService', () => {
  let loginService: LoginService;
  let configurationProvider: ConfigurationProvider;
  let urlService: UrlService;
  let loggerService: LoggerService;
  let responseTypValidationService: ResponseTypeValidationService;
  let redirectService: RedirectService;
  let authWellKnownService: AuthWellKnownService;
  let popupService: PopUpService;
  let checkAuthService: CheckAuthService;
  let userService: UserService;
  let authStateService: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
      providers: [
        LoginService,
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
        { provide: ParLoginService, useClass: ParLoginServiceMock },
        { provide: PopUpLoginService, useClass: PopUpLoginServiceMock },
        { provide: StandardLoginService, useClass: StandardLoginServiceMock },
      ],
    });
  });

  beforeEach(() => {
    loginService = TestBed.inject(LoginService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    urlService = TestBed.inject(UrlService);
    loggerService = TestBed.inject(LoggerService);
    responseTypValidationService = TestBed.inject(ResponseTypeValidationService);
    redirectService = TestBed.inject(RedirectService);
    authWellKnownService = TestBed.inject(AuthWellKnownService);
    popupService = TestBed.inject(PopUpService);
    checkAuthService = TestBed.inject(CheckAuthService);
    userService = TestBed.inject(UserService);
    authStateService = TestBed.inject(AuthStateService);
  });

  it('should create', () => {
    expect(loginService).toBeTruthy();
  });

  describe('login', () => {
    it(
      'does nothing if it has an invalid response type',
      waitForAsync(() => {
        spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ responseType: 'stubValue' });
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(false);
        const loggerSpy = spyOn(loggerService, 'logError');
        const result = loginService.login();
        expect(result).toBeUndefined();
        expect(loggerSpy).toHaveBeenCalled();
      })
    );

    it(
      'does nothing if no well known endpoint is given',
      waitForAsync(() => {
        spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ responseType: 'stubValue' });
        const spy = spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        const result = loginService.login();
        expect(result).toBeUndefined();
        expect(spy).toHaveBeenCalled();
      })
    );

    it(
      'calls urlService.getAuthorizeUrl() if everything fits',
      waitForAsync(() => {
        spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
          authWellknownEndpoint: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
        const spy = spyOn(urlService, 'getAuthorizeUrl');
        spyOn(redirectService, 'redirectTo').and.callFake(() => {});
        const result = loginService.login();
        expect(result).toBeUndefined();
        expect(spy).toHaveBeenCalled();
      })
    );

    it(
      'redirects to url with no url handler',
      waitForAsync(() => {
        spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
          authWellknownEndpoint: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
        spyOn(urlService, 'getAuthorizeUrl').and.returnValue('someUrl');
        const redirectSpy = spyOn(redirectService, 'redirectTo').and.callFake(() => {});
        const result = loginService.login();
        expect(result).toBeUndefined();
        expect(redirectSpy).toHaveBeenCalledWith('someUrl');
      })
    );

    it(
      'redirects to url with url handler when urlHandler is given',
      waitForAsync(() => {
        spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
          authWellknownEndpoint: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
        spyOn(urlService, 'getAuthorizeUrl').and.returnValue('someUrl');
        const redirectSpy = spyOn(redirectService, 'redirectTo').and.callFake(() => {});
        const spy = jasmine.createSpy();
        const urlHandler = (url) => {
          spy(url);
        };
        const result = loginService.login({ urlHandler });
        expect(result).toBeUndefined();
        expect(spy).toHaveBeenCalledWith('someUrl');
        expect(redirectSpy).not.toHaveBeenCalled();
      })
    );

    it(
      'calls getAuthorizeUrl with custom params if they are given as parameter',
      waitForAsync(() => {
        spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
          authWellknownEndpoint: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
        const getAuthorizeUrlSpy = spyOn(urlService, 'getAuthorizeUrl').and.returnValue('someUrl');
        const redirectSpy = spyOn(redirectService, 'redirectTo').and.callFake(() => {});

        const result = loginService.login({ customParams: { to: 'add', as: 'well' } });
        expect(result).toBeUndefined();
        expect(redirectSpy).toHaveBeenCalledWith('someUrl');
        expect(getAuthorizeUrlSpy).toHaveBeenCalledWith({ to: 'add', as: 'well' });
      })
    );
  });

  describe('loginWithPopup', () => {
    it(
      'does nothing if it has an invalid response type',
      waitForAsync(() => {
        spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ responseType: 'stubValue' });
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(false);
        const loggerSpy = spyOn(loggerService, 'logError');

        const result = loginService.loginWithPopUp();

        expect(result).toBeUndefined();
        expect(loggerSpy).toHaveBeenCalled();
      })
    );

    it(
      'does nothing if no well known endpoint is given',
      waitForAsync(() => {
        spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ responseType: 'stubValue' });
        const spy = spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        const loggerSpy = spyOn(loggerService, 'logError');

        const result = loginService.loginWithPopUp();

        expect(result).toBeUndefined();
        expect(spy).toHaveBeenCalled();
        expect(loggerSpy).toHaveBeenCalled();
      })
    );

    it(
      'calls urlService.getAuthorizeUrl() if everything fits',
      waitForAsync(() => {
        spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
          authWellknownEndpoint: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
        const spy = spyOn(urlService, 'getAuthorizeUrl');

        loginService.loginWithPopUp().subscribe(() => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'opens popup if everything fits',
      waitForAsync(() => {
        spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
          authWellknownEndpoint: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
        spyOn(urlService, 'getAuthorizeUrl');
        const popupSpy = spyOn(popupService, 'openPopUp');

        loginService.loginWithPopUp().subscribe(() => {
          expect(popupSpy).toHaveBeenCalled();
        });
      })
    );

    it(
      'returns three properties when popupservice received an url',
      waitForAsync(() => {
        spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
          authWellknownEndpoint: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
        spyOn(urlService, 'getAuthorizeUrl');
        spyOn(popupService, 'openPopUp');
        const checkAuthSpy = spyOn(checkAuthService, 'checkAuth').and.returnValue(of(true));
        const getUserDataFromStoreSpy = spyOn(userService, 'getUserDataFromStore').and.returnValue({ any: 'userData' });
        const getAccessTokenSpy = spyOn(authStateService, 'getAccessToken').and.returnValue('anyAccessToken');
        spyOnProperty(popupService, 'receivedUrl$').and.returnValue(of('someUrl'));

        loginService.loginWithPopUp().subscribe((result) => {
          expect(checkAuthSpy).toHaveBeenCalledWith('someUrl');
          expect(getUserDataFromStoreSpy).toHaveBeenCalledTimes(1);
          expect(getAccessTokenSpy).toHaveBeenCalledTimes(1);

          expect(result).toEqual({ isAuthenticated: true, userData: { any: 'userData' }, accessToken: 'anyAccessToken' });
        });
      })
    );
  });
});
