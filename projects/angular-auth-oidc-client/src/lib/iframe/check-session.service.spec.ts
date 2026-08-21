import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { skip } from 'rxjs/operators';
import { mockAbstractProvider, mockProvider } from '../../test/auto-mock';
import { LoggerService } from '../logging/logger.service';
import { OidcSecurityService } from '../oidc.security.service';
import { PublicEventsService } from '../public-events/public-events.service';
import { AbstractSecurityStorage } from '../storage/abstract-security-storage';
import { DefaultSessionStorageService } from '../storage/default-sessionstorage.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { CheckSessionService } from './check-session.service';
import { IFrameService } from './existing-iframe.service';

describe('CheckSessionService', () => {
  let checkSessionService: CheckSessionService;
  let loggerService: LoggerService;
  let iFrameService: IFrameService;
  let storagePersistenceService: StoragePersistenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CheckSessionService,
        OidcSecurityService,
        IFrameService,
        PublicEventsService,
        mockProvider(StoragePersistenceService),
        mockProvider(LoggerService),
        mockProvider(PlatformProvider),
        mockAbstractProvider(
          AbstractSecurityStorage,
          DefaultSessionStorageService
        ),
      ],
    });
  });

  beforeEach(() => {
    checkSessionService = TestBed.inject(CheckSessionService);
    loggerService = TestBed.inject(LoggerService);
    iFrameService = TestBed.inject(IFrameService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
  });

  afterEach(() => {
    const iFrameIdwhichshouldneverexist = window.document.getElementById(
      'idwhichshouldneverexist'
    );

    if (iFrameIdwhichshouldneverexist) {
      iFrameIdwhichshouldneverexist.parentNode?.removeChild(
        iFrameIdwhichshouldneverexist
      );
    }
    const myiFrameForCheckSession = window.document.getElementById(
      'myiFrameForCheckSession'
    );

    if (myiFrameForCheckSession) {
      myiFrameForCheckSession.parentNode?.removeChild(myiFrameForCheckSession);
    }
  });

  it('should create', () => {
    expect(checkSessionService).toBeTruthy();
  });

  it('getOrCreateIframe calls iFrameService.addIFrameToWindowBody if no Iframe exists', () => {
    vi.spyOn(iFrameService, 'addIFrameToWindowBody');

    const result = (checkSessionService as any).getOrCreateIframe({
      configId: 'configId1',
    });

    expect(result).toBeTruthy();
    expect(iFrameService.addIFrameToWindowBody).toHaveBeenCalled();
  });

  it('getOrCreateIframe returns true if document found on window.document', () => {
    iFrameService.addIFrameToWindowBody('myiFrameForCheckSession', {
      configId: 'configId1',
    });

    const result = (checkSessionService as any).getOrCreateIframe();

    expect(result).toBeDefined();
  });

  it('init appends iframe on body with correct values', () => {
    expect((checkSessionService as any).sessionIframe).toBeFalsy();
    vi.spyOn(loggerService as any, 'logDebug').mockImplementation(
      () => undefined
    );

    (checkSessionService as any).init();
    const iframe = (checkSessionService as any).getOrCreateIframe({
      configId: 'configId1',
    });

    expect(iframe).toBeTruthy();
    expect(iframe.id).toBe('myiFrameForCheckSession');
    expect(iframe.style.display).toBe('none');
    const iFrame = document.getElementById('myiFrameForCheckSession');

    expect(iFrame).toBeDefined();
  });

  it('log warning if authWellKnownEndpoints.check_session_iframe is not existing', () => {
    const spyLogWarning = vi
      .spyOn(loggerService as any, 'logWarning')
      .mockReturnValue(undefined);
    const config = { configId: 'configId1' };

    vi.spyOn(loggerService as any, 'logDebug').mockImplementation(
      () => undefined
    );
    vi.spyOn(storagePersistenceService, 'read').mockImplementation(
      (...args: any[]) => {
        if (args[0] === 'authWellKnownEndPoints') {
          return { checkSessionIframe: undefined };
        }

        return undefined;
      }
    );
    (checkSessionService as any).init(config);

    expect(spyLogWarning).toHaveBeenCalledTimes(1);

    expect(spyLogWarning).toHaveBeenCalledWith(config, expect.any(String));
  });

  it('start() calls pollserversession() with clientId if no scheduledheartbeat is set', () => {
    const spy = vi
      .spyOn(checkSessionService as any, 'pollServerSession')
      .mockReturnValue(undefined);
    const config = { clientId: 'clientId', configId: 'configId1' };

    checkSessionService.start(config);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('clientId', config);
  });

  it('start() does not call pollServerSession() if scheduledHeartBeatRunning is set', () => {
    const config = { configId: 'configId1' };
    const spy = vi
      .spyOn(checkSessionService as any, 'pollServerSession')
      .mockReturnValue(undefined);

    (checkSessionService as any).scheduledHeartBeatRunning = (): void =>
      undefined;
    checkSessionService.start(config);
    expect(spy).not.toHaveBeenCalled();
  });

  it('stopCheckingSession sets heartbeat to null', () => {
    (checkSessionService as any).scheduledHeartBeatRunning = setTimeout(
      () => undefined,
      999
    );
    checkSessionService.stop();
    const heartBeat = (checkSessionService as any).scheduledHeartBeatRunning;

    expect(heartBeat).toBeNull();
  });

  it('stopCheckingSession does nothing if scheduledHeartBeatRunning is not set', () => {
    (checkSessionService as any).scheduledHeartBeatRunning = null;
    const spy = vi
      .spyOn(checkSessionService as any, 'clearScheduledHeartBeat')
      .mockReturnValue(undefined);

    checkSessionService.stop();
    expect(spy).not.toHaveBeenCalledTimes(1);
    expect(spy).not.toHaveBeenCalledWith();
  });

  describe('serverStateChanged', () => {
    it('returns false if startCheckSession is not configured', () => {
      const config = { startCheckSession: false, configId: 'configId1' };
      const result = checkSessionService.serverStateChanged(config);

      expect(result).toBeFalsy();
    });

    it('returns false if checkSessionReceived is false', () => {
      (checkSessionService as any).checkSessionReceived = false;
      const config = { startCheckSession: true, configId: 'configId1' };
      const result = checkSessionService.serverStateChanged(config);

      expect(result).toBe(false);
    });

    it('returns true if startCheckSession is configured and checkSessionReceived is true', () => {
      (checkSessionService as any).checkSessionReceived = true;
      const config = { startCheckSession: true, configId: 'configId1' };
      const result = checkSessionService.serverStateChanged(config);

      expect(result).toBe(true);
    });
  });

  describe('pollServerSession', () => {
    beforeEach(() => {
      vi.spyOn(checkSessionService as any, 'init').mockReturnValue(
        of(undefined)
      );
    });

    it('increases outstandingMessages', () => {
      vi.spyOn(checkSessionService as any, 'getExistingIframe').mockReturnValue(
        {
          contentWindow: { postMessage: () => undefined },
        }
      );
      const authWellKnownEndpoints = {
        checkSessionIframe: 'https://some-testing-url.com',
      };
      const config = { configId: 'configId1' };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return authWellKnownEndpoints;
          }

          if (args[0] === 'session_state') {
            return 'session_state';
          }

          return undefined;
        }
      );
      vi.spyOn(loggerService, 'logDebug').mockImplementation(() => undefined);
      (checkSessionService as any).pollServerSession('clientId', config);
      expect((checkSessionService as any).outstandingMessages).toBe(1);
    });

    it('logs warning if iframe does not exist', () => {
      vi.spyOn(checkSessionService as any, 'getExistingIframe').mockReturnValue(
        null
      );
      const authWellKnownEndpoints = {
        checkSessionIframe: 'https://some-testing-url.com',
      };
      const config = { configId: 'configId1' };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return authWellKnownEndpoints;
          }

          return undefined;
        }
      );
      const spyLogWarning = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);

      vi.spyOn(loggerService, 'logDebug').mockImplementation(() => undefined);
      (checkSessionService as any).pollServerSession('clientId', config);
      expect(spyLogWarning).toHaveBeenCalledTimes(1);
      expect(spyLogWarning).toHaveBeenCalledWith(config, expect.any(String));
    });

    it('logs warning if clientId is not set', () => {
      vi.spyOn(checkSessionService as any, 'getExistingIframe').mockReturnValue(
        {}
      );
      const authWellKnownEndpoints = {
        checkSessionIframe: 'https://some-testing-url.com',
      };
      const config = { configId: 'configId1' };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return authWellKnownEndpoints;
          }

          return undefined;
        }
      );
      const spyLogWarning = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);

      vi.spyOn(loggerService, 'logDebug').mockImplementation(() => undefined);
      (checkSessionService as any).pollServerSession('', config);
      expect(spyLogWarning).toHaveBeenCalledTimes(1);
      expect(spyLogWarning).toHaveBeenCalledWith(config, expect.any(String));
    });

    it('logs debug if session_state is not set', () => {
      vi.spyOn(checkSessionService as any, 'getExistingIframe').mockReturnValue(
        {}
      );
      const authWellKnownEndpoints = {
        checkSessionIframe: 'https://some-testing-url.com',
      };
      const config = { configId: 'configId1' };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return authWellKnownEndpoints;
          }

          if (args[0] === 'session_state') {
            return null;
          }

          return undefined;
        }
      );

      const spyLogDebug = vi
        .spyOn(loggerService, 'logDebug')
        .mockImplementation(() => undefined);

      (checkSessionService as any).pollServerSession('clientId', config);
      expect(spyLogDebug).toHaveBeenCalledTimes(2);
    });

    it('logs debug if session_state is set but authWellKnownEndpoints are not set', () => {
      vi.spyOn(checkSessionService as any, 'getExistingIframe').mockReturnValue(
        {}
      );
      const authWellKnownEndpoints = null;
      const config = { configId: 'configId1' };

      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return authWellKnownEndpoints;
          }

          if (args[0] === 'session_state') {
            return 'some_session_state';
          }

          return undefined;
        }
      );
      const spyLogDebug = vi
        .spyOn(loggerService, 'logDebug')
        .mockImplementation(() => undefined);

      (checkSessionService as any).pollServerSession('clientId', config);
      expect(spyLogDebug).toHaveBeenCalledTimes(2);
    });
  });

  describe('init', () => {
    it('returns falsy observable when lastIframerefresh and iframeRefreshInterval are bigger than now', () => {
      const serviceAsAny = checkSessionService as any;
      const dateNow = new Date();
      const lastRefresh = dateNow.setMinutes(dateNow.getMinutes() + 30);

      serviceAsAny.lastIFrameRefresh = lastRefresh;
      serviceAsAny.iframeRefreshInterval = lastRefresh;

      const emissions: any[] = [];
      let completed = false;

      serviceAsAny.init().subscribe({
        next: (result: any) => emissions.push(result),
        complete: () => (completed = true),
      });

      expect(emissions).toEqual([]);
      expect(completed).toBe(true);
    });
  });

  describe('bindMessageEventToIframe', () => {
    it('remove event listener when iframeMessageEventListener already exist', () => {
      const serviceAsAny = checkSessionService as any;
      const defaultView = serviceAsAny.document.defaultView;
      const configuration = { configId: 'configId1' };
      const existingListener = serviceAsAny.messageHandler.bind(
        this,
        configuration
      );

      serviceAsAny.iframeMessageEventListener = existingListener;

      const spyRemoveEventListener = vi
        .spyOn(defaultView, 'removeEventListener')
        .mockReturnValue(undefined);

      serviceAsAny.bindMessageEventToIframe(configuration);

      expect(spyRemoveEventListener).toHaveBeenCalledTimes(1);

      expect(spyRemoveEventListener).toHaveBeenCalledWith(
        'message',
        existingListener,
        false
      );
    });

    it("doesn't remove event listener when iframeMessageEventListener not exist", () => {
      const serviceAsAny = checkSessionService as any;
      const defaultView = serviceAsAny.document.defaultView;

      serviceAsAny.iframeMessageEventListener = undefined;

      const spyRemoveEventListener = vi
        .spyOn(defaultView, 'removeEventListener')
        .mockReturnValue(undefined);
      const configuration = { configId: 'configId1' };

      serviceAsAny.bindMessageEventToIframe(configuration);

      expect(spyRemoveEventListener).not.toHaveBeenCalled();
    });

    it('add event listener', () => {
      const serviceAsAny = checkSessionService as any;
      const defaultView = serviceAsAny.document.defaultView;
      const spyAddEventListener = vi
        .spyOn(defaultView, 'addEventListener')
        .mockReturnValue(undefined);
      const configuration = { configId: 'configId1' };

      serviceAsAny.bindMessageEventToIframe(configuration);

      expect(spyAddEventListener).toHaveBeenCalledTimes(1);

      expect(spyAddEventListener).toHaveBeenCalledWith(
        'message',
        expect.any(Function),
        false
      );
    });
  });

  describe('messageHandler', () => {
    const fakeIframe = {
      contentWindow: { id: 'fake-iframe-content-window' },
    } as any;
    let eventService: PublicEventsService;
    let serviceAsAny: any;

    beforeEach(() => {
      eventService = TestBed.inject(PublicEventsService);
      serviceAsAny = checkSessionService as any;
      vi.spyOn(serviceAsAny, 'getExistingIframe').mockReturnValue(fakeIframe);
    });

    function messageEvent(overrides: Partial<MessageEvent> = {}): MessageEvent {
      return {
        origin: 'https://idp.example.com',
        source: fakeIframe.contentWindow,
        data: 'changed',
        ...overrides,
      } as MessageEvent;
    }

    it('processes the message when e.origin exactly matches the origin of checkSessionIframe', () => {
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: 'https://idp.example.com/connect/checksession',
      });
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);

      serviceAsAny.messageHandler({ configId: 'configId1' }, messageEvent());

      expect(fireEventSpy).toHaveBeenCalled();
    });

    it('rejects the message when e.origin is only a prefix substring of checkSessionIframe (typosquat regression)', () => {
      // Real-world risk: an attacker registers idp.example.co (one char short of
      // idp.example.com) and tricks the iframe into loading from there. With the
      // old startsWith check this passes because the configured URL string starts
      // with the attacker's shorter origin. With exact-origin equality it fails.
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: 'https://idp.example.com/connect/checksession',
      });
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);

      serviceAsAny.messageHandler(
        { configId: 'configId1' },
        messageEvent({ origin: 'https://idp.example.co' })
      );

      expect(fireEventSpy).not.toHaveBeenCalled();
    });

    it('rejects the message when e.origin is an unrelated host', () => {
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: 'https://idp.example.com/checksession',
      });
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);

      serviceAsAny.messageHandler(
        { configId: 'configId1' },
        messageEvent({ origin: 'https://attacker.example' })
      );

      expect(fireEventSpy).not.toHaveBeenCalled();
    });

    it('rejects the message when checkSessionIframe is missing', () => {
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: undefined,
      });
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);

      serviceAsAny.messageHandler({ configId: 'configId1' }, messageEvent());

      expect(fireEventSpy).not.toHaveBeenCalled();
    });

    it('rejects the message when checkSessionIframe is a malformed URL', () => {
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: 'not a valid url',
      });
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);

      serviceAsAny.messageHandler({ configId: 'configId1' }, messageEvent());

      expect(fireEventSpy).not.toHaveBeenCalled();
    });

    it('rejects the message when e.source is not the existing iframe (defense in depth)', () => {
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: 'https://idp.example.com/checksession',
      });
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);

      serviceAsAny.messageHandler(
        { configId: 'configId1' },
        messageEvent({ source: { id: 'some-other-window' } as any })
      );

      expect(fireEventSpy).not.toHaveBeenCalled();
    });
  });

  describe('isCheckSessionConfigured', () => {
    it('returns true if startCheckSession on config is true', () => {
      const config = { configId: 'configId1', startCheckSession: true };
      const result = checkSessionService.isCheckSessionConfigured(config);

      expect(result).toBe(true);
    });

    it('returns true if startCheckSession on config is true', () => {
      const config = { configId: 'configId1', startCheckSession: false };
      const result = checkSessionService.isCheckSessionConfigured(config);

      expect(result).toBe(false);
    });
  });

  describe('checkSessionChanged$', () => {
    it('emits when internal event is thrown', () => {
      let receivedResult: boolean | undefined;

      checkSessionService.checkSessionChanged$
        .pipe(skip(1))
        .subscribe((result) => {
          receivedResult = result;
        });

      const serviceAsAny = checkSessionService as any;

      serviceAsAny.checkSessionChangedInternal$.next(true);

      expect(receivedResult).toBe(true);
    });

    it('emits false initially', async () => {
      const result = await firstValueFrom(
        checkSessionService.checkSessionChanged$
      );

      expect(result).toBe(false);
    });

    it('emits false then true when emitted', () => {
      const results: boolean[] = [];

      checkSessionService.checkSessionChanged$.subscribe((result) => {
        results.push(result);
      });

      (checkSessionService as any).checkSessionChangedInternal$.next(true);

      expect(results).toEqual([false, true]);
    });
  });
});
