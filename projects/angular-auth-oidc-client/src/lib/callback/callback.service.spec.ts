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

    // describe('refreshSession', () => {
    //     it('returns null if no auth well known endpoint defined', async(() => {
    //         spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);

    //         (callbackService as any).startRefreshSession().subscribe((result) => {
    //             expect(result).toBe(null);
    //         });
    //     }));

    //     it('returns null if silent renew Is running', async(() => {
    //         spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(true);

    //         (callbackService as any).startRefreshSession().subscribe((result) => {
    //             expect(result).toBe(null);
    //         });
    //     }));

    //     it('returns null if no authwellknownendpoints are given', async(() => {
    //         spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
    //         spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ authWellknownEndpoint: null });
    //         (callbackService as any).startRefreshSession().subscribe((result) => {
    //             expect(result).toBe(null);
    //         });
    //     }));

    //     it('calls `setSilentRenewRunning` when should be executed', async(() => {
    //         const setSilentRenewRunningSpy = spyOn(flowsDataService, 'setSilentRenewRunning');

    //         spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
    //         spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ authWellknownEndpoint: 'https://authWell' });
    //         spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));

    //         spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefeshTokens').and.returnValue(true);
    //         spyOn(callbackService as any, 'refreshSessionWithRefreshTokens').and.returnValue(of(null));

    //         (callbackService as any).startRefreshSession().subscribe(() => {
    //             expect(setSilentRenewRunningSpy).toHaveBeenCalled();
    //         });
    //     }));

    //     it('calls refreshSessionWithRefreshTokens when current flow is codeflow with refresh tokens', async(() => {
    //         spyOn(flowsDataService, 'setSilentRenewRunning');

    //         spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
    //         spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ authWellknownEndpoint: 'https://authWell' });
    //         spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));

    //         spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefeshTokens').and.returnValue(true);
    //         const refreshSessionWithRefreshTokensSpy = spyOn(callbackService as any, 'refreshSessionWithRefreshTokens').and.returnValue(
    //             of(null)
    //         );

    //         (callbackService as any).startRefreshSession().subscribe(() => {
    //             expect(refreshSessionWithRefreshTokensSpy).toHaveBeenCalled();
    //         });
    //     }));

    //     it('calls refreshSessionWithIframe when current flow is NOT codeflow with refresh tokens', async(() => {
    //         spyOn(flowsDataService, 'setSilentRenewRunning');

    //         spyOn(flowsDataService, 'isSilentRenewRunning').and.returnValue(false);
    //         spyOnProperty(configurationProvider, 'openIDConfiguration').and.returnValue({ authWellknownEndpoint: 'https://authWell' });
    //         spyOn(authWellKnownService, 'getAuthWellKnownEndPoints').and.returnValue(of({}));

    //         spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefeshTokens').and.returnValue(false);
    //         const refreshSessionWithRefreshTokensSpy = spyOn(callbackService as any, 'refreshSessionWithRefreshTokens').and.returnValue(
    //             of(null)
    //         );

    //         const refreshSessionWithIframeSpy = spyOn(callbackService as any, 'refreshSessionWithIframe').and.returnValue(of(null));

    //         (callbackService as any).startRefreshSession().subscribe(() => {
    //             expect(refreshSessionWithRefreshTokensSpy).not.toHaveBeenCalled();
    //             expect(refreshSessionWithIframeSpy).toHaveBeenCalled();
    //         });
    //     }));
    // });

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

    // describe('forceRefreshSession', () => {
    //     it('only calls start refresh session and returns idtoken and accesstoken if auth is true', async(() => {
    //         spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefeshTokens').and.returnValue(true);
    //         spyOn(callbackService as any, 'startRefreshSession').and.returnValue(of(null));
    //         spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

    //         callbackService.forceRefreshSession().subscribe((result) => {
    //             expect(result.idToken).not.toBeUndefined();
    //             expect(result.accessToken).not.toBeUndefined();
    //         });
    //     }));

    //     it('only calls start refresh session and returns null if auth is false', async(() => {
    //         spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefeshTokens').and.returnValue(true);
    //         spyOn(callbackService as any, 'startRefreshSession').and.returnValue(of(null));
    //         spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);

    //         callbackService.forceRefreshSession().subscribe((result) => {
    //             expect(result).toBeNull();
    //         });
    //     }));

    //     it('calls start refresh session and waits for completed, returns idtoken and accesstoken if auth is true', async(() => {
    //         spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefeshTokens').and.returnValue(false);
    //         spyOn(callbackService as any, 'startRefreshSession').and.returnValue(of(null));
    //         spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(true);

    //         callbackService.forceRefreshSession().subscribe((result) => {
    //             expect(result.idToken).not.toBeUndefined();
    //             expect(result.accessToken).not.toBeUndefined();
    //         });

    //         (callbackService as any).fireRefreshWithIframeCompleted({ authResult: { id_token: 'id_token', access_token: 'access_token' } });
    //     }));

    //     it('calls start refresh session and waits for completed, returns null if auth is false', async(() => {
    //         spyOn(flowHelper, 'isCurrentFlowCodeFlowWithRefeshTokens').and.returnValue(false);
    //         spyOn(callbackService as any, 'startRefreshSession').and.returnValue(of(null));
    //         spyOn(authStateService, 'areAuthStorageTokensValid').and.returnValue(false);

    //         callbackService.forceRefreshSession().subscribe((result) => {
    //             expect(result).toBeNull();
    //         });

    //         (callbackService as any).fireRefreshWithIframeCompleted({ authResult: { id_token: 'id_token', access_token: 'access_token' } });
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
