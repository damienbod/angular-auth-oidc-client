import { TestBed, waitForAsync } from '@angular/core/testing';
import { of } from 'rxjs';
import { skip } from 'rxjs/operators';
import { ConfigurationProvider } from '../config/provider/config.provider';
import { ConfigurationProviderMock } from '../config/provider/config.provider-mock';
import { LoggerService } from '../logging/logger.service';
import { LoggerServiceMock } from '../logging/logger.service-mock';
import { OidcSecurityService } from '../oidc.security.service';
import { PublicEventsService } from '../public-events/public-events.service';
import { AbstractSecurityStorage } from '../storage/abstract-security-storage';
import { BrowserStorageMock } from '../storage/browser-storage.service-mock';
import { StoragePersistenceService } from '../storage/storage-persistence.service';
import { StoragePersistenceServiceMock } from '../storage/storage-persistence.service-mock';
import { PlatformProvider } from '../utils/platform-provider/platform.provider';
import { PlatformProviderMock } from '../utils/platform-provider/platform.provider-mock';
import { CheckSessionService } from './check-session.service';
import { IFrameService } from './existing-iframe.service';

describe('CheckSessionService', () => {
  let checkSessionService: CheckSessionService;
  let loggerService: LoggerService;
  let configurationProvider: ConfigurationProvider;
  let iFrameService: IFrameService;
  let storagePersistenceService: StoragePersistenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CheckSessionService,
        OidcSecurityService,
        IFrameService,
        PublicEventsService,
        {
          provide: StoragePersistenceService,
          useClass: StoragePersistenceServiceMock,
        },
        {
          provide: ConfigurationProvider,
          useClass: ConfigurationProviderMock,
        },
        { provide: LoggerService, useClass: LoggerServiceMock },
        { provide: AbstractSecurityStorage, useClass: BrowserStorageMock },
        { provide: PlatformProvider, useClass: PlatformProviderMock },
      ],
    });
  });

  beforeEach(() => {
    checkSessionService = TestBed.inject(CheckSessionService);
    configurationProvider = TestBed.inject(ConfigurationProvider);
    loggerService = TestBed.inject(LoggerService);
    iFrameService = TestBed.inject(IFrameService);
    storagePersistenceService = TestBed.inject(StoragePersistenceService);
  });

  afterEach(() => {
    const iFrameIdwhichshouldneverexist = window.document.getElementById('idwhichshouldneverexist');
    if (iFrameIdwhichshouldneverexist) {
      iFrameIdwhichshouldneverexist.parentNode.removeChild(iFrameIdwhichshouldneverexist);
    }
    const myiFrameForCheckSession = window.document.getElementById('myiFrameForCheckSession');
    if (myiFrameForCheckSession) {
      myiFrameForCheckSession.parentNode.removeChild(myiFrameForCheckSession);
    }
  });

  it('should create', () => {
    expect(checkSessionService).toBeTruthy();
  });

  it('getOrCreateIframe calls iFrameService.addIFrameToWindowBody if no Iframe exists', () => {
    spyOn(iFrameService, 'addIFrameToWindowBody').and.callThrough();

    const result = (checkSessionService as any).getOrCreateIframe();
    expect(result).toBeTruthy();
    expect(iFrameService.addIFrameToWindowBody).toHaveBeenCalled();
  });

  it('getOrCreateIframe returns true if document found on window.document', () => {
    iFrameService.addIFrameToWindowBody('myiFrameForCheckSession', 'configId');

    const result = (checkSessionService as any).getOrCreateIframe();
    expect(result).toBeDefined();
  });

  /*
      THIS TEST WORKS IN WHEN DEBUGGING...location.replace
       does not return a promise or something we can wait for
    */
  xit(
    'location of iframe is set to authWellKnownEndpoints.check_session_iframe if existing',
    waitForAsync(async () => {
      const authWellKnownEndpoints = {
        checkSessionIframe: 'https://some-testing-url.com',
      };

      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue(authWellKnownEndpoints);
      spyOn<any>(loggerService, 'logDebug').and.callFake(() => {});

      (checkSessionService as any).init();
      await Promise.resolve().then();
      const iframe = (checkSessionService as any).getOrCreateIframe();
      expect(iframe.contentWindow.location.toString()).toContain('someTestingValue');
    })
  );

  it('init appends iframe on body with correct values', () => {
    expect((checkSessionService as any).sessionIframe).toBeFalsy();
    spyOn<any>(loggerService, 'logDebug').and.callFake(() => {});

    (checkSessionService as any).init();
    const iframe = (checkSessionService as any).getOrCreateIframe();
    expect(iframe).toBeTruthy();
    expect(iframe.id).toBe('myiFrameForCheckSession');
    expect(iframe.style.display).toBe('none');
    const iFrame = document.getElementById('myiFrameForCheckSession');
    expect(iFrame).toBeDefined();
  });

  it('log warning if authWellKnownEndpoints.check_session_iframe is not existing', () => {
    spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });
    const spyLogWarning = spyOn<any>(loggerService, 'logWarning');
    spyOn<any>(loggerService, 'logDebug').and.callFake(() => {});
    spyOn(storagePersistenceService, 'read')
      .withArgs('authWellKnownEndPoints', 'configId')
      .and.returnValue({ checkSessionIframe: undefined });
    (checkSessionService as any).init('configId');

    expect(spyLogWarning).toHaveBeenCalledWith('configId', jasmine.any(String));
  });

  it('start() calls pollserversession() with clientId if no scheduledheartbeat is set', () => {
    const spy = spyOn<any>(checkSessionService, 'pollServerSession');
    spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ clientId: 'clientId', configId: 'configId' });

    checkSessionService.start('configId');
    expect(spy).toHaveBeenCalledWith('clientId', 'configId');
  });

  it('start() does not call pollServerSession() if scheduledHeartBeatRunning is set', () => {
    spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ configId: 'configId' });
    const spy = spyOn<any>(checkSessionService, 'pollServerSession');
    (checkSessionService as any).scheduledHeartBeatRunning = () => {};
    checkSessionService.start('configId');
    expect(spy).not.toHaveBeenCalled();
  });

  it('stopCheckingSession sets heartbeat to null', () => {
    (checkSessionService as any).scheduledHeartBeatRunning = setTimeout(() => {}, 999);
    checkSessionService.stop();
    const heartBeat = (checkSessionService as any).scheduledHeartBeatRunning;
    expect(heartBeat).toBeNull();
  });

  it('stopCheckingSession does nothing if scheduledHeartBeatRunning is not set', () => {
    (checkSessionService as any).scheduledHeartBeatRunning = null;
    const spy = spyOn<any>(checkSessionService, 'clearScheduledHeartBeat');
    checkSessionService.stop();
    expect(spy).not.toHaveBeenCalledWith();
  });

  describe('serverStateChanged', () => {
    it('returns false if startCheckSession is not configured', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ startCheckSession: false });
      const result = checkSessionService.serverStateChanged('configId');
      expect(result).toBeFalsy();
    });

    it('returns false if checkSessionReceived is false', () => {
      (checkSessionService as any).checkSessionReceived = false;
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ startCheckSession: true });
      const result = checkSessionService.serverStateChanged('configId');
      expect(result).toBeFalse();
    });

    it('returns true if startCheckSession is configured and checkSessionReceived is true', () => {
      (checkSessionService as any).checkSessionReceived = true;
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ startCheckSession: true });
      const result = checkSessionService.serverStateChanged('configId');
      expect(result).toBeTrue();
    });
  });

  describe('pollServerSession', () => {
    beforeEach(() => {
      spyOn<any>(checkSessionService, 'init').and.returnValue(of(undefined));
    });

    it('increases outstandingMessages', () => {
      spyOn<any>(checkSessionService, 'getExistingIframe').and.returnValue({ contentWindow: { postMessage: () => {} } });
      const authWellKnownEndpoints = {
        checkSessionIframe: 'https://some-testing-url.com',
      };
      spyOn(storagePersistenceService, 'read')
        .withArgs('authWellKnownEndPoints', 'configId')
        .and.returnValue(authWellKnownEndpoints)
        .withArgs('session_state', 'configId')
        .and.returnValue('session_state');
      spyOn(loggerService, 'logDebug').and.callFake(() => {});
      (checkSessionService as any).pollServerSession('clientId', 'configId');
      expect((checkSessionService as any).outstandingMessages).toBe(1);
    });

    it('logs warning if iframe does not exist', () => {
      spyOn<any>(checkSessionService, 'getExistingIframe').and.returnValue(null);
      const authWellKnownEndpoints = {
        checkSessionIframe: 'https://some-testing-url.com',
      };
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue(authWellKnownEndpoints);
      const spyLogWarning = spyOn(loggerService, 'logWarning').and.callFake(() => {});
      spyOn(loggerService, 'logDebug').and.callFake(() => {});
      (checkSessionService as any).pollServerSession('clientId', 'configId');
      expect(spyLogWarning).toHaveBeenCalledWith('configId', jasmine.any(String));
    });

    it('logs warning if clientId is not set', () => {
      spyOn<any>(checkSessionService, 'getExistingIframe').and.returnValue({});
      const authWellKnownEndpoints = {
        checkSessionIframe: 'https://some-testing-url.com',
      };
      spyOn(storagePersistenceService, 'read').withArgs('authWellKnownEndPoints', 'configId').and.returnValue(authWellKnownEndpoints);
      const spyLogWarning = spyOn(loggerService, 'logWarning').and.callFake(() => {});
      spyOn(loggerService, 'logDebug').and.callFake(() => {});
      (checkSessionService as any).pollServerSession('', 'configId');
      expect(spyLogWarning).toHaveBeenCalledWith('configId', jasmine.any(String));
    });

    it('logs debug if session_state is not set', () => {
      spyOn<any>(checkSessionService, 'getExistingIframe').and.returnValue({});
      const authWellKnownEndpoints = {
        checkSessionIframe: 'https://some-testing-url.com',
      };

      spyOn(storagePersistenceService, 'read')
        .withArgs('authWellKnownEndPoints', 'configId')
        .and.returnValue(authWellKnownEndpoints)
        .withArgs('session_state', 'configId')
        .and.returnValue(null);

      const spyLogDebug = spyOn(loggerService, 'logDebug').and.callFake(() => {});
      (checkSessionService as any).pollServerSession('clientId', 'configId');
      expect(spyLogDebug).toHaveBeenCalledTimes(2);
    });

    it('logs debug if session_state is set but authWellKnownEndpoints are not set', () => {
      spyOn<any>(checkSessionService, 'getExistingIframe').and.returnValue({});
      const authWellKnownEndpoints = null;

      spyOn(storagePersistenceService, 'read')
        .withArgs('authWellKnownEndPoints', 'configId')
        .and.returnValue(authWellKnownEndpoints)
        .withArgs('session_state', 'configId')
        .and.returnValue('some_session_state');
      const spyLogDebug = spyOn(loggerService, 'logDebug').and.callFake(() => {});
      (checkSessionService as any).pollServerSession('clientId', 'configId');
      expect(spyLogDebug).toHaveBeenCalledTimes(2);
    });
  });

  describe('init', () => {
    it(
      'returns falsy observable when lastIframerefresh and iframeRefreshInterval are bigger than now',
      waitForAsync(() => {
        const serviceAsAny = checkSessionService as any;
        const dateNow = new Date();
        const lastRefresh = dateNow.setMinutes(dateNow.getMinutes() + 30);
        serviceAsAny.lastIFrameRefresh = lastRefresh;
        serviceAsAny.iframeRefreshInterval = lastRefresh;

        serviceAsAny.init().subscribe((result) => {
          expect(result).toBeUndefined();
        });
      })
    );
  });

  describe('isCheckSessionConfigured', () => {
    it('returns true if startCheckSession on config is true', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ startCheckSession: true });

      const result = checkSessionService.isCheckSessionConfigured('configId');

      expect(result).toBe(true);
    });

    it('returns true if startCheckSession on config is true', () => {
      spyOn(configurationProvider, 'getOpenIDConfiguration').and.returnValue({ startCheckSession: false });

      const result = checkSessionService.isCheckSessionConfigured('configId');

      expect(result).toBe(false);
    });
  });

  describe('checkSessionChanged$', () => {
    it(
      'emits when internal event is thrown',
      waitForAsync(() => {
        checkSessionService.checkSessionChanged$.pipe(skip(1)).subscribe((result) => {
          expect(result).toBe(true);
        });

        const serviceAsAny = checkSessionService as any;
        serviceAsAny.checkSessionChangedInternal$.next(true);
      })
    );
  });
});
