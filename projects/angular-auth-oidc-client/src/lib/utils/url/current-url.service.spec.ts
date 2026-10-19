import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CurrentUrlService } from './current-url.service';

describe('CurrentUrlService with existing Url', () => {
  let service: CurrentUrlService;
  const documentValue = {
    defaultView: { location: 'http://my-url.com?state=my-state' },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
          useValue: documentValue,
        },
      ],
    });

    service = TestBed.inject(CurrentUrlService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('getCurrentUrl', () => {
    it('should return the current URL', () => {
      const currentUrl = service.getCurrentUrl();

      expect(currentUrl).toBe('http://my-url.com?state=my-state');
    });
  });

  describe('getStateParamFromCurrentUrl', () => {
    it('should return null if there is no current URL', () => {
      vi.spyOn(service, 'getCurrentUrl').mockReturnValue(null);

      const stateParam = service.getStateParamFromCurrentUrl('');

      expect(stateParam).toBe(null);
    });

    it('should return the state param for the URL', () => {
      const stateParam = service.getStateParamFromCurrentUrl();

      expect(stateParam).toBe('my-state');
    });

    it('should return the state param for the URL if one is passed', () => {
      const stateParam = service.getStateParamFromCurrentUrl(
        'http://my-url.com?state=my-passed-state'
      );

      expect(stateParam).toBe('my-passed-state');
    });

    it('should return the state param from the fragment (implicit flow)', () => {
      const stateParam = service.getStateParamFromCurrentUrl(
        'http://my-url.com#id_token=abc&state=my-fragment-state'
      );

      expect(stateParam).toBe('my-fragment-state');
    });

    it('should prefer the state param from the query over the fragment', () => {
      const stateParam = service.getStateParamFromCurrentUrl(
        'http://my-url.com?state=query-state#state=fragment-state'
      );

      expect(stateParam).toBe('query-state');
    });

    it('should return the state param for the URL if one is passed as empty string', () => {
      const stateParam = service.getStateParamFromCurrentUrl('');

      expect(stateParam).toBe('my-state');
    });

    it('should return the state param for the URL if one is passed as null', () => {
      const stateParam = service.getStateParamFromCurrentUrl(
        null as unknown as string
      );

      expect(stateParam).toBe('my-state');
    });

    it('should return the state param for the URL if one is passed as undefined', () => {
      const stateParam = service.getStateParamFromCurrentUrl(undefined);

      expect(stateParam).toBe('my-state');
    });
  });
});

describe('CurrentUrlService without defaultView', () => {
  let service: CurrentUrlService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
          useValue: {},
        },
      ],
    });

    service = TestBed.inject(CurrentUrlService);
  });

  describe('getCurrentUrl', () => {
    it('should return null when defaultView is not available', () => {
      const currentUrl = service.getCurrentUrl();

      expect(currentUrl).toBeNull();
    });
  });
});
