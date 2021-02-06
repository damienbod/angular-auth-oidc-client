import { CommonModule } from '@angular/common';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthStateServiceMock } from '../authState/auth-state.service-mock';
import { CheckAuthServiceMock } from '../check-auth.service-mock';
import { AuthWellKnownService } from '../config/auth-well-known.service';
import { AuthWellKnownServiceMock } from '../config/auth-well-known.service-mock';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/config.provider-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { RedirectService } from '../utils/redirect/redirect.service';
import { UrlService } from '../utils/url/url.service';
import { UrlServiceMock } from '../utils/url/url.service-mock';
import { TokenValidationService } from '../validation/token-validation.service';
import { TokenValidationServiceMock } from '../validation/token-validation.service-mock';
import { CheckAuthService } from './../check-auth.service';
import { UserService } from './../userData/user-service';
import { UserServiceMock } from './../userData/user-service-mock';
import { LoginService } from './login.service';
import { PopUpService } from './popup.service';

describe('LoginService', () => {
  let loginService: LoginService;
  let configurationProvider: ConfigurationProvider;
  let urlService: UrlService;
  let loggerService: LoggerService;
  let tokenValidationService: TokenValidationService;
  let redirectService: RedirectService;
  let authWellKnownService: AuthWellKnownService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
      providers: [
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: TokenValidationService, useClass: TokenValidationServiceMock },
        { provide: UrlService, useClass: UrlServiceMock },
        RedirectService,
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
        { provide: AuthWellKnownService, useClass: AuthWellKnownServiceMock },
        PopUpService,
        { provide: CheckAuthService, useClass: CheckAuthServiceMock },
        { provide: UserService, useClass: UserServiceMock },
        { provide: AuthStateService, useClass: AuthStateServiceMock },
        LoginService,
      ],
    });
  });

  beforeEach(() => {
    loginService = TestBed.inject(LoginService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    urlService = TestBed.inject(UrlService);
    loggerService = TestBed.inject(LoggerService);
    tokenValidationService = TestBed.inject(TokenValidationService);
    redirectService = TestBed.inject(RedirectService);
    authWellKnownService = TestBed.inject(AuthWellKnownService);
  });

  it('should create', () => {
    expect(loginService).toBeTruthy();
  });

  describe('login', () => {
    it(
      'does nothing if it has an invalid response type',
      waitForAsync(() => {
        spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ responseType: 'stubValue' });
        spyOn(tokenValidationService, 'configValidateResponseType').and.returnValue(false);
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
        const spy = spyOn(tokenValidationService, 'configValidateResponseType').and.returnValue(true);
        const result = loginService.login();
        expect(result).toBeUndefined();
        expect(spy).toHaveBeenCalled();
      })
    );

    it(
      'calls flowsService.resetAuthorizationData() if everything fits',
      waitForAsync(() => {
        spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
          authWellknownEndpoint: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });
        spyOn(tokenValidationService, 'configValidateResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
        spyOn(redirectService, 'redirectTo').and.callFake(() => {});
        const result = loginService.login();
        expect(result).toBeUndefined();
      })
    );

    it(
      'calls urlService.getAuthorizeUrl() if everything fits',
      waitForAsync(() => {
        spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
          authWellknownEndpoint: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });
        spyOn(tokenValidationService, 'configValidateResponseType').and.returnValue(true);
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
        spyOn(tokenValidationService, 'configValidateResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
        spyOn(urlService, 'getAuthorizeUrl').and.returnValue('someUrl');
        const redirectspy = spyOn(redirectService, 'redirectTo').and.callFake(() => {});
        const result = loginService.login();
        expect(result).toBeUndefined();
        expect(redirectspy).toHaveBeenCalledWith('someUrl');
      })
    );

    it(
      'redirects to url with url handler when urlhandler is given',
      waitForAsync(() => {
        spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
          authWellknownEndpoint: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });
        spyOn(tokenValidationService, 'configValidateResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
        spyOn(urlService, 'getAuthorizeUrl').and.returnValue('someUrl');
        const redirectspy = spyOn(redirectService, 'redirectTo').and.callFake(() => {});
        const spy = jasmine.createSpy();
        const urlHandler = (url) => {
          spy(url);
        };
        const result = loginService.login({ urlHandler });
        expect(result).toBeUndefined();
        expect(spy).toHaveBeenCalledWith('someUrl');
        expect(redirectspy).not.toHaveBeenCalled();
      })
    );

    it(
      'calls getAuthorizeUrl with custom params if they are given as parameter',
      waitForAsync(() => {
        spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
          authWellknownEndpoint: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });
        spyOn(tokenValidationService, 'configValidateResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
        const getAuthorizeUrlSpy = spyOn(urlService, 'getAuthorizeUrl').and.returnValue('someUrl');
        const redirectspy = spyOn(redirectService, 'redirectTo').and.callFake(() => {});

        const result = loginService.login({ customParams: { to: 'add', as: 'well' } });
        expect(result).toBeUndefined();
        expect(redirectspy).toHaveBeenCalledWith('someUrl');
        expect(getAuthorizeUrlSpy).toHaveBeenCalledWith({ to: 'add', as: 'well' });
      })
    );
  });
});
