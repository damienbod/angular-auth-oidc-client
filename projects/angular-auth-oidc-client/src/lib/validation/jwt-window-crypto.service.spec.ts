import { TestBed, waitForAsync } from '@angular/core/testing';
import { TestScheduler } from 'rxjs/testing';
import { CryptoService } from '../utils/crypto/crypto-service';
import { JwtWindowCryptoService } from './jwt-window-crypto.service';

describe('JwtWindowCryptoService', () => {
  let service: JwtWindowCryptoService;
  let testScheduler: TestScheduler;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [JwtWindowCryptoService, CryptoService],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(JwtWindowCryptoService);
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toBe(expected);
    });
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('generateCodeChallenge', () => {
    it(
      'returns good result with correct codeVerifier',
      waitForAsync(() => {
        const outcome = 'R2TWD45Vtcf_kfAqjuE3LMSRF3JDE5fsFndnn6-a0nQ';
        const observable = service.generateCodeChallenge('44445543344242132145455aaabbdc3b4');

        observable.subscribe((value) => {
          expect(value).toBe(outcome);
        });
      })
    );
  });
});
