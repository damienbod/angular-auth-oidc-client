import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { LoggerService } from '../logging/logger.service';
import { UrlService } from '../utils/url/url.service';
import { RefreshSessionIframeService } from './refresh-session-iframe.service';
import { SilentRenewService, getFrameId } from './silent-renew.service';

describe('RefreshSessionIframeService ', () => {
  let refreshSessionIframeService: RefreshSessionIframeService;
  let urlService: UrlService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RefreshSessionIframeService,
        mockProvider(SilentRenewService),
        mockProvider(LoggerService),
        mockProvider(UrlService),
      ],
    });
  });

  beforeEach(() => {
    refreshSessionIframeService = TestBed.inject(RefreshSessionIframeService);
    urlService = TestBed.inject(UrlService);
  });

  it('should create', () => {
    expect(refreshSessionIframeService).toBeTruthy();
  });

  describe('refreshSessionWithIframe', () => {
    it('calls sendAuthorizeRequestUsingSilentRenew with created url', async () => {
      vi.spyOn(urlService, 'getRefreshSessionSilentRenewUrl').mockReturnValue(
        of('a-url')
      );
      const sendAuthorizeRequestUsingSilentRenewSpy = vi
        .spyOn(
          refreshSessionIframeService as any,
          'sendAuthorizeRequestUsingSilentRenew'
        )
        .mockReturnValue(of(null));
      const allConfigs = [{ configId: 'configId1' }];

      await firstValueFrom(
        refreshSessionIframeService.refreshSessionWithIframe(
          allConfigs[0],
          allConfigs
        )
      );

      expect(sendAuthorizeRequestUsingSilentRenewSpy).toHaveBeenCalledTimes(1);
      expect(sendAuthorizeRequestUsingSilentRenewSpy).toHaveBeenCalledWith(
        'a-url',
        allConfigs[0],
        allConfigs
      );
    });
  });

  describe('initSilentRenewRequest', () => {
    it('dispatches customevent to window object', () => {
      const dispatchEventSpy = vi
        .spyOn(window, 'dispatchEvent')
        .mockReturnValue(undefined as any);
      const config = { configId: 'testConfigId' };
      const allConfigs = [config];

      (refreshSessionIframeService as any).initSilentRenewRequest(
        config,
        allConfigs
      );

      expect(dispatchEventSpy).toHaveBeenCalledTimes(1);

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'oidc-silent-renew-init',
          detail: expect.objectContaining({
            instanceId: expect.any(Number),
            configId: 'testConfigId',
          }),
        })
      );
    });
  });

  describe('shouldProcessRenewMessage', () => {
    it('returns true when srcFrameId contains matching configId', () => {
      const config = { configId: 'testConfigId' };
      const event = new CustomEvent('oidc-silent-renew-message', {
        detail: {
          url: 'http://example.com',
          srcFrameId: getFrameId('testConfigId'),
        },
      });
      const result = (
        refreshSessionIframeService as any
      ).shouldProcessRenewMessage(event, config);

      expect(result).toBe(true);
    });

    it('returns false when srcFrameId contains different configId', () => {
      const config = { configId: 'testConfigId' };
      const event = new CustomEvent('oidc-silent-renew-message', {
        detail: {
          url: 'http://example.com',
          srcFrameId: getFrameId('differentConfigId'),
        },
      });
      const result = (
        refreshSessionIframeService as any
      ).shouldProcessRenewMessage(event, config);

      expect(result).toBe(false);
    });

    it('returns false when srcFrameId does not start with expected prefix', () => {
      const config = { configId: 'testConfigId' };
      const event = new CustomEvent('oidc-silent-renew-message', {
        detail: {
          url: 'http://example.com',
          srcFrameId: 'someOtherFrame_testConfigId',
        },
      });
      const result = (
        refreshSessionIframeService as any
      ).shouldProcessRenewMessage(event, config);

      expect(result).toBe(false);
    });

    it('returns true for backward compatibility when event has no srcFrameId', () => {
      const config = { configId: 'testConfigId' };
      const event = new CustomEvent('oidc-silent-renew-message', {
        detail: 'http://example.com',
      });
      const result = (
        refreshSessionIframeService as any
      ).shouldProcessRenewMessage(event, config);

      expect(result).toBe(true);
    });

    it('returns false when event has no detail', () => {
      const config = { configId: 'testConfigId' };
      const event = new CustomEvent('oidc-silent-renew-message');
      const result = (
        refreshSessionIframeService as any
      ).shouldProcessRenewMessage(event, config);

      expect(result).toBe(false);
    });
  });

  describe('convertToLegacyEvent', () => {
    it('converts new format event to legacy format', () => {
      const newFormatEvent = new CustomEvent('oidc-silent-renew-message', {
        detail: {
          url: 'http://example.com?code=123',
          srcFrameId: getFrameId('testConfigId'),
        },
      });
      const result = (refreshSessionIframeService as any).convertToLegacyEvent(
        newFormatEvent
      );

      expect(result.type).toBe('oidc-silent-renew-message');
      expect(result.detail).toBe('http://example.com?code=123');
    });

    it('returns event as-is if already in legacy format', () => {
      const legacyEvent = new CustomEvent('oidc-silent-renew-message', {
        detail: 'http://example.com?code=123',
      });
      const result = (refreshSessionIframeService as any).convertToLegacyEvent(
        legacyEvent
      );

      expect(result).toBe(legacyEvent);
    });
  });
});
