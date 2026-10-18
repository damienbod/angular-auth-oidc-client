import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subscription } from 'rxjs';
import { IntervalService } from './interval.service';

describe('IntervalService', () => {
  beforeEach(() => {
    vi.useFakeTimers({ advanceTimeDelta: 1, shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });
  let intervalService: IntervalService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DOCUMENT,
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
    it('should return false when no validation subscription is running', () => {
      intervalService.runTokenValidationRunning = null;

      expect(intervalService.isTokenValidationRunning()).toBe(false);
    });

    it('should return true when a validation subscription is running', () => {
      intervalService.runTokenValidationRunning = new Subscription();

      expect(intervalService.isTokenValidationRunning()).toBe(true);
    });
  });

  describe('stopPeriodicTokenCheck', () => {
    it('should call unsubscribe and sets to null', () => {
      intervalService.runTokenValidationRunning = new Subscription();
      const spy = vi
        .spyOn(intervalService.runTokenValidationRunning, 'unsubscribe')
        .mockReturnValue(undefined);

      intervalService.stopPeriodicTokenCheck();

      expect(spy).toHaveBeenCalled();
      expect(intervalService.runTokenValidationRunning).toBeNull();
    });

    it('should do nothing if `runTokenValidationRunning` is null', () => {
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
    it('should start check after correct milliseconds', async () => {
      const periodicCheck = intervalService.startPeriodicTokenCheck(0.5);
      const spy = vi.fn();
      const sub = periodicCheck.subscribe(() => {
        spy();
      });

      await vi.advanceTimersByTimeAsync(490);
      expect(spy).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(10);
      expect(spy).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(500);
      expect(spy).toHaveBeenCalledTimes(2);

      sub.unsubscribe();
    });
  });
});
