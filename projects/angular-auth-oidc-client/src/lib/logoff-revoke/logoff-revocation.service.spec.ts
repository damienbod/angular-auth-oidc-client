import { TestBed, waitForAsync } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { mockClass } from '../../test/auto-mock';
import { createRetriableStream } from '../../test/create-retriable-stream.helper';
import { DataService } from '../api/data.service';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { CheckSessionService } from '../iframe/check-session.service';
import { AbstractLoggerService } from '../logging/abstract-logger.service';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { UrlService } from '../utils/url/url.service';
import { RedirectService } from './../utils/redirect/redirect.service';
import { LogoffRevocationService } from './logoff-revocation.service';

describe('Logout and Revoke Service', () => {
  let service: LogoffRevocationService;
  let dataService: DataService;
  let loggerService: AbstractLoggerService;
  let storagePersistenceService: StoragePersistenceService;
  let urlService: UrlService;
  let checkSessionService: CheckSessionService;
  let resetAuthDataService: ResetAuthDataService;
  let redirectService: RedirectService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LogoffRevocationService,
        { provide: DataService, useClass: mockClass(DataService) },
        { provide: AbstractLoggerService, useClass: mockClass(LoggerService) },
        { provide: StoragePersistenceService, useClass: mockClass(StoragePersistenceService) },
        { provide: UrlService, useClass: mockClass(UrlService) },
        { provide: CheckSessionService, useClass: mockClass(CheckSessionService) },
        { provide: ResetAuthDataService, useClass: mockClass(ResetAuthDataService) },
        { provide: RedirectService, useClass: mockClass(RedirectService) },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(LogoffRevocationService);
    dataService = TestBed.inject(DataService);
    loggerService = TestBed.inject(AbstractLoggerService);
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
      const config = { configId: 'configId1' };
      spyOn(dataService, 'post').and.returnValue(of(null));

      // Act
      service.revokeAccessToken(config, paramToken);
      // Assert
      expect(revocationSpy).toHaveBeenCalledOnceWith(paramToken, config);
    });

    it('uses token parameter from persistence if no param is provided', () => {
      // Arrange
      const paramToken = 'damien';
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue(paramToken);
      const revocationSpy = spyOn(urlService, 'createRevocationEndpointBodyAccessToken');
      spyOn(dataService, 'post').and.returnValue(of(null));
      const config = { configId: 'configId1' };

      // Act
      service.revokeAccessToken(config);
      // Assert
      expect(revocationSpy).toHaveBeenCalledOnceWith(paramToken, config);
    });

    it('returns type observable', () => {
      // Arrange
      const paramToken = 'damien';
      spyOn(storagePersistenceService, 'getAccessToken').and.returnValue(paramToken);
      spyOn(urlService, 'createRevocationEndpointBodyAccessToken');
      spyOn(dataService, 'post').and.returnValue(of(null));
      const config = { configId: 'configId1' };

      // Act
      const result = service.revokeAccessToken(config);

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
        const config = { configId: 'configId1' };

        // Act
        service.revokeAccessToken(config).subscribe((result) => {
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
        const config = { configId: 'configId1' };
        spyOn(dataService, 'post').and.returnValue(throwError(() => new Error('Error')));

        // Act
        service.revokeAccessToken(config).subscribe({
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
        const config = { configId: 'configId1' };
        spyOn(dataService, 'post').and.returnValue(
          createRetriableStream(
            throwError(() => new Error('Error')),
            of({ data: 'anything' })
          )
        );

        service.revokeAccessToken(config).subscribe({
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
        const config = { configId: 'configId1' };
        spyOn(dataService, 'post').and.returnValue(
          createRetriableStream(
            throwError(() => new Error('Error')),
            throwError(() => new Error('Error')),
            of({ data: 'anything' })
          )
        );

        service.revokeAccessToken(config).subscribe({
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
        const config = { configId: 'configId1' };
        spyOn(dataService, 'post').and.returnValue(
          createRetriableStream(
            throwError(() => new Error('Error')),
            throwError(() => new Error('Error')),
            throwError(() => new Error('Error')),
            of({ data: 'anything' })
          )
        );

        service.revokeAccessToken(config).subscribe({
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
      spyOn(dataService, 'post').and.returnValue(of(null));
      const config = { configId: 'configId1' };

      // Act
      service.revokeRefreshToken(config, paramToken);
      // Assert
      expect(revocationSpy).toHaveBeenCalledOnceWith(paramToken, config);
    });

    it('uses refresh token parameter from persistence if no param is provided', () => {
      // Arrange
      const paramToken = 'damien';
      spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(paramToken);
      const config = { configId: 'configId1' };
      const revocationSpy = spyOn(urlService, 'createRevocationEndpointBodyRefreshToken');
      spyOn(dataService, 'post').and.returnValue(of(null));
      // Act
      service.revokeRefreshToken(config);
      // Assert
      expect(revocationSpy).toHaveBeenCalledOnceWith(paramToken, config);
    });

    it('returns type observable', () => {
      // Arrange
      const paramToken = 'damien';
      spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(paramToken);
      spyOn(urlService, 'createRevocationEndpointBodyAccessToken');
      spyOn(dataService, 'post').and.returnValue(of(null));
      const config = { configId: 'configId1' };

      // Act
      const result = service.revokeRefreshToken(config);

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
        const config = { configId: 'configId1' };

        // Act
        service.revokeRefreshToken(config).subscribe((result) => {
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
        const config = { configId: 'configId1' };
        spyOn(dataService, 'post').and.returnValue(throwError(() => new Error('Error')));

        // Act
        service.revokeRefreshToken(config).subscribe({
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
        const config = { configId: 'configId1' };
        spyOn(dataService, 'post').and.returnValue(
          createRetriableStream(
            throwError(() => new Error('Error')),
            of({ data: 'anything' })
          )
        );

        service.revokeRefreshToken(config).subscribe({
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
        const config = { configId: 'configId1' };
        spyOn(dataService, 'post').and.returnValue(
          createRetriableStream(
            throwError(() => new Error('Error')),
            throwError(() => new Error('Error')),
            of({ data: 'anything' })
          )
        );

        service.revokeRefreshToken(config).subscribe({
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
        const config = { configId: 'configId1' };
        spyOn(dataService, 'post').and.returnValue(
          createRetriableStream(
            throwError(() => new Error('Error')),
            throwError(() => new Error('Error')),
            throwError(() => new Error('Error')),
            of({ data: 'anything' })
          )
        );

        service.revokeRefreshToken(config).subscribe({
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
      const config = { configId: 'configId1' };

      // Act
      service.getEndSessionUrl(config);
      // Assert
      expect(revocationSpy).toHaveBeenCalledOnceWith(paramToken, config, {});
    });
  });

  describe('logoff', () => {
    it('logs and returns if `endSessionUrl` is false', () => {
      // Arrange
      spyOn(service, 'getEndSessionUrl').and.returnValue('');
      const serverStateChangedSpy = spyOn(checkSessionService, 'serverStateChanged');
      const config = { configId: 'configId1' };

      // Act
      service.logoff(config, [config]);
      // Assert
      expect(serverStateChangedSpy).not.toHaveBeenCalled();
    });

    it('logs and returns if `serverStateChanged` is true', () => {
      // Arrange
      spyOn(service, 'getEndSessionUrl').and.returnValue('someValue');
      const redirectSpy = spyOn(redirectService, 'redirectTo');
      spyOn(checkSessionService, 'serverStateChanged').and.returnValue(true);
      const config = { configId: 'configId1' };

      // Act
      service.logoff(config, [config]);
      // Assert
      expect(redirectSpy).not.toHaveBeenCalled();
    });

    it('calls urlHandler if urlhandler is passed', () => {
      // Arrange
      spyOn(service, 'getEndSessionUrl').and.returnValue('someValue');
      const spy = jasmine.createSpy();
      const urlHandler = (url): void => {
        spy(url);
      };
      const redirectSpy = spyOn(redirectService, 'redirectTo');
      spyOn(checkSessionService, 'serverStateChanged').and.returnValue(false);
      const config = { configId: 'configId1' };

      // Act
      service.logoff(config, [config], { urlHandler });

      // Assert
      expect(redirectSpy).not.toHaveBeenCalled();
      expect(spy).toHaveBeenCalledOnceWith('someValue');
    });

    it('calls redirect service if no urlhandler is passed', () => {
      // Arrange
      spyOn(service, 'getEndSessionUrl').and.returnValue('someValue');

      const redirectSpy = spyOn(redirectService, 'redirectTo');
      spyOn(checkSessionService, 'serverStateChanged').and.returnValue(false);
      const config = { configId: 'configId1' };

      // Act
      service.logoff(config, [config]);

      // Assert
      expect(redirectSpy).toHaveBeenCalledOnceWith('someValue');
    });
  });

  describe('logoffLocal', () => {
    it('calls flowsService.resetAuthorizationData', () => {
      // Arrange
      const resetAuthorizationDataSpy = spyOn(resetAuthDataService, 'resetAuthorizationData');
      const config = { configId: 'configId1' };

      // Act
      service.logoffLocal(config, [config]);

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
        const config = { configId: 'configId1' };
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', config)
          .and.returnValue({ revocationEndpoint: 'revocationEndpoint' });
        spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(paramToken);
        const revokeRefreshTokenSpy = spyOn(service, 'revokeRefreshToken').and.returnValue(of({ any: 'thing' }));
        const revokeAccessTokenSpy = spyOn(service, 'revokeAccessToken').and.returnValue(of({ any: 'thing' }));

        // Act
        service.logoffAndRevokeTokens(config, [config]).subscribe(() => {
          // Assert
          expect(revokeRefreshTokenSpy).toHaveBeenCalled();
          expect(revokeAccessTokenSpy).toHaveBeenCalled();
        });
      })
    );

    it(
      'logs error when revokeaccesstoken throws an error',
      waitForAsync(() => {
        // Arrange
        const paramToken = 'damien';
        const config = { configId: 'configId1' };
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', config)
          .and.returnValue({ revocationEndpoint: 'revocationEndpoint' });
        spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(paramToken);
        spyOn(service, 'revokeRefreshToken').and.returnValue(of({ any: 'thing' }));
        const loggerSpy = spyOn(loggerService, 'logError');

        spyOn(service, 'revokeAccessToken').and.returnValue(throwError(() => new Error('Error')));

        // Act
        service.logoffAndRevokeTokens(config, [config]).subscribe({
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
        const config = { configId: 'configId1' };

        // Act
        service.logoffAndRevokeTokens(config, [config]).subscribe(() => {
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
        const urlHandler = (_url): void => {};
        const config = { configId: 'configId1' };

        // Act
        service.logoffAndRevokeTokens(config, [config], { urlHandler }).subscribe(() => {
          // Assert
          expect(logoffSpy).toHaveBeenCalledOnceWith(config, [config], { urlHandler });
        });
      })
    );

    it(
      'calls revokeAccessToken when storage does not hold a refreshtoken',
      waitForAsync(() => {
        // Arrange
        const config = { configId: 'configId1' };
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', config)
          .and.returnValue({ revocationEndpoint: 'revocationEndpoint' });

        spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(null);
        const revokeRefreshTokenSpy = spyOn(service, 'revokeRefreshToken');
        const revokeAccessTokenSpy = spyOn(service, 'revokeAccessToken').and.returnValue(of({ any: 'thing' }));

        // Act
        service.logoffAndRevokeTokens(config, [config]).subscribe(() => {
          // Assert
          expect(revokeRefreshTokenSpy).not.toHaveBeenCalled();
          expect(revokeAccessTokenSpy).toHaveBeenCalled();
        });
      })
    );

    it(
      'logs error when revokeaccesstoken throws an error',
      waitForAsync(() => {
        // Arrange
        const config = { configId: 'configId1' };
        spyOn(storagePersistenceService, 'read')
          .withArgs('authWellKnownEndPoints', config)
          .and.returnValue({ revocationEndpoint: 'revocationEndpoint' });
        spyOn(storagePersistenceService, 'getRefreshToken').and.returnValue(null);
        const loggerSpy = spyOn(loggerService, 'logError');
        spyOn(service, 'revokeAccessToken').and.returnValue(throwError(() => new Error('Error')));

        // Act
        service.logoffAndRevokeTokens(config, [config]).subscribe({
          error: (err) => {
            expect(loggerSpy).toHaveBeenCalled();
            expect(err).toBeTruthy();
          },
        });
      })
    );
  });

  describe('logoffLocalMultiple', () => {
    it('calls logoffLocal for every config which is present', () => {
      // Arrange
      const allConfigs = [{ configId: 'configId1' }, { configId: 'configId2' }];
      const resetAuthorizationDataSpy = spyOn(resetAuthDataService, 'resetAuthorizationData');
      const checkSessionServiceSpy = spyOn(checkSessionService, 'stop');

      // Act
      service.logoffLocalMultiple(allConfigs);

      // Assert
      expect(resetAuthorizationDataSpy).toHaveBeenCalledTimes(2);
      expect(checkSessionServiceSpy).toHaveBeenCalledTimes(2);
      expect(resetAuthorizationDataSpy.calls.allArgs()).toEqual([
        [allConfigs[0], allConfigs],
        [allConfigs[1], allConfigs],
      ]);
    });
  });
});
