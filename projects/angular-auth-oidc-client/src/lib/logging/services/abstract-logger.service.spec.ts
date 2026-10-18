import { describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AbstractLoggerService } from './abstract-logger.service';
import { ConsoleLoggerService } from './console-logger.service';

describe('AbstractLoggerService', () => {
  it('should default to the ConsoleLoggerService without a provider', () => {
    TestBed.configureTestingModule({});

    expect(TestBed.inject(AbstractLoggerService)).toBeInstanceOf(
      ConsoleLoggerService
    );
  });
});
