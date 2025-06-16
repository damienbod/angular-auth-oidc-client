import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
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
    spyOn(iFrameService, 'addIFrameToWindowBody').and.callThrough();

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
    spyOn<any>(loggerService, 'logDebug').and.callFake(() => undefined);

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
    const spyLogWarning = spyOn<any>(loggerService, 'logWarning');
    const config = { configId: 'configId1' };

    spyOn<any>(loggerService, 'logDebug').and.callFake(() => undefined);
    spyOn(storagePersistenceService, 'read')
      .withArgs('authWellKnownEndPoints', config)
      .and.returnValue({ checkSessionIframe: undefined });
    (checkSessionService as any).init(config);

    expect(spyLogWarning).toHaveBeenCalledOnceWith(config, jasmine.any(String));
  });

  it('start() calls pollserversession() with clientId if no scheduledheartbeat is set', () => {
    const spy = spyOn<any>(checkSessionService, 'pollServerSession');
    const config = { clientId: 'clientId', configId: 'configId1' };

    checkSessionService.start(config);
    expect(spy).toHaveBeenCalledOnceWith('clientId', config);
  });

  it('start() does not call pollServerSession() if scheduledHeartBeatRunning is set', () => {
    const config = { configId: 'configId1' };
    const spy = spyOn<any>(checkSessionService, 'pollServerSession');

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
    const spy = spyOn<any>(checkSessionService, 'clearScheduledHeartBeat');

    checkSessionService.stop();
    expect(spy).not.toHaveBeenCalledOnceWith();
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

      expect(result).toBeFalse();
    });

    it('returns true if startCheckSession is configured and checkSessionReceived is true', () => {
      (checkSessionService as any).checkSessionReceived = true;
      const config = { startCheckSession: true, configId: 'configId1' };
      const result = checkSessionService.serverStateChanged(config);

      expect(result).toBeTrue();
    });
  });

  describe('pollServerSession', () => {
    beforeEach(() => {
      spyOn<any>(checkSessionService, 'init').and.returnValue(of(undefined));
    });

    it('increases outstandingMessages', () => {
      spyOn<any>(checkSessionService, 'getExistingIframe').and.returnValue({
        contentWindow: { postMessage: () => undefined },
      });
      const authWellKnownEndpoints = {
        checkSessionIframe: 'https://some-testing-url.com',
      };
      const config = { configId: 'configId1' };

      spyOn(storagePersistenceService, 'read')
        .withArgs('authWellKnownEndPoints', config)
        .and.returnValue(authWellKnownEndpoints)
        .withArgs('session_state', config)
        .and.returnValue('session_state');
      spyOn(loggerService, 'logDebug').and.callFake(() => undefined);
      (checkSessionService as any).pollServerSession('clientId', config);
      expect((checkSessionService as any).outstandingMessages).toBe(1);
    });

    it('logs warning if iframe does not exist', () => {
      spyOn<any>(checkSessionService, 'getExistingIframe').and.returnValue(
        null
      );
      const authWellKnownEndpoints = {
        checkSessionIframe: 'https://some-testing-url.com',
      };
      const config = { configId: 'configId1' };

      spyOn(storagePersistenceService, 'read')
        .withArgs('authWellKnownEndPoints', config)
        .and.returnValue(authWellKnownEndpoints);
      const spyLogWarning = spyOn(loggerService, 'logWarning').and.callFake(
        () => undefined
      );

      spyOn(loggerService, 'logDebug').and.callFake(() => undefined);
      (checkSessionService as any).pollServerSession('clientId', config);
      expect(spyLogWarning).toHaveBeenCalledOnceWith(
        config,
        jasmine.any(String)
      );
    });

    it('logs warning if clientId is not set', () => {
      spyOn<any>(checkSessionService, 'getExistingIframe').and.returnValue({});
      const authWellKnownEndpoints = {
        checkSessionIframe: 'https://some-testing-url.com',
      };
      const config = { configId: 'configId1' };

      spyOn(storagePersistenceService, 'read')
        .withArgs('authWellKnownEndPoints', config)
        .and.returnValue(authWellKnownEndpoints);
      const spyLogWarning = spyOn(loggerService, 'logWarning').and.callFake(
        () => undefined
      );

      spyOn(loggerService, 'logDebug').and.callFake(() => undefined);
      (checkSessionService as any).pollServerSession('', config);
      expect(spyLogWarning).toHaveBeenCalledOnceWith(
        config,
        jasmine.any(String)
      );
    });

    it('logs debug if session_state is not set', () => {
      spyOn<any>(checkSessionService, 'getExistingIframe').and.returnValue({});
      const authWellKnownEndpoints = {
        checkSessionIframe: 'https://some-testing-url.com',
      };
      const config = { configId: 'configId1' };

      spyOn(storagePersistenceService, 'read')
        .withArgs('authWellKnownEndPoints', config)
        .and.returnValue(authWellKnownEndpoints)
        .withArgs('session_state', config)
        .and.returnValue(null);

      const spyLogDebug = spyOn(loggerService, 'logDebug').and.callFake(
        () => undefined
      );

      (checkSessionService as any).pollServerSession('clientId', config);
      expect(spyLogDebug).toHaveBeenCalledTimes(2);
    });

    it('logs debug if session_state is set but authWellKnownEndpoints are not set', () => {
      spyOn<any>(checkSessionService, 'getExistingIframe').and.returnValue({});
      const authWellKnownEndpoints = null;
      const config = { configId: 'configId1' };

      spyOn(storagePersistenceService, 'read')
        .withArgs('authWellKnownEndPoints', config)
        .and.returnValue(authWellKnownEndpoints)
        .withArgs('session_state', config)
        .and.returnValue('some_session_state');
      const spyLogDebug = spyOn(loggerService, 'logDebug').and.callFake(
        () => undefined
      );

      (checkSessionService as any).pollServerSession('clientId', config);
      expect(spyLogDebug).toHaveBeenCalledTimes(2);
    });
  });

  describe('init', () => {
    it('returns falsy observable when lastIframerefresh and iframeRefreshInterval are bigger than now', waitForAsync(() => {
      const serviceAsAny = checkSessionService as any;
      const dateNow = new Date();
      const lastRefresh = dateNow.setMinutes(dateNow.getMinutes() + 30);

      serviceAsAny.lastIFrameRefresh = lastRefresh;
      serviceAsAny.iframeRefreshInterval = lastRefresh;

      serviceAsAny.init().subscribe((result: any) => {
        expect(result).toBeUndefined();
      });
    }));
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

      const spyRemoveEventListener = spyOn(defaultView, 'removeEventListener');

      serviceAsAny.bindMessageEventToIframe(configuration);

      expect(spyRemoveEventListener).toHaveBeenCalledOnceWith(
        'message',
        existingListener,
        false
      );
    });

    it('doesn\'t remove event listener when iframeMessageEventListener not exist', () => {
      const serviceAsAny = checkSessionService as any;
      const defaultView = serviceAsAny.document.defaultView;

      serviceAsAny.iframeMessageEventListener = undefined;

      const spyRemoveEventListener = spyOn(defaultView, 'removeEventListener');
      const configuration = { configId: 'configId1' };

      serviceAsAny.bindMessageEventToIframe(configuration);

      expect(spyRemoveEventListener).not.toHaveBeenCalled();
    });

    it('add event listener', () => {
      const serviceAsAny = checkSessionService as any;
      const defaultView = serviceAsAny.document.defaultView;
      const spyAddEventListener = spyOn(defaultView, 'addEventListener');
      const configuration = { configId: 'configId1' };

      serviceAsAny.bindMessageEventToIframe(configuration);

      expect(spyAddEventListener).toHaveBeenCalledOnceWith(
        'message',
        jasmine.any(Function),
        false
      );
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
    it('emits when internal event is thrown', waitForAsync(() => {
      checkSessionService.checkSessionChanged$
        .pipe(skip(1))
        .subscribe((result) => {
          expect(result).toBe(true);
        });

      const serviceAsAny = checkSessionService as any;

      serviceAsAny.checkSessionChangedInternal$.next(true);
    }));

    it('emits false initially', waitForAsync(() => {
      checkSessionService.checkSessionChanged$.subscribe((result) => {
        expect(result).toBe(false);
      });
    }));

    it('emits false then true when emitted', waitForAsync(() => {
      const expectedResultsInOrder = [false, true];
      let counter = 0;

      checkSessionService.checkSessionChanged$.subscribe((result) => {
        expect(result).toBe(expectedResultsInOrder[counter]);
        counter++;
      });

      (checkSessionService as any).checkSessionChangedInternal$.next(true);
    }));
  });
});
