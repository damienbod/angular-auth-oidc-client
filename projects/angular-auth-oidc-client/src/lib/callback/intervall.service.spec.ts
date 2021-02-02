import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Subscription } from 'rxjs';
import { IntervallService } from './intervall.service';

describe('Intervall Service ', () => {
    let intervallService: IntervallService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [IntervallService],
        });
    });

    beforeEach(() => {
        intervallService = TestBed.inject(IntervallService);
    });

    it('should create', () => {
        expect(intervallService).toBeTruthy();
    });

    describe('stopPeriodicallTokenCheck', () => {
        it('calls unsubscribe and sets to null', () => {
            intervallService.runTokenValidationRunning = new Subscription();
            const spy = spyOn(intervallService.runTokenValidationRunning, 'unsubscribe');

            intervallService.stopPeriodicallTokenCheck();

            expect(spy).toHaveBeenCalled();
            expect(intervallService.runTokenValidationRunning).toBeNull();
        });

        it('does nothing if `runTokenValidationRunning` is null', () => {
            intervallService.runTokenValidationRunning = new Subscription();
            const spy = spyOn(intervallService.runTokenValidationRunning, 'unsubscribe');
            intervallService.runTokenValidationRunning = null;
            intervallService.stopPeriodicallTokenCheck();

            expect(spy).not.toHaveBeenCalled();
        });
    });

    describe('startPeriodicTokenCheck', () => {
        it('starts check after correct milliseconds', fakeAsync(() => {
            const periodicCheck = intervallService.startPeriodicTokenCheck(0.5);
            const spy = jasmine.createSpy();
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
