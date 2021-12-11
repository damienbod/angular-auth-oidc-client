import { CommonModule } from '@angular/common';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { CheckAuthService } from '../../check-auth.service';
import { CheckAuthServiceMock } from '../../check-auth.service-mock';
import { AuthWellKnownService } from '../../config/auth-well-known/auth-well-known.service';
import { AuthWellKnownServiceMock } from '../../config/auth-well-known/auth-well-known.service-mock';
import { LoggerService } from '../../logging/logger.service';
import { LoggerServiceMock } from '../../logging/logger.service-mock';
import { UrlService } from '../../utils/url/url.service';
import { UrlServiceMock } from '../../utils/url/url.service-mock';
import { ResponseTypeValidationService } from '../response-type-validation/response-type-validation.service';
import { ResponseTypeValidationServiceMock } from '../response-type-validation/response-type-validation.service.mock';
import { PopUpLoginService } from './popup-login.service';
import { PopupResult } from './popup-result';
import { PopUpService } from './popup.service';
import { PopUpServiceMock } from './popup.service-mock';

describe('PopUpLoginService', () => {
  let popUpLoginService: PopUpLoginService;
  let urlService: UrlService;
  let loggerService: LoggerService;
  let responseTypValidationService: ResponseTypeValidationService;
  let authWellKnownService: AuthWellKnownService;
  let popupService: PopUpService;
  let checkAuthService: CheckAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CommonModule],
      providers: [
        PopUpLoginService,
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: ResponseTypeValidationService, useClass: ResponseTypeValidationServiceMock },
        { provide: UrlService, useClass: UrlServiceMock },
        { provide: AuthWellKnownService, useClass: AuthWellKnownServiceMock },
        { provide: PopUpService, useClass: PopUpServiceMock },
        { provide: CheckAuthService, useClass: CheckAuthServiceMock },
      ],
    });
  });

  beforeEach(() => {
    popUpLoginService = TestBed.inject(PopUpLoginService);
    urlService = TestBed.inject(UrlService);
    loggerService = TestBed.inject(LoggerService);
    responseTypValidationService = TestBed.inject(ResponseTypeValidationService);
    authWellKnownService = TestBed.inject(AuthWellKnownService);
    popupService = TestBed.inject(PopUpService);
    checkAuthService = TestBed.inject(CheckAuthService);
  });

  it('should create', () => {
    expect(popUpLoginService).toBeTruthy();
  });

  describe('loginWithPopUpStandard', () => {
    it(
      'does nothing if it has an invalid response type',
      waitForAsync(() => {
        const config = { responseType: 'stubValue' };
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(false);
        const loggerSpy = spyOn(loggerService, 'logError');

        popUpLoginService.loginWithPopUpStandard(config, [config]).subscribe({
          error: (err) => {
            expect(loggerSpy).toHaveBeenCalled();
            expect(err.message).toBe('Invalid response type!');
          },
        });
      })
    );

    it(
      'calls urlService.getAuthorizeUrl() if everything fits',
      waitForAsync(() => {
        const config = {
          authWellknownEndpointUrl: 'authWellknownEndpoint',
          responseType: 'stubValue',
        };
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'queryAndStoreAuthWellKnownEndPoints').and.returnValue(of({}));
        spyOnProperty(popupService, 'result$').and.returnValue(of({}));
        spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of('someUrl'));

        popUpLoginService.loginWithPopUpStandard(config, [config]).subscribe(() => {
          expect(urlService.getAuthorizeUrl).toHaveBeenCalled();
        });
      })
    );

    it(
      'opens popup if everything fits',
      waitForAsync(() => {
        const config = {
          authWellknownEndpointUrl: 'authWellknownEndpoint',
          responseType: 'stubValue',
        };
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'queryAndStoreAuthWellKnownEndPoints').and.returnValue(of({}));
        spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of('someUrl'));
        spyOnProperty(popupService, 'result$').and.returnValue(of({}));
        const popupSpy = spyOn(popupService, 'openPopUp');

        popUpLoginService.loginWithPopUpStandard(config, [config]).subscribe(() => {
          expect(popupSpy).toHaveBeenCalled();
        });
      })
    );

    it(
      'returns three properties when popupservice received an url',
      waitForAsync(() => {
        const config = {
          authWellknownEndpointUrl: 'authWellknownEndpoint',
          responseType: 'stubValue',
        };
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'queryAndStoreAuthWellKnownEndPoints').and.returnValue(of({}));
        spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of('someUrl'));
        spyOn(popupService, 'openPopUp');
        const checkAuthSpy = spyOn(checkAuthService, 'checkAuth').and.returnValue(
          of({
            isAuthenticated: true,
            configId: 'configId1',
            idToken: null,
            userData: { any: 'userData' },
            accessToken: 'anyAccessToken',
          })
        );
        const popupResult: PopupResult = { userClosed: false, receivedUrl: 'someUrl' };
        spyOnProperty(popupService, 'result$').and.returnValue(of(popupResult));

        popUpLoginService.loginWithPopUpStandard(config, [config]).subscribe((result) => {
          expect(checkAuthSpy).toHaveBeenCalledWith(config, [config], 'someUrl');

          expect(result).toEqual({
            isAuthenticated: true,
            configId: 'configId1',
            idToken: null,
            userData: { any: 'userData' },
            accessToken: 'anyAccessToken',
          });
        });
      })
    );

    it(
      'returns two properties if popup was closed by user',
      waitForAsync(() => {
        const config = {
          authWellknownEndpointUrl: 'authWellknownEndpoint',
          responseType: 'stubValue',
        };
        spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
        spyOn(authWellKnownService, 'queryAndStoreAuthWellKnownEndPoints').and.returnValue(of({}));
        spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of('someUrl'));
        spyOn(popupService, 'openPopUp');
        const checkAuthSpy = spyOn(checkAuthService, 'checkAuth');
        const popupResult: PopupResult = { userClosed: true };
        spyOnProperty(popupService, 'result$').and.returnValue(of(popupResult));

        popUpLoginService.loginWithPopUpStandard(config, [config]).subscribe((result) => {
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
      })
    );
  });
});
