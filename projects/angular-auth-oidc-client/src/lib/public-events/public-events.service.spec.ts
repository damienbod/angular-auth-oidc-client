import { TestBed, waitForAsync } from '@angular/core/testing';
import { filter } from 'rxjs/operators';
import { EventTypes } from './event-types';
import { PublicEventsService } from './public-events.service';

describe('Events Service', () => {
  let eventsService: PublicEventsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PublicEventsService],
    });
  });

  beforeEach(() => {
    eventsService = TestBed.inject(PublicEventsService);
  });

  it('should create', () => {
    expect(eventsService).toBeTruthy();
  });

  it('registering to single event with one event emit works', waitForAsync(() => {
    eventsService.registerForEvents().subscribe((firedEvent) => {
      expect(firedEvent).toBeTruthy();
      expect(firedEvent).toEqual({ type: EventTypes.ConfigLoaded, value: { myKey: 'myValue' } });
    });
    eventsService.fireEvent(EventTypes.ConfigLoaded, { myKey: 'myValue' });
  }));

  it('registering to single event with multiple same event emit works', waitForAsync(() => {
    const spy = jasmine.createSpy('spy');

    eventsService.registerForEvents().subscribe((firedEvent) => {
      spy(firedEvent);
      expect(firedEvent).toBeTruthy();
    });
    eventsService.fireEvent(EventTypes.ConfigLoaded, { myKey: 'myValue' });
    eventsService.fireEvent(EventTypes.ConfigLoaded, { myKey: 'myValue2' });

    expect(spy.calls.count()).toBe(2);
    expect(spy.calls.first().args[0]).toEqual({ type: EventTypes.ConfigLoaded, value: { myKey: 'myValue' } });
    expect(spy.calls.mostRecent().args[0]).toEqual({ type: EventTypes.ConfigLoaded, value: { myKey: 'myValue2' } });
  }));

  it('registering to single event with multiple emit works', waitForAsync(() => {
    eventsService
      .registerForEvents()
      .pipe(filter((x) => x.type === EventTypes.ConfigLoaded))
      .subscribe((firedEvent) => {
        expect(firedEvent).toBeTruthy();
        expect(firedEvent).toEqual({ type: EventTypes.ConfigLoaded, value: { myKey: 'myValue' } });
      });
    eventsService.fireEvent(EventTypes.ConfigLoaded, { myKey: 'myValue' });
    eventsService.fireEvent(EventTypes.NewAuthenticationResult, true);
  }));
});
