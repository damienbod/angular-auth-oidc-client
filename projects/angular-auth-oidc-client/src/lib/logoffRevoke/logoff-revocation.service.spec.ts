import { TestBed, waitForAsync } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { createRetriableStream } from '../../test/create-retriable-stream.helper';
import { DataService } from '../api/data.service';
import { DataServiceMock } from '../api/data.service-mock';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { ConfigurationProviderMock } from '../config/provider/config.provider-mock';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { ResetAuthDataServiceMock } from '../flows/reset-auth-data.service-mock';
import { CheckSessionService } from '../iframe/check-session.service';
import { CheckSessionServiceMock } from '../iframe/check-session.service-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { StoragePersistenceServiceMock } from '../storage/storage-persistence.service-mock';
import { RedirectServiceMock } from '../utils/redirect/redirect.service-mock';
import { UrlService } from '../utils/url/url.service';
import { RedirectService } from './../utils/redirect/redirect.service';
import { UrlServiceMock } from './../utils/url/url.service-mock';
import { LogoffRevocationService } from './logoff-revocation.service';

describe('Logout and Revoke Service', () => {
  let service: LogoffRevocationService;
  let dataService: DataService;
  let loggerService: LoggerService;
  let storagePersistenceService: StoragePersistenceService;
  let urlService: UrlService;
  let checkSessionService: CheckSessionService;
  let resetAuthDataService: ResetAuthDataService;
  let redirectService: RedirectService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LogoffRevocationService,
        { provide: DataService, useClass: DataServiceMock },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: StoragePersistenceService, useClass: StoragePersistenceServiceMock },
        { provide: UrlService, useClass: UrlServiceMock },
        { provide: CheckSessionService, useClass: CheckSessionServiceMock },
        { provide: ResetAuthDataService, useClass: ResetAuthDataServiceMock },
        { provide: RedirectService, useClass: RedirectServiceMock },
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(LogoffRevocationService);
    dataService = TestBed.inject(DataService);
    loggerService = TestBed.inject(LoggerService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    urlService = TestBed.inject(UrlService);
    checkSessionService = TestBed.inject(CheckSessionService);
    resetAuthDataService = TestBed.inject(ResetAuthDataService);
    redirectService = TestBed.inject(RedirectService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('revokeAccessToken', () => {
    it('uses token parameter if token as parameter is passed in the method', () => {
      // Arrange
      const paramToken = 'passedTokenAsParam';
      const revocationSpy = spyOn(urlService, 'createRevocationEndpointBodyAccessToken');
      // Act
      service.revokeAccessToken(paramToken);
      // Assert
      expect(revocationSpy).toHaveBeenCalledWith(paramToken, 'configId');
    });

    it('uses token parameter from persistence if no param is provided', () => {
      // Arrange
      const paramToken = 'damien';
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue(paramToken);
      const revocationSpy = spyOn(urlService, 'createRevocationEndpointBodyAccessToken');
      // Act
      service.revokeAccessToken('configId');
      // Assert
      expect(revocationSpy).toHaveBeenCalledWith(paramToken, 'configId');
    });

    it('returns type observable', () => {
      // Arrange
      const paramToken = 'damien';
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue(paramToken);
      spyOn(urlService, 'createRevocationEndpointBodyAccessToken');

      // Act
      const result = service.revokeAccessToken('configId');

      // Assert
      expect(result).toEqual(jasmine.any(Observable));
    });

    it(
      'loggs and returns unmodified response if request is positive',
      waitForAsync(() => {
        // Arrange
        const paramToken = 'damien';
        spyOn(storagePersistenceService, 'getAccessToken').and.returnValue(paramToken);
        spyOn(urlService, 'createRevocationEndpointBodyAccessToken');
        const loggerSpy = spyOn(loggerService, 'logDebug');
        spyOn(dataService, 'post').and.returnValue(of({ data: 'anything' }));

        // Act
        service.revokeAccessToken('configId').subscribe((result) => {
          // Assert
          expect(result).toEqual({ data: 'anything' });
          expect(loggerSpy).toHaveBeenCalled();
        });
      })
    );

    it(
      'loggs error when request is negative',
      waitForAsync(() => {
        // Arrange
        const paramToken = 'damien';
        spyOn(storagePersistenceService, 'getAccessToken').and.returnValue(paramToken);
        spyOn(urlService, 'createRevocationEndpointBodyAccessToken');
        const loggerSpy = spyOn(loggerService, 'logError');
        spyOn(dataService, 'post').and.returnValue(throwError('FAILUUURE'));

        // Act
        service.revokeAccessToken('configId').subscribe({
          error: (err) => {
            expect(loggerSpy).toHaveBeenCalled();
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      'should retry once',
      waitForAsync(() => {
        // Arrange
        const paramToken = 'damien';
        spyOn(storagePersistenceService, 'getAccessToken').and.returnValue(paramToken);
        spyOn(urlService, 'createRevocationEndpointBodyAccessToken');
        const loggerSpy = spyOn(loggerService, 'logDebug');
        spyOn(dataService, 'post').and.returnValue(createRetriableStream(throwError({}), of({ data: 'anything' })));

        service.revokeAccessToken('configId').subscribe({
          next: (res) => {
            // Assert
            expect(res).toBeTruthy();
            expect(res).toEqual({ data: 'anything' });
            expect(loggerSpy).toHaveBeenCalled();
          },
        });
      })
    );

    it(
      'should retry twice',
      waitForAsync(() => {
        // Arrange
        const paramToken = 'damien';
        spyOn(storagePersistenceService, 'getAccessToken').and.returnValue(paramToken);
        spyOn(urlService, 'createRevocationEndpointBodyAccessToken');
        const loggerSpy = spyOn(loggerService, 'logDebug');
        spyOn(dataService, 'post').and.returnValue(createRetriableStream(throwError({}), throwError({}), of({ data: 'anything' })));

        service.revokeAccessToken('configId').subscribe({
          next: (res) => {
            // Assert
            expect(res).toBeTruthy();
            expect(res).toEqual({ data: 'anything' });
            expect(loggerSpy).toHaveBeenCalled();
          },
        });
      })
    );

    it(
      'should fail after three tries',
      waitForAsync(() => {
        // Arrange
        const paramToken = 'damien';
        spyOn(storagePersistenceService, 'getAccessToken').and.returnValue(paramToken);
        spyOn(urlService, 'createRevocationEndpointBodyAccessToken');
        const loggerSpy = spyOn(loggerService, 'logError');
        spyOn(dataService, 'post').and.returnValue(
          createRetriableStream(throwError({}), throwError({}), throwError({}), of({ data: 'anything' }))
        );

        service.revokeAccessToken('configId').subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
            expect(loggerSpy).toHaveBeenCalled();
          },
        });
      })
    );
  });

  describe('revokeRefreshToken', () => {
    it('uses refresh token parameter if token as parameter is passed in the method', () => {
      // Arrange
      const paramToken = 'passedTokenAsParam';
      const revocationSpy = spyOn(urlService, 'createRevocationEndpointBodyRefreshToken');
      // Act
      service.revokeRefreshToken(paramToken);
      // Assert
      expect(revocationSpy).toHaveBeenCalledWith(paramToken, 'configId');
    });

    it('uses refresh token parameter from persistence if no param is provided', () => {
      // Arrange
      const paramToken = 'damien';
      spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(paramToken);
      const revocationSpy = spyOn(urlService, 'createRevocationEndpointBodyRefreshToken');
      // Act
      service.revokeRefreshToken('configId');
      // Assert
      expect(revocationSpy).toHaveBeenCalledWith(paramToken, 'configId');
    });

    it('returns type observable', () => {
      // Arrange
      const paramToken = 'damien';
      spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(paramToken);
      spyOn(urlService, 'createRevocationEndpointBodyAccessToken');

      // Act
      const result = service.revokeRefreshToken('configId');

      // Assert
      expect(result).toEqual(jasmine.any(Observable));
    });

    it(
      'loggs and returns unmodified response if request is positive',
      waitForAsync(() => {
        // Arrange
        const paramToken = 'damien';
        spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(paramToken);
        spyOn(urlService, 'createRevocationEndpointBodyAccessToken');
        const loggerSpy = spyOn(loggerService, 'logDebug');
        spyOn(dataService, 'post').and.returnValue(of({ data: 'anything' }));

        // Act
        service.revokeRefreshToken('configId').subscribe((result) => {
          // Assert
          expect(result).toEqual({ data: 'anything' });
          expect(loggerSpy).toHaveBeenCalled();
        });
      })
    );

    it(
      'loggs error when request is negative',
      waitForAsync(() => {
        // Arrange
        const paramToken = 'damien';
        spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(paramToken);
        spyOn(urlService, 'createRevocationEndpointBodyAccessToken');
        const loggerSpy = spyOn(loggerService, 'logError');
        spyOn(dataService, 'post').and.returnValue(throwError('FAILUUURE'));

        // Act
        service.revokeRefreshToken('configId').subscribe({
          error: (err) => {
            expect(loggerSpy).toHaveBeenCalled();
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      'should retry once',
      waitForAsync(() => {
        // Arrange
        const paramToken = 'damien';
        spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(paramToken);
        spyOn(urlService, 'createRevocationEndpointBodyAccessToken');
        const loggerSpy = spyOn(loggerService, 'logDebug');
        spyOn(dataService, 'post').and.returnValue(createRetriableStream(throwError({}), of({ data: 'anything' })));

        service.revokeRefreshToken('configId').subscribe({
          next: (res) => {
            // Assert
            expect(res).toBeTruthy();
            expect(res).toEqual({ data: 'anything' });
            expect(loggerSpy).toHaveBeenCalled();
          },
        });
      })
    );

    it(
      'should retry twice',
      waitForAsync(() => {
        // Arrange
        const paramToken = 'damien';
        spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(paramToken);
        spyOn(urlService, 'createRevocationEndpointBodyAccessToken');
        const loggerSpy = spyOn(loggerService, 'logDebug');
        spyOn(dataService, 'post').and.returnValue(createRetriableStream(throwError({}), throwError({}), of({ data: 'anything' })));

        service.revokeRefreshToken('configId').subscribe({
          next: (res) => {
            // Assert
            expect(res).toBeTruthy();
            expect(res).toEqual({ data: 'anything' });
            expect(loggerSpy).toHaveBeenCalled();
          },
        });
      })
    );

    it(
      'should fail after three tries',
      waitForAsync(() => {
        // Arrange
        const paramToken = 'damien';
        spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(paramToken);
        spyOn(urlService, 'createRevocationEndpointBodyAccessToken');
        const loggerSpy = spyOn(loggerService, 'logError');
        spyOn(dataService, 'post').and.returnValue(
          createRetriableStream(throwError({}), throwError({}), throwError({}), of({ data: 'anything' }))
        );

        service.revokeRefreshToken('configId').subscribe({
          error: (err) => {
            expect(err).toBeTruthy();
            expect(loggerSpy).toHaveBeenCalled();
          },
        });
      })
    );
  });

  describe('getEndSessionUrl', () => {
    it('uses id_token parameter from persistence if no param is provided', () => {
      // Arrange
      const paramToken = 'damienId';
      spyOn(storagePersistenceService, 'getIdToken').and.returnValue(paramToken);
      const revocationSpy = spyOn(urlService, 'createEndSessionUrl');
      // Act
      service.getEndSessionUrl('configId');
      // Assert
      expect(revocationSpy).toHaveBeenCalledWith(paramToken, undefined);
    });
  });

  describe('logoff', () => {
    it('logs and retuns if `endSessionUrl` is false', () => {
      // Arrange
      spyOn(service, 'getEndSessionUrl').and.returnValue('');
      const serverStateChangedSpy = spyOn(checkSessionService, 'serverStateChanged');
      // Act
      service.logoff('configId');
      // Assert
      expect(serverStateChangedSpy).not.toHaveBeenCalled();
    });

    it('logs and retuns if `serverStateChanged` is true', () => {
      // Arrange
      spyOn(service, 'getEndSessionUrl').and.returnValue('someValue');
      const redirectSpy = spyOn(redirectService, 'redirectTo');
      spyOn(checkSessionService, 'serverStateChanged').and.returnValue(true);
      // Act
      service.logoff('configId');
      // Assert
      expect(redirectSpy).not.toHaveBeenCalled();
    });

    it('calls urlHandler if urlhandler is passed', () => {
      // Arrange
      spyOn(service, 'getEndSessionUrl').and.returnValue('someValue');
      const spy = jasmine.createSpy();
      const urlHandler = (url) => {
        spy(url);
      };
      const redirectSpy = spyOn(redirectService, 'redirectTo');
      spyOn(checkSessionService, 'serverStateChanged').and.returnValue(false);
      // Act
      service.logoff('configId', urlHandler);
      // Assert
      expect(redirectSpy).not.toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith('someValue');
    });

    it('calls reidrect service if no urlhandler is passed', () => {
      // Arrange
      spyOn(service, 'getEndSessionUrl').and.returnValue('someValue');

      const redirectSpy = spyOn(redirectService, 'redirectTo');
      spyOn(checkSessionService, 'serverStateChanged').and.returnValue(false);
      // Act
      service.logoff('configId');
      // Assert
      expect(redirectSpy).toHaveBeenCalledWith('someValue');
    });
  });

  describe('logoffLocal', () => {
    it('calls flowsService.resetAuthorizationData', () => {
      // Arrange
      const resetAuthorizationDataSpy = spyOn(resetAuthDataService, 'resetAuthorizationData');
      // Act
      service.logoffLocal('configId');
      // Assert
      expect(resetAuthorizationDataSpy).toHaveBeenCalled();
    });
  });

  describe('logoffAndRevokeTokens', () => {
    it(
      'calls revokeRefreshToken and revokeAccessToken when storage holds a refreshtoken',
      waitForAsync(() => {
        // Arrange
        const paramToken = 'damien';
        spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(paramToken);
        const revokeRefreshTokenSpy = spyOn(service, 'revokeRefreshToken').and.returnValue(of({ any: 'thing' }));
        const revokeAccessTokenSpy = spyOn(service, 'revokeAccessToken').and.returnValue(of({ any: 'thing' }));

        // Act
        service.logoffAndRevokeTokens('configId').subscribe(() => {
          // Assert
          expect(revokeRefreshTokenSpy).toHaveBeenCalled();
          expect(revokeAccessTokenSpy).toHaveBeenCalled();
        });
      })
    );

    it(
      'loggs error when revokeaccesstoken throws an error',
      waitForAsync(() => {
        // Arrange
        const paramToken = 'damien';
        spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(paramToken);
        spyOn(service, 'revokeRefreshToken').and.returnValue(of({ any: 'thing' }));
        const loggerSpy = spyOn(loggerService, 'logError');
        spyOn(service, 'revokeAccessToken').and.returnValue(throwError('FAILUUURE'));

        // Act
        service.logoffAndRevokeTokens('configId').subscribe({
          error: (err) => {
            expect(loggerSpy).toHaveBeenCalled();
            expect(err).toBeTruthy();
          },
        });
      })
    );

    it(
      'calls logoff in case of success',
      waitForAsync(() => {
        // Arrange
        const paramToken = 'damien';
        spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(paramToken);
        spyOn(service, 'revokeRefreshToken').and.returnValue(of({ any: 'thing' }));
        spyOn(service, 'revokeAccessToken').and.returnValue(of({ any: 'thing' }));
        const logoffSpy = spyOn(service, 'logoff');

        // Act
        service.logoffAndRevokeTokens('configId').subscribe(() => {
          // Assert
          expect(logoffSpy).toHaveBeenCalled();
        });
      })
    );

    it(
      'calls logoff with urlhandler in case of success',
      waitForAsync(() => {
        // Arrange
        const paramToken = 'damien';
        spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(paramToken);
        spyOn(service, 'revokeRefreshToken').and.returnValue(of({ any: 'thing' }));
        spyOn(service, 'revokeAccessToken').and.returnValue(of({ any: 'thing' }));
        const logoffSpy = spyOn(service, 'logoff');
        const urlHandler = (url) => {};
        // Act
        service.logoffAndRevokeTokens('configId', urlHandler).subscribe(() => {
          // Assert
          expect(logoffSpy).toHaveBeenCalledWith('configId', urlHandler);
        });
      })
    );

    it(
      'calls revokeAccessToken when storage does not hold a refreshtoken',
      waitForAsync(() => {
        // Arrange
        spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(null);
        const revokeRefreshTokenSpy = spyOn(service, 'revokeRefreshToken');
        const revokeAccessTokenSpy = spyOn(service, 'revokeAccessToken').and.returnValue(of({ any: 'thing' }));

        // Act
        service.logoffAndRevokeTokens('configId').subscribe(() => {
          // Assert
          expect(revokeRefreshTokenSpy).not.toHaveBeenCalled();
          expect(revokeAccessTokenSpy).toHaveBeenCalled();
        });
      })
    );

    it(
      'loggs error when revokeaccesstoken throws an error',
      waitForAsync(() => {
        // Arrange
        spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(null);
        const loggerSpy = spyOn(loggerService, 'logError');
        spyOn(service, 'revokeAccessToken').and.returnValue(throwError('FAILUUURE'));

        // Act
        service.logoffAndRevokeTokens('configId').subscribe({
          error: (err) => {
            expect(loggerSpy).toHaveBeenCalled();
            expect(err).toBeTruthy();
          },
        });
      })
    );
  });
});
