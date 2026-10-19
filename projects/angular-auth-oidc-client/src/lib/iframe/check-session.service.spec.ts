import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createEnvironmentInjector,
  DOCUMENT,
  EnvironmentInjector,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { mockAbstractProvider, mockProvider } from '../../test/auto-mock';
import { OpenIdConfiguration } from '../config/openid-configuration';
import { LoggerService } from '../logging/services/logger.service';
import { OidcSecurityService } from '../oidc.security.service';
import { EventTypes } from '../public-events/event-types';
import { PublicEventsService } from '../public-events/public-events.service';
import { AbstractSecurityStorage } from '../storage/abstract-security-storage';
import { DefaultSessionStorageService } from '../storage/default-sessionstorage.service';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { CheckSessionService } from './check-session.service';
import { IFrameService } from './existing-iframe.service';

const HEART_BEAT_INTERVAL = 3000;
const IFRAME_REFRESH_INTERVAL = 60000;

interface FakeIframe {
  iframe: any;
  postMessage: ReturnType<typeof vi.fn>;
  replace: ReturnType<typeof vi.fn>;
}

function createFakeIframe(): FakeIframe {
  const postMessage = vi.fn();
  const replace = vi.fn();
  const iframe = {
    contentWindow: { postMessage, location: { replace } },
  } as any;

  return { iframe, postMessage, replace };
}

describe('CheckSessionService', () => {
  let checkSessionService: CheckSessionService;
  let loggerService: LoggerService;
  let iFrameService: IFrameService;
  let storagePersistenceService: StoragePersistenceService;
  let eventService: PublicEventsService;

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
    eventService = TestBed.inject(PublicEventsService);
  });

  afterEach(() => {
    checkSessionService.ngOnDestroy();

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

  function arrangeStorage(values: {
    authWellKnownEndPoints?: unknown;
    sessionState?: string | null;
  }): void {
    vi.spyOn(storagePersistenceService, 'read').mockImplementation(
      (...args: any[]) => {
        if (args[0] === 'authWellKnownEndPoints') {
          return values.authWellKnownEndPoints;
        }

        if (args[0] === 'session_state') {
          return values.sessionState;
        }

        return undefined;
      }
    );
  }

  function arrangeExistingIframe(iframe: any): void {
    vi.spyOn(iFrameService, 'getExistingIFrame').mockReturnValue(iframe);
  }

  function dispatchMessage(init: {
    origin?: string;
    source?: unknown;
    data?: unknown;
  }): void {
    window.dispatchEvent(Object.assign(new Event('message'), init));
  }

  it('should create', () => {
    expect(checkSessionService).toBeTruthy();
  });

  it('should add an iframe to the window body if no iframe exists', () => {
    // Arrange
    const config = { clientId: 'clientId', configId: 'configId1' };
    const addIFrameSpy = vi.spyOn(iFrameService, 'addIFrameToWindowBody');

    arrangeStorage({
      authWellKnownEndPoints: { checkSessionIframe: undefined },
    });
    vi.spyOn(loggerService, 'logWarning').mockImplementation(() => undefined);

    // Act
    checkSessionService.start(config);

    // Assert
    expect(addIFrameSpy).toHaveBeenCalledExactlyOnceWith(
      'myiFrameForCheckSession',
      config
    );
    expect(checkSessionService.getExistingIframe()).toBeTruthy();
  });

  it('should reuse the existing iframe if it is found on window.document', () => {
    // Arrange
    const existingIframe = iFrameService.addIFrameToWindowBody(
      'myiFrameForCheckSession',
      { configId: 'configId1' }
    );
    const addIFrameSpy = vi.spyOn(iFrameService, 'addIFrameToWindowBody');

    arrangeStorage({
      authWellKnownEndPoints: { checkSessionIframe: undefined },
    });
    vi.spyOn(loggerService, 'logWarning').mockImplementation(() => undefined);

    // Act
    checkSessionService.start({ clientId: 'clientId', configId: 'configId1' });

    // Assert
    expect(addIFrameSpy).not.toHaveBeenCalled();
    expect(checkSessionService.getExistingIframe()).toBe(existingIframe);
  });

  it('should append a hidden iframe to the body with the check session id on start', () => {
    // Arrange
    arrangeStorage({
      authWellKnownEndPoints: { checkSessionIframe: undefined },
    });
    vi.spyOn(loggerService, 'logWarning').mockImplementation(() => undefined);

    // Act
    checkSessionService.start({ clientId: 'clientId', configId: 'configId1' });

    // Assert
    const iframe = checkSessionService.getExistingIframe();

    expect(iframe).toBeTruthy();
    expect(iframe?.id).toBe('myiFrameForCheckSession');
    expect(iframe?.style.display).toBe('none');
    expect(document.getElementById('myiFrameForCheckSession')).toBe(iframe);
  });

  describe('start and stop', () => {
    const config = { clientId: 'clientId', configId: 'configId1' };
    let fake: FakeIframe;

    beforeEach(() => {
      vi.useFakeTimers();
      fake = createFakeIframe();
      arrangeExistingIframe(fake.iframe);
      arrangeStorage({
        authWellKnownEndPoints: {
          checkSessionIframe: 'https://idp.example.com/checksession',
        },
        sessionState: 'session_state',
      });
    });

    afterEach(() => {
      checkSessionService.stop();
      vi.useRealTimers();
    });

    it('should start checking the session with the clientId when no heartbeat is scheduled', () => {
      // Act
      checkSessionService.start(config);
      fake.iframe.onload();

      // Assert
      expect(fake.replace).toHaveBeenCalledTimes(1);
      expect(fake.postMessage).toHaveBeenCalledExactlyOnceWith(
        'clientId session_state',
        'https://idp.example.com'
      );
    });

    it('should not start checking the session again if a heartbeat is already scheduled', () => {
      // Arrange
      checkSessionService.start(config);
      fake.iframe.onload();
      vi.setSystemTime(Date.now() + IFRAME_REFRESH_INTERVAL);

      // Act
      checkSessionService.start(config);

      // Assert
      expect(fake.replace).toHaveBeenCalledTimes(1);
    });

    it('should allow starting again after the session check was stopped', () => {
      // Arrange
      checkSessionService.start(config);
      fake.iframe.onload();
      checkSessionService.stop();
      vi.setSystemTime(Date.now() + IFRAME_REFRESH_INTERVAL);

      // Act
      checkSessionService.start(config);

      // Assert
      expect(fake.replace).toHaveBeenCalledTimes(2);
    });

    it('should not navigate the iframe again when it was refreshed recently', () => {
      // Arrange
      checkSessionService.start(config);
      fake.iframe.onload();
      checkSessionService.stop();

      // Act
      checkSessionService.start(config);

      // Assert
      expect(fake.replace).toHaveBeenCalledTimes(1);
      expect(fake.postMessage).toHaveBeenCalledTimes(1);
    });

    it('should do nothing when stopping the session check if no heartbeat is scheduled', () => {
      // Arrange
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      // Act
      checkSessionService.stop();

      // Assert
      expect(clearTimeoutSpy).not.toHaveBeenCalled();
    });
  });

  describe('serverStateChanged', () => {
    it('should return false if startCheckSession is not configured', () => {
      const config = { startCheckSession: false, configId: 'configId1' };
      const result = checkSessionService.serverStateChanged(config);

      expect(result).toBeFalsy();
    });

    it('should return false if no changed check session message was received', () => {
      const config = { startCheckSession: true, configId: 'configId1' };
      const result = checkSessionService.serverStateChanged(config);

      expect(result).toBe(false);
    });

    describe('after a check session message', () => {
      const config = {
        clientId: 'clientId',
        configId: 'configId1',
        startCheckSession: true,
      };
      let fake: FakeIframe;

      beforeEach(() => {
        vi.useFakeTimers();
        fake = createFakeIframe();
        arrangeExistingIframe(fake.iframe);
        arrangeStorage({
          authWellKnownEndPoints: {
            checkSessionIframe: 'https://idp.example.com/checksession',
          },
          sessionState: 'session_state',
        });
        vi.spyOn(eventService, 'fireEvent').mockReturnValue(undefined);
      });

      afterEach(() => {
        checkSessionService.stop();
        vi.useRealTimers();
      });

      it('should return true if startCheckSession is configured and a "changed" message was received', () => {
        // Arrange
        checkSessionService.start(config);
        fake.iframe.onload();
        dispatchMessage({
          origin: 'https://idp.example.com',
          source: fake.iframe.contentWindow,
          data: 'changed',
        });

        // Act
        const result = checkSessionService.serverStateChanged(config);

        // Assert
        expect(result).toBe(true);
      });

      it('should return false again after the session check was stopped', () => {
        // Arrange
        checkSessionService.start(config);
        fake.iframe.onload();
        dispatchMessage({
          origin: 'https://idp.example.com',
          source: fake.iframe.contentWindow,
          data: 'changed',
        });

        // Act
        checkSessionService.stop();

        // Assert
        expect(checkSessionService.serverStateChanged(config)).toBe(false);
      });
    });
  });

  describe('polling the server session', () => {
    let fake: FakeIframe;

    beforeEach(() => {
      fake = createFakeIframe();
    });

    afterEach(() => {
      checkSessionService.stop();
    });

    it('should log warning if iframe does not exist', () => {
      // Arrange
      const config = { clientId: 'clientId', configId: 'configId1' };

      vi.spyOn(iFrameService, 'getExistingIFrame').mockReturnValue(null);
      vi.spyOn(iFrameService, 'addIFrameToWindowBody').mockReturnValue(
        fake.iframe
      );
      arrangeStorage({
        authWellKnownEndPoints: {
          checkSessionIframe: 'https://some-testing-url.com',
        },
      });
      const spyLogWarning = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);

      // Act
      checkSessionService.start(config);
      fake.iframe.onload();

      // Assert
      expect(spyLogWarning).toHaveBeenCalledTimes(1);
      expect(spyLogWarning).toHaveBeenCalledWith(config, expect.any(String));
    });

    it('should log warning if clientId is not set', () => {
      // Arrange
      const config = { configId: 'configId1' };

      arrangeExistingIframe(fake.iframe);
      arrangeStorage({
        authWellKnownEndPoints: {
          checkSessionIframe: 'https://some-testing-url.com',
        },
      });
      const spyLogWarning = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);

      // Act
      checkSessionService.start(config);
      fake.iframe.onload();

      // Assert
      expect(spyLogWarning).toHaveBeenCalledTimes(1);
      expect(spyLogWarning).toHaveBeenCalledWith(config, expect.any(String));
      expect(fake.postMessage).not.toHaveBeenCalled();
    });

    it('should log debug if session_state is not set', () => {
      // Arrange
      arrangeExistingIframe(fake.iframe);
      arrangeStorage({
        authWellKnownEndPoints: {
          checkSessionIframe: 'https://some-testing-url.com',
        },
        sessionState: null,
      });
      const spyLogDebug = vi
        .spyOn(loggerService, 'logDebug')
        .mockImplementation(() => undefined);

      // Act
      checkSessionService.start({
        clientId: 'clientId',
        configId: 'configId1',
      });
      fake.iframe.onload();

      // Assert
      expect(spyLogDebug).toHaveBeenCalledTimes(2);
      expect(fake.postMessage).not.toHaveBeenCalled();
    });

    it('should log debug if session_state is set but authWellKnownEndpoints are not set', () => {
      // Arrange
      const storage = {
        authWellKnownEndPoints: {
          checkSessionIframe: 'https://some-testing-url.com',
        } as unknown,
        sessionState: 'some_session_state',
      };

      arrangeExistingIframe(fake.iframe);
      arrangeStorage(storage);
      const spyLogDebug = vi
        .spyOn(loggerService, 'logDebug')
        .mockImplementation(() => undefined);

      checkSessionService.start({
        clientId: 'clientId',
        configId: 'configId1',
      });
      storage.authWellKnownEndPoints = null;

      // Act
      fake.iframe.onload();

      // Assert
      expect(spyLogDebug).toHaveBeenCalledTimes(2);
      expect(fake.postMessage).not.toHaveBeenCalled();
    });

    it('should emit checkSessionChanged$ true when the session cannot be checked', () => {
      // Arrange
      arrangeExistingIframe(fake.iframe);
      arrangeStorage({
        authWellKnownEndPoints: {
          checkSessionIframe: 'https://some-testing-url.com',
        },
        sessionState: null,
      });
      const results: boolean[] = [];

      checkSessionService.checkSessionChanged$.subscribe((r) =>
        results.push(r)
      );

      // Act
      checkSessionService.start({
        clientId: 'clientId',
        configId: 'configId1',
      });
      fake.iframe.onload();

      // Assert
      expect(results).toEqual([false, true]);
    });

    it('should post "clientId sessionState" to the iframe origin of checkSessionIframe', () => {
      // Arrange
      arrangeExistingIframe(fake.iframe);
      arrangeStorage({
        authWellKnownEndPoints: {
          checkSessionIframe: 'https://idp.example.com/connect/checksession',
        },
        sessionState: 'the-session-state',
      });

      // Act
      checkSessionService.start({
        clientId: 'clientId',
        configId: 'configId1',
      });
      fake.iframe.onload();

      // Assert
      expect(fake.postMessage).toHaveBeenCalledExactlyOnceWith(
        'clientId the-session-state',
        'https://idp.example.com'
      );
    });

    describe('heartbeat', () => {
      beforeEach(() => {
        vi.useFakeTimers();
        arrangeExistingIframe(fake.iframe);
        arrangeStorage({
          authWellKnownEndPoints: {
            checkSessionIframe: 'https://idp.example.com',
          },
          sessionState: 'session_state',
        });
      });

      afterEach(() => {
        checkSessionService.stop();
        vi.useRealTimers();
      });

      // The iframe is only re-navigated (and the next heartbeat only scheduled)
      // once the refresh interval has passed, so jump the clock past it after
      // every load before letting the next heartbeat fire.
      function loadIframeAndRunNextHeartBeat(): void {
        fake.iframe.onload();
        vi.setSystemTime(Date.now() + IFRAME_REFRESH_INTERVAL);
        vi.advanceTimersByTime(HEART_BEAT_INTERVAL);
      }

      it('should poll the server again after each heartbeat interval', () => {
        // Arrange
        checkSessionService.start({
          clientId: 'clientId',
          configId: 'configId1',
        });

        // Act
        loadIframeAndRunNextHeartBeat();
        loadIframeAndRunNextHeartBeat();
        fake.iframe.onload();

        // Assert
        expect(fake.postMessage).toHaveBeenCalledTimes(3);
      });

      it('should not log an error while at most three messages are outstanding', () => {
        // Arrange
        const spyLogError = vi
          .spyOn(loggerService, 'logError')
          .mockImplementation(() => undefined);

        checkSessionService.start({
          clientId: 'clientId',
          configId: 'configId1',
        });

        // Act
        loadIframeAndRunNextHeartBeat();
        loadIframeAndRunNextHeartBeat();
        fake.iframe.onload();

        // Assert
        expect(fake.postMessage).toHaveBeenCalledTimes(3);
        expect(spyLogError).not.toHaveBeenCalled();
      });

      it('should log an error when more than three messages are outstanding', () => {
        // Arrange
        const config = { clientId: 'clientId', configId: 'configId1' };
        const spyLogError = vi
          .spyOn(loggerService, 'logError')
          .mockImplementation(() => undefined);

        checkSessionService.start(config);

        // Act
        loadIframeAndRunNextHeartBeat();
        loadIframeAndRunNextHeartBeat();
        loadIframeAndRunNextHeartBeat();
        fake.iframe.onload();

        // Assert
        expect(spyLogError).toHaveBeenCalledExactlyOnceWith(
          config,
          expect.stringContaining("Outstanding messages: '4'")
        );
      });

      it('should reset the outstanding messages on every received message, even rejected ones', () => {
        // Arrange
        const spyLogError = vi
          .spyOn(loggerService, 'logError')
          .mockImplementation(() => undefined);

        checkSessionService.start({
          clientId: 'clientId',
          configId: 'configId1',
        });
        loadIframeAndRunNextHeartBeat();
        loadIframeAndRunNextHeartBeat();

        // Act
        dispatchMessage({
          origin: 'https://attacker.example',
          source: fake.iframe.contentWindow,
          data: 'unchanged',
        });
        loadIframeAndRunNextHeartBeat();
        fake.iframe.onload();

        // Assert
        expect(fake.postMessage).toHaveBeenCalledTimes(4);
        expect(spyLogError).not.toHaveBeenCalled();
      });

      it('should prevent any further polling after stop', () => {
        // Arrange
        checkSessionService.start({
          clientId: 'clientId',
          configId: 'configId1',
        });
        fake.iframe.onload();

        // Act
        checkSessionService.stop();
        vi.setSystemTime(Date.now() + IFRAME_REFRESH_INTERVAL);
        vi.advanceTimersByTime(HEART_BEAT_INTERVAL * 3);

        // Assert
        expect(fake.replace).toHaveBeenCalledTimes(1);
        expect(fake.postMessage).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('without a document defaultView', () => {
    let serviceWithoutDefaultView: CheckSessionService;
    let injector: EnvironmentInjector;

    beforeEach(() => {
      injector = createEnvironmentInjector(
        [
          CheckSessionService,
          { provide: DOCUMENT, useValue: { defaultView: null } },
        ],
        TestBed.inject(EnvironmentInjector)
      );
      serviceWithoutDefaultView = injector.get(CheckSessionService);
    });

    afterEach(() => {
      injector.destroy();
      vi.useRealTimers();
    });

    it('should not schedule a heartbeat so that start polls again', () => {
      // Arrange
      vi.useFakeTimers();
      const fake = createFakeIframe();
      const config = { clientId: 'clientId', configId: 'configId1' };

      arrangeExistingIframe(fake.iframe);
      arrangeStorage({
        authWellKnownEndPoints: {
          checkSessionIframe: 'https://idp.example.com',
        },
        sessionState: 'session_state',
      });
      serviceWithoutDefaultView.start(config);
      fake.iframe.onload();
      vi.setSystemTime(Date.now() + IFRAME_REFRESH_INTERVAL);

      // Act
      serviceWithoutDefaultView.start(config);

      // Assert
      expect(fake.replace).toHaveBeenCalledTimes(2);
    });

    it('should not register a message listener on the window', () => {
      // Arrange
      const spyAddEventListener = vi.spyOn(window, 'addEventListener');

      arrangeExistingIframe(createFakeIframe().iframe);
      arrangeStorage({
        authWellKnownEndPoints: {
          checkSessionIframe: 'https://idp.example.com',
        },
      });

      // Act
      serviceWithoutDefaultView.start({
        clientId: 'clientId',
        configId: 'configId1',
      });

      // Assert
      expect(spyAddEventListener).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      arrangeExistingIframe(createFakeIframe().iframe);
      arrangeStorage({
        authWellKnownEndPoints: {
          checkSessionIframe: 'https://idp.example.com/checksession',
        },
        sessionState: 'session_state',
      });
    });

    it('should remove the bound message listener from the window', () => {
      // Arrange
      const spyAddEventListener = vi.spyOn(window, 'addEventListener');

      checkSessionService.start({
        clientId: 'clientId',
        configId: 'configId1',
      });
      const boundListener = spyAddEventListener.mock.calls[0][1];
      const spyRemoveEventListener = vi.spyOn(window, 'removeEventListener');

      // Act
      checkSessionService.ngOnDestroy();

      // Assert
      expect(spyRemoveEventListener).toHaveBeenCalledExactlyOnceWith(
        'message',
        boundListener,
        false
      );
    });

    it('should not remove a listener when none was bound', () => {
      // Arrange
      const spyRemoveEventListener = vi.spyOn(window, 'removeEventListener');

      // Act
      checkSessionService.ngOnDestroy();

      // Assert
      expect(spyRemoveEventListener).not.toHaveBeenCalled();
    });

    it('should stop a running heartbeat', () => {
      // Arrange
      vi.useFakeTimers();
      const fake = createFakeIframe();

      arrangeExistingIframe(fake.iframe);
      checkSessionService.start({
        clientId: 'clientId',
        configId: 'configId1',
      });
      fake.iframe.onload();

      // Act
      checkSessionService.ngOnDestroy();
      vi.setSystemTime(Date.now() + IFRAME_REFRESH_INTERVAL);
      vi.advanceTimersByTime(HEART_BEAT_INTERVAL * 3);
      vi.useRealTimers();

      // Assert
      expect(fake.replace).toHaveBeenCalledTimes(1);
      expect(fake.postMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('iframe initialization', () => {
    const config = { clientId: 'clientId', configId: 'configId1' };

    it('should log a warning and not create an iframe when authWellKnownEndPoints is missing', () => {
      // Arrange
      arrangeStorage({ authWellKnownEndPoints: undefined });
      const addIFrameSpy = vi.spyOn(iFrameService, 'addIFrameToWindowBody');
      const spyLogWarning = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);

      // Act
      checkSessionService.start(config);

      // Assert
      expect(addIFrameSpy).not.toHaveBeenCalled();
      expect(spyLogWarning).toHaveBeenCalledExactlyOnceWith(
        config,
        expect.stringContaining('authWellKnownEndpoints is undefined')
      );
    });

    it('should log a warning and not navigate when checkSessionIframe is not configured', () => {
      // Arrange
      const fake = createFakeIframe();

      arrangeExistingIframe(fake.iframe);
      arrangeStorage({
        authWellKnownEndPoints: { checkSessionIframe: undefined },
      });
      const spyLogWarning = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);

      // Act
      checkSessionService.start(config);

      // Assert
      expect(fake.replace).not.toHaveBeenCalled();
      expect(fake.iframe.onload).toBeUndefined();
      expect(spyLogWarning).toHaveBeenCalledExactlyOnceWith(
        config,
        expect.stringContaining('checkSessionIframe is not configured')
      );
    });

    it('should navigate the iframe content window to checkSessionIframe', () => {
      // Arrange
      const fake = createFakeIframe();

      arrangeExistingIframe(fake.iframe);
      arrangeStorage({
        authWellKnownEndPoints: {
          checkSessionIframe: 'https://idp.example.com/checksession',
        },
      });

      // Act
      checkSessionService.start(config);

      // Assert
      expect(fake.replace).toHaveBeenCalledExactlyOnceWith(
        'https://idp.example.com/checksession'
      );
    });

    it('should log a warning when the iframe has no contentWindow', () => {
      // Arrange
      const fakeIframe = { contentWindow: null } as any;

      arrangeExistingIframe(fakeIframe);
      arrangeStorage({
        authWellKnownEndPoints: {
          checkSessionIframe: 'https://idp.example.com/checksession',
        },
      });
      const spyLogWarning = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);

      // Act
      checkSessionService.start(config);

      // Assert
      expect(spyLogWarning).toHaveBeenCalledExactlyOnceWith(
        config,
        expect.stringContaining('IFrame contentWindow does not exist')
      );
    });

    it('should not check the session before the iframe has loaded', () => {
      // Arrange
      const fake = createFakeIframe();

      arrangeExistingIframe(fake.iframe);
      arrangeStorage({
        authWellKnownEndPoints: {
          checkSessionIframe: 'https://idp.example.com/checksession',
        },
        sessionState: 'session_state',
      });

      // Act
      checkSessionService.start(config);

      // Assert
      expect(fake.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('message handling', () => {
    const config = {
      clientId: 'clientId',
      configId: 'configId1',
      startCheckSession: true,
    };
    let fake: FakeIframe;

    beforeEach(() => {
      fake = createFakeIframe();
      arrangeExistingIframe(fake.iframe);
    });

    function startWithCheckSessionIframe(
      checkSessionIframe: string | undefined,
      configuration: OpenIdConfiguration = config
    ): void {
      arrangeStorage({ authWellKnownEndPoints: { checkSessionIframe } });
      vi.spyOn(loggerService, 'logWarning').mockImplementation(() => undefined);
      checkSessionService.start(configuration);
    }

    function dispatchFromIframe(
      overrides: { origin?: string; source?: unknown; data?: unknown } = {}
    ): void {
      dispatchMessage({
        origin: 'https://idp.example.com',
        source: fake.iframe.contentWindow,
        data: 'changed',
        ...overrides,
      });
    }

    it('should process the message when e.origin exactly matches the origin of checkSessionIframe', () => {
      startWithCheckSessionIframe(
        'https://idp.example.com/connect/checksession'
      );
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);

      dispatchFromIframe();

      expect(fireEventSpy).toHaveBeenCalled();
    });

    it('should reject the message when e.origin is only a prefix substring of checkSessionIframe (typosquat regression)', () => {
      // Real-world risk: an attacker registers idp.example.co (one char short of
      // idp.example.com) and tricks the iframe into loading from there. With the
      // old startsWith check this passes because the configured URL string starts
      // with the attacker's shorter origin. With exact-origin equality it fails.
      startWithCheckSessionIframe(
        'https://idp.example.com/connect/checksession'
      );
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);

      dispatchFromIframe({ origin: 'https://idp.example.co' });

      expect(fireEventSpy).not.toHaveBeenCalled();
    });

    it('should reject the message when e.origin is an unrelated host', () => {
      startWithCheckSessionIframe('https://idp.example.com/checksession');
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);

      dispatchFromIframe({ origin: 'https://attacker.example' });

      expect(fireEventSpy).not.toHaveBeenCalled();
    });

    it('should reject the message when checkSessionIframe is missing', () => {
      startWithCheckSessionIframe(undefined);
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);

      dispatchFromIframe();

      expect(fireEventSpy).not.toHaveBeenCalled();
    });

    it('should reject the message when checkSessionIframe is a malformed URL', () => {
      startWithCheckSessionIframe('not a valid url');
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);

      dispatchFromIframe();

      expect(fireEventSpy).not.toHaveBeenCalled();
    });

    it('should reject the message when e.source is not the existing iframe (defense in depth)', () => {
      startWithCheckSessionIframe('https://idp.example.com/checksession');
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);

      dispatchFromIframe({ source: { id: 'some-other-window' } });

      expect(fireEventSpy).not.toHaveBeenCalled();
    });

    it('should reject the message when no check session iframe exists', () => {
      // Arrange
      startWithCheckSessionIframe('https://idp.example.com/checksession');
      vi.spyOn(iFrameService, 'getExistingIFrame').mockReturnValue(null);
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);

      // Act
      dispatchFromIframe();

      // Assert
      expect(fireEventSpy).not.toHaveBeenCalled();
    });

    it('should log a warning and fire no event when the iframe reports "error"', () => {
      // Arrange
      startWithCheckSessionIframe('https://idp.example.com/checksession');
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);
      const spyLogWarning = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);

      // Act
      dispatchFromIframe({ data: 'error' });

      // Assert
      expect(spyLogWarning).toHaveBeenCalledExactlyOnceWith(
        config,
        'CheckSession - error from check session messageHandler'
      );
      expect(fireEventSpy).not.toHaveBeenCalled();
      expect(checkSessionService.serverStateChanged(config)).toBe(false);
    });

    it('should mark the session as changed and emit checkSessionChanged$ when the iframe reports "changed"', () => {
      // Arrange
      startWithCheckSessionIframe('https://idp.example.com/checksession');
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);
      const results: boolean[] = [];

      checkSessionService.checkSessionChanged$.subscribe((r) =>
        results.push(r)
      );

      // Act
      dispatchFromIframe({ data: 'changed' });

      // Assert
      expect(checkSessionService.serverStateChanged(config)).toBe(true);
      expect(fireEventSpy).toHaveBeenCalledExactlyOnceWith(
        EventTypes.CheckSessionReceived,
        'changed'
      );
      expect(results).toEqual([false, true]);
    });

    it('should fire CheckSessionReceived without flagging a change when the iframe reports "unchanged"', () => {
      // Arrange
      startWithCheckSessionIframe('https://idp.example.com/checksession');
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);
      const results: boolean[] = [];

      checkSessionService.checkSessionChanged$.subscribe((r) =>
        results.push(r)
      );

      // Act
      dispatchFromIframe({ data: 'unchanged' });

      // Assert
      expect(fireEventSpy).toHaveBeenCalledExactlyOnceWith(
        EventTypes.CheckSessionReceived,
        'unchanged'
      );
      expect(checkSessionService.serverStateChanged(config)).toBe(false);
      expect(results).toEqual([false]);
    });

    it('should replace the previous message listener when the session check is started again', () => {
      // Arrange
      const spyAddEventListener = vi.spyOn(window, 'addEventListener');

      startWithCheckSessionIframe('https://idp.example.com/checksession');
      const firstListener = spyAddEventListener.mock.calls[0][1];
      const spyRemoveEventListener = vi.spyOn(window, 'removeEventListener');

      // Act
      checkSessionService.start(config);

      // Assert
      expect(spyRemoveEventListener).toHaveBeenCalledExactlyOnceWith(
        'message',
        firstListener,
        false
      );
      expect(spyAddEventListener).toHaveBeenCalledTimes(2);
    });

    it('should register a single message listener on the window when started', () => {
      // Arrange
      const spyAddEventListener = vi.spyOn(window, 'addEventListener');
      const spyRemoveEventListener = vi.spyOn(window, 'removeEventListener');

      // Act
      startWithCheckSessionIframe('https://idp.example.com/checksession');

      // Assert
      expect(spyAddEventListener).toHaveBeenCalledExactlyOnceWith(
        'message',
        expect.any(Function),
        false
      );
      expect(spyRemoveEventListener).not.toHaveBeenCalled();
    });
  });

  describe('isCheckSessionConfigured', () => {
    it('should return true if startCheckSession on config is true', () => {
      const config = { configId: 'configId1', startCheckSession: true };
      const result = checkSessionService.isCheckSessionConfigured(config);

      expect(result).toBe(true);
    });

    it('should return false if startCheckSession on config is false', () => {
      const config = { configId: 'configId1', startCheckSession: false };
      const result = checkSessionService.isCheckSessionConfigured(config);

      expect(result).toBe(false);
    });
  });

  describe('checkSessionChanged$', () => {
    it('should emit false initially', async () => {
      const result = await firstValueFrom(
        checkSessionService.checkSessionChanged$
      );

      expect(result).toBe(false);
    });
  });
});
