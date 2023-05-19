import { CommonModule } from '@angular/common';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { mockClass } from '../../../test/auto-mock';
import { CheckAuthService } from '../../auth-state/check-auth.service';
import { AuthWellKnownService } from '../../config/auth-well-known/auth-well-known.service';
import { LoggerService } from '../../logging/logger.service';
import { UrlService } from '../../utils/url/url.service';
import { ResponseTypeValidationService } from '../response-type-validation/response-type-validation.service';
import { PopUpLoginService } from './popup-login.service';
import { PopupResult } from './popup-result';
import { PopUpService } from './popup.service';

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
        { provide: LoggerService, useClass: mockClass(LoggerService) },
        { provide: ResponseTypeValidationService, useClass: mockClass(ResponseTypeValidationService) },
        { provide: UrlService, useClass: mockClass(UrlService) },
        { provide: AuthWellKnownService, useClass: mockClass(AuthWellKnownService) },
        { provide: PopUpService, useClass: mockClass(PopUpService) },
        { provide: CheckAuthService, useClass: mockClass(CheckAuthService) },
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
    it('does nothing if it has an invalid response type', waitForAsync(() => {
      const config = { responseType: 'stubValue' };

      spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(false);
      const loggerSpy = spyOn(loggerService, 'logError');

      popUpLoginService.loginWithPopUpStandard(config, [config]).subscribe({
        error: (err) => {
          expect(loggerSpy).toHaveBeenCalled();
          expect(err.message).toBe('Invalid response type!');
        },
      });
    }));

    it('calls urlService.getAuthorizeUrl() if everything fits', waitForAsync(() => {
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
      spyOn(authWellKnownService, 'queryAndStoreAuthWellKnownEndPoints').and.returnValue(of({}));
      spyOnProperty(popupService, 'result$').and.returnValue(of({} as PopupResult));
      spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of('someUrl'));
      spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));

      popUpLoginService.loginWithPopUpStandard(config, [config]).subscribe(() => {
        expect(urlService.getAuthorizeUrl).toHaveBeenCalled();
      });
    }));

    it('opens popup if everything fits', waitForAsync(() => {
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
      spyOn(authWellKnownService, 'queryAndStoreAuthWellKnownEndPoints').and.returnValue(of({}));
      spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of('someUrl'));
      spyOnProperty(popupService, 'result$').and.returnValue(of({} as PopupResult));
      spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));
      const popupSpy = spyOn(popupService, 'openPopUp');

      popUpLoginService.loginWithPopUpStandard(config, [config]).subscribe(() => {
        expect(popupSpy).toHaveBeenCalled();
      });
    }));

    it('returns three properties when popupservice received an url', waitForAsync(() => {
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
        expect(checkAuthSpy).toHaveBeenCalledOnceWith(config, [config], 'someUrl');

        expect(result).toEqual({
          isAuthenticated: true,
          configId: 'configId1',
          idToken: null,
          userData: { any: 'userData' },
          accessToken: 'anyAccessToken',
        });
      });
    }));

    it('returns two properties if popup was closed by user', waitForAsync(() => {
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
        configId: 'configId1',
      };

      spyOn(responseTypValidationService, 'hasConfigValidResponseType').and.returnValue(true);
      spyOn(authWellKnownService, 'queryAndStoreAuthWellKnownEndPoints').and.returnValue(of({}));
      spyOn(urlService, 'getAuthorizeUrl').and.returnValue(of('someUrl'));
      spyOn(popupService, 'openPopUp');
      const checkAuthSpy = spyOn(checkAuthService, 'checkAuth').and.returnValue(of(null));
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
    }));
  });
});
