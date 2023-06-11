import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { CurrentUrlService } from './current-url.service';

describe('CurrentUrlService with existing Url', () => {
  let service: CurrentUrlService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CurrentUrlService,
        {
          provide: DOCUMENT,
          useValue: {
            defaultView: { location: 'http://my-url.com?state=my-state' },
          },
        },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(CurrentUrlService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('getCurrentUrl', () => {
    it('returns the current URL', () => {
      const currentUrl = service.getCurrentUrl();

      expect(currentUrl).toBe('http://my-url.com?state=my-state');
    });
  });

  describe('getStateParamFromCurrentUrl', () => {
    it('returns the state param for the URL', () => {
      const stateParam = service.getStateParamFromCurrentUrl();

      expect(stateParam).toBe('my-state');
    });

    it('returns the state param for the URL if one is passed', () => {
      const stateParam = service.getStateParamFromCurrentUrl(
        'http://my-url.com?state=my-passed-state'
      );

      expect(stateParam).toBe('my-passed-state');
    });

    it('returns the state param for the URL if one is passed as empty string', () => {
      const stateParam = service.getStateParamFromCurrentUrl('');

      expect(stateParam).toBe('my-state');
    });

    it('returns the state param for the URL if one is passed as null', () => {
      const stateParam = service.getStateParamFromCurrentUrl(null);

      expect(stateParam).toBe('my-state');
    });

    it('returns the state param for the URL if one is passed as undefined', () => {
      const stateParam = service.getStateParamFromCurrentUrl(undefined);

      expect(stateParam).toBe('my-state');
    });
  });
});
