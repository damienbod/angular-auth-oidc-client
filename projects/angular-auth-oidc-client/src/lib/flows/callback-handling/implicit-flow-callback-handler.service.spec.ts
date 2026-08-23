import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { mockProvider } from '../../../test/auto-mock';
import { LoggerService } from '../../logging/logger.service';
import { CallbackContext } from '../callback-context';
import { FlowsDataService } from '../flows-data.service';
import { ResetAuthDataService } from '../reset-auth-data.service';
import { ImplicitFlowCallbackHandlerService } from './implicit-flow-callback-handler.service';

describe('ImplicitFlowCallbackHandlerService', () => {
  let service: ImplicitFlowCallbackHandlerService;
  let flowsDataService: FlowsDataService;
  let resetAuthDataService: ResetAuthDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ImplicitFlowCallbackHandlerService,
        mockProvider(FlowsDataService),
        mockProvider(ResetAuthDataService),
        mockProvider(LoggerService),
        {
          provide: DOCUMENT,
          useValue: {
            location: {
              get hash(): string {
                return '&anyFakeHash';
              },
              set hash(_value) {
                // ...
              },
            },
          },
        },
      ],
    });
  });

  beforeEach(() => {
    service = TestBed.inject(ImplicitFlowCallbackHandlerService);
    flowsDataService = TestBed.inject(FlowsDataService);
    resetAuthDataService = TestBed.inject(ResetAuthDataService);
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  describe('implicitFlowCallback', () => {
    it('calls "resetAuthorizationData" if silent renew is not running', async () => {
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(false);
      const resetAuthorizationDataSpy = vi
        .spyOn(resetAuthDataService, 'resetAuthorizationData')
        .mockReturnValue(undefined);
      const allconfigs = [
        {
          configId: 'configId1',
        },
      ];

      await firstValueFrom(
        service.implicitFlowCallback(allconfigs[0], allconfigs, 'any-hash')
      );

      expect(resetAuthorizationDataSpy).toHaveBeenCalled();
    });

    it('does NOT calls "resetAuthorizationData" if silent renew is running', async () => {
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(true);
      const resetAuthorizationDataSpy = vi
        .spyOn(resetAuthDataService, 'resetAuthorizationData')
        .mockReturnValue(undefined);
      const allconfigs = [
        {
          configId: 'configId1',
        },
      ];

      await firstValueFrom(
        service.implicitFlowCallback(allconfigs[0], allconfigs, 'any-hash')
      );

      expect(resetAuthorizationDataSpy).not.toHaveBeenCalled();
    });

    it('returns callbackContext if all params are good', async () => {
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(true);
      const expectedCallbackContext = {
        code: '',
        refreshToken: '',
        state: '',
        sessionState: null,
        authResult: { anyHash: '' },
        isRenewProcess: true,
        jwtKeys: null,
        validationResult: null,
        existingIdToken: null,
      } as CallbackContext;
      const allconfigs = [
        {
          configId: 'configId1',
        },
      ];
      const callbackContext = await firstValueFrom(
        service.implicitFlowCallback(allconfigs[0], allconfigs, 'anyHash')
      );

      expect(callbackContext).toEqual(expectedCallbackContext);
    });

    it('uses window location hash if no hash is passed', async () => {
      vi.spyOn(flowsDataService, 'isSilentRenewRunning').mockReturnValue(true);
      const expectedCallbackContext = {
        code: '',
        refreshToken: '',
        state: '',
        sessionState: null,
        authResult: { anyFakeHash: '' },
        isRenewProcess: true,
        jwtKeys: null,
        validationResult: null,
        existingIdToken: null,
      } as CallbackContext;
      const allconfigs = [
        {
          configId: 'configId1',
        },
      ];
      const callbackContext = await firstValueFrom(
        service.implicitFlowCallback(allconfigs[0], allconfigs)
      );

      expect(callbackContext).toEqual(expectedCallbackContext);
    });
  });
});
