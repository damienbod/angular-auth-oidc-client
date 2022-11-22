import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { CryptoService } from './crypto.service';

describe('CryptoService: crypto', () => {
  let cryptoService: CryptoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CryptoService, { provide: DOCUMENT, useValue: { defaultView: { crypto: 'some-thing' } } }],
    });
  });

  beforeEach(() => {
    cryptoService = TestBed.inject(CryptoService);
  });

  it('should create', () => {
    expect(cryptoService).toBeTruthy();
  });

  it('should return crypto if crypto is present', () => {
    // arrange

    // act
    const crypto = cryptoService.getCrypto();

    // assert
    expect(crypto).toBe('some-thing');
  });
});

describe('CryptoService: msCrypto', () => {
  let cryptoService: CryptoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CryptoService, { provide: DOCUMENT, useValue: { defaultView: { msCrypto: 'some-msCrypto-thing' } } }],
    });
  });

  beforeEach(() => {
    cryptoService = TestBed.inject(CryptoService);
  });

  it('should create', () => {
    expect(cryptoService).toBeTruthy();
  });

  it('should return crypto if crypto is present', () => {
    // arrange

    // act
    const crypto = cryptoService.getCrypto();

    // assert
    expect(crypto).toBe('some-msCrypto-thing');
  });
});
