import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { LoggerService } from '../logging/logger.service';
import { UrlService } from '../utils/url/url.service';
import { RefreshSessionIframeService } from './refresh-session-iframe.service';
import { SilentRenewService, IFRAME_FOR_SILENT_RENEW_IDENTIFIER } from './silent-renew.service';

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
    it('calls sendAuthorizeRequestUsingSilentRenew with created url', waitForAsync(() => {
      spyOn(urlService, 'getRefreshSessionSilentRenewUrl').and.returnValue(
        of('a-url')
      );
      const sendAuthorizeRequestUsingSilentRenewSpy = spyOn(
        refreshSessionIframeService as any,
        'sendAuthorizeRequestUsingSilentRenew'
      ).and.returnValue(of(null));
      const allConfigs = [{ configId: 'configId1' }];

      refreshSessionIframeService
        .refreshSessionWithIframe(allConfigs[0], allConfigs)
        .subscribe(() => {
          expect(
            sendAuthorizeRequestUsingSilentRenewSpy
          ).toHaveBeenCalledOnceWith('a-url', allConfigs[0], allConfigs);
        });
    }));
  });

  describe('initSilentRenewRequest', () => {
    it('dispatches customevent to window object', waitForAsync(() => {
      const dispatchEventSpy = spyOn(window, 'dispatchEvent');
      const config = { configId: 'testConfigId' };
      const allConfigs = [config];

      (refreshSessionIframeService as any).initSilentRenewRequest(config, allConfigs);

      expect(dispatchEventSpy).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({
          type: 'oidc-silent-renew-init',
          detail: jasmine.objectContaining({
            instanceId: jasmine.any(Number),
            configId: 'testConfigId'
          }),
        })
      );
    }));
  });

  describe('shouldProcessRenewMessage', () => {
    it('returns true when srcFrameId contains matching configId', () => {
      const config = { configId: 'testConfigId' };
      const event = new CustomEvent('oidc-silent-renew-message', {
        detail: { url: 'http://example.com', srcFrameId: `${IFRAME_FOR_SILENT_RENEW_IDENTIFIER}_testConfigId` }
      });
      const result = (refreshSessionIframeService as any).shouldProcessRenewMessage(event, config);

      expect(result).toBe(true);
    });

    it('returns false when srcFrameId contains different configId', () => {
      const config = { configId: 'testConfigId' };
      const event = new CustomEvent('oidc-silent-renew-message', {
        detail: { url: 'http://example.com', srcFrameId: `${IFRAME_FOR_SILENT_RENEW_IDENTIFIER}_differentConfigId` }
      });
      const result = (refreshSessionIframeService as any).shouldProcessRenewMessage(event, config);

      expect(result).toBe(false);
    });

    it('returns false when srcFrameId does not start with expected prefix', () => {
      const config = { configId: 'testConfigId' };
      const event = new CustomEvent('oidc-silent-renew-message', {
        detail: { url: 'http://example.com', srcFrameId: 'someOtherFrame_testConfigId' }
      });
      const result = (refreshSessionIframeService as any).shouldProcessRenewMessage(event, config);

      expect(result).toBe(false);
    });

    it('returns true for backward compatibility when event has no srcFrameId', () => {
      const config = { configId: 'testConfigId' };
      const event = new CustomEvent('oidc-silent-renew-message', {
        detail: 'http://example.com'
      });
      const result = (refreshSessionIframeService as any).shouldProcessRenewMessage(event, config);

      expect(result).toBe(true);
    });

    it('returns false when event has no detail', () => {
      const config = { configId: 'testConfigId' };
      const event = new CustomEvent('oidc-silent-renew-message');
      const result = (refreshSessionIframeService as any).shouldProcessRenewMessage(event, config);

      expect(result).toBe(false);
    });
  });

  describe('convertToLegacyEvent', () => {
    it('converts new format event to legacy format', () => {
      const newFormatEvent = new CustomEvent('oidc-silent-renew-message', {
        detail: { url: 'http://example.com?code=123', srcFrameId: `${IFRAME_FOR_SILENT_RENEW_IDENTIFIER}_testConfigId` }
      });
      const result = (refreshSessionIframeService as any).convertToLegacyEvent(newFormatEvent);

      expect(result.type).toBe('oidc-silent-renew-message');
      expect(result.detail).toBe('http://example.com?code=123');
    });

    it('returns event as-is if already in legacy format', () => {
      const legacyEvent = new CustomEvent('oidc-silent-renew-message', {
        detail: 'http://example.com?code=123'
      });
      const result = (refreshSessionIframeService as any).convertToLegacyEvent(legacyEvent);

      expect(result).toBe(legacyEvent);
    });
  });
});
