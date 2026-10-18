import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { of, Subscription } from 'rxjs';
import { mockProvider } from '../../test/auto-mock';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/services/logger.service';
import { UrlService } from '../utils/url/url.service';
import { RefreshSessionIframeService } from './refresh-session-iframe.service';
import { SilentRenewService, getFrameId } from './silent-renew.service';

type FakeIframe = EventTarget & {
  contentWindow: { location: { replace: ReturnType<typeof vi.fn> } } | null;
};

const createFakeIframe = (): FakeIframe =>
  Object.assign(new EventTarget(), {
    contentWindow: { location: { replace: vi.fn() } },
  });
const dispatchRenewMessage = (detail?: unknown): void => {
  window.dispatchEvent(
    new CustomEvent('oidc-silent-renew-message', { detail })
  );
};
const removeHandlersOf = (configs: OpenIdConfiguration[]): void => {
  configs.forEach(({ configId }) =>
    window.dispatchEvent(
      new CustomEvent('oidc-silent-renew-init', {
        detail: { configId, instanceId: -1 },
      })
    )
  );
};

describe('RefreshSessionIframeService', () => {
  let refreshSessionIframeService: RefreshSessionIframeService;
  let urlService: UrlService;
  let silentRenewService: SilentRenewService;
  let iframe: FakeIframe;
  let subscriptions: Subscription;
  const config = { configId: 'configId1' };
  const otherConfig = { configId: 'configId2' };
  const allConfigs = [config, otherConfig];

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
    silentRenewService = TestBed.inject(SilentRenewService);
    iframe = createFakeIframe();
    subscriptions = new Subscription();
    vi.spyOn(urlService, 'getRefreshSessionSilentRenewUrl').mockReturnValue(
      of('https://idp.example.com/authorize')
    );
    vi.spyOn(silentRenewService, 'getOrCreateIframe').mockReturnValue(
      iframe as unknown as HTMLIFrameElement
    );
  });

  afterEach(() => {
    subscriptions.unsubscribe();
    removeHandlersOf(allConfigs);
  });

  const startRefresh = (
    configuration: OpenIdConfiguration = config,
    observer: Partial<{ next: () => void; complete: () => void }> = {}
  ): void => {
    subscriptions.add(
      refreshSessionIframeService
        .refreshSessionWithIframe(configuration, allConfigs)
        .subscribe(observer)
    );
  };

  it('should create', () => {
    expect(refreshSessionIframeService).toBeTruthy();
  });

  describe('refreshSessionWithIframe', () => {
    it('should ask the url service for the silent renew url with the custom params', () => {
      const customParams = { prompt: 'none' };

      subscriptions.add(
        refreshSessionIframeService
          .refreshSessionWithIframe(config, allConfigs, customParams)
          .subscribe()
      );

      expect(urlService.getRefreshSessionSilentRenewUrl).toHaveBeenCalledWith(
        config,
        customParams
      );
    });

    it('should use the silent renew iframe of the config', () => {
      startRefresh();

      expect(silentRenewService.getOrCreateIframe).toHaveBeenCalledWith(config);
    });

    it('should navigate the silent renew iframe to the authorize url', () => {
      startRefresh();

      expect(iframe.contentWindow?.location.replace).toHaveBeenCalledWith(
        'https://idp.example.com/authorize'
      );
    });

    it('should navigate the silent renew iframe to an empty url when no url could be created', () => {
      vi.spyOn(urlService, 'getRefreshSessionSilentRenewUrl').mockReturnValue(
        of(null)
      );

      startRefresh();

      expect(iframe.contentWindow?.location.replace).toHaveBeenCalledWith('');
    });

    it('should not fail when the iframe has no content window', () => {
      iframe.contentWindow = null;

      expect(() => startRefresh()).not.toThrow();
    });

    it('should not emit before the iframe has loaded', () => {
      const next = vi.fn();

      startRefresh(config, { next });

      expect(next).not.toHaveBeenCalled();
    });

    it('should emit true and completes once the iframe has loaded', () => {
      const next = vi.fn();
      const complete = vi.fn();

      startRefresh(config, { next, complete });
      iframe.dispatchEvent(new Event('load'));

      expect(next).toHaveBeenCalledExactlyOnceWith(true);
      expect(complete).toHaveBeenCalledTimes(1);
    });

    it('should stop listening to the iframe load event after it fired', () => {
      const removeEventListenerSpy = vi.spyOn(iframe, 'removeEventListener');

      startRefresh();
      iframe.dispatchEvent(new Event('load'));

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'load',
        expect.any(Function)
      );
    });

    it('should announce its silent renew handlers on the window', () => {
      const announcements: CustomEvent[] = [];
      const collect = (e: Event): number =>
        announcements.push(e as CustomEvent);

      window.addEventListener('oidc-silent-renew-init', collect);
      startRefresh();
      window.removeEventListener('oidc-silent-renew-init', collect);

      expect(announcements.length).toBe(1);
      expect(announcements[0].detail).toEqual({
        configId: 'configId1',
        instanceId: expect.any(Number),
      });
    });
  });

  describe('silent renew messages', () => {
    it('should hand a message from its own iframe to the silent renew service as a legacy event', () => {
      const handlerSpy = vi.spyOn(
        silentRenewService,
        'silentRenewEventHandler'
      );

      startRefresh();
      dispatchRenewMessage({
        url: 'https://app.example.com/silent-renew.html?code=abc',
        srcFrameId: getFrameId('configId1'),
      });

      expect(handlerSpy).toHaveBeenCalledTimes(1);
      const [event, passedConfig, passedConfigs] = handlerSpy.mock.calls[0];

      expect(event.type).toBe('oidc-silent-renew-message');
      expect(event.detail).toBe(
        'https://app.example.com/silent-renew.html?code=abc'
      );
      expect(passedConfig).toBe(config);
      expect(passedConfigs).toBe(allConfigs);
    });

    it('should ignore a message from the iframe of another config', () => {
      const handlerSpy = vi.spyOn(
        silentRenewService,
        'silentRenewEventHandler'
      );

      startRefresh();
      dispatchRenewMessage({
        url: 'https://app.example.com/silent-renew.html?code=abc',
        srcFrameId: getFrameId('configId2'),
      });

      expect(handlerSpy).not.toHaveBeenCalled();
    });

    it('should ignore a message from a frame that is no silent renew iframe', () => {
      const handlerSpy = vi.spyOn(
        silentRenewService,
        'silentRenewEventHandler'
      );

      startRefresh();
      dispatchRenewMessage({
        url: 'https://app.example.com/silent-renew.html?code=abc',
        srcFrameId: 'someOtherFrame_configId1',
      });

      expect(handlerSpy).not.toHaveBeenCalled();
    });

    it('should hand a legacy message without frame id to the silent renew service unchanged', () => {
      const handlerSpy = vi.spyOn(
        silentRenewService,
        'silentRenewEventHandler'
      );
      const legacyMessage = new CustomEvent('oidc-silent-renew-message', {
        detail: 'https://app.example.com/silent-renew.html?code=abc',
      });

      startRefresh();
      window.dispatchEvent(legacyMessage);

      expect(handlerSpy).toHaveBeenCalledExactlyOnceWith(
        legacyMessage,
        config,
        allConfigs
      );
    });

    it('should ignore a message without payload', () => {
      const handlerSpy = vi.spyOn(
        silentRenewService,
        'silentRenewEventHandler'
      );

      startRefresh();
      dispatchRenewMessage();

      expect(handlerSpy).not.toHaveBeenCalled();
    });

    it('should remove the handlers of an older refresh when a newer one for the same config starts', () => {
      const handlerSpy = vi.spyOn(
        silentRenewService,
        'silentRenewEventHandler'
      );

      startRefresh();
      startRefresh();
      dispatchRenewMessage({
        url: 'https://app.example.com/silent-renew.html?code=abc',
        srcFrameId: getFrameId('configId1'),
      });

      expect(handlerSpy).toHaveBeenCalledTimes(1);
    });

    it('should keep the handlers of other configs when a refresh for another config starts', () => {
      const handlerSpy = vi.spyOn(
        silentRenewService,
        'silentRenewEventHandler'
      );

      startRefresh(config);
      startRefresh(otherConfig);
      dispatchRenewMessage({
        url: 'https://app.example.com/silent-renew.html?code=abc',
        srcFrameId: getFrameId('configId1'),
      });

      expect(handlerSpy).toHaveBeenCalledExactlyOnceWith(
        expect.any(CustomEvent),
        config,
        allConfigs
      );
    });

    it('should stop handling messages once a newer refresh for the same config took over', () => {
      const handlerSpy = vi.spyOn(
        silentRenewService,
        'silentRenewEventHandler'
      );

      startRefresh();
      removeHandlersOf([config]);
      dispatchRenewMessage({
        url: 'https://app.example.com/silent-renew.html?code=abc',
        srcFrameId: getFrameId('configId1'),
      });

      expect(handlerSpy).not.toHaveBeenCalled();
    });
  });
});
