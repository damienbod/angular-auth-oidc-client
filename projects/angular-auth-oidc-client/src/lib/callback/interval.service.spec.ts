import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Subscription } from 'rxjs';
import { IntervalService } from './interval.service';

describe('IntervalService', () => {
  let intervalService: IntervalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Document,
          useValue: {
            defaultView: {
              setInterval: window.setInterval,
            },
          },
        },
      ],
    });
  });

  beforeEach(() => {
    intervalService = TestBed.inject(IntervalService);
  });

  it('should create', () => {
    expect(intervalService).toBeTruthy();
  });

  describe('isTokenValidationRunning', () => {
    it('returns false when no validation subscription is running', () => {
      intervalService.runTokenValidationRunning = null;

      expect(intervalService.isTokenValidationRunning()).toBe(false);
    });

    it('returns true when a validation subscription is running', () => {
      intervalService.runTokenValidationRunning = new Subscription();

      expect(intervalService.isTokenValidationRunning()).toBe(true);
    });
  });

  describe('stopPeriodicTokenCheck', () => {
    it('calls unsubscribe and sets to null', () => {
      intervalService.runTokenValidationRunning = new Subscription();
      const spy = vi
        .spyOn(intervalService.runTokenValidationRunning, 'unsubscribe')
        .mockReturnValue(undefined);

      intervalService.stopPeriodicTokenCheck();

      expect(spy).toHaveBeenCalled();
      expect(intervalService.runTokenValidationRunning).toBeNull();
    });

    it('does nothing if `runTokenValidationRunning` is null', () => {
      intervalService.runTokenValidationRunning = new Subscription();
      const spy = vi
        .spyOn(intervalService.runTokenValidationRunning, 'unsubscribe')
        .mockReturnValue(undefined);

      intervalService.runTokenValidationRunning = null;
      intervalService.stopPeriodicTokenCheck();

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('startPeriodicTokenCheck', () => {
    it('starts check after correct milliseconds', fakeAsync(() => {
      const periodicCheck = intervalService.startPeriodicTokenCheck(0.5);
      const spy = vi.fn();
      const sub = periodicCheck.subscribe(() => {
        spy();
      });

      tick(500);
      expect(spy).toHaveBeenCalledTimes(1);

      tick(500);
      expect(spy).toHaveBeenCalledTimes(2);

      sub.unsubscribe();
    }));
  });
});
