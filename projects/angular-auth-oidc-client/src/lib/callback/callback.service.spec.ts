import { HttpClientModule } from '@angular/common/http';
import { async, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/config.provider-mock';
import { FlowsService } from '../flows/flows.service';
import { FlowsServiceMock } from '../flows/flows.service-mock';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { UrlService } from '../utils/url/url.service';
import { UrlServiceMock } from '../utils/url/url.service-mock';
import { CallbackService } from './callback.service';
import { CodeFlowCallbackService } from './code-flow-callback.service';
import { CodeFlowCallbackServiceMock } from './code-flow-callback.service-mock';
import { ImplicitFlowCallbackService } from './implicit-flow-callback.service';
import { ImplicitFlowCallbackServiceMock } from './implicit-flow-callback.service-mock';

describe('Callbackservice ', () => {
    let callbackService: CallbackService;
    let implicitFlowCallbackService: ImplicitFlowCallbackService;
    let urlService: UrlService;
    let codeFlowCallbackService: CodeFlowCallbackService;
    let flowHelper: FlowHelper;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientModule, RouterTestingModule],
            providers: [
                CallbackService,
                { provide: UrlService, useClass: UrlServiceMock },
                { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
                { provide: FlowsService, useClass: FlowsServiceMock },
                { provide: ImplicitFlowCallbackService, useClass: ImplicitFlowCallbackServiceMock },
                { provide: CodeFlowCallbackService, useClass: CodeFlowCallbackServiceMock },
                FlowHelper,
            ],
        });
    });

    beforeEach(() => {
        callbackService = TestBed.inject(CallbackService);
        urlService = TestBed.inject(UrlService);
        flowHelper = TestBed.inject(FlowHelper);
        implicitFlowCallbackService = TestBed.inject(ImplicitFlowCallbackService);
        codeFlowCallbackService = TestBed.inject(CodeFlowCallbackService);
    });

    describe('handleCallbackAndFireEvents', () => {
        it('calls authorizedCallbackWithCode if current flow is code flow', async(() => {
            spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);
            const authorizedCallbackWithCodeSpy = spyOn(codeFlowCallbackService, 'authorizedCallbackWithCode').and.returnValue(of(null));

            callbackService.handleCallbackAndFireEvents('anyUrl').subscribe(() => {
                expect(authorizedCallbackWithCodeSpy).toHaveBeenCalledWith('anyUrl');
            });
        }));

        it('calls authorizedImplicitFlowCallback if current flow is implicit flow', async(() => {
            spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(false);
            spyOn(flowHelper, 'isCurrentFlowAnyImplicitFlow').and.returnValue(true);
            const authorizedCallbackWithCodeSpy = spyOn(implicitFlowCallbackService, 'authorizedImplicitFlowCallback').and.returnValue(
                of(null)
            );

            callbackService.handleCallbackAndFireEvents('anyUrl').subscribe(() => {
                expect(authorizedCallbackWithCodeSpy).toHaveBeenCalled();
            });
        }));

        it('emits callbackinternal no matter which flow it is', () => {
            const callbackSpy = spyOn((callbackService as any).stsCallbackInternal$, 'next');
            spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);
            const authorizedCallbackWithCodeSpy = spyOn(codeFlowCallbackService, 'authorizedCallbackWithCode').and.returnValue(of(null));

            callbackService.handleCallbackAndFireEvents('anyUrl').subscribe(() => {
                expect(authorizedCallbackWithCodeSpy).toHaveBeenCalledWith('anyUrl');
                expect(callbackSpy).toHaveBeenCalled();
            });
        });
    });

    // describe('stopPeriodicallTokenCheck', () => {
    //     it('calls unsubscribe and sets to null', () => {
    //         const serviceAsAny = callbackService as any;
    //         serviceAsAny.runTokenValidationRunning = new Subscription();
    //         const spy = spyOn(serviceAsAny.runTokenValidationRunning, 'unsubscribe');

    //         serviceAsAny.stopPeriodicallTokenCheck();

    //         expect(spy).toHaveBeenCalled();
    //         expect(serviceAsAny.runTokenValidationRunning).toBeNull();
    //     });

    //     it('does nothing if `runTokenValidationRunning` is null', () => {
    //         const serviceAsAny = callbackService as any;
    //         const aFalsyValue = '';
    //         serviceAsAny.runTokenValidationRunning = aFalsyValue;

    //         serviceAsAny.stopPeriodicallTokenCheck();

    //         expect(serviceAsAny.runTokenValidationRunning).toBe(aFalsyValue);
    //     });
    // });

    // describe('authorizedCallbackWithCode', () => {
    //     it('calls flowsService.processCodeFlowCallback with correct url', () => {
    //         const serviceAsAny = callbackService as any;
    //         const spy = spyOn(flowsService, 'processCodeFlowCallback').and.returnValue(of(null));
    //         serviceAsAny.authorizedCallbackWithCode('some-url');
    //         expect(spy).toHaveBeenCalledWith('some-url');
    //     });

    //     it('does nothing if triggerAuthorizationResultEvent is true and isRenewProcess is true', async(() => {
    //         const serviceAsAny = callbackService as any;
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
    //         serviceAsAny.authorizedCallbackWithCode('some-url').subscribe(() => {
    //             expect(spy).toHaveBeenCalledWith('some-url');
    //             expect(routerSpy).not.toHaveBeenCalled();
    //         });
    //     }));

    //     it('calls router if triggerAuthorizationResultEvent is false and isRenewProcess is false', async(() => {
    //         const serviceAsAny = callbackService as any;
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
    //         serviceAsAny.authorizedCallbackWithCode('some-url').subscribe(() => {
    //             expect(spy).toHaveBeenCalledWith('some-url');
    //             expect(routerSpy).toHaveBeenCalledWith(['postLoginRoute']);
    //         });
    //     }));

    //     it('resetSilentRenewRunning and stopPeriodicallTokenCheck in case of error', async(() => {
    //         const serviceAsAny = callbackService as any;

    //         spyOn(flowsService, 'processCodeFlowCallback').and.returnValue(throwError('error'));
    //         const resetSilentRenewRunningSpy = spyOn(flowsDataService, 'resetSilentRenewRunning');
    //         const stopPeriodicallTokenCheckSpy = spyOn(serviceAsAny, 'stopPeriodicallTokenCheck');

    //         spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
    //             triggerAuthorizationResultEvent: false,
    //             postLoginRoute: 'postLoginRoute',
    //         });
    //         serviceAsAny.authorizedCallbackWithCode('some-url').subscribe({
    //             error: (err) => {
    //                 expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
    //                 expect(stopPeriodicallTokenCheckSpy).toHaveBeenCalled();
    //                 expect(err).toBeTruthy();
    //             },
    //         });
    //     }));

    //     it(`navigates to unauthorizedRoute in case of error and  in case of error and
    //     triggerAuthorizationResultEvent is false`, async(() => {
    //         const serviceAsAny = callbackService as any;

    //         spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
    //         spyOn(flowsService, 'processCodeFlowCallback').and.returnValue(throwError('error'));
    //         const resetSilentRenewRunningSpy = spyOn(flowsDataService, 'resetSilentRenewRunning');
    //         const stopPeriodicallTokenCheckSpy = spyOn(serviceAsAny, 'stopPeriodicallTokenCheck');
    //         const routerSpy = spyOn(router, 'navigate');

    //         spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({
    //             triggerAuthorizationResultEvent: false,
    //             unauthorizedRoute: 'unauthorizedRoute',
    //         });
    //         serviceAsAny.authorizedCallbackWithCode('some-url').subscribe({
    //             error: (err) => {
    //                 expect(resetSilentRenewRunningSpy).toHaveBeenCalled();
    //                 expect(stopPeriodicallTokenCheckSpy).toHaveBeenCalled();
    //                 expect(err).toBeTruthy();
    //                 expect(routerSpy).toHaveBeenCalledWith(['unauthorizedRoute']);
    //             },
    //         });
    //     }));
    // });

    // describe('refreshSessionWithIframe', () => {
    //     it('calls sendAuthorizeReqestUsingSilentRenew with created url', async(() => {
    //         const serviceAsAny = callbackService as any;

    //         spyOn(urlService, 'getRefreshSessionSilentRenewUrl').and.returnValue('a-url');
    //         const sendAuthorizeReqestUsingSilentRenewSpy = spyOn(serviceAsAny, 'sendAuthorizeReqestUsingSilentRenew').and.returnValue(
    //             of(null)
    //         );

    //         serviceAsAny.refreshSessionWithIframe().subscribe(() => {
    //             expect(sendAuthorizeReqestUsingSilentRenewSpy).toHaveBeenCalledWith('a-url');
    //         });
    //     }));
    // });

    // describe('silentRenewEventHandler', () => {
    //     it('returns if authorizedImplicitFlowCallback', () => {
    //         spyOn(callbackService as any, 'runTokenValidationRunning').and.returnValue(new Subscription());
    //         spyOn(urlService, 'getRefreshSessionSilentRenewUrl').and.returnValue('a-url');
    //         spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(false);
    //         spyOn(flowHelper, 'isCurrentFlowAnyImplicitFlow').and.returnValue(true);
    //         const authorizedCallbackWithCodeSpy = spyOn(callbackService as any, 'authorizedImplicitFlowCallback').and.returnValue(of(true));
    //         const serviceAsAny = callbackService as any;
    //         const eventData = { detail: 'detail' };

    //         serviceAsAny.silentRenewEventHandler(eventData);

    //         callbackService.handleCallbackAndFireEvents('anyUrl').subscribe(() => {
    //             expect(authorizedCallbackWithCodeSpy).toHaveBeenCalled();
    //         });
    //     });
    // });
});
