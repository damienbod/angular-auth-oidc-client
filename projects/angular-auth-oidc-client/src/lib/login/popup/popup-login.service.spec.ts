import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { mockProvider } from '../../../test/auto-mock';
import { CheckAuthService } from '../../auth-state/check-auth.service';
import { AuthWellKnownService } from '../../config/auth-well-known/auth-well-known.service';
import { LoggerService } from '../../logging/logger.service';
import { UrlService } from '../../utils/url/url.service';
import { LoginResponse } from '../login-response';
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
        mockProvider(LoggerService),
        mockProvider(ResponseTypeValidationService),
        mockProvider(UrlService),
        mockProvider(AuthWellKnownService),
        mockProvider(PopUpService),
        mockProvider(CheckAuthService),
      ],
    });
  });

  beforeEach(() => {
    popUpLoginService = TestBed.inject(PopUpLoginService);
    urlService = TestBed.inject(UrlService);
    loggerService = TestBed.inject(LoggerService);
    responseTypValidationService = TestBed.inject(
      ResponseTypeValidationService
    );
    authWellKnownService = TestBed.inject(AuthWellKnownService);
    popupService = TestBed.inject(PopUpService);
    checkAuthService = TestBed.inject(CheckAuthService);
  });

  it('should create', () => {
    expect(popUpLoginService).toBeTruthy();
  });

  describe('loginWithPopUpStandard', () => {
    it('does nothing if it has an invalid response type', async () => {
      // arrange
      const config = { responseType: 'stubValue' };

      vi.spyOn(
        responseTypValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(false);
      const loggerSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);

      // act
      try {
        await firstValueFrom(
          popUpLoginService.loginWithPopUpStandard(config, [config])
        );
        expect.fail('expected an error');
      } catch (err: any) {
        // assert
        expect(loggerSpy).toHaveBeenCalled();
        expect(err.message).toBe('Invalid response type!');
      }
    });

    it('calls urlService.getAuthorizeUrl() if everything fits', async () => {
      // arrange
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      vi.spyOn(
        responseTypValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(true);
      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));
      vi.spyOn(popupService, 'result$', 'get').mockReturnValue(
        of({} as PopupResult)
      );
      vi.spyOn(urlService, 'getAuthorizeUrl').mockReturnValue(of('someUrl'));
      vi.spyOn(checkAuthService, 'checkAuth').mockReturnValue(
        of({} as LoginResponse)
      );

      // act
      await firstValueFrom(
        popUpLoginService.loginWithPopUpStandard(config, [config])
      );

      // assert
      expect(urlService.getAuthorizeUrl).toHaveBeenCalled();
    });

    it('opens popup if everything fits', async () => {
      // arrange
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      vi.spyOn(
        responseTypValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(true);
      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));
      vi.spyOn(urlService, 'getAuthorizeUrl').mockReturnValue(of('someUrl'));
      vi.spyOn(popupService, 'result$', 'get').mockReturnValue(
        of({} as PopupResult)
      );
      vi.spyOn(checkAuthService, 'checkAuth').mockReturnValue(
        of({} as LoginResponse)
      );
      const popupSpy = vi
        .spyOn(popupService, 'openPopUp')
        .mockReturnValue(undefined);

      // act
      await firstValueFrom(
        popUpLoginService.loginWithPopUpStandard(config, [config])
      );

      // assert
      expect(popupSpy).toHaveBeenCalled();
    });

    it('returns three properties when popupservice received an url', async () => {
      // arrange
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
      };

      vi.spyOn(
        responseTypValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(true);
      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));
      vi.spyOn(urlService, 'getAuthorizeUrl').mockReturnValue(of('someUrl'));
      vi.spyOn(popupService, 'openPopUp').mockReturnValue(undefined);
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

      // act
      const result = await firstValueFrom(
        popUpLoginService.loginWithPopUpStandard(config, [config])
      );

      // assert
      expect(checkAuthSpy).toHaveBeenCalledTimes(1);
      // assert
      expect(checkAuthSpy).toHaveBeenCalledWith(config, [config], 'someUrl');

      expect(result).toEqual({
        isAuthenticated: true,
        configId: 'configId1',
        idToken: '',
        userData: { any: 'userData' },
        accessToken: 'anyAccessToken',
      });
    });

    it('returns two properties if popup was closed by user', async () => {
      // arrange
      const config = {
        authWellknownEndpointUrl: 'authWellknownEndpoint',
        responseType: 'stubValue',
        configId: 'configId1',
      };

      vi.spyOn(
        responseTypValidationService,
        'hasConfigValidResponseType'
      ).mockReturnValue(true);
      vi.spyOn(
        authWellKnownService,
        'queryAndStoreAuthWellKnownEndPoints'
      ).mockReturnValue(of({}));
      vi.spyOn(urlService, 'getAuthorizeUrl').mockReturnValue(of('someUrl'));
      vi.spyOn(popupService, 'openPopUp').mockReturnValue(undefined);
      const checkAuthSpy = vi
        .spyOn(checkAuthService, 'checkAuth')
        .mockReturnValue(of({} as LoginResponse));
      const popupResult = { userClosed: true } as PopupResult;

      vi.spyOn(popupService, 'result$', 'get').mockReturnValue(of(popupResult));

      // act
      const result = await firstValueFrom(
        popUpLoginService.loginWithPopUpStandard(config, [config])
      );

      // assert
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
  });
});
