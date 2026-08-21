import { HttpHeaders } from '@angular/common/http';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { createRetriableStream } from '../../test/create-retriable-stream.helper';
import { DataService } from '../api/data.service';
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { CheckSessionService } from '../iframe/check-session.service';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { RedirectService } from '../utils/redirect/redirect.service';
import { UrlService } from '../utils/url/url.service';
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
        mockProvider(DataService),
        mockProvider(LoggerService),
        mockProvider(StoragePersistenceService),
        mockProvider(UrlService),
        mockProvider(CheckSessionService),
        mockProvider(ResetAuthDataService),
        mockProvider(RedirectService),
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
      const revocationSpy = vi
        .spyOn(urlService, 'createRevocationEndpointBodyAccessToken')
        .mockReturnValue(undefined as any);
      const config = { configId: 'configId1' };

      vi.spyOn(dataService, 'post').mockReturnValue(of(null));

      // Act
      service.revokeAccessToken(config, paramToken);
      // Assert
      expect(revocationSpy).toHaveBeenCalledTimes(1);
      // Assert
      expect(revocationSpy).toHaveBeenCalledWith(paramToken, config);
    });

    it('uses token parameter from persistence if no param is provided', () => {
      // Arrange
      const paramToken = 'damien';

      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        paramToken
      );
      const revocationSpy = vi
        .spyOn(urlService, 'createRevocationEndpointBodyAccessToken')
        .mockReturnValue(undefined as any);

      vi.spyOn(dataService, 'post').mockReturnValue(of(null));
      const config = { configId: 'configId1' };

      // Act
      service.revokeAccessToken(config);
      // Assert
      expect(revocationSpy).toHaveBeenCalledTimes(1);
      // Assert
      expect(revocationSpy).toHaveBeenCalledWith(paramToken, config);
    });

    it('returns type observable', () => {
      // Arrange
      const paramToken = 'damien';

      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        paramToken
      );
      vi.spyOn(
        urlService,
        'createRevocationEndpointBodyAccessToken'
      ).mockReturnValue(undefined as any);
      vi.spyOn(dataService, 'post').mockReturnValue(of(null));
      const config = { configId: 'configId1' };
      // Act
      const result = service.revokeAccessToken(config);

      // Assert
      expect(result).toEqual(expect.any(Observable));
    });

    it('loggs and returns unmodified response if request is positive', waitForAsync(() => {
      // Arrange
      const paramToken = 'damien';

      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        paramToken
      );
      vi.spyOn(
        urlService,
        'createRevocationEndpointBodyAccessToken'
      ).mockReturnValue(undefined as any);
      const loggerSpy = vi
        .spyOn(loggerService, 'logDebug')
        .mockReturnValue(undefined);

      vi.spyOn(dataService, 'post').mockReturnValue(of({ data: 'anything' }));
      const config = { configId: 'configId1' };

      // Act
      service.revokeAccessToken(config).subscribe((result) => {
        // Assert
        expect(result).toEqual({ data: 'anything' });
        expect(loggerSpy).toHaveBeenCalled();
      });
    }));

    it('loggs error when request is negative', waitForAsync(() => {
      // Arrange
      const paramToken = 'damien';

      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        paramToken
      );
      vi.spyOn(
        urlService,
        'createRevocationEndpointBodyAccessToken'
      ).mockReturnValue(undefined as any);
      const loggerSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);
      const config = { configId: 'configId1' };

      vi.spyOn(dataService, 'post').mockReturnValue(
        throwError(() => new Error('Error'))
      );

      // Act
      service.revokeAccessToken(config).subscribe({
        error: (err) => {
          expect(loggerSpy).toHaveBeenCalled();
          expect(err).toBeTruthy();
        },
      });
    }));

    it('should retry once', waitForAsync(() => {
      // Arrange
      const paramToken = 'damien';

      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        paramToken
      );
      vi.spyOn(
        urlService,
        'createRevocationEndpointBodyAccessToken'
      ).mockReturnValue(undefined as any);
      const loggerSpy = vi
        .spyOn(loggerService, 'logDebug')
        .mockReturnValue(undefined);
      const config = { configId: 'configId1' };

      vi.spyOn(dataService, 'post').mockReturnValue(
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
    }));

    it('should retry twice', waitForAsync(() => {
      // Arrange
      const paramToken = 'damien';

      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        paramToken
      );
      vi.spyOn(
        urlService,
        'createRevocationEndpointBodyAccessToken'
      ).mockReturnValue(undefined as any);
      const loggerSpy = vi
        .spyOn(loggerService, 'logDebug')
        .mockReturnValue(undefined);
      const config = { configId: 'configId1' };

      vi.spyOn(dataService, 'post').mockReturnValue(
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
    }));

    it('should fail after three tries', waitForAsync(() => {
      // Arrange
      const paramToken = 'damien';

      vi.spyOn(storagePersistenceService, 'getAccessToken').mockReturnValue(
        paramToken
      );
      vi.spyOn(
        urlService,
        'createRevocationEndpointBodyAccessToken'
      ).mockReturnValue(undefined as any);
      const loggerSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);
      const config = { configId: 'configId1' };

      vi.spyOn(dataService, 'post').mockReturnValue(
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
    }));
  });

  describe('revokeRefreshToken', () => {
    it('uses refresh token parameter if token as parameter is passed in the method', () => {
      // Arrange
      const paramToken = 'passedTokenAsParam';
      const revocationSpy = vi
        .spyOn(urlService, 'createRevocationEndpointBodyRefreshToken')
        .mockReturnValue(undefined as any);

      vi.spyOn(dataService, 'post').mockReturnValue(of(null));
      const config = { configId: 'configId1' };

      // Act
      service.revokeRefreshToken(config, paramToken);
      // Assert
      expect(revocationSpy).toHaveBeenCalledTimes(1);
      // Assert
      expect(revocationSpy).toHaveBeenCalledWith(paramToken, config);
    });

    it('uses refresh token parameter from persistence if no param is provided', () => {
      // Arrange
      const paramToken = 'damien';

      vi.spyOn(storagePersistenceService, 'getRefreshToken').mockReturnValue(
        paramToken
      );
      const config = { configId: 'configId1' };
      const revocationSpy = vi
        .spyOn(urlService, 'createRevocationEndpointBodyRefreshToken')
        .mockReturnValue(undefined as any);

      vi.spyOn(dataService, 'post').mockReturnValue(of(null));
      // Act
      service.revokeRefreshToken(config);
      // Assert
      expect(revocationSpy).toHaveBeenCalledTimes(1);
      // Assert
      expect(revocationSpy).toHaveBeenCalledWith(paramToken, config);
    });

    it('returns type observable', () => {
      // Arrange
      const paramToken = 'damien';

      vi.spyOn(storagePersistenceService, 'getRefreshToken').mockReturnValue(
        paramToken
      );
      vi.spyOn(
        urlService,
        'createRevocationEndpointBodyAccessToken'
      ).mockReturnValue(undefined as any);
      vi.spyOn(dataService, 'post').mockReturnValue(of(null));
      const config = { configId: 'configId1' };
      // Act
      const result = service.revokeRefreshToken(config);

      // Assert
      expect(result).toEqual(expect.any(Observable));
    });

    it('loggs and returns unmodified response if request is positive', waitForAsync(() => {
      // Arrange
      const paramToken = 'damien';

      vi.spyOn(storagePersistenceService, 'getRefreshToken').mockReturnValue(
        paramToken
      );
      vi.spyOn(
        urlService,
        'createRevocationEndpointBodyAccessToken'
      ).mockReturnValue(undefined as any);
      const loggerSpy = vi
        .spyOn(loggerService, 'logDebug')
        .mockReturnValue(undefined);

      vi.spyOn(dataService, 'post').mockReturnValue(of({ data: 'anything' }));
      const config = { configId: 'configId1' };

      // Act
      service.revokeRefreshToken(config).subscribe((result) => {
        // Assert
        expect(result).toEqual({ data: 'anything' });
        expect(loggerSpy).toHaveBeenCalled();
      });
    }));

    it('loggs error when request is negative', waitForAsync(() => {
      // Arrange
      const paramToken = 'damien';

      vi.spyOn(storagePersistenceService, 'getRefreshToken').mockReturnValue(
        paramToken
      );
      vi.spyOn(
        urlService,
        'createRevocationEndpointBodyAccessToken'
      ).mockReturnValue(undefined as any);
      const loggerSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);
      const config = { configId: 'configId1' };

      vi.spyOn(dataService, 'post').mockReturnValue(
        throwError(() => new Error('Error'))
      );

      // Act
      service.revokeRefreshToken(config).subscribe({
        error: (err) => {
          expect(loggerSpy).toHaveBeenCalled();
          expect(err).toBeTruthy();
        },
      });
    }));

    it('should retry once', waitForAsync(() => {
      // Arrange
      const paramToken = 'damien';

      vi.spyOn(storagePersistenceService, 'getRefreshToken').mockReturnValue(
        paramToken
      );
      vi.spyOn(
        urlService,
        'createRevocationEndpointBodyAccessToken'
      ).mockReturnValue(undefined as any);
      const loggerSpy = vi
        .spyOn(loggerService, 'logDebug')
        .mockReturnValue(undefined);
      const config = { configId: 'configId1' };

      vi.spyOn(dataService, 'post').mockReturnValue(
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
    }));

    it('should retry twice', waitForAsync(() => {
      // Arrange
      const paramToken = 'damien';

      vi.spyOn(storagePersistenceService, 'getRefreshToken').mockReturnValue(
        paramToken
      );
      vi.spyOn(
        urlService,
        'createRevocationEndpointBodyAccessToken'
      ).mockReturnValue(undefined as any);
      const loggerSpy = vi
        .spyOn(loggerService, 'logDebug')
        .mockReturnValue(undefined);
      const config = { configId: 'configId1' };

      vi.spyOn(dataService, 'post').mockReturnValue(
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
    }));

    it('should fail after three tries', waitForAsync(() => {
      // Arrange
      const paramToken = 'damien';

      vi.spyOn(storagePersistenceService, 'getRefreshToken').mockReturnValue(
        paramToken
      );
      vi.spyOn(
        urlService,
        'createRevocationEndpointBodyAccessToken'
      ).mockReturnValue(undefined as any);
      const loggerSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);
      const config = { configId: 'configId1' };

      vi.spyOn(dataService, 'post').mockReturnValue(
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
    }));
  });

  describe('logoff', () => {
    it('logs and returns if `endSessionUrl` is false', waitForAsync(() => {
      // Arrange
      vi.spyOn(urlService, 'getEndSessionUrl').mockReturnValue('');

      const serverStateChangedSpy = vi
        .spyOn(checkSessionService, 'serverStateChanged')
        .mockReturnValue(undefined as any);
      const config = { configId: 'configId1' };
      // Act
      const result$ = service.logoff(config, [config]);

      // Assert
      result$.subscribe(() => {
        expect(serverStateChangedSpy).not.toHaveBeenCalled();
      });
    }));

    it('logs and returns if `serverStateChanged` is true', waitForAsync(() => {
      // Arrange
      vi.spyOn(urlService, 'getEndSessionUrl').mockReturnValue('someValue');
      const redirectSpy = vi
        .spyOn(redirectService, 'redirectTo')
        .mockReturnValue(undefined);

      vi.spyOn(checkSessionService, 'serverStateChanged').mockReturnValue(true);
      const config = { configId: 'configId1' };
      // Act
      const result$ = service.logoff(config, [config]);

      // Assert
      result$.subscribe(() => {
        expect(redirectSpy).not.toHaveBeenCalled();
      });
    }));

    it('calls urlHandler if urlhandler is passed', waitForAsync(() => {
      // Arrange
      vi.spyOn(urlService, 'getEndSessionUrl').mockReturnValue('someValue');
      const spy = vi.fn();
      const urlHandler = (url: string): void => {
        spy(url);
      };
      const redirectSpy = vi
        .spyOn(redirectService, 'redirectTo')
        .mockReturnValue(undefined);
      const resetAuthorizationDataSpy = vi
        .spyOn(resetAuthDataService, 'resetAuthorizationData')
        .mockReturnValue(undefined);

      vi.spyOn(checkSessionService, 'serverStateChanged').mockReturnValue(
        false
      );
      const config = { configId: 'configId1' };
      // Act
      const result$ = service.logoff(config, [config], { urlHandler });

      // Assert
      result$.subscribe(() => {
        expect(redirectSpy).not.toHaveBeenCalled();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith('someValue');
        expect(resetAuthorizationDataSpy).toHaveBeenCalled();
      });
    }));

    it('calls redirect service if no logoutOptions are passed', waitForAsync(() => {
      // Arrange
      vi.spyOn(urlService, 'getEndSessionUrl').mockReturnValue('someValue');

      const redirectSpy = vi
        .spyOn(redirectService, 'redirectTo')
        .mockReturnValue(undefined);

      vi.spyOn(checkSessionService, 'serverStateChanged').mockReturnValue(
        false
      );
      const config = { configId: 'configId1' };
      // Act
      const result$ = service.logoff(config, [config]);

      // Assert
      result$.subscribe(() => {
        expect(redirectSpy).toHaveBeenCalledTimes(1);
        expect(redirectSpy).toHaveBeenCalledWith('someValue');
      });
    }));

    it('calls redirect service if logoutOptions are passed and method is GET', waitForAsync(() => {
      // Arrange
      vi.spyOn(urlService, 'getEndSessionUrl').mockReturnValue('someValue');

      const redirectSpy = vi
        .spyOn(redirectService, 'redirectTo')
        .mockReturnValue(undefined);

      vi.spyOn(checkSessionService, 'serverStateChanged').mockReturnValue(
        false
      );
      const config = { configId: 'configId1' };
      // Act
      const result$ = service.logoff(config, [config], { logoffMethod: 'GET' });

      // Assert
      result$.subscribe(() => {
        expect(redirectSpy).toHaveBeenCalledTimes(1);
        expect(redirectSpy).toHaveBeenCalledWith('someValue');
      });
    }));

    it('calls dataservice post if logoutOptions are passed and method is POST', waitForAsync(() => {
      // Arrange
      vi.spyOn(urlService, 'getEndSessionUrl').mockReturnValue('someValue');

      const redirectSpy = vi
        .spyOn(redirectService, 'redirectTo')
        .mockReturnValue(undefined);

      vi.spyOn(checkSessionService, 'serverStateChanged').mockReturnValue(
        false
      );
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue(
        'id-token'
      );
      vi.spyOn(urlService, 'getPostLogoutRedirectUrl').mockReturnValue(
        'post-logout-redirect-url'
      );
      vi.spyOn(urlService, 'getEndSessionEndpoint').mockReturnValue({
        url: 'some-url',
        existingParams: '',
      });
      const postSpy = vi.spyOn(dataService, 'post').mockReturnValue(of(null));
      const config = { configId: 'configId1', clientId: 'clientId' };
      // Act
      const result$ = service.logoff(config, [config], {
        logoffMethod: 'POST',
      });

      // Assert
      result$.subscribe(() => {
        expect(redirectSpy).not.toHaveBeenCalled();
        expect(postSpy).toHaveBeenCalledTimes(1);
        expect(postSpy).toHaveBeenCalledWith(
          'some-url',
          {
            id_token_hint: 'id-token',
            client_id: 'clientId',
            post_logout_redirect_uri: 'post-logout-redirect-url',
          },
          config,
          expect.anything()
        );

        const httpHeaders = vi.mocked(postSpy).mock.lastCall![3] as HttpHeaders;

        expect(httpHeaders.has('Content-Type')).toBe(true);
        expect(httpHeaders.get('Content-Type')).toBe(
          'application/x-www-form-urlencoded'
        );
      });
    }));

    it('calls dataservice post if logoutOptions with customParams are passed and method is POST', waitForAsync(() => {
      // Arrange
      vi.spyOn(urlService, 'getEndSessionUrl').mockReturnValue('someValue');

      const redirectSpy = vi
        .spyOn(redirectService, 'redirectTo')
        .mockReturnValue(undefined);

      vi.spyOn(checkSessionService, 'serverStateChanged').mockReturnValue(
        false
      );
      vi.spyOn(storagePersistenceService, 'getIdToken').mockReturnValue(
        'id-token'
      );
      vi.spyOn(urlService, 'getPostLogoutRedirectUrl').mockReturnValue(
        'post-logout-redirect-url'
      );
      vi.spyOn(urlService, 'getEndSessionEndpoint').mockReturnValue({
        url: 'some-url',
        existingParams: '',
      });
      const postSpy = vi.spyOn(dataService, 'post').mockReturnValue(of(null));
      const config = { configId: 'configId1', clientId: 'clientId' };
      // Act
      const result$ = service.logoff(config, [config], {
        logoffMethod: 'POST',
        customParams: {
          state: 'state',
          logout_hint: 'logoutHint',
          ui_locales: 'de fr en',
        },
      });

      // Assert
      result$.subscribe(() => {
        expect(redirectSpy).not.toHaveBeenCalled();
        expect(postSpy).toHaveBeenCalledTimes(1);
        expect(postSpy).toHaveBeenCalledWith(
          'some-url',
          {
            id_token_hint: 'id-token',
            client_id: 'clientId',
            post_logout_redirect_uri: 'post-logout-redirect-url',
            state: 'state',
            logout_hint: 'logoutHint',
            ui_locales: 'de fr en',
          },
          config,
          expect.anything()
        );

        const httpHeaders = vi.mocked(postSpy).mock.lastCall![3] as HttpHeaders;

        expect(httpHeaders.has('Content-Type')).toBe(true);
        expect(httpHeaders.get('Content-Type')).toBe(
          'application/x-www-form-urlencoded'
        );
      });
    }));
  });

  describe('logoffLocal', () => {
    it('calls flowsService.resetAuthorizationData', () => {
      // Arrange
      const resetAuthorizationDataSpy = vi
        .spyOn(resetAuthDataService, 'resetAuthorizationData')
        .mockReturnValue(undefined);
      const config = { configId: 'configId1' };

      // Act
      service.logoffLocal(config, [config]);

      // Assert
      expect(resetAuthorizationDataSpy).toHaveBeenCalled();
    });
  });

  describe('logoffAndRevokeTokens', () => {
    it('calls revokeRefreshToken and revokeAccessToken when storage holds a refreshtoken', waitForAsync(() => {
      // Arrange
      const paramToken = 'damien';
      const config = { configId: 'configId1' };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { revocationEndpoint: 'revocationEndpoint' };
          }

          return undefined;
        }
      );
      vi.spyOn(storagePersistenceService, 'getRefreshToken').mockReturnValue(
        paramToken
      );
      const revokeRefreshTokenSpy = vi
        .spyOn(service, 'revokeRefreshToken')
        .mockReturnValue(of({ any: 'thing' }));
      const revokeAccessTokenSpy = vi
        .spyOn(service, 'revokeAccessToken')
        .mockReturnValue(of({ any: 'thing' }));

      // Act
      service.logoffAndRevokeTokens(config, [config]).subscribe(() => {
        // Assert
        expect(revokeRefreshTokenSpy).toHaveBeenCalled();
        expect(revokeAccessTokenSpy).toHaveBeenCalled();
      });
    }));

    it('logs error when revokeaccesstoken throws an error', waitForAsync(() => {
      // Arrange
      const paramToken = 'damien';
      const config = { configId: 'configId1' };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { revocationEndpoint: 'revocationEndpoint' };
          }

          return undefined;
        }
      );
      vi.spyOn(storagePersistenceService, 'getRefreshToken').mockReturnValue(
        paramToken
      );
      vi.spyOn(service, 'revokeRefreshToken').mockReturnValue(
        of({ any: 'thing' })
      );
      const loggerSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);

      vi.spyOn(service, 'revokeAccessToken').mockReturnValue(
        throwError(() => new Error('Error'))
      );

      // Act
      service.logoffAndRevokeTokens(config, [config]).subscribe({
        error: (err) => {
          expect(loggerSpy).toHaveBeenCalled();
          expect(err).toBeTruthy();
        },
      });
    }));

    it('calls logoff in case of success', waitForAsync(() => {
      // Arrange
      const paramToken = 'damien';

      vi.spyOn(storagePersistenceService, 'getRefreshToken').mockReturnValue(
        paramToken
      );
      vi.spyOn(service, 'revokeRefreshToken').mockReturnValue(
        of({ any: 'thing' })
      );
      vi.spyOn(service, 'revokeAccessToken').mockReturnValue(
        of({ any: 'thing' })
      );
      const logoffSpy = vi.spyOn(service, 'logoff').mockReturnValue(of(null));
      const config = { configId: 'configId1' };

      // Act
      service.logoffAndRevokeTokens(config, [config]).subscribe(() => {
        // Assert
        expect(logoffSpy).toHaveBeenCalled();
      });
    }));

    it('calls logoff with urlhandler in case of success', waitForAsync(() => {
      // Arrange
      const paramToken = 'damien';

      vi.spyOn(storagePersistenceService, 'getRefreshToken').mockReturnValue(
        paramToken
      );
      vi.spyOn(service, 'revokeRefreshToken').mockReturnValue(
        of({ any: 'thing' })
      );
      vi.spyOn(service, 'revokeAccessToken').mockReturnValue(
        of({ any: 'thing' })
      );
      const logoffSpy = vi.spyOn(service, 'logoff').mockReturnValue(of(null));
      const urlHandler = (_url: string): void => undefined;
      const config = { configId: 'configId1' };

      // Act
      service
        .logoffAndRevokeTokens(config, [config], { urlHandler })
        .subscribe(() => {
          // Assert
          expect(logoffSpy).toHaveBeenCalledTimes(1);
          // Assert
          expect(logoffSpy).toHaveBeenCalledWith(config, [config], {
            urlHandler,
          });
        });
    }));

    it('calls revokeAccessToken when storage does not hold a refreshtoken', waitForAsync(() => {
      // Arrange
      const config = { configId: 'configId1' };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { revocationEndpoint: 'revocationEndpoint' };
          }

          return undefined;
        }
      );

      vi.spyOn(storagePersistenceService, 'getRefreshToken').mockReturnValue(
        ''
      );
      const revokeRefreshTokenSpy = vi
        .spyOn(service, 'revokeRefreshToken')
        .mockReturnValue(undefined as any);
      const revokeAccessTokenSpy = vi
        .spyOn(service, 'revokeAccessToken')
        .mockReturnValue(of({ any: 'thing' }));

      // Act
      service.logoffAndRevokeTokens(config, [config]).subscribe(() => {
        // Assert
        expect(revokeRefreshTokenSpy).not.toHaveBeenCalled();
        expect(revokeAccessTokenSpy).toHaveBeenCalled();
      });
    }));

    it('logs error when revokeaccesstoken throws an error', waitForAsync(() => {
      // Arrange
      const config = { configId: 'configId1' };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { revocationEndpoint: 'revocationEndpoint' };
          }

          return undefined;
        }
      );
      vi.spyOn(storagePersistenceService, 'getRefreshToken').mockReturnValue(
        ''
      );
      const loggerSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);

      vi.spyOn(service, 'revokeAccessToken').mockReturnValue(
        throwError(() => new Error('Error'))
      );

      // Act
      service.logoffAndRevokeTokens(config, [config]).subscribe({
        error: (err) => {
          expect(loggerSpy).toHaveBeenCalled();
          expect(err).toBeTruthy();
        },
      });
    }));
  });

  describe('logoffLocalMultiple', () => {
    it('calls logoffLocal for every config which is present', () => {
      // Arrange
      const allConfigs = [{ configId: 'configId1' }, { configId: 'configId2' }];
      const resetAuthorizationDataSpy = vi
        .spyOn(resetAuthDataService, 'resetAuthorizationData')
        .mockReturnValue(undefined);
      const checkSessionServiceSpy = vi
        .spyOn(checkSessionService, 'stop')
        .mockReturnValue(undefined);

      // Act
      service.logoffLocalMultiple(allConfigs);

      // Assert
      expect(resetAuthorizationDataSpy).toHaveBeenCalledTimes(2);
      expect(checkSessionServiceSpy).toHaveBeenCalledTimes(2);
      expect(vi.mocked(resetAuthorizationDataSpy).mock.calls).toEqual([
        [allConfigs[0], allConfigs],
        [allConfigs[1], allConfigs],
      ]);
    });
  });
});
