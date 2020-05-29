import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthStateService } from '../authState/auth-state.service';
import { AuthStateServiceMock } from '../authState/auth-state.service-mock';
import { ImplicitFlowCallbackService } from '../callback/implicit-flow-callback.service';
import { ImplicitFlowCallbackServiceMock } from '../callback/implicit-flow-callback.service-mock';
import { IntervallService } from '../callback/intervall.service';
import { ConfigurationProvider } from '../config/config.provider';
import { ConfigurationProviderMock } from '../config/config.provider-mock';
import { FlowsDataService } from '../flows/flows-data.service';
import { FlowsDataServiceMock } from '../flows/flows-data.service-mock';
import { FlowsService } from '../flows/flows.service';
import { FlowsServiceMock } from '../flows/flows.service-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { IFrameService } from './existing-iframe.service';
import { SilentRenewService } from './silent-renew.service';

describe('SilentRenewService  ', () => {
    let silentRenewService: SilentRenewService;
    let flowHelper: FlowHelper;
    let implicitFlowCallbackService: ImplicitFlowCallbackService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                SilentRenewService,
                { provide: LoggerService, useClass: LoggerServiceMock },
                { provide: ImplicitFlowCallbackService, useClass: ImplicitFlowCallbackServiceMock },
                { provide: FlowsService, useClass: FlowsServiceMock },
                { provide: AuthStateService, useClass: AuthStateServiceMock },
                { provide: FlowsDataService, useClass: FlowsDataServiceMock },
                FlowHelper,
                IFrameService,
                IntervallService,
                { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
            ],
        });
    });

    beforeEach(() => {
        silentRenewService = TestBed.inject(SilentRenewService);
        flowHelper = TestBed.inject(FlowHelper);
        implicitFlowCallbackService = TestBed.inject(ImplicitFlowCallbackService);
    });

    it('should create', () => {
        expect(silentRenewService).toBeTruthy();
    });

    describe('silentRenewEventHandler', () => {
        it('returns if no details is given', fakeAsync(() => {
            const isCurrentFlowCodeFlowSpy = spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(false);
            spyOn(implicitFlowCallbackService, 'authorizedImplicitFlowCallback').and.returnValue(of(null));
            const eventData = { detail: null } as CustomEvent;

            silentRenewService.silentRenewEventHandler(eventData);
            tick(1000);
            expect(isCurrentFlowCodeFlowSpy).not.toHaveBeenCalled();
        }));

        it('calls authorizedImplicitFlowCallback if current flow is not code flow', fakeAsync(() => {
            const isCurrentFlowCodeFlowSpy = spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(false);
            const authorizedImplicitFlowCallbackSpy = spyOn(implicitFlowCallbackService, 'authorizedImplicitFlowCallback').and.returnValue(
                of(null)
            );
            const eventData = { detail: 'detail' } as CustomEvent;

            silentRenewService.silentRenewEventHandler(eventData);
            tick(1000);
            expect(isCurrentFlowCodeFlowSpy).toHaveBeenCalled();
            expect(authorizedImplicitFlowCallbackSpy).toHaveBeenCalledWith('detail');
        }));

        it('calls codeFlowCallbackSilentRenewIframe if current flow is code flow', fakeAsync(() => {
            spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);
            const codeFlowCallbackSilentRenewIframe = spyOn(silentRenewService, 'codeFlowCallbackSilentRenewIframe').and.returnValue(
                of(null)
            );
            const eventData = { detail: 'detail?detail2' } as CustomEvent;

            silentRenewService.silentRenewEventHandler(eventData);
            tick(1000);
            expect(codeFlowCallbackSilentRenewIframe).toHaveBeenCalledWith(['detail', 'detail2']);
        }));

        it('calls authorizedImplicitFlowCallback if current flo wis not code flow', fakeAsync(() => {
            spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);
            const codeFlowCallbackSilentRenewIframe = spyOn(silentRenewService, 'codeFlowCallbackSilentRenewIframe').and.returnValue(
                of(null)
            );
            const eventData = { detail: 'detail?detail2' } as CustomEvent;

            silentRenewService.silentRenewEventHandler(eventData);
            tick(1000);
            expect(codeFlowCallbackSilentRenewIframe).toHaveBeenCalledWith(['detail', 'detail2']);
        }));
    });
});
