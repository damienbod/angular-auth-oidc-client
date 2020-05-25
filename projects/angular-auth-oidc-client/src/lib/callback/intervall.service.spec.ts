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

    // describe('authorizedCallbackWithCode', () => {
    //     it('calls flowsService.processCodeFlowCallback with correct url', () => {
    //         const spy = spyOn(flowsService, 'processCodeFlowCallback').and.returnValue(of(null));
    //         codeFlowCallbackService.authorizedCallbackWithCode('some-url');
    //         expect(spy).toHaveBeenCalledWith('some-url');
    //     });

    //     it('does nothing if triggerAuthorizationResultEvent is true and isRenewProcess is true', async(() => {
    //         const callbackContext = {
    //             code: '',
    //             refreshToken: '',
    //             state: '',
    //             sessionState: null,
    //             authResult: null,
    //             isRenewProcess: true,
    //             jwtKeys: new JwtKeys(),
    //             validationResult: null,
    //             existingIdToken: '',
    //         };
    //         const spy = spyOn(flowsService, 'processCodeFlowCallback').and.returnValue(of(callbackContext));
    //         const routerSpy = spyOn(router, 'navigate');
    //         spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ triggerAuthorizationResultEvent: true });
    //         codeFlowCallbackService.authorizedCallbackWithCode('some-url').subscribe(() => {
    //             expect(spy).toHaveBeenCalledWith('some-url');
    //             expect(routerSpy).not.toHaveBeenCalled();
    //         });
    //     }));

    //     it('calls router if triggerAuthorizationResultEvent is false and isRenewProcess is false', async(() => {
    //         const callbackContext = {
    //             code: '',
    //             refreshToken: '',
    //             state: '',
    //             sessionState: null,
    //             authResult: null,
    //             isRenewProcess: false,
    //             jwtKeys: new JwtKeys(),
    //             validationResult: null,
    //             existingIdToken: '',
    //         };
    //         const spy = spyOn(flowsService, 'processCodeFlowCallback').and.returnValue(of(callbackContext));
    //         const routerSpy = spyOn(router, 'navigate');
    //         spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
    //             triggerAuthorizationResultEvent: false,
    //             postLoginRoute: 'postLoginRoute',
    //         });
    //         codeFlowCallbackService.authorizedCallbackWithCode('some-url').subscribe(() => {
    //             expect(spy).toHaveBeenCalledWith('some-url');
    //             expect(routerSpy).toHaveBeenCalledWith(['postLoginRoute']);
    //         });
    //     }));

    //     it('resetSilentRenewRunning and stopPeriodicallTokenCheck in case of error', async(() => {
    //         spyOn(flowsService, 'processCodeFlowCallback').and.returnValue(throwError('error'));
    //         const resetSilentRenewRunningSpy = spyOn(flowsDataService, 'resetSilentRenewRunning');
    //         const stopPeriodicallTokenCheckSpy = spyOn(intervallService, 'stopPeriodicallTokenCheck');

    //         spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
    //             triggerAuthorizationResultEvent: false,
    //             postLoginRoute: 'postLoginRoute',
    //         });
    //         codeFlowCallbackService.authorizedCallbackWithCode('some-url').subscribe({
    //             error: (err) => {
    //                 expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
    //                 expect(stopPeriodicallTokenCheckSpy).toHaveBeenCalled();
    //                 expect(err).toBeTruthy();
    //             },
    //         });
    //     }));

    //     it(`navigates to unauthorizedRoute in case of error and  in case of error and
    //         triggerAuthorizationResultEvent is false`, async(() => {
    //         spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
    //         spyOn(flowsService, 'processCodeFlowCallback').and.returnValue(throwError('error'));
    //         const resetSilentRenewRunningSpy = spyOn(flowsDataService, 'resetSilentRenewRunning');
    //         const stopPeriodicallTokenCheckSpy = spyOn(intervallService, 'stopPeriodicallTokenCheck');
    //         const routerSpy = spyOn(router, 'navigate');

    //         spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
    //             triggerAuthorizationResultEvent: false,
    //             unauthorizedRoute: 'unauthorizedRoute',
    //         });
    //         codeFlowCallbackService.authorizedCallbackWithCode('some-url').subscribe({
    //             error: (err) => {
    //                 expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
    //                 expect(stopPeriodicallTokenCheckSpy).toHaveBeenCalled();
    //                 expect(err).toBeTruthy();
    //                 expect(routerSpy).toHaveBeenCalledWith(['unauthorizedRoute']);
    //             },
    //         });
    //     }));
    // });
});
