import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { CurrentUrlService } from './current-url.service';

describe('CurrentUrlService', () => {
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

  describe('currentUrlHasStateParam', () => {
    it('returns true for the given URL', () => {
      const hasStateParam = service.currentUrlHasStateParam();

      expect(hasStateParam).toBe(true);
    });
  });

  describe('currentUrlHasStateParam', () => {
    it('returns the state param for the given URL', () => {
      const stateParam = service.getStateParamFromCurrentUrl();

      expect(stateParam).toBe('my-state');
    });
  });
});
