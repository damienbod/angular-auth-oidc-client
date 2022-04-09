import { TestBed } from '@angular/core/testing';
import { mockClass } from '../../../test/auto-mock';
import { AbstractLoggerService } from '../../logging/abstract-logger.service';
import { LoggerService } from '../../logging/logger.service';
import { CryptoService } from '../../utils/crypto/crypto-service';
import { RandomService } from './random.service';

describe('RandomService Tests', () => {
  let randomService: RandomService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RandomService, { provide: AbstractLoggerService, useClass: mockClass(LoggerService) }, CryptoService],
    });
  });

  beforeEach(() => {
    randomService = TestBed.inject(RandomService);
  });

  it('should create', () => {
    expect(randomService).toBeTruthy();
  });

  it('should be not equal', () => {
    const r1 = randomService.createRandom(45, { configId: 'configId1' });
    const r2 = randomService.createRandom(45, { configId: 'configId1' });
    expect(r1).not.toEqual(r2);
  });

  it('correct length with high number', () => {
    const r1 = randomService.createRandom(79, { configId: 'configId1' });
    const result = r1.length;
    expect(result).toBe(79);
  });

  it('correct length with small number', () => {
    const r1 = randomService.createRandom(7, { configId: 'configId1' });
    const result = r1.length;
    expect(result).toBe(7);
  });

  it('correct length with 0', () => {
    const r1 = randomService.createRandom(0, { configId: 'configId1' });
    const result = r1.length;
    expect(result).toBe(0);
    expect(r1).toBe('');
  });

  for (let index = 1; index < 7; index++) {
    it('Giving back 10 or more characters when called with numbers less than 7', () => {
      const requiredLengthSmallerThenSeven = index;
      const fallbackLength = 10;
      const r1 = randomService.createRandom(requiredLengthSmallerThenSeven, { configId: 'configId1' });
      expect(r1.length).toBeGreaterThanOrEqual(fallbackLength);
    });
  }
});
