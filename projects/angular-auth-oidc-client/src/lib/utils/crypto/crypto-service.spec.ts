import { TestBed } from '@angular/core/testing';
import { CryptoService } from './crypto-service';

describe('CryptoService Tests', () => {
  let cryptoService: CryptoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CryptoService],
    });
  });

  beforeEach(() => {
    cryptoService = TestBed.inject(CryptoService);
  });

  it('should create', () => {
    expect(cryptoService).toBeTruthy();
  });
});
