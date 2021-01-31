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

    it(
        'registering to single event with one event emit works',
        waitForAsync(() => {
            eventsService.registerForEvents().subscribe((firedEvent) => {
                expect(firedEvent).toBeTruthy();
                expect(firedEvent).toEqual({ type: EventTypes.configLoaded, value: { myKey: 'myValue' } });
            });
            eventsService.fireEvent(EventTypes.configLoaded, { myKey: 'myValue' });
        })
    );

    it(
        'registering to single event with mutliple same event emit works',
        waitForAsync(() => {
            const spy = jasmine.createSpy('spy');
            eventsService.registerForEvents().subscribe((firedEvent) => {
                spy(firedEvent);
                expect(firedEvent).toBeTruthy();
            });
            eventsService.fireEvent(EventTypes.configLoaded, { myKey: 'myValue' });
            eventsService.fireEvent(EventTypes.configLoaded, { myKey: 'myValue2' });

            expect(spy.calls.count()).toBe(2);
            expect(spy.calls.first().args[0]).toEqual({ type: EventTypes.configLoaded, value: { myKey: 'myValue' } });
            expect(spy.calls.mostRecent().args[0]).toEqual({ type: EventTypes.configLoaded, value: { myKey: 'myValue2' } });
        })
    );

    it(
        'registering to single event with mutliple emit works',
        waitForAsync(() => {
            eventsService
                .registerForEvents()
                .pipe(filter((x) => x.type === EventTypes.configLoaded))
                .subscribe((firedEvent) => {
                    expect(firedEvent).toBeTruthy();
                    expect(firedEvent).toEqual({ type: EventTypes.configLoaded, value: { myKey: 'myValue' } });
                });
            eventsService.fireEvent(EventTypes.configLoaded, { myKey: 'myValue' });
            eventsService.fireEvent(EventTypes.newAuthorizationResult, true);
        })
    );
});
