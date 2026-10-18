import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { skip } from 'rxjs/operators';
import { mockAbstractProvider, mockProvider } from '../../test/auto-mock';
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

  it('should add an iframe to the window body if no iframe exists', () => {
    vi.spyOn(iFrameService, 'addIFrameToWindowBody');

    const result = (checkSessionService as any).getOrCreateIframe({
      configId: 'configId1',
    });

    expect(result).toBeTruthy();
    expect(iFrameService.addIFrameToWindowBody).toHaveBeenCalled();
  });

  it('should return the existing iframe if it is found on window.document', () => {
    const existingIframe = iFrameService.addIFrameToWindowBody(
      'myiFrameForCheckSession',
      {
        configId: 'configId1',
      }
    );
    const addIFrameSpy = vi.spyOn(iFrameService, 'addIFrameToWindowBody');
    const result = (checkSessionService as any).getOrCreateIframe();

    expect(result).toBe(existingIframe);
    expect(addIFrameSpy).not.toHaveBeenCalled();
  });

  it('should append the iframe to the body with correct values on init', () => {
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

    expect(iFrame).toBe(iframe);
  });

  it('should log warning if authWellKnownEndpoints.check_session_iframe is not existing', () => {
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

  it('should start polling the server session with the clientId if no heartbeat is scheduled', () => {
    const spy = vi
      .spyOn(checkSessionService as any, 'pollServerSession')
      .mockReturnValue(undefined);
    const config = { clientId: 'clientId', configId: 'configId1' };

    checkSessionService.start(config);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('clientId', config);
  });

  it('should not start polling the server session if a heartbeat is already scheduled', () => {
    const config = { configId: 'configId1' };
    const spy = vi
      .spyOn(checkSessionService as any, 'pollServerSession')
      .mockReturnValue(undefined);

    (checkSessionService as any).scheduledHeartBeatRunning = (): void =>
      undefined;
    checkSessionService.start(config);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should stop the scheduled heartbeat when stopping the session check', () => {
    (checkSessionService as any).scheduledHeartBeatRunning = setTimeout(
      () => undefined,
      999
    );
    checkSessionService.stop();
    const heartBeat = (checkSessionService as any).scheduledHeartBeatRunning;

    expect(heartBeat).toBeNull();
  });

  it('should do nothing when stopping the session check if no heartbeat is scheduled', () => {
    (checkSessionService as any).scheduledHeartBeatRunning = null;
    const spy = vi
      .spyOn(checkSessionService as any, 'clearScheduledHeartBeat')
      .mockReturnValue(undefined);

    checkSessionService.stop();
    expect(spy).not.toHaveBeenCalled();
  });

  describe('serverStateChanged', () => {
    it('should return false if startCheckSession is not configured', () => {
      const config = { startCheckSession: false, configId: 'configId1' };
      const result = checkSessionService.serverStateChanged(config);

      expect(result).toBeFalsy();
    });

    it('should return false if checkSessionReceived is false', () => {
      (checkSessionService as any).checkSessionReceived = false;
      const config = { startCheckSession: true, configId: 'configId1' };
      const result = checkSessionService.serverStateChanged(config);

      expect(result).toBe(false);
    });

    it('should return true if startCheckSession is configured and checkSessionReceived is true', () => {
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

    it('should increase outstandingMessages', () => {
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

    it('should log warning if iframe does not exist', () => {
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

    it('should log warning if clientId is not set', () => {
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

    it('should log debug if session_state is not set', () => {
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

    it('should log debug if session_state is set but authWellKnownEndpoints are not set', () => {
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

    it('should emit checkSessionChanged$ true when the session cannot be checked', () => {
      // Arrange
      vi.spyOn(checkSessionService as any, 'getExistingIframe').mockReturnValue(
        {}
      );
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue(undefined);
      const results: boolean[] = [];

      checkSessionService.checkSessionChanged$.subscribe((r) =>
        results.push(r)
      );

      // Act
      (checkSessionService as any).pollServerSession('clientId', {
        configId: 'configId1',
      });

      // Assert
      expect(results).toEqual([false, true]);
    });

    it('should post "clientId sessionState" to the iframe origin of checkSessionIframe', () => {
      // Arrange
      const postMessage = vi.fn();

      vi.spyOn(checkSessionService as any, 'getExistingIframe').mockReturnValue(
        { contentWindow: { postMessage } }
      );
      vi.spyOn(storagePersistenceService, 'read').mockImplementation(
        (...args: any[]) => {
          if (args[0] === 'authWellKnownEndPoints') {
            return {
              checkSessionIframe:
                'https://idp.example.com/connect/checksession',
            };
          }

          if (args[0] === 'session_state') {
            return 'the-session-state';
          }

          return undefined;
        }
      );

      // Act
      (checkSessionService as any).pollServerSession('clientId', {
        configId: 'configId1',
      });

      // Assert
      expect(postMessage).toHaveBeenCalledExactlyOnceWith(
        'clientId the-session-state',
        'https://idp.example.com'
      );
    });

    describe('heartbeat', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        checkSessionService.stop();
        vi.useRealTimers();
      });

      function arrangeIframeWithoutResponses(): ReturnType<typeof vi.fn> {
        const postMessage = vi.fn();

        vi.spyOn(
          checkSessionService as any,
          'getExistingIframe'
        ).mockReturnValue({ contentWindow: { postMessage } });
        vi.spyOn(storagePersistenceService, 'read').mockImplementation(
          (...args: any[]) => {
            if (args[0] === 'authWellKnownEndPoints') {
              return { checkSessionIframe: 'https://idp.example.com' };
            }

            if (args[0] === 'session_state') {
              return 'session_state';
            }

            return undefined;
          }
        );

        return postMessage;
      }

      it('should poll the server again after each heartbeat interval', () => {
        // Arrange
        const postMessage = arrangeIframeWithoutResponses();

        (checkSessionService as any).pollServerSession('clientId', {
          configId: 'configId1',
        });

        // Act
        vi.advanceTimersByTime(3000 * 2);

        // Assert
        expect(postMessage).toHaveBeenCalledTimes(3);
        expect((checkSessionService as any).scheduledHeartBeatRunning).not.toBe(
          null
        );
      });

      it('should not log an error while at most three messages are outstanding', () => {
        // Arrange
        arrangeIframeWithoutResponses();
        const spyLogError = vi
          .spyOn(loggerService, 'logError')
          .mockImplementation(() => undefined);

        (checkSessionService as any).pollServerSession('clientId', {
          configId: 'configId1',
        });

        // Act
        vi.advanceTimersByTime(3000 * 2);

        // Assert
        expect((checkSessionService as any).outstandingMessages).toBe(3);
        expect(spyLogError).not.toHaveBeenCalled();
      });

      it('should log an error when more than three messages are outstanding', () => {
        // Arrange
        arrangeIframeWithoutResponses();
        const config = { configId: 'configId1' };
        const spyLogError = vi
          .spyOn(loggerService, 'logError')
          .mockImplementation(() => undefined);

        (checkSessionService as any).pollServerSession('clientId', config);

        // Act
        vi.advanceTimersByTime(3000 * 3);

        // Assert
        expect(spyLogError).toHaveBeenCalledExactlyOnceWith(
          config,
          expect.stringContaining("Outstanding messages: '4'")
        );
      });

      it('should prevent any further polling after stop', () => {
        // Arrange
        const postMessage = arrangeIframeWithoutResponses();

        (checkSessionService as any).pollServerSession('clientId', {
          configId: 'configId1',
        });

        // Act
        checkSessionService.stop();
        vi.advanceTimersByTime(3000 * 3);

        // Assert
        expect(postMessage).toHaveBeenCalledTimes(1);
        expect(
          (checkSessionService as any).scheduledHeartBeatRunning
        ).toBeNull();
      });
    });

    it('should not schedule a heartbeat when the document has no defaultView', () => {
      // Arrange
      const serviceAsAny = checkSessionService as any;

      vi.spyOn(serviceAsAny, 'getExistingIframe').mockReturnValue(null);
      vi.spyOn(loggerService, 'logWarning').mockImplementation(() => undefined);
      serviceAsAny.document = { defaultView: null };

      // Act
      serviceAsAny.pollServerSession('clientId', { configId: 'configId1' });

      // Assert
      expect(serviceAsAny.scheduledHeartBeatRunning).toBeNull();
    });
  });

  describe('clearScheduledHeartBeat', () => {
    it('should clear the pending timeout and resets the heartbeat handle', () => {
      // Arrange
      const serviceAsAny = checkSessionService as any;
      const callback = vi.fn();

      vi.useFakeTimers();
      serviceAsAny.scheduledHeartBeatRunning = setTimeout(callback, 100);

      // Act
      serviceAsAny.clearScheduledHeartBeat();
      vi.advanceTimersByTime(200);
      vi.useRealTimers();

      // Assert
      expect(callback).not.toHaveBeenCalled();
      expect(serviceAsAny.scheduledHeartBeatRunning).toBeNull();
    });

    it('should not call clearTimeout when no heartbeat is scheduled', () => {
      // Arrange
      const serviceAsAny = checkSessionService as any;
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

      serviceAsAny.scheduledHeartBeatRunning = null;

      // Act
      serviceAsAny.clearScheduledHeartBeat();

      // Assert
      expect(clearTimeoutSpy).not.toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('ngOnDestroy', () => {
    it('should remove the bound message listener from the window', () => {
      // Arrange
      const serviceAsAny = checkSessionService as any;
      const defaultView = serviceAsAny.document.defaultView;

      serviceAsAny.bindMessageEventToIframe({ configId: 'configId1' });
      const boundListener = serviceAsAny.iframeMessageEventListener;
      const spyRemoveEventListener = vi.spyOn(
        defaultView,
        'removeEventListener'
      );

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
      const defaultView = (checkSessionService as any).document.defaultView;
      const spyRemoveEventListener = vi.spyOn(
        defaultView,
        'removeEventListener'
      );

      // Act
      checkSessionService.ngOnDestroy();

      // Assert
      expect(spyRemoveEventListener).not.toHaveBeenCalled();
    });

    it('should stop a running heartbeat', () => {
      // Arrange
      const serviceAsAny = checkSessionService as any;

      serviceAsAny.scheduledHeartBeatRunning = setTimeout(() => undefined, 999);

      // Act
      checkSessionService.ngOnDestroy();

      // Assert
      expect(serviceAsAny.scheduledHeartBeatRunning).toBeNull();
    });
  });

  describe('init', () => {
    const config = { configId: 'configId1' };

    function collect(observable: any): {
      emissions: unknown[];
      isCompleted: () => boolean;
    } {
      const emissions: unknown[] = [];
      let completed = false;

      observable.subscribe({
        next: (v: unknown) => emissions.push(v),
        complete: () => (completed = true),
      });

      return { emissions, isCompleted: () => completed };
    }

    it('should log a warning and completes without emitting when authWellKnownEndPoints is missing', () => {
      // Arrange
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue(undefined);
      const spyLogWarning = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);
      // Act
      const { emissions, isCompleted } = collect(
        (checkSessionService as any).init(config)
      );

      // Assert
      expect(emissions).toEqual([]);
      expect(isCompleted()).toBe(true);
      expect(spyLogWarning).toHaveBeenCalledExactlyOnceWith(
        config,
        expect.stringContaining('authWellKnownEndpoints is undefined')
      );
    });

    it('should complete without emitting when checkSessionIframe is not configured', () => {
      // Arrange
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: undefined,
      });
      const spyLogWarning = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);
      // Act
      const { emissions, isCompleted } = collect(
        (checkSessionService as any).init(config)
      );

      // Assert
      expect(emissions).toEqual([]);
      expect(isCompleted()).toBe(true);
      expect(spyLogWarning).toHaveBeenCalledExactlyOnceWith(
        config,
        expect.stringContaining('checkSessionIframe is not configured')
      );
    });

    it('should navigate the iframe content window to checkSessionIframe', () => {
      // Arrange
      const replace = vi.fn();
      const fakeIframe = { contentWindow: { location: { replace } } } as any;

      vi.spyOn(checkSessionService as any, 'getExistingIframe').mockReturnValue(
        fakeIframe
      );
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: 'https://idp.example.com/checksession',
      });

      // Act
      (checkSessionService as any).init(config).subscribe();

      // Assert
      expect(replace).toHaveBeenCalledExactlyOnceWith(
        'https://idp.example.com/checksession'
      );
    });

    it('should log a warning when the iframe has no contentWindow', () => {
      // Arrange
      const fakeIframe = { contentWindow: null } as any;

      vi.spyOn(checkSessionService as any, 'getExistingIframe').mockReturnValue(
        fakeIframe
      );
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: 'https://idp.example.com/checksession',
      });
      const spyLogWarning = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);

      // Act
      (checkSessionService as any).init(config).subscribe();

      // Assert
      expect(spyLogWarning).toHaveBeenCalledExactlyOnceWith(
        config,
        expect.stringContaining('IFrame contentWindow does not exist')
      );
    });

    it('should not emit before the iframe has loaded', () => {
      // Arrange
      const fakeIframe = {
        contentWindow: { location: { replace: vi.fn() } },
      } as any;

      vi.spyOn(checkSessionService as any, 'getExistingIframe').mockReturnValue(
        fakeIframe
      );
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: 'https://idp.example.com/checksession',
      });

      // Act
      const { emissions, isCompleted } = collect(
        (checkSessionService as any).init(config)
      );

      // Assert
      expect(emissions).toEqual([]);
      expect(isCompleted()).toBe(false);
    });

    it('should emit, complete and record the last iframe refresh when the iframe loads', () => {
      // Arrange
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
      const fakeIframe = { contentWindow: null } as any;

      vi.spyOn(checkSessionService as any, 'getExistingIframe').mockReturnValue(
        fakeIframe
      );
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: 'https://idp.example.com/checksession',
      });
      vi.spyOn(loggerService, 'logWarning').mockImplementation(() => undefined);
      const { emissions, isCompleted } = collect(
        (checkSessionService as any).init(config)
      );

      // Act
      fakeIframe.onload();
      vi.useRealTimers();

      // Assert
      expect(emissions).toEqual([undefined]);
      expect(isCompleted()).toBe(true);
      expect((checkSessionService as any).lastIFrameRefresh).toBe(
        new Date('2026-01-01T00:00:00Z').getTime()
      );
    });

    it('should return falsy observable when lastIframerefresh and iframeRefreshInterval are bigger than now', () => {
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
    it('should remove event listener when iframeMessageEventListener already exist', () => {
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

    it('should not remove event listener when iframeMessageEventListener not exist', () => {
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

    it('should add event listener', () => {
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

    it('should still create the listener but not register it when the document has no defaultView', () => {
      // Arrange
      const serviceAsAny = checkSessionService as any;
      const spyAddEventListener = vi.spyOn(window, 'addEventListener');

      serviceAsAny.document = { defaultView: null };

      // Act
      serviceAsAny.bindMessageEventToIframe({ configId: 'configId1' });

      // Assert
      expect(serviceAsAny.iframeMessageEventListener).toEqual(
        expect.any(Function)
      );
      expect(spyAddEventListener).not.toHaveBeenCalled();
    });

    it('should route window message events to messageHandler with the configuration', () => {
      // Arrange
      const serviceAsAny = checkSessionService as any;
      const configuration = { configId: 'configId1' };
      const spyMessageHandler = vi
        .spyOn(serviceAsAny, 'messageHandler')
        .mockReturnValue(undefined);
      const event = new MessageEvent('message', { data: 'unchanged' });

      serviceAsAny.bindMessageEventToIframe(configuration);

      // Act
      window.dispatchEvent(event);

      // Assert
      expect(spyMessageHandler).toHaveBeenCalledExactlyOnceWith(
        configuration,
        event
      );
      checkSessionService.ngOnDestroy();
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

    it('should process the message when e.origin exactly matches the origin of checkSessionIframe', () => {
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: 'https://idp.example.com/connect/checksession',
      });
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);

      serviceAsAny.messageHandler({ configId: 'configId1' }, messageEvent());

      expect(fireEventSpy).toHaveBeenCalled();
    });

    it('should reject the message when e.origin is only a prefix substring of checkSessionIframe (typosquat regression)', () => {
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

    it('should reject the message when e.origin is an unrelated host', () => {
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

    it('should reject the message when checkSessionIframe is missing', () => {
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: undefined,
      });
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);

      serviceAsAny.messageHandler({ configId: 'configId1' }, messageEvent());

      expect(fireEventSpy).not.toHaveBeenCalled();
    });

    it('should reject the message when checkSessionIframe is a malformed URL', () => {
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: 'not a valid url',
      });
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);

      serviceAsAny.messageHandler({ configId: 'configId1' }, messageEvent());

      expect(fireEventSpy).not.toHaveBeenCalled();
    });

    it('should reject the message when e.source is not the existing iframe (defense in depth)', () => {
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

    it('should reject the message when no check session iframe exists', () => {
      // Arrange
      vi.spyOn(serviceAsAny, 'getExistingIframe').mockReturnValue(null);
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: 'https://idp.example.com/checksession',
      });
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);

      // Act
      serviceAsAny.messageHandler({ configId: 'configId1' }, messageEvent());

      // Assert
      expect(fireEventSpy).not.toHaveBeenCalled();
    });

    it('should reset outstandingMessages on every received message, even rejected ones', () => {
      // Arrange
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: 'https://idp.example.com/checksession',
      });
      serviceAsAny.outstandingMessages = 3;

      // Act
      serviceAsAny.messageHandler(
        { configId: 'configId1' },
        messageEvent({ origin: 'https://attacker.example' })
      );

      // Assert
      expect(serviceAsAny.outstandingMessages).toBe(0);
    });

    it('should log a warning and fires no event when the iframe reports "error"', () => {
      // Arrange
      const config = { configId: 'configId1' };

      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: 'https://idp.example.com/checksession',
      });
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);
      const spyLogWarning = vi
        .spyOn(loggerService, 'logWarning')
        .mockImplementation(() => undefined);

      // Act
      serviceAsAny.messageHandler(config, messageEvent({ data: 'error' }));

      // Assert
      expect(spyLogWarning).toHaveBeenCalledExactlyOnceWith(
        config,
        'CheckSession - error from check session messageHandler'
      );
      expect(fireEventSpy).not.toHaveBeenCalled();
      expect(serviceAsAny.checkSessionReceived).toBe(false);
    });

    it('should mark the session as changed and emits checkSessionChanged$ when the iframe reports "changed"', () => {
      // Arrange
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: 'https://idp.example.com/checksession',
      });
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);
      const results: boolean[] = [];

      checkSessionService.checkSessionChanged$.subscribe((r) =>
        results.push(r)
      );

      // Act
      serviceAsAny.messageHandler(
        { configId: 'configId1' },
        messageEvent({ data: 'changed' })
      );

      // Assert
      expect(serviceAsAny.checkSessionReceived).toBe(true);
      expect(fireEventSpy).toHaveBeenCalledExactlyOnceWith(
        EventTypes.CheckSessionReceived,
        'changed'
      );
      expect(results).toEqual([false, true]);
    });

    it('should fire CheckSessionReceived without flagging a change when the iframe reports "unchanged"', () => {
      // Arrange
      vi.spyOn(storagePersistenceService, 'read').mockReturnValue({
        checkSessionIframe: 'https://idp.example.com/checksession',
      });
      const fireEventSpy = vi
        .spyOn(eventService, 'fireEvent')
        .mockReturnValue(undefined);
      const results: boolean[] = [];

      checkSessionService.checkSessionChanged$.subscribe((r) =>
        results.push(r)
      );

      // Act
      serviceAsAny.messageHandler(
        { configId: 'configId1' },
        messageEvent({ data: 'unchanged' })
      );

      // Assert
      expect(fireEventSpy).toHaveBeenCalledExactlyOnceWith(
        EventTypes.CheckSessionReceived,
        'unchanged'
      );
      expect(serviceAsAny.checkSessionReceived).toBe(false);
      expect(results).toEqual([false]);
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
    it('should emit when internal event is thrown', () => {
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

    it('should emit false initially', async () => {
      const result = await firstValueFrom(
        checkSessionService.checkSessionChanged$
      );

      expect(result).toBe(false);
    });

    it('should emit false then true when emitted', () => {
      const results: boolean[] = [];

      checkSessionService.checkSessionChanged$.subscribe((result) => {
        results.push(result);
      });

      (checkSessionService as any).checkSessionChangedInternal$.next(true);

      expect(results).toEqual([false, true]);
    });
  });
});
