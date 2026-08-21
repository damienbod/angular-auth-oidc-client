import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { createRetriableStream } from '../../test/create-retriable-stream.helper';
import { DataService } from '../api/data.service';
import { LoggerService } from '../logging/logger.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { SigninKeyDataService } from './signin-key-data.service';

const DUMMY_JWKS = {
  keys: [
    {
      kid: 'random-id',
      kty: 'RSA',
      alg: 'RS256',
      use: 'sig',
      n: 'some-value',
      e: 'AQAB',
      x5c: ['some-value'],
      x5t: 'some-value',
      'x5t#S256': 'some-value',
    },
  ],
};

describe('Signin Key Data Service', () => {
  let service: SigninKeyDataService;
  let storagePersistenceService: StoragePersistenceService;
  let dataService: DataService;
  let loggerService: LoggerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SigninKeyDataService,
        mockProvider(DataService),
        mockProvider(LoggerService),
        mockProvider(StoragePersistenceService),
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(SigninKeyDataService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    dataService = TestBed.inject(DataService);
    loggerService = TestBed.inject(LoggerService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('getSigningKeys', () => {
    it('throws error when no wellKnownEndpoints given', async () => {
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return null;
          }

          return undefined;
        }
      );
      const result = service.getSigningKeys({ configId: 'configId1' });

      await expect(firstValueFrom(result)).rejects.toBeTruthy();
    });

    it('throws error when no jwksUri given', async () => {
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { jwksUri: null };
          }

          return undefined;
        }
      );
      const result = service.getSigningKeys({ configId: 'configId1' });

      await expect(firstValueFrom(result)).rejects.toBeTruthy();
    });

    it('calls dataservice if jwksurl is given', () => {
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { jwksUri: 'someUrl' };
          }

          return undefined;
        }
      );
      const spy = vi.spyOn(dataService, 'get').mockImplementation(() => of());
      const result = service.getSigningKeys({ configId: 'configId1' });
      let completed = false;

      result.subscribe({
        complete: () => {
          completed = true;
        },
      });

      expect(completed).toBe(true);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('someUrl', {
        configId: 'configId1',
      });
    });

    it('should retry once', async () => {
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { jwksUri: 'someUrl' };
          }

          return undefined;
        }
      );
      vi.spyOn(dataService, 'get').mockReturnValue(
        createRetriableStream(
          throwError(() => new Error('Error')),
          of(DUMMY_JWKS)
        )
      );

      const res = await firstValueFrom(
        service.getSigningKeys({ configId: 'configId1' })
      );

      expect(res).toBeTruthy();
      expect(res).toEqual(DUMMY_JWKS);
    });

    it('should retry twice', async () => {
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { jwksUri: 'someUrl' };
          }

          return undefined;
        }
      );
      vi.spyOn(dataService, 'get').mockReturnValue(
        createRetriableStream(
          throwError(() => new Error('Error')),
          throwError(() => new Error('Error')),
          of(DUMMY_JWKS)
        )
      );

      const res = await firstValueFrom(
        service.getSigningKeys({ configId: 'configId1' })
      );

      expect(res).toBeTruthy();
      expect(res).toEqual(DUMMY_JWKS);
    });

    it('should fail after three tries', async () => {
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return { jwksUri: 'someUrl' };
          }

          return undefined;
        }
      );
      vi.spyOn(dataService, 'get').mockReturnValue(
        createRetriableStream(
          throwError(() => new Error('Error')),
          throwError(() => new Error('Error')),
          throwError(() => new Error('Error')),
          of(DUMMY_JWKS)
        )
      );

      await expect(
        firstValueFrom(service.getSigningKeys({ configId: 'configId1' }))
      ).rejects.toBeTruthy();
    });
  });

  describe('handleErrorGetSigningKeys', () => {
    it('keeps observable if error is catched', () => {
      const result = (service as any).handleErrorGetSigningKeys(
        new HttpResponse()
      );
      const hasTypeObservable = isObservable(result);

      expect(hasTypeObservable).toBe(true);
    });

    it('logs error if error is response', async () => {
      const logSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);

      await expect(
        firstValueFrom(
          (service as any).handleErrorGetSigningKeys(
            new HttpResponse({ status: 400, statusText: 'nono' }),
            { configId: 'configId1' }
          )
        )
      ).rejects.toBeTruthy();
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(
        { configId: 'configId1' },
        '400 - nono {}'
      );
    });

    it('logs error if error is not a response', async () => {
      const logSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);

      await expect(
        firstValueFrom(
          (service as any).handleErrorGetSigningKeys('Just some Error', {
            configId: 'configId1',
          })
        )
      ).rejects.toBeTruthy();
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(
        { configId: 'configId1' },
        'Just some Error'
      );
    });

    it('logs error if error with message property is not a response', async () => {
      const logSpy = vi
        .spyOn(loggerService, 'logError')
        .mockReturnValue(undefined);

      await expect(
        firstValueFrom(
          (service as any).handleErrorGetSigningKeys(
            { message: 'Just some Error' },
            { configId: 'configId1' }
          )
        )
      ).rejects.toBeTruthy();
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith(
        { configId: 'configId1' },
        'Just some Error'
      );
    });
  });
});
