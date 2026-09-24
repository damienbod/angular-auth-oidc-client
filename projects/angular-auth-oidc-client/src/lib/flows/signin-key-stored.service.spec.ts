import { TestBed, waitForAsync } from '@angular/core/testing';
import { mockProvider } from '../../test/auto-mock';
import { JwkExtractor } from '../extractors/jwk.extractor';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { TokenHelperService } from '../utils/tokenHelper/token-helper.service';
import { JwtKeys } from '../validation/jwtkeys';
import { SigninKeyStoredService } from './signin-key-stored.service';

const DUMMY_JWT_KEYS: JwtKeys = {
  keys: [
    {
      kty: 'RSA',
      use: 'sig',
      kid: 'some-kid',
      x5t: 'some-x5t',
      e: 'AQAB',
      n: 'some-n',
      x5c: ['some-x5c'],
    },
  ],
};

describe('SigninKeyStoredService', () => {
  let service: SigninKeyStoredService;
  let storagePersistenceService: StoragePersistenceService;
  let tokenHelperService: TokenHelperService;
  let jwkExtractor: JwkExtractor;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SigninKeyStoredService,
        mockProvider(StoragePersistenceService),
        mockProvider(TokenHelperService),
        mockProvider(JwkExtractor),
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(SigninKeyStoredService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
    tokenHelperService = TestBed.inject(TokenHelperService);
    jwkExtractor = TestBed.inject(JwkExtractor);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('getSigningKeys', () => {
    it('should return stored jwt keys when a matching kid is found', waitForAsync(() => {
      spyOn(storagePersistenceService, 'read').and.returnValue(
        DUMMY_JWT_KEYS
      );

      spyOn(tokenHelperService, 'getHeaderFromToken').and.returnValue({
        kid: 'some-kid',
      });

      spyOn(jwkExtractor, 'extractJwk').and.returnValue(
        DUMMY_JWT_KEYS.keys
      );

      service.getSigningKeys('some-token', {} as any).subscribe({
        next: (jwtKeys) => {
          expect(jwtKeys).toEqual(DUMMY_JWT_KEYS);
        },
      });

      expect(tokenHelperService.getHeaderFromToken).toHaveBeenCalledWith(
        'some-token',
        false,
        {} as any
      );

      expect(jwkExtractor.extractJwk).toHaveBeenCalledWith(
        DUMMY_JWT_KEYS.keys,
        { kid: 'some-kid' },
        true
      );
    }));

    it('should throw an error if no token is provided', waitForAsync(() => {
      service.getSigningKeys(undefined, {} as any).subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error).toBeTruthy();
        },
      });
    }));

    it('should throw an error if no stored jwt keys exist', waitForAsync(() => {
      spyOn(storagePersistenceService, 'read').and.returnValue(null);

      service.getSigningKeys('some-token', {} as any).subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.message).toEqual('No stored signing keys');
        },
      });
    }));

    it('should throw an error if no matching kid is found', waitForAsync(() => {
      spyOn(storagePersistenceService, 'read').and.returnValue(
        DUMMY_JWT_KEYS
      );

      spyOn(tokenHelperService, 'getHeaderFromToken').and.returnValue({
        kid: 'unknown-kid',
      });

      spyOn(jwkExtractor, 'extractJwk').and.throwError(
        new Error('No matching key')
      );

      service.getSigningKeys('some-token', {} as any).subscribe({
        next: () => fail('Expected an error'),
        error: (error) => {
          expect(error.message).toEqual('No matching stored signing key');
        },
      });
    }));
  });

  describe('storeSigningKeys', () => {
    it('should store jwt keys', () => {
      const config = {
        configId: 'configId1',
      } as any;
      const writeSpy = spyOn(storagePersistenceService, 'write');

      service.storeSigningKeys(DUMMY_JWT_KEYS, config);

      expect(writeSpy).toHaveBeenCalledOnceWith(
        'jwtKeys',
        DUMMY_JWT_KEYS,
        config
      );
    });
  });
});