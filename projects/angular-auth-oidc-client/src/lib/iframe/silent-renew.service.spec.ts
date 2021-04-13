import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
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
import { ResetAuthDataService } from '../flows/reset-auth-data.service';
import { ResetAuthDataServiceMock } from '../flows/reset-auth-data.service-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { IFrameService } from './existing-iframe.service';
import { SilentRenewService } from './silent-renew.service';

describe('SilentRenewService  ', () => {
  let silentRenewService: SilentRenewService;
  let flowHelper: FlowHelper;
  let implicitFlowCallbackService: ImplicitFlowCallbackService;
  let iFrameService: IFrameService;
  let configurationProvider: ConfigurationProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SilentRenewService,
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: ImplicitFlowCallbackService, useClass: ImplicitFlowCallbackServiceMock },
        { provide: FlowsService, useClass: FlowsServiceMock },
        { provide: AuthStateService, useClass: AuthStateServiceMock },
        { provide: FlowsDataService, useClass: FlowsDataServiceMock },
        { provide: ResetAuthDataService, useClass: ResetAuthDataServiceMock },
        FlowHelper,
        IFrameService,
        IntervallService,
        { provide: ConfigurationProvider, useClass: ConfigurationProviderMock },
      ],
    });
  });

  beforeEach(() => {
    silentRenewService = TestBed.inject(SilentRenewService);
    iFrameService = TestBed.inject(IFrameService);
    flowHelper = TestBed.inject(FlowHelper);
    implicitFlowCallbackService = TestBed.inject(ImplicitFlowCallbackService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
  });

  it('should create', () => {
    expect(silentRenewService).toBeTruthy();
  });

  describe('refreshSessionWithIFrameCompleted', () => {
    it('is of type observable', () => {
      expect(silentRenewService.refreshSessionWithIFrameCompleted$).toEqual(jasmine.any(Observable));
    });
  });

  describe('isSilentRenewConfigured', () => {
    it('returns true if refreshToken is configured false and silentRenew is configured true', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ useRefreshToken: false, silentRenew: true });

      const result = silentRenewService.isSilentRenewConfigured();

      expect(result).toBe(true);
    });

    it('returns false if refreshToken is configured true and silentRenew is configured true', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ useRefreshToken: true, silentRenew: true });

      const result = silentRenewService.isSilentRenewConfigured();

      expect(result).toBe(false);
    });

    it('returns false if refreshToken is configured false and silentRenew is configured false', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ useRefreshToken: false, silentRenew: false });

      const result = silentRenewService.isSilentRenewConfigured();

      expect(result).toBe(false);
    });
  });

  describe('getOrCreateIframe', () => {
    it('returns iframe if iframe is truthy', () => {
      spyOn(silentRenewService as any, 'getExistingIframe').and.returnValue({ name: 'anything' });

      const result = silentRenewService.getOrCreateIframe();

      expect(result).toEqual({ name: 'anything' } as HTMLIFrameElement);
    });

    it('adds iframe to body if existing iframe is falsy', () => {
      spyOn(silentRenewService as any, 'getExistingIframe').and.returnValue(null);

      const spy = spyOn(iFrameService, 'addIFrameToWindowBody').and.returnValue({ name: 'anything' } as HTMLIFrameElement);

      const result = silentRenewService.getOrCreateIframe();

      expect(result).toEqual({ name: 'anything' } as HTMLIFrameElement);
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith('myiFrameForSilentRenew');
    });
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
      const codeFlowCallbackSilentRenewIframe = spyOn(silentRenewService, 'codeFlowCallbackSilentRenewIframe').and.returnValue(of(null));
      const eventData = { detail: 'detail?detail2' } as CustomEvent;

      silentRenewService.silentRenewEventHandler(eventData);
      tick(1000);
      expect(codeFlowCallbackSilentRenewIframe).toHaveBeenCalledWith(['detail', 'detail2']);
    }));

    it('calls authorizedImplicitFlowCallback if current flo wis not code flow', fakeAsync(() => {
      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);
      const codeFlowCallbackSilentRenewIframe = spyOn(silentRenewService, 'codeFlowCallbackSilentRenewIframe').and.returnValue(of(null));
      const eventData = { detail: 'detail?detail2' } as CustomEvent;

      silentRenewService.silentRenewEventHandler(eventData);
      tick(1000);
      expect(codeFlowCallbackSilentRenewIframe).toHaveBeenCalledWith(['detail', 'detail2']);
    }));
  });
});
