import { CommonModule } from '@angular/common';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthStateService } from '../../authState/auth-state.service';
import { AuthStateServiceMock } from '../../authState/auth-state.service-mock';
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
import { UrlService } from '../../utils/url/url.service';
import { ResponseTypeValidationService } from '../response-type-validation/response-type-validation.service';
import { ResponseTypeValidationServiceMock } from '../response-type-validation/response-type-validation.service.mock';
import { UrlServiceMock } from './../../utils/url/url.service-mock';
import { PopUpLoginService } from './popup-login.service';
import { PopupResult } from './popup-result';
import { PopUpService } from './popup.service';
import { PopUpServiceMock } from './popup.service-mock';

describe('PopUpLoginService', () => {
  let popUpLoginService: PopUpLoginService;
  let configurationProvider: ConfigurationProvider;
  let urlService: UrlService;
  let loggerService: LoggerService;
  let responseTypValidationService: ResponseTypeValidationService;
  let authWellKnownService: AuthWellKnownService;
  let popupService: PopUpService;
  let checkAuthService: CheckAuthService;
  let userService: UserService;
  let authStateService: AuthStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
      providers: [
        PopUpLoginService,
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: ResponseTypeValidationService, useClass: ResponseTypeValidationServiceMock },
        { provide: UrlService, useClass: UrlServiceMock },
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
        { provide: AuthWellKnownService, useClass: AuthWellKnownServiceMock },
        { provide: PopUpService, useClass: PopUpServiceMock },
        { provide: CheckAuthService, useClass: CheckAuthServiceMock },
        { provide: UserService, useClass: UserServiceMock },
        { provide: AuthStateService, useClass: AuthStateServiceMock },
      ],
    });
  });

  beforeEach(() => {
    popUpLoginService = TestBed.inject(PopUpLoginService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    urlService = TestBed.inject(UrlService);
    loggerService = TestBed.inject(LoggerService);
    responseTypValidationService = TestBed.inject(ResponseTypeValidationService);
    authWellKnownService = TestBed.inject(AuthWellKnownService);
    popupService = TestBed.inject(PopUpService);
    checkAuthService = TestBed.inject(CheckAuthService);
    userService = TestBed.inject(UserService);
    authStateService = TestBed.inject(AuthStateService);
  });

  it('should create', () => {
    expect(popUpLoginService).toBeTruthy();
  });

  describe('loginWithPopUpStandard', () => {
    it(
      'does nothing if it has an invalid response type',
      waitForAsync(() => {
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ responseType: 'stubValue' });
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(false);
        const loggerSpy = spyOn(loggerService, 'logError');

        popUpLoginService.loginWithPopUpStandard().subscribe({
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
        const spy = spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        const loggerSpy = spyOn(loggerService, 'logError');

        popUpLoginService.loginWithPopUpStandard().subscribe({
          error: (err) => {
            expect(spy).toHaveBeenCalled();
            expect(loggerSpy).toHaveBeenCalled();
            expect(err).toBe('no authWellknownEndpoint given!');
          },
        });
      })
    );

    it(
      'calls urlService.getAuthorizeUrl() if everything fits',
      waitForAsync(() => {
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          authWellknownEndpoint: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
        spyOnProperty(popupService, 'result$').and.returnValue(of({}));
        const spy = spyOn(urlService, 'getAuthorizeUrl');

        popUpLoginService.loginWithPopUpStandard().subscribe(() => {
          expect(spy).toHaveBeenCalled();
        });
      })
    );

    it(
      'opens popup if everything fits',
      waitForAsync(() => {
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          authWellknownEndpoint: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
        spyOn(urlService, 'getAuthorizeUrl');
        spyOnProperty(popupService, 'result$').and.returnValue(of({}));
        const popupSpy = spyOn(popupService, 'openPopUp');

        popUpLoginService.loginWithPopUpStandard().subscribe(() => {
          expect(popupSpy).toHaveBeenCalled();
        });
      })
    );

    it(
      'returns three properties when popupservice received an url',
      waitForAsync(() => {
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
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
        const popupResult: PopupResult = { userClosed: false, receivedUrl: 'someUrl' };
        spyOnProperty(popupService, 'result$').and.returnValue(of(popupResult));

        popUpLoginService.loginWithPopUpStandard().subscribe((result) => {
          expect(checkAuthSpy).toHaveBeenCalledWith('someUrl');
          expect(getUserDataFromStoreSpy).toHaveBeenCalledTimes(1);
          expect(getAccessTokenSpy).toHaveBeenCalledTimes(1);

          expect(result).toEqual({ isAuthenticated: true, userData: { any: 'userData' }, accessToken: 'anyAccessToken' });
        });
      })
    );

    it(
      'returns two properties if popup was closed by user',
      waitForAsync(() => {
        spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({
          authWellknownEndpoint: 'authWellknownEndpoint',
          responseType: 'stubValue',
        });
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));
        spyOn(urlService, 'getAuthorizeUrl');
        spyOn(popupService, 'openPopUp');
        const checkAuthSpy = spyOn(checkAuthService, 'checkAuth');
        const getUserDataFromStoreSpy = spyOn(userService, 'getUserDataFromStore');
        const getAccessTokenSpy = spyOn(authStateService, 'getAccessToken');
        const popupResult: PopupResult = { userClosed: true };
        spyOnProperty(popupService, 'result$').and.returnValue(of(popupResult));

        popUpLoginService.loginWithPopUpStandard().subscribe((result) => {
          expect(checkAuthSpy).not.toHaveBeenCalled();
          expect(getUserDataFromStoreSpy).not.toHaveBeenCalled();
          expect(getAccessTokenSpy).not.toHaveBeenCalled();

          expect(result).toEqual({ isAuthenticated: false, errorMessage: 'User closed popup' });
        });
      })
    );
  });
});
