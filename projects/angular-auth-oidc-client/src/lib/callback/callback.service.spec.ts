import { HttpClientModule } from '@angular/common/http';
import { TestBed, waitForAsync } from '@angular/core/testing';
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
        it(
            'calls authorizedCallbackWithCode if current flow is code flow',
            waitForAsync(() => {
                spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);
                const authorizedCallbackWithCodeSpy = spyOn(codeFlowCallbackService, 'authorizedCallbackWithCode').and.returnValue(
                    of(null)
                );

                callbackService.handleCallbackAndFireEvents('anyUrl').subscribe(() => {
                    expect(authorizedCallbackWithCodeSpy).toHaveBeenCalledWith('anyUrl');
                });
            })
        );

        it(
            'calls authorizedImplicitFlowCallback if current flow is implicit flow',
            waitForAsync(() => {
                spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(false);
                spyOn(flowHelper, 'isCurrentFlowAnyImplicitFlow').and.returnValue(true);
                const authorizedCallbackWithCodeSpy = spyOn(implicitFlowCallbackService, 'authorizedImplicitFlowCallback').and.returnValue(
                    of(null)
                );

                callbackService.handleCallbackAndFireEvents('anyUrl').subscribe(() => {
                    expect(authorizedCallbackWithCodeSpy).toHaveBeenCalled();
                });
            })
        );

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
});
