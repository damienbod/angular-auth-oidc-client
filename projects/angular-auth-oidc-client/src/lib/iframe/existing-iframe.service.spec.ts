import { beforeEach, describe, expect, it } from 'vitest';
import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { mockProvider } from '../../test/auto-mock';
import { LoggerService } from '../logging/logger.service';
import { IFrameService } from './existing-iframe.service';

describe('IFrameService', () => {
  let service: IFrameService;

  describe('getExistingIFrame - found on parent window', () => {
    let iframe: HTMLIFrameElement;

    beforeEach(() => {
      iframe = document.createElement('iframe');
      iframe.id = 'iframeId';

      TestBed.configureTestingModule({
        providers: [
          mockProvider(LoggerService),
          {
            provide: DOCUMENT,
            useValue: {
              defaultView: {
                parent: {
                  document: { getElementById: (): HTMLIFrameElement => iframe },
                },
              },
              getElementById: (): null => null,
            },
          },
        ],
      });
      service = TestBed.inject(IFrameService);
    });

    it('returns the iframe found on the parent window', () => {
      const result = service.getExistingIFrame('iframeId');

      expect(result).toBe(iframe);
    });
  });

  describe('getExistingIFrame - parent window access throws', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          mockProvider(LoggerService),
          {
            provide: DOCUMENT,
            useValue: {
              defaultView: {
                get parent(): never {
                  throw new Error('cross-origin access blocked');
                },
              },
              getElementById: (): null => null,
            },
          },
        ],
      });
      service = TestBed.inject(IFrameService);
    });

    it('returns null when accessing the parent window throws', () => {
      const result = service.getExistingIFrame('iframeId');

      expect(result).toBeNull();
    });
  });
});
