import { TestBed, waitForAsync } from '@angular/core/testing';
import { Observable, of } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { CallbackContext } from '../flows/callback-context';
import { FlowHelper } from '../utils/flowHelper/flow-helper.service';
import { UrlService } from '../utils/url/url.service';
import { CallbackService } from './callback.service';
import { CodeFlowCallbackService } from './code-flow-callback.service';
import { ImplicitFlowCallbackService } from './implicit-flow-callback.service';

describe('CallbackService ', () => {
  let callbackService: CallbackService;
  let implicitFlowCallbackService: ImplicitFlowCallbackService;
  let codeFlowCallbackService: CodeFlowCallbackService;
  let flowHelper: FlowHelper;
  let urlService: UrlService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [
        CallbackService,
        mockProvider(UrlService),
        FlowHelper,
        mockProvider(ImplicitFlowCallbackService),
        mockProvider(CodeFlowCallbackService),
      ],
    });
  });

  beforeEach(() => {
    callbackService = TestBed.inject(CallbackService);
    flowHelper = TestBed.inject(FlowHelper);
    implicitFlowCallbackService = TestBed.inject(ImplicitFlowCallbackService);
    codeFlowCallbackService = TestBed.inject(CodeFlowCallbackService);
    urlService = TestBed.inject(UrlService);
  });

  describe('isCallback', () => {
    it('calls urlService.isCallbackFromSts with passed url', () => {
      const urlServiceSpy = spyOn(urlService, 'isCallbackFromSts');

      callbackService.isCallback('anyUrl');
      expect(urlServiceSpy).toHaveBeenCalledOnceWith('anyUrl', undefined);
    });
  });

  describe('stsCallback$', () => {
    it('is of type Observable', () => {
      expect(callbackService.stsCallback$).toBeInstanceOf(Observable);
    });
  });

  describe('handleCallbackAndFireEvents', () => {
    it('calls authorizedCallbackWithCode if current flow is code flow', waitForAsync(() => {
      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);
      const authorizedCallbackWithCodeSpy = spyOn(
        codeFlowCallbackService,
        'authenticatedCallbackWithCode'
      ).and.returnValue(of({} as CallbackContext));

      callbackService
        .handleCallbackAndFireEvents('anyUrl', { configId: 'configId1' }, [
          { configId: 'configId1' },
        ])
        .subscribe(() => {
          expect(authorizedCallbackWithCodeSpy).toHaveBeenCalledOnceWith(
            'anyUrl',
            { configId: 'configId1' },
            [{ configId: 'configId1' }]
          );
        });
    }));

    it('calls authorizedImplicitFlowCallback without hash if current flow is implicit flow and callbackurl does not include a hash', waitForAsync(() => {
      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(false);
      spyOn(flowHelper, 'isCurrentFlowAnyImplicitFlow').and.returnValue(true);
      const authorizedCallbackWithCodeSpy = spyOn(
        implicitFlowCallbackService,
        'authenticatedImplicitFlowCallback'
      ).and.returnValue(of({} as CallbackContext));

      callbackService
        .handleCallbackAndFireEvents('anyUrl', { configId: 'configId1' }, [
          { configId: 'configId1' },
        ])
        .subscribe(() => {
          expect(authorizedCallbackWithCodeSpy).toHaveBeenCalledWith(
            { configId: 'configId1' },
            [{ configId: 'configId1' }]
          );
        });
    }));

    it('calls authorizedImplicitFlowCallback with hash if current flow is implicit flow and callbackurl does include a hash', waitForAsync(() => {
      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(false);
      spyOn(flowHelper, 'isCurrentFlowAnyImplicitFlow').and.returnValue(true);
      const authorizedCallbackWithCodeSpy = spyOn(
        implicitFlowCallbackService,
        'authenticatedImplicitFlowCallback'
      ).and.returnValue(of({} as CallbackContext));

      callbackService
        .handleCallbackAndFireEvents(
          'anyUrlWithAHash#some-string',
          { configId: 'configId1' },
          [{ configId: 'configId1' }]
        )
        .subscribe(() => {
          expect(authorizedCallbackWithCodeSpy).toHaveBeenCalledWith(
            { configId: 'configId1' },
            [{ configId: 'configId1' }],
            'some-string'
          );
        });
    }));

    it('emits callbackinternal no matter which flow it is', waitForAsync(() => {
      const callbackSpy = spyOn(
        (callbackService as any).stsCallbackInternal$,
        'next'
      );

      spyOn(flowHelper, 'isCurrentFlowCodeFlow').and.returnValue(true);
      const authenticatedCallbackWithCodeSpy = spyOn(
        codeFlowCallbackService,
        'authenticatedCallbackWithCode'
      ).and.returnValue(of({} as CallbackContext));

      callbackService
        .handleCallbackAndFireEvents('anyUrl', { configId: 'configId1' }, [
          { configId: 'configId1' },
        ])
        .subscribe(() => {
          expect(authenticatedCallbackWithCodeSpy).toHaveBeenCalledOnceWith(
            'anyUrl',
            { configId: 'configId1' },
            [{ configId: 'configId1' }]
          );
          expect(callbackSpy).toHaveBeenCalled();
        });
    }));
  });
});
