import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Observable, of } from 'rxjs';
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
      const urlServiceSpy = vi
        .spyOn(urlService, 'isCallbackFromSts')
        .mockReturnValue(undefined as any);

      callbackService.isCallback('anyUrl');
      expect(urlServiceSpy).toHaveBeenCalledTimes(1);
      expect(urlServiceSpy).toHaveBeenCalledWith('anyUrl', undefined);
    });

    it('returns false and does not call urlService if currentUrl is empty', () => {
      const urlServiceSpy = vi
        .spyOn(urlService, 'isCallbackFromSts')
        .mockReturnValue(undefined as any);
      const result = callbackService.isCallback('');

      expect(result).toBe(false);
      expect(urlServiceSpy).not.toHaveBeenCalled();
    });
  });

  describe('stsCallback$', () => {
    it('is of type Observable', () => {
      expect(callbackService.stsCallback$).toBeInstanceOf(Observable);
    });
  });

  describe('handleCallbackAndFireEvents', () => {
    it('calls authorizedCallbackWithCode if current flow is code flow', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      const authorizedCallbackWithCodeSpy = vi
        .spyOn(codeFlowCallbackService, 'authenticatedCallbackWithCode')
        .mockReturnValue(of({} as CallbackContext));

      await firstValueFrom(
        callbackService.handleCallbackAndFireEvents(
          'anyUrl',
          { configId: 'configId1' },
          [{ configId: 'configId1' }]
        )
      );

      expect(authorizedCallbackWithCodeSpy).toHaveBeenCalledTimes(1);
      expect(authorizedCallbackWithCodeSpy).toHaveBeenCalledWith(
        'anyUrl',
        { configId: 'configId1' },
        [{ configId: 'configId1' }]
      );
    });

    it('calls authorizedImplicitFlowCallback without hash if current flow is implicit flow and callbackurl does not include a hash', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(false);
      vi.spyOn(flowHelper, 'isCurrentFlowAnyImplicitFlow').mockReturnValue(
        true
      );
      const authorizedCallbackWithCodeSpy = vi
        .spyOn(implicitFlowCallbackService, 'authenticatedImplicitFlowCallback')
        .mockReturnValue(of({} as CallbackContext));

      await firstValueFrom(
        callbackService.handleCallbackAndFireEvents(
          'anyUrl',
          { configId: 'configId1' },
          [{ configId: 'configId1' }]
        )
      );

      expect(authorizedCallbackWithCodeSpy).toHaveBeenCalledWith(
        { configId: 'configId1' },
        [{ configId: 'configId1' }]
      );
    });

    it('calls authorizedImplicitFlowCallback with hash if current flow is implicit flow and callbackurl does include a hash', async () => {
      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(false);
      vi.spyOn(flowHelper, 'isCurrentFlowAnyImplicitFlow').mockReturnValue(
        true
      );
      const authorizedCallbackWithCodeSpy = vi
        .spyOn(implicitFlowCallbackService, 'authenticatedImplicitFlowCallback')
        .mockReturnValue(of({} as CallbackContext));

      await firstValueFrom(
        callbackService.handleCallbackAndFireEvents(
          'anyUrlWithAHash#some-string',
          { configId: 'configId1' },
          [{ configId: 'configId1' }]
        )
      );

      expect(authorizedCallbackWithCodeSpy).toHaveBeenCalledWith(
        { configId: 'configId1' },
        [{ configId: 'configId1' }],
        'some-string'
      );
    });

    it('emits callbackinternal no matter which flow it is', async () => {
      const callbackSpy = vi
        .spyOn((callbackService as any).stsCallbackInternal$, 'next')
        .mockReturnValue(undefined);

      vi.spyOn(flowHelper, 'isCurrentFlowCodeFlow').mockReturnValue(true);
      const authenticatedCallbackWithCodeSpy = vi
        .spyOn(codeFlowCallbackService, 'authenticatedCallbackWithCode')
        .mockReturnValue(of({} as CallbackContext));

      await firstValueFrom(
        callbackService.handleCallbackAndFireEvents(
          'anyUrl',
          { configId: 'configId1' },
          [{ configId: 'configId1' }]
        )
      );

      expect(authenticatedCallbackWithCodeSpy).toHaveBeenCalledTimes(1);
      expect(authenticatedCallbackWithCodeSpy).toHaveBeenCalledWith(
        'anyUrl',
        { configId: 'configId1' },
        [{ configId: 'configId1' }]
      );
      expect(callbackSpy).toHaveBeenCalled();
    });
  });
});
